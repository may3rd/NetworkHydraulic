"""Configuration loader utilities."""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
import json

from ruamel.yaml import YAML

from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.utils.pipe_dimensions import inner_diameter_from_nps
from network_hydraulic.utils.units import convert as convert_units

SWAGE_TOLERANCE = 1e-9
QUANTITY_PATTERN = re.compile(r"^\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(\S.+)$")

def _yaml_loader() -> YAML:
    yaml = YAML(typ="safe")
    yaml.default_flow_style = False
    return yaml


@dataclass(slots=True)
class ConfigurationLoader:
    raw: Dict[str, Any]

    @classmethod
    def from_path(cls, path: Path) -> "ConfigurationLoader":
        yaml = _yaml_loader()
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.load(handle) or {}
        return cls(raw=data)

    @classmethod
    def from_json_path(cls, path: Path) -> "ConfigurationLoader":
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle) or {}
        return cls(raw=data)

    def build_network(self) -> Network:
        network_cfg = self.raw.get("network", {})
        fluid_cfg = network_cfg.get("fluid", {})
        boundary_pressure = self._quantity(network_cfg.get("boundary_pressure"), "network.boundary_pressure", target_unit="Pa")
        fluid = Fluid(
            name=fluid_cfg.get("name"),
            mass_flow_rate=self._quantity(fluid_cfg.get("mass_flow_rate"), "fluid.mass_flow_rate", target_unit="kg/s"),
            volumetric_flow_rate=self._quantity(
                fluid_cfg.get("volumetric_flow_rate"), "fluid.volumetric_flow_rate", target_unit="m^3/s"
            ),
            phase=fluid_cfg.get("phase", "liquid"),
            temperature=self._quantity(fluid_cfg.get("temperature"), "fluid.temperature", target_unit="K", default=0.0),
            pressure=self._quantity(fluid_cfg.get("pressure"), "fluid.pressure", target_unit="Pa", default=0.0),
            density=self._quantity(fluid_cfg.get("density"), "fluid.density", target_unit="kg/m^3", default=0.0),
            molecular_weight=fluid_cfg.get("molecular_weight", 0.0),
            z_factor=fluid_cfg.get("z_factor", 1.0),
            specific_heat_ratio=fluid_cfg.get("specific_heat_ratio", 1.0),
            viscosity=self._quantity(fluid_cfg.get("viscosity"), "fluid.viscosity", target_unit="Pa*s", default=0.0),
            standard_flow_rate=self._quantity(
                fluid_cfg.get("standard_flow_rate"), "fluid.standard_flow_rate", target_unit="m^3/s"
            ),
            vapor_pressure=self._quantity(fluid_cfg.get("vapor_pressure"), "fluid.vapor_pressure", target_unit="Pa"),
            critical_pressure=self._quantity(
                fluid_cfg.get("critical_pressure"), "fluid.critical_pressure", target_unit="Pa"
            ),
        )
        sections_cfg: List[Dict[str, Any]] = network_cfg.get("sections", [])
        sections = [self._build_section(cfg) for cfg in sections_cfg]
        direction = network_cfg.get("direction", "forward")
        gas_flow_model = network_cfg.get("gas_flow_model", network_cfg.get("gas_flow_type", "isothermal"))
        return Network(
            name=network_cfg.get("name", "network"),
            description=network_cfg.get("description"),
            fluid=fluid,
            direction=direction,
            boundary_pressure=boundary_pressure,
            gas_flow_model=gas_flow_model,
            sections=sections,
        )

    def _build_section(self, cfg: Dict[str, Any]) -> PipeSection:
        control_valve = self._build_control_valve(cfg.get("control_valve"))
        orifice = self._build_orifice(cfg.get("orifice"))
        schedule = str(cfg.get("schedule", "40"))
        pipe_npd = self._quantity(cfg.get("pipe_NPD"), "pipe_NPD")
        main_d = self._resolve_main_diameter(cfg.get("main_ID"), pipe_npd, schedule)
        inlet_d = self._diameter(cfg.get("input_ID"), "input_ID", default=main_d)
        outlet_d = self._diameter(cfg.get("output_ID"), "output_ID", default=main_d)
        pipe_diameter = self._diameter(cfg.get("pipe_diameter"), "pipe_diameter", default=main_d)
        inlet_diameter = self._diameter(cfg.get("inlet_diameter"), "inlet_diameter", default=inlet_d)
        outlet_diameter = self._diameter(cfg.get("outlet_diameter"), "outlet_diameter", default=outlet_d)
        fittings = self._build_fittings(cfg.get("fittings"), inlet_diameter, outlet_diameter, pipe_diameter)
        roughness = self._quantity(cfg.get("roughness"), "roughness", target_unit="m", default=0.0)
        length = self._quantity(cfg.get("length"), "length", target_unit="m")
        elevation_change = self._quantity(cfg.get("elevation_change"), "elevation_change", target_unit="m")
        boundary_pressure = self._quantity(cfg.get("boundary_pressure"), "section.boundary_pressure", target_unit="Pa")
        pipe_section = PipeSection(
            id=cfg["id"],
            main_ID=main_d,
            input_ID=inlet_diameter,
            output_ID=outlet_diameter,
            schedule=schedule,
            roughness=roughness,
            length=length,
            elevation_change=elevation_change,
            fitting_type=cfg.get("fitting_type", "SCRD"),
            fittings=fittings,
            fitting_K=cfg.get("fitting_K"),
            pipe_length_K=cfg.get("pipe_length_K"),
            user_K=cfg.get("user_K"),
            piping_and_fitting_safety_factor=cfg.get("piping_and_fitting_safety_factor"),
            total_K=cfg.get("total_K"),
            user_specified_fixed_loss=self._quantity(
                cfg.get("user_specified_fixed_loss"), "user_specified_fixed_loss", target_unit="Pa"
            ),
            pipe_NPD=pipe_npd,
            pipe_diameter=pipe_diameter,
            inlet_diameter=inlet_diameter,
            outlet_diameter=outlet_diameter,
            erosional_constant=cfg.get("erosional_constant"),
            control_valve=control_valve,
            orifice=orifice,
            boundary_pressure=boundary_pressure,
        )
        return pipe_section

    def _build_control_valve(self, cfg: Optional[Dict[str, Any]]) -> Optional[ControlValve]:
        if not cfg:
            return None
        return ControlValve(
            tag=cfg.get("tag"),
            cv=cfg.get("cv"),
            cg=cfg.get("cg"),
            pressure_drop=self._quantity(cfg.get("pressure_drop"), "control_valve.pressure_drop", target_unit="Pa"),
            C1=cfg.get("C1"),
            FL=cfg.get("FL"),
            Fd=cfg.get("Fd"),
            xT=cfg.get("xT"),
            inlet_diameter=self._quantity(cfg.get("inlet_diameter"), "control_valve.inlet_diameter", target_unit="m"),
            outlet_diameter=self._quantity(
                cfg.get("outlet_diameter"), "control_valve.outlet_diameter", target_unit="m"
            ),
            valve_diameter=self._quantity(cfg.get("valve_diameter"), "control_valve.valve_diameter", target_unit="m"),
        )

    def _build_orifice(self, cfg: Optional[Dict[str, Any]]) -> Optional[Orifice]:
        if not cfg:
            return None
        return Orifice(
            tag=cfg.get("tag"),
            d_over_D_ratio=cfg.get("d_over_D_ratio"),
            pressure_drop=self._quantity(cfg.get("pressure_drop"), "orifice.pressure_drop", target_unit="Pa"),
            pipe_diameter=self._quantity(cfg.get("pipe_diameter"), "orifice.pipe_diameter", target_unit="m"),
            orifice_diameter=self._quantity(cfg.get("orifice_diameter"), "orifice.orifice_diameter", target_unit="m"),
            meter_type=cfg.get("meter_type"),
            taps=cfg.get("taps"),
            tap_position=cfg.get("tap_position"),
            discharge_coefficient=cfg.get("discharge_coefficient"),
            expansibility=cfg.get("expansibility"),
        )

    def _build_fittings(
        self,
        cfg: Optional[List[Any]],
        inlet_diameter: float,
        outlet_diameter: float,
        main_diameter: float,
    ) -> List[Fitting]:
        fittings: List[Fitting] = []
        for raw in cfg or []:
            fittings.append(self._normalize_fitting(raw))

        if self._needs_swage(inlet_diameter, main_diameter) and not self._has_fitting(fittings, "inlet_swage"):
            fittings.append(Fitting(type="inlet_swage", count=1))
        if self._needs_swage(main_diameter, outlet_diameter) and not self._has_fitting(fittings, "outlet_swage"):
            fittings.append(Fitting(type="outlet_swage", count=1))

        return fittings

    def _normalize_fitting(self, raw_entry: Any) -> Fitting:
        if isinstance(raw_entry, dict):
            fit_type = str(raw_entry.get("type", "")).strip().lower()
            count = raw_entry.get("count", 1)
        else:
            fit_type = str(raw_entry).strip().lower()
            count = 1
        if not fit_type:
            raise ValueError("Fitting type must be specified")
        try:
            count_int = int(count)
        except (TypeError, ValueError) as exc:
            raise ValueError("Fitting count must be an integer") from exc
        return Fitting(type=fit_type, count=count_int)

    @staticmethod
    def _needs_swage(upstream: float, downstream: float) -> bool:
        return abs((upstream or 0.0) - (downstream or 0.0)) > SWAGE_TOLERANCE

    @staticmethod
    def _has_fitting(fittings: List[Fitting], fit_type: str) -> bool:
        return any(fitting.type == fit_type for fitting in fittings)

    def _resolve_main_diameter(self, explicit: Optional[Any], pipe_npd: Optional[float], schedule: str) -> float:
        if explicit is not None:
            return self._diameter(explicit, "main_ID")
        if pipe_npd is None:
            raise ValueError("Either main_ID or pipe_NPD must be provided")
        return inner_diameter_from_nps(pipe_npd, schedule)

    def _diameter(self, value: Optional[Any], name: str, default: Optional[float] = None) -> float:
        diameter = self._quantity(value, name, target_unit="m")
        if diameter is None:
            if default is None:
                raise ValueError(f"{name} must be provided")
            return default
        return diameter

    def _quantity(
        self,
        raw: Optional[Any],
        name: str,
        *,
        target_unit: Optional[str] = None,
        default: Optional[float] = None,
    ) -> Optional[float]:
        value = self._convert_value(raw, name, target_unit)
        if value is None:
            return default
        return value

    def _convert_value(self, raw: Optional[Any], name: str, target_unit: Optional[str]) -> Optional[float]:
        if raw is None:
            return None
        if isinstance(raw, dict):
            return self._convert_from_mapping(raw, name, target_unit)
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            stripped = raw.strip()
            if not stripped:
                return None
            if target_unit:
                converted = self._convert_from_string(stripped, target_unit)
                if converted is not None:
                    return converted
            try:
                return float(stripped)
            except ValueError as exc:
                raise ValueError(f"{name} must be numeric") from exc
        try:
            return float(raw)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} must be numeric") from exc

    def _convert_from_mapping(self, raw_map: Dict[str, Any], name: str, target_unit: Optional[str]) -> float:
        if "value" not in raw_map or "unit" not in raw_map:
            raise ValueError(f"{name} entries with units must include 'value' and 'unit'")
        magnitude = raw_map["value"]
        unit = raw_map["unit"]
        try:
            magnitude_f = float(magnitude)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} value must be numeric") from exc
        unit_str = str(unit).strip()
        if not unit_str:
            raise ValueError(f"{name} unit must be a non-empty string")
        if target_unit and unit_str == target_unit: # Added condition
            return magnitude_f # Return directly if units are the same
        if target_unit:
            return convert_units(magnitude_f, unit_str, target_unit)
        return magnitude_f

    def _convert_from_string(self, raw: str, target_unit: str) -> Optional[float]:
        match = QUANTITY_PATTERN.match(raw)
        if not match:
            return None
        magnitude = float(match.group(1))
        unit = match.group(2).strip()
        return convert_units(magnitude, unit, target_unit)
