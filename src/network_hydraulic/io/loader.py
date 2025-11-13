"""Configuration loader utilities that parse YAML/JSON configs.

Example:

    from network_hydraulic.io.loader import ConfigurationLoader

    loader = ConfigurationLoader.from_yaml_path(Path("config/sample.yaml"))
    network = loader.build_network()
"""
from __future__ import annotations

import json
import logging
import re
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from ruamel.yaml import YAML

from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.models.output_units import OutputUnits
from network_hydraulic.utils.pipe_dimensions import inner_diameter_from_nps
from network_hydraulic.utils.units import convert as convert_units

SWAGE_ABSOLUTE_TOLERANCE = 1e-6
SWAGE_RELATIVE_TOLERANCE = 1e-3
QUANTITY_PATTERN = re.compile(r"^\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*(\S.+)$")

logger = logging.getLogger(__name__)
NETWORK_ALLOWED_KEYS = {
    "name",
    "description",
    "direction",
    "boundary_pressure",
    "boundary_temperature",
    "pressure",
    "temperature",
    "gas_flow_model",
    "gas_flow_type",
    "fluid",
    "sections",
    "output_units",
    "design_margin",
    "mass_flow_rate",
}

SECTION_ALLOWED_KEYS = {
    "id",
    "description",
    "main_ID",
    "input_ID",
    "output_ID",
    "schedule",
    "roughness",
    "length",
    "elevation_change",
    "fitting_type",
    "fittings",
    "pipe_diameter",
    "inlet_diameter",
    "outlet_diameter",
    "control_valve",
    "orifice",
    "pipe_NPD",
    "design_margin",
    "fitting_K",
    "pipe_length_K",
    "user_K",
    "piping_and_fitting_safety_factor",
    "total_K",
    "user_specified_fixed_loss",
    "erosional_constant",
    "boundary_pressure",
    "direction",
    "inlet_diameter_specified",
    "outlet_diameter_specified",
    "flow_splitting_factor",
    "from_pipe_id",
    "to_pipe_id",
}

def _yaml_loader() -> YAML:
    yaml = YAML(typ="safe")
    yaml.default_flow_style = False
    return yaml


@dataclass(slots=True)
class ConfigurationLoader:
    raw: Dict[str, Any]

    @classmethod
    def from_yaml_path(cls, path: Path) -> "ConfigurationLoader":
        yaml = _yaml_loader()
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.load(handle) or {}
        return cls(raw=data)

    @classmethod
    def from_path(cls, path: Path) -> "ConfigurationLoader":
        warnings.warn(
            "ConfigurationLoader.from_path is deprecated; use from_yaml_path instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        return cls.from_yaml_path(path)

    @classmethod
    def from_json_path(cls, path: Path) -> "ConfigurationLoader":
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle) or {}
        return cls(raw=data)

    def build_network(self) -> Network:
        network_cfg = self.raw.get("network", {})
        logger.info("Building network configuration from loader data")
        self._validate_keys(network_cfg, NETWORK_ALLOWED_KEYS, context="network")
        fluid_cfg = network_cfg.get("fluid", {})
        
        raw_boundary_temperature = (
            network_cfg.get("boundary_temperature")
            if network_cfg.get("boundary_temperature") is not None
            else network_cfg.get("temperature")
        )
        raw_boundary_pressure = (
            network_cfg.get("boundary_pressure")
            if network_cfg.get("boundary_pressure") is not None
            else network_cfg.get("pressure")
        )
        boundary_temperature = self._require_positive_quantity(
            raw_boundary_temperature,
            "network.boundary_temperature",
            target_unit="K",
        )
        boundary_pressure = self._require_positive_quantity(
            raw_boundary_pressure,
            "network.boundary_pressure",
            target_unit="Pa",
        )
        phase = fluid_cfg.get("phase", "liquid")
        
        density_value = self._quantity(
            fluid_cfg.get("density"),
            "fluid.density",
            target_unit="kg/m^3",
        )
        viscosity = self._require_positive_quantity(
            fluid_cfg.get("viscosity"),
            "fluid.viscosity",
            target_unit="Pa*s",
        )
        molecular_weight = self._coerce_optional_float(
            fluid_cfg.get("molecular_weight"),
            "fluid.molecular_weight",
        )
        z_factor = self._coerce_optional_float(
            fluid_cfg.get("z_factor", 1.0),
            "fluid.z_factor",
        )
        specific_heat_ratio = self._coerce_optional_float(
            fluid_cfg.get("specific_heat_ratio", 1.0),
            "fluid.specific_heat_ratio",
        )

        mass_flow_rate_val = self._quantity(network_cfg.get("mass_flow_rate"), "network.mass_flow_rate", target_unit="kg/s")

        if mass_flow_rate_val is None:
            raise ValueError("network.mass_flow_rate must be provided")

        fluid = Fluid(
            name=fluid_cfg.get("name"),
            phase=phase,
            density=density_value if density_value is not None else 0.0,
            molecular_weight=molecular_weight if molecular_weight is not None else 0.0,
            z_factor=z_factor if z_factor is not None else 1.0,
            specific_heat_ratio=specific_heat_ratio if specific_heat_ratio is not None else 1.0,
            viscosity=viscosity,
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
        self._align_adjacent_diameters(sections)
        direction = network_cfg.get("direction", "auto")
        raw_gas_flow_model = network_cfg.get("gas_flow_model", network_cfg.get("gas_flow_type"))
        if raw_gas_flow_model is None:
            gas_flow_model = "isothermal" if fluid.is_gas() else None
        else:
            text_value = str(raw_gas_flow_model).strip().lower()
            if not text_value:
                gas_flow_model = "isothermal" if fluid.is_gas() else None
            else:
                gas_flow_model = text_value
        output_units = self._build_output_units(network_cfg.get("output_units"))
        network = Network(
            name=network_cfg.get("name", "network"),
            description=network_cfg.get("description"),
            fluid=fluid,
            boundary_temperature=boundary_temperature,
            boundary_pressure=boundary_pressure,
            direction=direction,
            mass_flow_rate=mass_flow_rate_val,
            gas_flow_model=gas_flow_model,
            sections=sections,
            output_units=output_units,
            design_margin=self._coerce_optional_float(network_cfg.get("design_margin"), "network.design_margin"),
        )
        logger.info(
            "Built network '%s' with %d section(s) and fluid '%s'",
            network.name,
            len(sections),
            network.fluid.name or network.fluid.phase,
        )
        return network

    def _build_section(self, cfg: Dict[str, Any]) -> PipeSection:
        self._validate_keys(cfg, SECTION_ALLOWED_KEYS, context=f"section '{cfg.get('id', '<unknown>')}'")
        control_valve = self._build_control_valve(cfg.get("control_valve"))
        orifice = self._build_orifice(cfg.get("orifice"))
        schedule = str(cfg.get("schedule", "40"))
        pipe_npd = self._quantity(cfg.get("pipe_NPD"), "pipe_NPD")
        main_d = self._resolve_main_diameter(cfg.get("main_ID"), pipe_npd, schedule)
        inlet_d = self._diameter(cfg.get("input_ID"), "input_ID", default=main_d)
        outlet_d = self._diameter(cfg.get("output_ID"), "output_ID", default=main_d)
        pipe_diameter = self._diameter(cfg.get("pipe_diameter"), "pipe_diameter", default=main_d)
        inlet_specified = cfg.get("inlet_diameter") is not None or cfg.get("input_ID") is not None
        outlet_specified = cfg.get("outlet_diameter") is not None or cfg.get("output_ID") is not None
        inlet_diameter = self._diameter(cfg.get("inlet_diameter"), "inlet_diameter", default=inlet_d)
        outlet_diameter = self._diameter(cfg.get("outlet_diameter"), "outlet_diameter", default=outlet_d)
        fittings = self._build_fittings(cfg.get("fittings"), inlet_diameter, outlet_diameter, pipe_diameter)
        roughness = self._quantity(cfg.get("roughness"), "roughness", target_unit="m", default=0.0)
        length = self._quantity(cfg.get("length"), "length", target_unit="m")
        if length is None:
            section_id = cfg.get("id", "<unknown>")
            raise ValueError(f"section.length must be provided for section '{section_id}'")
        elevation_change = self._quantity(
            cfg.get("elevation_change"), "elevation_change", target_unit="m", default=0.0
        )
        boundary_pressure = self._quantity(cfg.get("boundary_pressure"), "section.boundary_pressure", target_unit="Pa")
        pipe_section = PipeSection(
            id=cfg["id"],
            schedule=schedule,
            roughness=roughness,
            length=length,
            elevation_change=elevation_change,
            fitting_type=cfg.get("fitting_type", "LR"),
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
            description=cfg.get("description") or f"Line {cfg['id']}",
            design_margin=self._coerce_optional_float(cfg.get("design_margin"), "section.design_margin"),
            pipe_diameter=pipe_diameter,
            inlet_diameter=inlet_diameter,
            outlet_diameter=outlet_diameter,
            erosional_constant=cfg.get("erosional_constant"),
            inlet_diameter_specified=inlet_specified,
            outlet_diameter_specified=outlet_specified,
            control_valve=control_valve,
            orifice=orifice,
            boundary_pressure=boundary_pressure,
            direction=cfg.get("direction"),
            flow_splitting_factor=self._coerce_optional_float(cfg.get("flow_splitting_factor"), "section.flow_splitting_factor") or 1.0,
            from_pipe_id=cfg.get("from_pipe_id"),
            to_pipe_id=cfg.get("to_pipe_id"),
        )
        return pipe_section

    def _build_output_units(self, cfg: Optional[Dict[str, Any]]) -> OutputUnits:
        if not cfg:
            return OutputUnits()
        valid_keys = set(OutputUnits.__dataclass_fields__.keys())
        normalized: Dict[str, str] = {}
        for key, value in cfg.items():
            if key not in valid_keys:
                raise ValueError(f"Unknown output unit key '{key}'. Valid keys: {sorted(valid_keys)}")
            if value is None:
                continue
            normalized[key] = str(value).strip()
        return OutputUnits(**normalized)

    def _align_adjacent_diameters(self, sections: List[PipeSection]) -> None:
        if not sections:
            return
        for upstream, downstream in zip(sections, sections[1:]):
            upstream_exit = (
                upstream.outlet_diameter if upstream.outlet_diameter_specified else upstream.pipe_diameter
            )
            downstream_entry = (
                downstream.inlet_diameter if downstream.inlet_diameter_specified else downstream.pipe_diameter
            )
            if upstream_exit is None or downstream_entry is None:
                continue
            if self._diameters_within_tolerance(upstream_exit, downstream_entry):
                continue
            if upstream.outlet_diameter_specified or downstream.inlet_diameter_specified:
                continue
            downstream.inlet_diameter = upstream_exit
            self._ensure_swage_fitting(downstream, "inlet_swage")
            logger.debug(
                "Aligned downstream inlet diameter for section '%s' to match upstream '%s'",
                downstream.id,
                upstream.id,
            )

    def _ensure_swage_fitting(self, section: PipeSection, fit_type: str) -> None:
        if self._has_fitting(section.fittings, fit_type):
            return
        section.fittings.append(Fitting(type=fit_type, count=1))

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
            calculation_note=cfg.get("calculation_note"),
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
            calculation_note=cfg.get("calculation_note"),
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
        if upstream is None or downstream is None:
            return False
        return not ConfigurationLoader._diameters_within_tolerance(upstream, downstream)

    @staticmethod
    def _has_fitting(fittings: List[Fitting], fit_type: str) -> bool:
        return any(fitting.type == fit_type for fitting in fittings)

    @staticmethod
    def _validate_keys(cfg: Dict[str, Any], allowed: set[str], *, context: str) -> None:
        unknown = set(cfg or {}) - allowed
        if unknown:
            keys = ", ".join(sorted(unknown))
            raise ValueError(f"Unknown keys in {context}: {keys}")

    @staticmethod
    def _diameters_within_tolerance(a: Optional[float], b: Optional[float]) -> bool:
        if a is None or b is None:
            return False
        diff = abs(a - b)
        scale = max(abs(a), abs(b), 1.0)
        tolerance = max(SWAGE_ABSOLUTE_TOLERANCE, SWAGE_RELATIVE_TOLERANCE * scale)
        return diff <= tolerance

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

    def _require_positive_quantity(
        self,
        raw: Optional[Any],
        name: str,
        *,
        target_unit: Optional[str] = None,
    ) -> float:
        value = self._quantity(raw, name, target_unit=target_unit)
        if value is None:
            raise ValueError(f"{name} must be provided")
        if value <= 0:
            raise ValueError(f"{name} must be positive")
        return value

    @staticmethod
    def _coerce_optional_float(value: Optional[Any], name: str) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{name} must be numeric") from exc
