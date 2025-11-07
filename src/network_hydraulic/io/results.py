"""Helpers for presenting and serializing solver results."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict

import yaml

if TYPE_CHECKING:  # pragma: no cover - hints only
    from network_hydraulic.io.loader import ConfigurationLoader
    from network_hydraulic.models.network import Network
    from network_hydraulic.models.pipe_section import PipeSection
    from network_hydraulic.models.results import NetworkResult, ResultSummary, SectionResult, StatePoint


def print_summary(network: "Network", result: "NetworkResult") -> None:
    """Pretty-print a human readable summary to stdout."""
    print("Network:", network.name)
    for section_result in result.sections:
        pd = section_result.calculation.pressure_drop
        print(f"Section {section_result.section_id}:")
        print(f"  Pipe+Fittings Loss: {pd.pipe_and_fittings or 0:.3f} Pa")
        print(f"  Elevation Loss: {pd.elevation_change or 0:.3f} Pa")
        print(f"  Control Valve Loss: {pd.control_valve_pressure_drop or 0:.3f} Pa")
        print(f"  Orifice Loss: {pd.orifice_pressure_drop or 0:.3f} Pa")
        print(f"  Total Segment Loss: {pd.total_segment_loss or 0:.3f} Pa")
        _print_state_table("    ", section_result.summary)
    print("Overall Network State:")
    _print_state_table("    ", network.result_summary)


def write_output(
    path: Path,
    loader: "ConfigurationLoader",
    network: "Network",
    result: "NetworkResult",
) -> None:
    """Persist calculation results back to YAML alongside the original config."""
    data = deepcopy(loader.raw or {})
    network_cfg = data.setdefault("network", {})
    sections_cfg = network_cfg.setdefault("sections", [])
    sections_by_id = {sec["id"]: sec for sec in sections_cfg if isinstance(sec, dict) and "id" in sec}
    actual_sections = {section.id: section for section in network.sections}

    for section_result in result.sections:
        section_cfg = sections_by_id.get(section_result.section_id)
        if section_cfg is None:
            section_cfg = {"id": section_result.section_id}
            sections_cfg.append(section_cfg)
            sections_by_id[section_result.section_id] = section_cfg
        _populate_section_config(section_cfg, actual_sections.get(section_result.section_id))
        section_cfg.setdefault("calculation_result", {})
        calculation = section_result.calculation
        section_cfg["calculation_result"]["pressure_drop"] = _pressure_drop_dict(
            calculation.pressure_drop, section_cfg.get("length")
        )
        section_cfg["calculation_result"]["summary"] = _summary_dict(section_result.summary)

    network_cfg["summary"] = network_cfg.get("summary", {})
    network_cfg["summary"]["state"] = _summary_dict(result.summary)
    summary_drop = _pressure_drop_dict(result.aggregate.pressure_drop, None)
    network_cfg["summary"]["pressure_drop"] = summary_drop

    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(data, handle, sort_keys=False)


def _pressure_drop_dict(details, length: float | None) -> Dict[str, Any]:
    normalized = None
    if length and length > 0 and details.pipe_and_fittings:
        normalized = details.pipe_and_fittings / length * 100.0
    return {
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


def _populate_section_config(section_cfg: Dict[str, Any], section: "PipeSection" | None) -> None:
    if section is None:
        return
    for key, value in (
        ("pipe_diameter", section.pipe_diameter),
        ("inlet_diameter", section.inlet_diameter),
        ("outlet_diameter", section.outlet_diameter),
        ("length", section.length),
        ("roughness", section.roughness),
        ("pipe_NPD", section.pipe_NPD),
        ("erosional_constant", section.erosional_constant),
    ):
        if value is not None:
            section_cfg[key] = value
    for redundant in ("main_ID", "input_ID", "output_ID"):
        section_cfg.pop(redundant, None)

    _populate_valve_config(section_cfg, section)
    _populate_orifice_config(section_cfg, section)


def _populate_valve_config(section_cfg: Dict[str, Any], section: "PipeSection") -> None:
    valve = section.control_valve
    if valve is None:
        return
    valve_cfg = section_cfg.setdefault("control_valve", {})
    for attr in (
        "tag",
        "cv",
        "cg",
        "pressure_drop",
        "C1",
        "FL",
        "Fd",
        "xT",
        "inlet_diameter",
        "outlet_diameter",
        "valve_diameter",
    ):
        value = getattr(valve, attr, None)
        if value is not None:
            valve_cfg[attr] = value


def _populate_orifice_config(section_cfg: Dict[str, Any], section: "PipeSection") -> None:
    orifice = section.orifice
    if orifice is None:
        return
    orifice_cfg = section_cfg.setdefault("orifice", {})
    for attr in ("tag", "d_over_D_ratio", "pressure_drop", "pipe_diameter", "orifice_diameter"):
        value = getattr(orifice, attr, None)
        if value is not None:
            orifice_cfg[attr] = value
