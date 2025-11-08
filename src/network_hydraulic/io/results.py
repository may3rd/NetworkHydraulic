"""Helpers for presenting and serializing solver results."""
from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import yaml

from network_hydraulic.models.fluid import GAS_CONSTANT

STANDARD_TEMPERATURE = 273.15  # 0 °C
STANDARD_PRESSURE = 101_325.0  # 1 atm

if TYPE_CHECKING:  # pragma: no cover - hints only
    from network_hydraulic.models.network import Network
    from network_hydraulic.models.pipe_section import PipeSection
    from network_hydraulic.models.results import NetworkResult, ResultSummary, SectionResult, StatePoint
    from network_hydraulic.models.fluid import Fluid
    from network_hydraulic.models.pipe_section import Fitting


def print_summary(network: "Network", result: "NetworkResult") -> None:
    """Pretty-print a human readable summary to stdout."""
    print("Network:", network.name)
    for section_result in result.sections:
        pd = section_result.calculation.pressure_drop
        print(f"Section {section_result.section_id}:")
        print(f"FITTINGS SUMMARY")
        print(f"  Fitting K: {pd.fitting_K or 0:.3f}")
        print(f"  Pipe Length K: {pd.pipe_length_K or 0:.3f}")
        print(f"  User Supply K: {pd.user_K or 0:.3f}")
        print(f"  Piping and Fitting Factor: {pd.piping_and_fitting_safety_factor or 0:.3f}")
        print(f"  Total K: {pd.total_K or 0:.3f}")
        print(f"CHACTERISTIC SUMMARY")
        print(f"  Reynolds Number: {pd.reynolds_number or 0:.3f}")
        print(f"  Flow Regime: {pd.flow_scheme or 'N/A'}")
        print(f"  Friction Factor: {pd.frictional_factor or 0:.3f}")
        print(f"PRESSURE LOSS SUMMARY")
        print(f"  Pipe+Fittings Loss: {pd.pipe_and_fittings or 0:.3f} Pa")
        print(f"  Elevation Loss: {pd.elevation_change or 0:.3f} Pa")
        print(f"  Control Valve Loss: {pd.control_valve_pressure_drop or 0:.3f} Pa")
        print(f"  Orifice Loss: {pd.orifice_pressure_drop or 0:.3f} Pa")
        print(f"  User Specified Fixed Loss: {pd.user_specified_fixed_loss or 0:.3f} Pa")
        print(f"  Total Segment Loss: {pd.total_segment_loss or 0:.3f} Pa")
        print(f"  Normalized Friction Loss: {pd.normalized_friction_loss or 0:.3f}")
        _print_state_table("    ", section_result.summary)
    print("Overall Network State:")
    _print_state_table("    ", network.result_summary)


def write_output(
    path: Path,
    network: "Network",
    result: "NetworkResult",
) -> None:
    """Persist calculation results back to YAML using SI-normalized values."""
    network_cfg = _network_config(network)
    section_results = {section.section_id: section for section in result.sections}
    mass_flow_rate = _mass_flow_rate(network.fluid)
    standard_density = _standard_gas_density(network.fluid)

    for section in network.sections:
        section_cfg = _section_config(section)
        section_result = section_results.get(section.id)
        if section_result:
            section_cfg["calculation_result"] = _section_result_payload(
                section_result, section_cfg.get("length"), mass_flow_rate, standard_density, section
            )
        network_cfg["sections"].append(section_cfg)

    flow_summary = _flow_dict(result.summary, mass_flow_rate, standard_density)
    network_cfg["summary"] = {
        "state": _summary_dict(result.summary),
        "pressure_drop": _pressure_drop_dict(result.aggregate.pressure_drop, None),
        "flow": flow_summary,
    }
    fluid_cfg = network_cfg.get("fluid")
    if fluid_cfg:
        if flow_summary["volumetric_actual"] is not None:
            fluid_cfg["volumetric_flow_rate"] = flow_summary["volumetric_actual"]
        if flow_summary["volumetric_standard"] is not None:
            fluid_cfg["standard_flow_rate"] = flow_summary["volumetric_standard"]

    data = {"network": network_cfg}

    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(data, handle, sort_keys=False)


def _pressure_drop_dict(details, length: float | None) -> Dict[str, Any]:
    normalized = None
    if length and length > 0 and details.pipe_and_fittings:
        normalized = details.pipe_and_fittings / length * 100.0
    return {
        "fitting_K": details.fitting_K,
        "pipe_length_K": details.pipe_length_K,
        "user_K": details.user_K,
        "piping_and_fitting_safety_factor": details.piping_and_fitting_safety_factor,
        "total_K": details.total_K,
        "reynolds_number": details.reynolds_number,
        "flow_scheme": details.flow_scheme,
        "frictional_factor": details.frictional_factor,
        "pipe_and_fittings": details.pipe_and_fittings,
        "elevation_change": details.elevation_change,
        "control_valve": details.control_valve_pressure_drop,
        "orifice": details.orifice_pressure_drop,
        "user_fixed": details.user_specified_fixed_loss,
        "total": details.total_segment_loss,
        "per_100m": normalized or details.normalized_friction_loss,
    }


def _summary_dict(summary: "ResultSummary") -> Dict[str, Any]:
    return {
        "inlet": _state_dict(summary.inlet),
        "outlet": _state_dict(summary.outlet),
    }


def _state_dict(state: "StatePoint") -> Dict[str, Any]:
    return {
        "pressure": state.pressure,
        "temperature": state.temperature,
        "density": state.density,
        "mach_number": state.mach_number,
        "velocity": state.velocity,
        "erosional_velocity": state.erosional_velocity,
        "flow_momentum": state.flow_momentum,
        "remarks": state.remarks,
    }


def _print_state_table(prefix: str, summary: "ResultSummary") -> None:
    def fmt(value: float | None) -> str:
        if value is None:
            return "—"
        if isinstance(value, float):
            return f"{value:.3f}"
        return str(value)

    inlet = summary.inlet
    outlet = summary.outlet
    print(f"{prefix}Inlet State:")
    print(f"{prefix}  Pressure: {fmt(inlet.pressure)} Pa")
    print(f"{prefix}  Temperature: {fmt(inlet.temperature)} K")
    print(f"{prefix}  Density: {fmt(inlet.density)} kg/m^3")
    print(f"{prefix}  Mach: {fmt(inlet.mach_number)}")
    print(f"{prefix}  Velocity: {fmt(inlet.velocity)} m/s")
    print(f"{prefix}  Erosional Velocity: {fmt(inlet.erosional_velocity)} m/s")
    print(f"{prefix}  Flow Momentum (rho V^2): {fmt(inlet.flow_momentum)}")
    if inlet.remarks:
        print(f"{prefix}  Remarks: {inlet.remarks}")
    print(f"{prefix}Outlet State:")
    print(f"{prefix}  Pressure: {fmt(outlet.pressure)} Pa")
    print(f"{prefix}  Temperature: {fmt(outlet.temperature)} K")
    print(f"{prefix}  Density: {fmt(outlet.density)} kg/m^3")
    print(f"{prefix}  Mach: {fmt(outlet.mach_number)}")
    print(f"{prefix}  Velocity: {fmt(outlet.velocity)} m/s")
    print(f"{prefix}  Erosional Velocity: {fmt(outlet.erosional_velocity)} m/s")
    print(f"{prefix}  Flow Momentum (rho V^2): {fmt(outlet.flow_momentum)}")
    if outlet.remarks:
        print(f"{prefix}  Remarks: {outlet.remarks}")


def _network_config(network: "Network") -> Dict[str, Any]:
    return {
        "name": network.name,
        "description": network.description,
        "direction": network.direction,
        "boundary_pressure": network.boundary_pressure,
        "gas_flow_model": network.gas_flow_model,
        "fluid": _fluid_dict(network.fluid),
        "sections": [],
    }


def _fluid_dict(fluid: "Fluid") -> Dict[str, Any]:
    return {
        "name": fluid.name,
        "mass_flow_rate": fluid.mass_flow_rate,
        "volumetric_flow_rate": fluid.volumetric_flow_rate,
        "phase": fluid.phase,
        "temperature": fluid.temperature,
        "pressure": fluid.pressure,
        "density": fluid.density,
        "molecular_weight": fluid.molecular_weight,
        "z_factor": fluid.z_factor,
        "specific_heat_ratio": fluid.specific_heat_ratio,
        "viscosity": fluid.viscosity,
        "standard_flow_rate": fluid.standard_flow_rate,
        "vapor_pressure": fluid.vapor_pressure,
        "critical_pressure": fluid.critical_pressure,
    }


def _section_config(section: "PipeSection") -> Dict[str, Any]:
    base = {
        "id": section.id,
        "main_ID": section.main_ID,
        "input_ID": section.input_ID,
        "output_ID": section.output_ID,
        "schedule": section.schedule,
        "roughness": section.roughness,
        "length": section.length,
        "elevation_change": section.elevation_change,
        "fitting_type": section.fitting_type,
        "fittings": _fittings_list(section.fittings),
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
    }


def _section_result_payload(
    section_result: "SectionResult",
    section_length: Optional[float],
    mass_flow_rate: Optional[float],
    standard_density: Optional[float],
    section: "PipeSection",
) -> Dict[str, Any]:
    calculation = section_result.calculation
    pressure_drop_dict = _pressure_drop_dict(calculation.pressure_drop, section_length)
    pressure_drop_dict["fitting_K"] = section.fitting_K
    pressure_drop_dict["pipe_length_K"] = section.pipe_length_K
    pressure_drop_dict["user_K"] = section.user_K
    pressure_drop_dict["piping_and_fitting_safety_factor"] = section.piping_and_fitting_safety_factor
    pressure_drop_dict["total_K"] = section.total_K
    return {
        "pressure_drop": pressure_drop_dict,
        "summary": _summary_dict(section_result.summary),
        "flow": _flow_dict(section_result.summary, mass_flow_rate, standard_density),
    }


def _flow_dict(
    summary: "ResultSummary",
    mass_flow_rate: Optional[float],
    standard_density: Optional[float],
) -> Dict[str, Optional[float]]:
    volumetric_actual = None
    if mass_flow_rate is not None:
        inlet_density = getattr(summary.inlet, "density", None)
        if inlet_density and inlet_density > 0:
            volumetric_actual = mass_flow_rate / inlet_density
    volumetric_standard = None
    if mass_flow_rate is not None and standard_density:
        volumetric_standard = mass_flow_rate / standard_density
    return {
        "volumetric_actual": volumetric_actual,
        "volumetric_standard": volumetric_standard,
    }


def _mass_flow_rate(fluid: "Fluid") -> Optional[float]:
    try:
        return fluid.current_mass_flow_rate()
    except Exception:  # pragma: no cover - defensive fallback
        return fluid.mass_flow_rate


def _standard_gas_density(fluid: "Fluid") -> Optional[float]:
    if not fluid.is_gas():
        return None
    molecular_weight = getattr(fluid, "molecular_weight", None)
    if molecular_weight is None or molecular_weight <= 0:
        return None
    mw = molecular_weight if molecular_weight <= 0.5 else molecular_weight / 1000.0
    z_factor = fluid.z_factor if fluid.z_factor and fluid.z_factor > 0 else 1.0
    return STANDARD_PRESSURE * mw / (GAS_CONSTANT * STANDARD_TEMPERATURE * z_factor)
