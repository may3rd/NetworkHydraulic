"""Elevation change losses."""
from __future__ import annotations

from dataclasses import dataclass

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.pipe_section import PipeSection

GRAVITY = 9.80665  # m/s^2, standard gravity
GAS_PHASES = {"gas", "vapor"}


@dataclass
class ElevationCalculator(LossCalculator):
    fluid_density: float
    phase: str = "liquid"
    gravity: float = GRAVITY

    def __post_init__(self) -> None:
        if self.fluid_density <= 0:
            raise ValueError("fluid_density must be positive")
        if self.gravity <= 0:
            raise ValueError("gravity must be positive")

    def calculate(self, section: PipeSection) -> None:
        pressure_drop = section.calculation_output.pressure_drop
        if self.phase.lower() in GAS_PHASES:
            pressure_drop.elevation_change = 0.0
            return
        delta_p = self.fluid_density * self.gravity * section.elevation_change
        pressure_drop.elevation_change = delta_p
        baseline = pressure_drop.total_segment_loss or 0.0
        pressure_drop.total_segment_loss = baseline + delta_p
