"""Network grouping of pipe sections."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.models.results import CalculationOutput, ResultSummary
from network_hydraulic.models.output_units import OutputUnits


@dataclass(slots=True)
class Network:
    name: str
    description: Optional[str]
    fluid: Fluid
    direction: str = "auto"
    boundary_pressure: Optional[float] = None
    upstream_pressure: Optional[float] = None
    downstream_pressure: Optional[float] = None
    gas_flow_model: str = "isothermal"
    sections: List[PipeSection] = field(default_factory=list)
    calculation_output: CalculationOutput = field(default_factory=CalculationOutput)
    result_summary: ResultSummary = field(default_factory=ResultSummary)
    output_units: OutputUnits = field(default_factory=OutputUnits)
    design_margin: Optional[float] = None

    def __post_init__(self) -> None:
        errors: list[str] = []

        normalized_direction = (self.direction or "").strip().lower()
        if normalized_direction not in {"auto", "forward", "backward"}:
            errors.append(f"Network direction '{self.direction}' must be 'auto', 'forward', or 'backward'")
        self.direction = normalized_direction

        normalized_gas_flow_model = (self.gas_flow_model or "").strip().lower()
        if normalized_gas_flow_model not in {"isothermal", "adiabatic"}:
            errors.append(f"Gas flow model '{self.gas_flow_model}' must be 'isothermal' or 'adiabatic'")
        self.gas_flow_model = normalized_gas_flow_model

        if self.design_margin is not None and self.design_margin < 0:
            errors.append("Network design_margin must be non-negative")

        if errors:
            raise ValueError("; ".join(errors))

    def add_section(self, section: PipeSection) -> None:
        self.sections.append(section)
