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

    def add_section(self, section: PipeSection) -> None:
        self.sections.append(section)
