"""Fitting loss coefficients using the 2-K method."""
from __future__ import annotations

from dataclasses import dataclass
from math import pi
from typing import Dict, Optional, Tuple

from fluids.friction import friction_factor

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.models.results import FittingBreakdown

INCHES_PER_METER = 39.3700787402


FITTING_COEFFICIENTS: Dict[str, object] = {
    "elbow_90": {
        "scrd": (800.0, 0.4),
        "sr": (800.0, 0.25),
        "lr": (800.0, 0.2),
        "default": (800.0, 0.2),
    },
    "elbow_45": {
        "scrd": (500.0, 0.2),
        "sr": (500.0, 0.2),
        "lr": (500.0, 0.15),
        "default": (500.0, 0.15),
    },
    "u_bend": {
        "scrd": (1000.0, 0.6),
        "sr": (1000.0, 0.35),
        "lr": (1000.0, 0.3),
        "default": (1000.0, 0.3),
    },
    "tee_elbow": {
        "scrd": (500.0, 0.7),
        "sr": (800.0, 0.8),
        "lr": (800.0, 0.4),
        "default": (500.0, 0.7),
    },
    "tee_through": {
        "scrd": (200.0, 0.1),
        "sr": (150.0, 0.05),
        "lr": (150.0, 0.05),
        "stub_in": (100.0, 0.0),
        "default": (150.0, 0.05),
    },
    "stub_in_elbow": (1000.0, 1.0),
    "block_valve_full_line_size": (300.0, 0.1),
    "block_valve_reduced_trim_0.9d": (500.0, 0.15),
    "block_valve_reduced_trim_0.8d": (1000.0, 0.25),
    "globe_valve": (1500.0, 4.0),
    "diaphragm_valve": (1000.0, 2.0),
    "butterfly_valve": (800.0, 0.25),
    "check_valve_swing": (1500.0, 1.5),
    "lift_check_valve": (2000.0, 10.0),
    "tilting_check_valve": (1000.0, 0.5),
}


@dataclass
class FittingLossCalculator(LossCalculator):
    """Derive per-fitting K values using the 2-K method."""

    fluid: Fluid
    default_pipe_diameter: Optional[float] = None

    def calculate(self, section: PipeSection) -> None:
        details = section.calculation_output.pressure_drop
        details.fitting_breakdown = []
        if not section.fittings:
            section.fitting_K = 0.0
            return

        diameter = self._pipe_diameter(section)
        velocity = self._velocity(section, diameter)
        density = self.fluid.current_density()
        viscosity = self._require_positive(self.fluid.viscosity, "viscosity")
        reynolds = density * abs(velocity) * diameter / viscosity
        if reynolds <= 0:
            raise ValueError("Unable to compute Reynolds number for fittings calculation")

        total_k = 0.0
        breakdown: list[FittingBreakdown] = []
        for fitting in section.fittings:
            k_value = self._fitting_k(fitting, section, reynolds, diameter)
            count = fitting.count or 1
            breakdown.append(
                FittingBreakdown(
                    type=fitting.type,
                    count=count,
                    k_each=k_value / count,
                    k_total=k_value,
                )
            )
            total_k += k_value

        section.fitting_K = total_k
        details.fitting_breakdown = breakdown

    def _pipe_diameter(self, section: PipeSection) -> float:
        for candidate in (section.pipe_diameter, self.default_pipe_diameter):
            if candidate and candidate > 0:
                return candidate
        raise ValueError("Pipe diameter is required to evaluate fittings with the 2-K method")

    def _velocity(self, section: PipeSection, diameter: float) -> float:
        flow_rate = section.current_volumetric_flow_rate(self.fluid)
        area = 0.25 * pi * diameter * diameter
        if area <= 0:
            raise ValueError("Pipe diameter must be positive to determine velocity")
        return flow_rate / area

    def _fitting_k(
        self,
        fitting: Fitting,
        section: PipeSection,
        reynolds: float,
        diameter: float,
    ) -> float:
        ftype = fitting.type
        coeffs = self._coefficients_for(ftype, section)
        if coeffs:
            k_value = self._two_k(coeffs[0], coeffs[1], reynolds, diameter)
        elif ftype == "pipe_entrance_normal":
            k_value = self._normal_entrance_k(reynolds)
        elif ftype == "pipe_entrance_raise":
            inlet = self._inlet_diameter(section) or diameter
            ratio = diameter / inlet
            k_value = (160.0 / reynolds + 1.0) * ratio**4
        elif ftype == "pipe_exit":
            k_value = 1.0
        elif ftype == "inlet_swage":
            k_value = self._inlet_swage_k(section, reynolds)
        elif ftype == "outlet_swage":
            k_value = self._outlet_swage_k(section, reynolds)
        else:
            raise ValueError(f"Unsupported fitting type '{ftype}' for 2-K calculation")
        return k_value * fitting.count

    def _coefficients_for(self, fitting_type: str, section: PipeSection) -> Optional[Tuple[float, float]]:
        entry = FITTING_COEFFICIENTS.get(fitting_type)
        if entry is None:
            return None
        if isinstance(entry, tuple):
            return entry
        style = self._normalized_style(section)
        for key in (style, "default"):
            if key and key in entry:
                return entry[key]
        return None

    def _normalized_style(self, section: PipeSection) -> str:
        raw = (section.fitting_type or "").strip().lower()
        if raw in {"scrd", "sr", "lr"}:
            return raw
        if raw in {"stub-in", "stub_in", "stab-in"}:
            return "stub_in"
        return "default"

    def _two_k(self, k1: float, kinf: float, reynolds: float, diameter: float) -> float:
        diameter_in = diameter * INCHES_PER_METER
        return k1 / reynolds + kinf * (1.0 + 1.0 / diameter_in)

    @staticmethod
    def _normal_entrance_k(reynolds: float) -> float:
        return 160.0 / reynolds + 0.5

    def _inlet_swage_k(self, section: PipeSection, reynolds: float) -> float:
        inlet = self._inlet_diameter(section) or self._pipe_diameter(section)
        pipe = self._pipe_diameter(section)
        corrected_re = reynolds * (pipe / inlet) if inlet else reynolds
        reducer = self._reducer_k(corrected_re, inlet, pipe, section.roughness)
        expander = self._expander_k(corrected_re, inlet, pipe, section.roughness)
        return reducer + expander

    def _outlet_swage_k(self, section: PipeSection, reynolds: float) -> float:
        pipe = self._pipe_diameter(section)
        outlet = self._outlet_diameter(section) or pipe
        reducer = self._reducer_k(reynolds, pipe, outlet, section.roughness)
        expander = self._expander_k(reynolds, pipe, outlet, section.roughness)
        ratio = pipe / outlet if outlet else 1.0
        return (reducer + expander) * ratio**4

    def _reducer_k(
        self,
        reynolds: float,
        diameter_inlet: Optional[float],
        diameter_outlet: Optional[float],
        roughness: Optional[float],
    ) -> float:
        if (
            reynolds <= 0
            or not diameter_inlet
            or not diameter_outlet
            or diameter_outlet >= diameter_inlet
        ):
            return 0.0

        ratio = diameter_inlet / diameter_outlet
        ratio2 = ratio * ratio
        ratio4 = ratio2 * ratio2
        if reynolds <= 2500.0:
            k_value = (1.2 + 160.0 / reynolds) * (ratio4 - 1.0)
        else:
            e_d = self._relative_roughness(roughness, diameter_inlet)
            fd = friction_factor(Re=reynolds, eD=e_d)
            k_value = (0.6 + 0.48 * fd) * ratio2 * (ratio2 - 1.0)
        return k_value * 0.75 / ratio4

    def _expander_k(
        self,
        reynolds: float,
        diameter_inlet: Optional[float],
        diameter_outlet: Optional[float],
        roughness: Optional[float],
    ) -> float:
        if (
            reynolds <= 0
            or not diameter_inlet
            or not diameter_outlet
            or diameter_outlet <= diameter_inlet
        ):
            return 0.0

        ratio = diameter_inlet / diameter_outlet
        ratio2 = ratio * ratio
        ratio4 = ratio2 * ratio2
        if reynolds < 4000.0:
            k_value = 2.0 * (1.0 - ratio4)
        else:
            e_d = self._relative_roughness(roughness, diameter_inlet)
            fd = friction_factor(Re=reynolds, eD=e_d)
            delta = 1.0 - ratio2
            k_value = (1.0 + 0.8 * fd) * (delta * delta)
        return k_value / ratio4

    @staticmethod
    def _relative_roughness(roughness: Optional[float], diameter: float) -> float:
        if not roughness or roughness <= 0:
            return 0.0
        return roughness / diameter

    def _inlet_diameter(self, section: PipeSection) -> Optional[float]:
        return section.inlet_diameter or section.pipe_diameter or self.default_pipe_diameter

    def _outlet_diameter(self, section: PipeSection) -> Optional[float]:
        return section.outlet_diameter or section.pipe_diameter or self.default_pipe_diameter

    @staticmethod
    def _require_positive(value: Optional[float], name: str) -> float:  # pragma: no cover - defensive
        if value is None or value <= 0:
            raise ValueError(f"{name} must be positive for fittings calculations")
        return value
