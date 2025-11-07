"""Utility calculators for normalized losses."""
from __future__ import annotations

from dataclasses import dataclass

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.pipe_section import PipeSection


@dataclass
class NormalizedLossCalculator(LossCalculator):
    def calculate(self, section: PipeSection) -> None:
        pressure_drop = section.calculation_output.pressure_drop
        friction_drop = pressure_drop.pipe_and_fittings
        if friction_drop is None:
            return
        if section.length is None or section.length <= 0:
            return
        normalized = friction_drop / section.length * 100.0
        pressure_drop.normalized_friction_loss = normalized
