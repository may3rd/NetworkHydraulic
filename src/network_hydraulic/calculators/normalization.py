"""Utility calculators for normalized losses."""
from __future__ import annotations

from dataclasses import dataclass

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.pipe_section import PipeSection


@dataclass
class NormalizedLossCalculator(LossCalculator):
    def calculate(self, section: PipeSection) -> None:
        pressure_drop = section.calculation_output.pressure_drop
        length = section.length or 0.0
        pipe_k = section.pipe_length_K or 0.0
        total_k = pipe_k + (section.fitting_K or 0.0)
        friction_drop = pressure_drop.pipe_and_fittings

        if length <= 0 or pipe_k <= 0 or friction_drop is None or total_k <= 0:
            pressure_drop.normalized_friction_loss = None
            return

        pipe_only_drop = friction_drop * pipe_k / total_k
        pressure_drop.normalized_friction_loss = pipe_only_drop / length * 100.0
