"""Configuration loader utilities."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from ruamel.yaml import YAML

from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.utils.pipe_dimensions import inner_diameter_from_nps

SWAGE_TOLERANCE = 1e-9

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

    def build_network(self) -> Network:
        network_cfg = self.raw.get("network", {})
        fluid_cfg = network_cfg.get("fluid", {})
        fluid = Fluid(
            name=fluid_cfg.get("name"),
            mass_flow_rate=fluid_cfg.get("mass_flow_rate"),
            volumetric_flow_rate=fluid_cfg.get("volumetric_flow_rate"),
            phase=fluid_cfg.get("phase", "liquid"),
            temperature=fluid_cfg.get("temperature", 0.0),
            pressure=fluid_cfg.get("pressure", 0.0),
            density=fluid_cfg.get("density", 0.0),
            molecular_weight=fluid_cfg.get("molecular_weight", 0.0),
            z_factor=fluid_cfg.get("z_factor", 1.0),
            specific_heat_ratio=fluid_cfg.get("specific_heat_ratio", 1.0),
            viscosity=fluid_cfg.get("viscosity", 0.0),
            standard_flow_rate=fluid_cfg.get("standard_flow_rate"),
            vapor_pressure=fluid_cfg.get("vapor_pressure"),
            critical_pressure=fluid_cfg.get("critical_pressure"),
        )
        sections_cfg: List[Dict[str, Any]] = network_cfg.get("sections", [])
        sections = [self._build_section(cfg) for cfg in sections_cfg]
        direction = network_cfg.get("direction", "forward")
        boundary_pressure = network_cfg.get("boundary_pressure")
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
        pipe_npd = self._optional_float(cfg.get("pipe_NPD"))
        main_d = self._resolve_main_diameter(cfg.get("main_ID"), pipe_npd, schedule)
        inlet_d = self._diameter(cfg.get("input_ID"), "input_ID", default=main_d)
        outlet_d = self._diameter(cfg.get("output_ID"), "output_ID", default=main_d)
        pipe_diameter = self._diameter(cfg.get("pipe_diameter"), "pipe_diameter", default=main_d)
        inlet_diameter = self._diameter(cfg.get("inlet_diameter"), "inlet_diameter", default=inlet_d)
        outlet_diameter = self._diameter(cfg.get("outlet_diameter"), "outlet_diameter", default=outlet_d)
        fittings = self._build_fittings(cfg.get("fittings"), inlet_diameter, outlet_diameter, pipe_diameter)
        return PipeSection(
            id=cfg["id"],
            main_ID=main_d,
            input_ID=inlet_diameter,
            output_ID=outlet_diameter,
            schedule=schedule,
            roughness=cfg.get("roughness", 0.0),
            length=cfg.get("length"),
            elevation_change=cfg.get("elevation_change", 0.0),
            fitting_type=cfg.get("fitting_type", "SCRD"),
            fittings=fittings,
            fitting_K=cfg.get("fitting_K"),
            pipe_length_K=cfg.get("pipe_length_K"),
            user_K=cfg.get("user_K"),
            piping_and_fitting_safety_factor=cfg.get("piping_and_fitting_safety_factor"),
            total_K=cfg.get("total_K"),
            user_specified_fixed_loss=cfg.get("user_specified_fixed_loss"),
            pipe_NPD=pipe_npd,
            pipe_diameter=pipe_diameter,
            inlet_diameter=inlet_diameter,
            outlet_diameter=outlet_diameter,
            erosional_constant=cfg.get("erosional_constant"),
            control_valve=control_valve,
            orifice=orifice,
        )

    def _build_control_valve(self, cfg: Optional[Dict[str, Any]]) -> Optional[ControlValve]:
        if not cfg:
            return None
        return ControlValve(
            tag=cfg.get("tag"),
            cv=cfg.get("cv"),
            cg=cfg.get("cg"),
            pressure_drop=cfg.get("pressure_drop"),
            C1=cfg.get("C1"),
            FL=cfg.get("FL"),
            Fd=cfg.get("Fd"),
            xT=cfg.get("xT"),
            inlet_diameter=cfg.get("inlet_diameter"),
            outlet_diameter=cfg.get("outlet_diameter"),
            valve_diameter=cfg.get("valve_diameter"),
        )

    def _build_orifice(self, cfg: Optional[Dict[str, Any]]) -> Optional[Orifice]:
        if not cfg:
            return None
        return Orifice(
            tag=cfg.get("tag"),
            d_over_D_ratio=cfg.get("d_over_D_ratio"),
            pressure_drop=cfg.get("pressure_drop"),
            pipe_diameter=cfg.get("pipe_diameter"),
            orifice_diameter=cfg.get("orifice_diameter"),
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

    @staticmethod
    def _optional_float(value: Optional[Any]) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("pipe_NPD must be numeric") from exc

    @staticmethod
    def _diameter(value: Optional[Any], name: str, default: Optional[float] = None) -> float:
        if value is None:
            if default is None:
                raise ValueError(f"{name} must be provided")
            return default
        try:
            return float(value)
        except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
            raise ValueError(f"{name} must be numeric") from exc
