"""User specified fixed losses."""
from __future__ import annotations

from dataclasses import dataclass

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.pipe_section import PipeSection


@dataclass
class UserFixedLossCalculator(LossCalculator):
    """Compute user specified fixed losses."""

    def calculate(self, section: PipeSection) -> None:
        if section.user_specified_fixed_loss is None:
            return

        pressure_drop = section.calculation_output.pressure_drop
        delta_p = section.user_specified_fixed_loss
        pressure_drop.user_specified_fixed_loss = delta_p
        baseline = pressure_drop.total_segment_loss or 0.0
        pressure_drop.total_segment_loss = baseline + delta_p
