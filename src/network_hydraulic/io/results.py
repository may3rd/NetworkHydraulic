"""Helpers for presenting and serializing solver results.

Example:

    from network_hydraulic.io import results as results_io
    results_io.write_output(Path("out.yaml"), network, result)
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import yaml

from network_hydraulic.models.fluid import GAS_CONSTANT
from network_hydraulic.models.output_units import OutputUnits
from network_hydraulic.utils.units import convert as convert_units

STANDARD_TEMPERATURE = 273.15  # 0 °C
STANDARD_PRESSURE = 101_325.0  # 1 atm

if TYPE_CHECKING:  # pragma: no cover - hints only
    from network_hydraulic.models.network import Network
    from network_hydraulic.models.pipe_section import PipeSection
    from network_hydraulic.models.results import (
        FittingBreakdown,
        NetworkResult,
        ResultSummary,
        SectionResult,
        StatePoint,
    )
    from network_hydraulic.models.fluid import Fluid
    from network_hydraulic.models.pipe_section import Fitting


@dataclass(slots=True)
class _OutputUnitConverter:
    units: OutputUnits

    def pressure(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "Pa", self.units.pressure)

    def pressure_drop(self, value: Optional[float]) -> Optional[float]:
        target = self.units.pressure_drop or self.units.pressure
        return _convert_value(value, "Pa", target)

    def temperature(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "K", self.units.temperature)

    def density(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "kg/m^3", self.units.density)

    def velocity(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "m/s", self.units.velocity)

    def volumetric_flow(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "m^3/s", self.units.volumetric_flow_rate)

    def mass_flow(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "kg/s", self.units.mass_flow_rate)

    def flow_momentum(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "Pa", self.units.flow_momentum)

    def viscosity(self, value: Optional[float]) -> Optional[float]:
        return _convert_value(value, "Pa*s", "cP")


def print_summary(network: "Network", result: "NetworkResult", *, debug: bool = False) -> None:
    """Pretty-print a human readable summary to stdout."""
    converter = _OutputUnitConverter(network.output_units)
    pressure_unit = network.output_units.pressure_drop
    section_lookup = {section.id: section for section in network.sections}

    def fmt(value: float | None) -> str:
        if value is None:
            return "—"
        if isinstance(value, float):
            return f"{value:.3f}"
        return str(value)

    def format_measure(value: Optional[float], convert_fn, unit: Optional[str]) -> str:
        converted = convert_fn(value) if convert_fn else value
        if converted is None:
            return "—"
        text = fmt(converted)
        if unit and text != "—":
            return f"{text} {unit}"
        return text

    print("Network:", network.name)
    for section_result in result.sections:
        section = section_lookup.get(section_result.section_id)
        pd = section_result.calculation.pressure_drop
        print(f"Section {section_result.section_id}:")
        _print_section_overview(
            section=section,
            network=network,
            converter=converter,
            fmt=fmt,
            format_measure=format_measure,
        )
        print(f"FITTINGS SUMMARY")
        print(f"  Fitting K: {pd.fitting_K or 0:.5f}")
        print(f"  Pipe Length K: {pd.pipe_length_K or 0:.5f}")
        print(f"  User Supply K: {pd.user_K or 0:.5f}")
        print(f"  Piping and Fitting Factor: {pd.piping_and_fitting_safety_factor or 0:.5f}")
        print(f"  Total K: {pd.total_K or 0:.5f}")
        if debug:
            _print_fitting_breakdown("    ", pd.fitting_breakdown)
        _print_control_elements(section)
        print(f"CHARACTERISTIC SUMMARY")
        print(f"  Reynolds Number: {pd.reynolds_number or 0:.3f}")
        print(f"  Flow Regime: {pd.flow_scheme or 'N/A'}")
        print(f"  Friction Factor: {pd.frictional_factor or 0:.6f}")
        velocity_head = _velocity_head(section_result.summary.inlet)
        print(
            f"  Velocity Head (Inlet): {format_measure(velocity_head, converter.flow_momentum, network.output_units.flow_momentum)}"
        )
        print(
            f"  Critical Pressure: {convert_units(pd.critical_pressure, "Pa", "kPa"):.3f} (abs)"
        )
        print(f"PRESSURE LOSS SUMMARY")
        print(
            f"  Pipe+Fittings Loss: {fmt(converter.pressure_drop(pd.pipe_and_fittings))} {pressure_unit}"
        )
        print(f"  Elevation Loss: {fmt(converter.pressure_drop(pd.elevation_change))} {pressure_unit}")
        print(
            f"  Control Valve Loss: {fmt(converter.pressure_drop(pd.control_valve_pressure_drop))} {pressure_unit}"
        )
        print(f"  Orifice Loss: {fmt(converter.pressure_drop(pd.orifice_pressure_drop))} {pressure_unit}")
        print(
            f"  User Specified Fixed Loss: {fmt(converter.pressure_drop(pd.user_specified_fixed_loss))} {pressure_unit}"
        )
        print(f"  Total Segment Loss: {fmt(converter.pressure_drop(pd.total_segment_loss))} {pressure_unit}")
        normalized_loss = converter.pressure_drop(pd.normalized_friction_loss)
        print(f"  Normalized Friction Loss: {fmt(normalized_loss)} {pressure_unit}")
        _print_state_table("    ", section_result.summary, converter, network.output_units)
    print("Overall Network State:")
    _print_state_table("    ", network.result_summary, converter, network.output_units)


def write_output(
    path: Path,
    network: "Network",
    result: "NetworkResult",
) -> None:
    """Persist calculation results back to YAML honoring configured output units."""
    converter = _OutputUnitConverter(network.output_units)
    network_cfg = _network_config(network, converter)
    section_results = {section.section_id: section for section in result.sections}
    mass_flow_rate = network.mass_flow_rate
    standard_density = _standard_gas_density(network.fluid, STANDARD_TEMPERATURE, STANDARD_PRESSURE)

    for section in network.sections:
        section_cfg = _section_config(section)
        section_result = section_results.get(section.id)
        if section_result:
            section_cfg["calculation_result"] = _section_result_payload(
                section_result,
                section_cfg.get("length"),
                mass_flow_rate,
                standard_density,
                section,
                converter,
            )
        network_cfg["sections"].append(section_cfg)

    flow_summary = _flow_dict(result.summary, mass_flow_rate, standard_density, converter)
    network_cfg["summary"] = {
        "state": _summary_dict(result.summary, converter),
        "pressure_drop": _pressure_drop_dict(result.aggregate.pressure_drop, None, converter),
        "flow": flow_summary,
    }
    
    data = {"network": network_cfg}
    suffix = path.suffix.lower()
    with path.open("w", encoding="utf-8") as handle:
        if suffix == ".json":
            json.dump(data, handle, indent=2)
        else:
            yaml.safe_dump(data, handle, sort_keys=False)


def _pressure_drop_dict(details, length: float | None, converter: _OutputUnitConverter) -> Dict[str, Any]:
    normalized = None
    if length and length > 0 and details.pipe_and_fittings:
        normalized = details.pipe_and_fittings / length * 100.0
    normalized = converter.pressure_drop(normalized)
    return {
        "fitting_K": details.fitting_K,
        "pipe_length_K": details.pipe_length_K,
        "user_K": details.user_K,
        "piping_and_fitting_safety_factor": details.piping_and_fitting_safety_factor,
        "total_K": details.total_K,
        "fitting_breakdown": _fitting_breakdown_dict(details.fitting_breakdown),
        "reynolds_number": details.reynolds_number,
        "flow_scheme": details.flow_scheme,
        "frictional_factor": details.frictional_factor,
        "critical_pressure": converter.pressure(details.critical_pressure),
        "pipe_and_fittings": converter.pressure_drop(details.pipe_and_fittings),
        "elevation_change": converter.pressure_drop(details.elevation_change),
        "control_valve": converter.pressure_drop(details.control_valve_pressure_drop),
        "orifice": converter.pressure_drop(details.orifice_pressure_drop),
        "user_fixed": converter.pressure_drop(details.user_specified_fixed_loss),
        "total": converter.pressure_drop(details.total_segment_loss),
        "per_100m": (
            normalized
            if normalized is not None
            else converter.pressure_drop(details.normalized_friction_loss)
        ),
    }


def _summary_dict(summary: "ResultSummary", converter: _OutputUnitConverter) -> Dict[str, Any]:
    return {
        "inlet": _state_dict(summary.inlet, converter),
        "outlet": _state_dict(summary.outlet, converter),
    }


def _state_dict(state: "StatePoint", converter: _OutputUnitConverter) -> Dict[str, Any]:
    return {
        "pressure": converter.pressure(state.pressure),
        "temperature": converter.temperature(state.temperature),
        "density": converter.density(state.density),
        "mach_number": state.mach_number,
        "velocity": converter.velocity(state.velocity),
        "pipe_velocity": converter.velocity(state.pipe_velocity),
        "erosional_velocity": converter.velocity(state.erosional_velocity),
        "flow_momentum": converter.flow_momentum(state.flow_momentum),
        "remarks": state.remarks,
    }


def _velocity_head(state: Optional["StatePoint"]) -> Optional[float]:
    if state is None:
        return None
    density = state.density
    velocity = state.velocity
    if density is None or velocity is None:
        return None
    return 0.5 * density * velocity * velocity


def _print_state_table(
    prefix: str,
    summary: "ResultSummary",
    converter: _OutputUnitConverter,
    units: OutputUnits,
) -> None:
    def fmt(value: float | None) -> str:
        if value is None:
            return "—"
        if isinstance(value, float):
            return f"{value:.3f}"
        return str(value)

    inlet = summary.inlet
    outlet = summary.outlet
    print(f"{prefix}Inlet State:")
    print(f"{prefix}  Pressure: {fmt(converter.pressure(inlet.pressure))} {units.pressure}")
    print(f"{prefix}  Temperature: {fmt(converter.temperature(inlet.temperature))} {units.temperature}")
    print(f"{prefix}  Density: {fmt(converter.density(inlet.density))} {units.density}")
    print(f"{prefix}  Mach: {fmt(inlet.mach_number)}")
    print(f"{prefix}  Velocity: {fmt(converter.velocity(inlet.velocity))} {units.velocity}")
    print(
        f"{prefix}  Pipe Avg Velocity: {fmt(converter.velocity(inlet.pipe_velocity))} {units.velocity}"
    )
    print(
        f"{prefix}  Erosional Velocity: {fmt(converter.velocity(inlet.erosional_velocity))} {units.velocity}"
    )
    print(
        f"{prefix}  Flow Momentum (rho V^2): {fmt(converter.flow_momentum(inlet.flow_momentum))} {units.flow_momentum}"
    )
    if inlet.remarks:
        print(f"{prefix}  Remarks: {inlet.remarks}")
    print(f"{prefix}Outlet State:")
    print(f"{prefix}  Pressure: {fmt(converter.pressure(outlet.pressure))} {units.pressure}")
    print(f"{prefix}  Temperature: {fmt(converter.temperature(outlet.temperature))} {units.temperature}")
    print(f"{prefix}  Density: {fmt(converter.density(outlet.density))} {units.density}")
    print(f"{prefix}  Mach: {fmt(outlet.mach_number)}")
    print(f"{prefix}  Velocity: {fmt(converter.velocity(outlet.velocity))} {units.velocity}")
    print(
        f"{prefix}  Pipe Avg Velocity: {fmt(converter.velocity(outlet.pipe_velocity))} {units.velocity}"
    )
    print(
        f"{prefix}  Erosional Velocity: {fmt(converter.velocity(outlet.erosional_velocity))} {units.velocity}"
    )
    print(
        f"{prefix}  Flow Momentum (rho V^2): {fmt(converter.flow_momentum(outlet.flow_momentum))} {units.flow_momentum}"
    )
    if outlet.remarks:
        print(f"{prefix}  Remarks: {outlet.remarks}")

def _print_fitting_breakdown(prefix: str, breakdown: Optional[List["FittingBreakdown"]]) -> None:
    if not breakdown:
        print(f"{prefix}FITTING DETAILS: none")
        return
    print(f"{prefix}FITTING DETAILS")
    for item in breakdown:
        print(
            f"{prefix}  - {item.type} x{item.count}: "
            f"K_each={item.k_each:.3f}, K_total={item.k_total:.3f}"
        )


def _fitting_breakdown_dict(breakdown: Optional[List["FittingBreakdown"]]) -> Optional[List[Dict[str, Any]]]:
    if not breakdown:
        return None
    return [
        {
            "type": item.type,
            "count": item.count,
            "k_each": item.k_each,
            "k_total": item.k_total,
        }
        for item in breakdown
    ]


def _network_config(network: "Network", converter: _OutputUnitConverter) -> Dict[str, Any]:
    return {
        "name": network.name,
        "description": network.description,
        "direction": network.direction,
        "boundary_pressure": converter.pressure(network.boundary_pressure),
        "gas_flow_model": network.gas_flow_model,
        "boundary_temperature": converter.temperature(network.boundary_temperature),
        "mass_flow_rate": converter.mass_flow(network.mass_flow_rate),
        "fluid": _fluid_dict(network.fluid, converter),
        "sections": [],
        "output_units": network.output_units.as_dict(),
    }


def _fluid_dict(fluid: "Fluid", converter: _OutputUnitConverter) -> Dict[str, Any]:
    return {
        "name": fluid.name,
        "phase": fluid.phase,
        "density": converter.density(fluid.density),
        "viscosity": converter.viscosity(fluid.viscosity),
        "molecular_weight": fluid.molecular_weight,
        "z_factor": fluid.z_factor,
        "specific_heat_ratio": fluid.specific_heat_ratio,
        "standard_flow_rate": converter.volumetric_flow(fluid.standard_flow_rate),
        "vapor_pressure": converter.pressure(fluid.vapor_pressure),
        "critical_pressure": converter.pressure(fluid.critical_pressure),
    }


def _section_config(section: "PipeSection") -> Dict[str, Any]:
    base = {
        "id": section.id,
        "description": section.description,
        "schedule": section.schedule,
        "roughness": section.roughness,
        "length": section.length,
        "elevation_change": section.elevation_change,
        "fitting_type": section.fitting_type,
        "fittings": _fittings_list(section.fittings),
        "direction": section.direction,
        "pipe_diameter": section.pipe_diameter,
        "inlet_diameter": section.inlet_diameter,
        "outlet_diameter": section.outlet_diameter,
        "fitting_K": section.fitting_K,
        "pipe_length_K": section.pipe_length_K,
        "user_K": section.user_K,
        "piping_and_fitting_safety_factor": section.piping_and_fitting_safety_factor,
        "total_K": section.total_K,
        "user_specified_fixed_loss": section.user_specified_fixed_loss,
        "pipe_NPD": section.pipe_NPD,
        "erosional_constant": section.erosional_constant,
        "mach_number": section.mach_number,
    }
    if section.control_valve:
        base["control_valve"] = _control_valve_dict(section.control_valve)
    if section.orifice:
        base["orifice"] = _orifice_dict(section.orifice)
    return base


def _fittings_list(fittings: Optional[List["Fitting"]]) -> List[Dict[str, Any]]:
    return [{"type": fitting.type, "count": fitting.count} for fitting in fittings or []]


def _control_valve_dict(valve) -> Dict[str, Any]:
    return {
        "tag": getattr(valve, "tag", None),
        "cv": getattr(valve, "cv", None),
        "cg": getattr(valve, "cg", None),
        "pressure_drop": getattr(valve, "pressure_drop", None),
        "C1": getattr(valve, "C1", None),
        "FL": getattr(valve, "FL", None),
        "Fd": getattr(valve, "Fd", None),
        "xT": getattr(valve, "xT", None),
        "inlet_diameter": getattr(valve, "inlet_diameter", None),
        "outlet_diameter": getattr(valve, "outlet_diameter", None),
        "valve_diameter": getattr(valve, "valve_diameter", None),
        "calculation_note": getattr(valve, "calculation_note", None),
    }


def _orifice_dict(orifice) -> Dict[str, Any]:
    return {
        "tag": getattr(orifice, "tag", None),
        "d_over_D_ratio": getattr(orifice, "d_over_D_ratio", None),
        "pressure_drop": getattr(orifice, "pressure_drop", None),
        "pipe_diameter": getattr(orifice, "pipe_diameter", None),
        "orifice_diameter": getattr(orifice, "orifice_diameter", None),
        "meter_type": getattr(orifice, "meter_type", None),
        "taps": getattr(orifice, "taps", None),
        "tap_position": getattr(orifice, "tap_position", None),
        "discharge_coefficient": getattr(orifice, "discharge_coefficient", None),
        "expansibility": getattr(orifice, "expansibility", None),
        "calculation_note": getattr(orifice, "calculation_note", None),
    }


def _section_result_payload(
    section_result: "SectionResult",
    section_length: Optional[float],
    mass_flow_rate: Optional[float],
    standard_density: Optional[float],
    section: "PipeSection",
    converter: _OutputUnitConverter,
) -> Dict[str, Any]:
    calculation = section_result.calculation
    pressure_drop_dict = _pressure_drop_dict(calculation.pressure_drop, section_length, converter)
    pressure_drop_dict["fitting_K"] = section.fitting_K
    pressure_drop_dict["pipe_length_K"] = section.pipe_length_K
    pressure_drop_dict["user_K"] = section.user_K
    pressure_drop_dict["piping_and_fitting_safety_factor"] = section.piping_and_fitting_safety_factor
    pressure_drop_dict["total_K"] = section.total_K
    return {
        "pressure_drop": pressure_drop_dict,
        "summary": _summary_dict(section_result.summary, converter),
        "flow": _flow_dict(
            section_result.summary,
            mass_flow_rate,
            standard_density,
            converter,
            section_mass_flow=section.mass_flow_rate,
        ),
    }


def _flow_dict(
    summary: "ResultSummary",
    mass_flow_rate: Optional[float],
    standard_density: Optional[float],
    converter: _OutputUnitConverter,
    section_mass_flow: Optional[float] = None,
) -> Dict[str, Optional[float]]:
    volumetric_actual = None
    effective_mass_flow = section_mass_flow if section_mass_flow is not None else mass_flow_rate
    if effective_mass_flow is not None:
        inlet_density = getattr(summary.inlet, "density", None)
        if inlet_density and inlet_density > 0:
            volumetric_actual = effective_mass_flow / inlet_density
    volumetric_standard = None
    if effective_mass_flow is not None and standard_density:
        volumetric_standard = effective_mass_flow / standard_density
    return {
        "volumetric_actual": converter.volumetric_flow(volumetric_actual),
        "volumetric_standard": converter.volumetric_flow(volumetric_standard),
    }


def _standard_gas_density(fluid: "Fluid", temperature: float, pressure: float) -> Optional[float]:
    if not fluid.is_gas():
        return None
    molecular_weight = getattr(fluid, "molecular_weight", None)
    if molecular_weight is None or molecular_weight <= 0:
        return None
    mw = molecular_weight if molecular_weight <= 0.5 else molecular_weight / 1000.0
    z_factor = fluid.z_factor if fluid.z_factor and fluid.z_factor > 0 else 1.0
    return pressure * mw / (GAS_CONSTANT * temperature * z_factor)


def _convert_value(value: Optional[float], from_unit: str, to_unit: str) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)) and not math.isfinite(value):
        raise ValueError(f"Non-finite value '{value}' encountered while converting from {from_unit} to {to_unit}")
    if not to_unit or to_unit == from_unit:
        return value
    converted = convert_units(value, from_unit, to_unit)
    if isinstance(converted, float) and not math.isfinite(converted):
        raise ValueError(
            f"Unit conversion produced non-finite value '{converted}' from {from_unit} to {to_unit}"
        )
    return converted


def _print_section_overview(
    *,
    section: Optional["PipeSection"],
    network: "Network",
    converter: _OutputUnitConverter,
    fmt,
    format_measure,
) -> None:
    fluid = network.fluid
    section_id = section.id if section else None
    description = (section.description if section and section.description else network.description) or "—"
    direction = (section.direction if section and section.direction else network.direction) or "—"
    boundary_pressure = (
        section.boundary_pressure if section and section.boundary_pressure is not None else network.boundary_pressure
    )
    flow_type = network.gas_flow_model if fluid.is_gas() else "N/A"

    actual_mass_flow = section.mass_flow_rate if section and section.mass_flow_rate is not None else network.mass_flow_rate
    actual_vol_flow = None
    reference_density = None
    if section:
        reference_density = section.result_summary.inlet.density
    if not (reference_density and reference_density > 0):
        reference_density = fluid.current_density(network.boundary_temperature, network.boundary_pressure)
    if actual_mass_flow is not None and reference_density and reference_density > 0:
        actual_vol_flow = actual_mass_flow / reference_density

    standard_flow = fluid.standard_flow_rate if fluid.is_gas() else None
    temperature = network.boundary_temperature
    density = fluid.current_density(network.boundary_temperature, network.boundary_pressure)

    def pipe_value(value: Optional[float], unit: Optional[str] = None) -> str:
        if value is None:
            return "—"
        text = fmt(float(value))
        return f"{text} {unit}" if unit else text

    print(f"Section ID: {section_id or '—'}")
    print(f"Description: {description}")
    margin_percent = None
    if section and section.design_margin is not None:
        margin_percent = section.design_margin
    elif network.design_margin is not None:
        margin_percent = network.design_margin

    margin_multiplier = 1.0 + (margin_percent or 0.0) / 100.0

    print("GENERAL DATA")
    print(f"  Fluid Phase: {fmt(fluid.phase)}")
    print(f"  Flow Direction: {fmt(direction)}")
    print(f"  Flow Type (gas): {fmt(flow_type)}")
    print(
        f"  Boundary Pressure: {format_measure(boundary_pressure, converter.pressure, network.output_units.pressure)}"
    )

    print("FLUID DATA")
    print(
        f"  Mass Flow Rate: {format_measure(actual_mass_flow, converter.mass_flow, network.output_units.mass_flow_rate)}"
    )
    print(
        f"  Volumetric Flow Rate: {format_measure(actual_vol_flow, converter.volumetric_flow, network.output_units.volumetric_flow_rate)}"
    )
    if margin_percent is not None:
        print(f"  Design Margin: {fmt(margin_percent)} %")
    else:
        print("  Design Margin: —")
    design_mass_flow = (
        section.design_mass_flow_rate if section else None
    )
    if design_mass_flow is None and actual_mass_flow is not None and margin_percent is not None:
        design_mass_flow = actual_mass_flow * margin_multiplier
    design_vol_flow = None
    if actual_vol_flow is not None and margin_percent is not None:
        design_vol_flow = actual_vol_flow * margin_multiplier
    print(
        f"  Design Mass Flow Rate: {format_measure(design_mass_flow, converter.mass_flow, network.output_units.mass_flow_rate)}"
    )
    print(
        f"  Design Volumetric Flow Rate: {format_measure(design_vol_flow, converter.volumetric_flow, network.output_units.volumetric_flow_rate)}"
    )
    standard_flow_text = (
        format_measure(standard_flow, converter.volumetric_flow, network.output_units.volumetric_flow_rate)
        if standard_flow is not None
        else "—"
    )
    print("  Standard Flow Rate (@15 degC, 1 ATM):", standard_flow_text)
    print(f"  Boundary Temperature: {format_measure(temperature, converter.temperature, network.output_units.temperature)}")
    print(f"  Density: {format_measure(density, converter.density, network.output_units.density)}")
    print(f"  Viscosity: {format_measure(fluid.viscosity, converter.viscosity, 'cP')}")
    if fluid.is_gas():
        print(f"  Molecular Weight (gas): {fmt(fluid.molecular_weight)}")
        print(f"  Compressibility Z (gas): {fmt(fluid.z_factor)}")
        print(f"  Cp/Cv (gas): {fmt(fluid.specific_heat_ratio)}")
    else:
        print("  Molecular Weight (gas): —")
        print("  Compressibility Z (gas): —")
        print("  Cp/Cv (gas): —")

    print("PIPE & FITTINGS")
    print(f"  Pipe NPD: {pipe_value(section.pipe_NPD) if section else '—'}")
    print(f"  Schedule: {fmt(section.schedule) if section else '—'}")
    print(f"  Inlet Diameter: {pipe_value(section.inlet_diameter, 'm') if section else '—'}")
    print(f"  Pipe Diameter: {pipe_value(section.pipe_diameter, 'm') if section else '—'}")
    print(f"  Outlet Diameter: {pipe_value(section.outlet_diameter, 'm') if section else '—'}")
    print(f"  Roughness: {pipe_value(section.roughness, 'm') if section else '—'}")
    print(f"  Pipe Length: {pipe_value(section.length, 'm') if section else '—'}")
    print(f"  Elevation Change: {pipe_value(section.elevation_change, 'm') if section else '—'}")
    print(f"  Erosional Constant: {pipe_value(section.erosional_constant) if section else '—'}")
    print(f"  Fitting Type: {fmt(section.fitting_type) if section else '—'}")


def _print_control_elements(section: Optional["PipeSection"]) -> None:
    if section is None:
        return
    if section.control_valve:
        valve = section.control_valve
        print("CONTROL VALVE DATA")
        kv_pairs = [
            ("  Tag", getattr(valve, "tag", None)),
            ("  Cv", getattr(valve, "cv", None)),
            ("  Cg", getattr(valve, "cg", None)),
            ("  Pressure Drop", getattr(valve, "pressure_drop", None)),
            ("  C1", getattr(valve, "C1", None)),
            ("  FL", getattr(valve, "FL", None)),
            ("  Fd", getattr(valve, "Fd", None)),
            ("  xT", getattr(valve, "xT", None)),
            ("  Inlet Diameter", getattr(valve, "inlet_diameter", None)),
            ("  Outlet Diameter", getattr(valve, "outlet_diameter", None)),
            ("  Valve Diameter", getattr(valve, "valve_diameter", None)),
            ("  Calculation Note", getattr(valve, "calculation_note", None)),
        ]
        for label, value in kv_pairs:
            text = f"{value:.3f}" if isinstance(value, float) else (value if value is not None else "—")
            print(f"{label}: {text}")
    if section.orifice:
        orifice = section.orifice
        print("ORIFICE DATA")
        kv_pairs = [
            ("  Tag", getattr(orifice, "tag", None)),
            ("  d/D Ratio", getattr(orifice, "d_over_D_ratio", None)),
            ("  Pressure Drop", getattr(orifice, "pressure_drop", None)),
            ("  Pipe Diameter", getattr(orifice, "pipe_diameter", None)),
            ("  Orifice Diameter", getattr(orifice, "orifice_diameter", None)),
            ("  Meter Type", getattr(orifice, "meter_type", None)),
            ("  Taps", getattr(orifice, "taps", None)),
            ("  Tap Position", getattr(orifice, "tap_position", None)),
            ("  Discharge Coefficient", getattr(orifice, "discharge_coefficient", None)),
            ("  Expansibility", getattr(orifice, "expansibility", None)),
            ("  Calculation Note", getattr(orifice, "calculation_note", None)),
        ]
        for label, value in kv_pairs:
            text = f"{value:.3f}" if isinstance(value, float) else (value if value is not None else "—")
            print(f"{label}: {text}")
