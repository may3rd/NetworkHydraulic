"""Network grouping of pipe sections and result summaries.

Example:

    from network_hydraulic.models import fluid, network

    fluid_model = fluid.Fluid(...)
    net = network.Network(name="demo", description="Sample", fluid=fluid_model)
    net.add_section(...)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional

from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.models.results import CalculationOutput, ResultSummary
from network_hydraulic.models.output_units import OutputUnits

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class Network:
    name: str
    description: Optional[str]
    fluid: Fluid
    direction: str = "auto"
    boundary_pressure: Optional[float] = None
    upstream_pressure: Optional[float] = None
    downstream_pressure: Optional[float] = None
    gas_flow_model: Optional[str] = None
    sections: List[PipeSection] = field(default_factory=list)
    calculation_output: CalculationOutput = field(default_factory=CalculationOutput)
    result_summary: ResultSummary = field(default_factory=ResultSummary)
    output_units: OutputUnits = field(default_factory=OutputUnits)
    design_margin: Optional[float] = None
    mass_flow_rate: Optional[float] = None
    volumetric_flow_rate: Optional[float] = None
    standard_flow_rate: Optional[float] = None

    def __post_init__(self) -> None:
        errors: list[str] = []

        normalized_direction = (self.direction or "").strip().lower()
        if normalized_direction not in {"auto", "forward", "backward"}:
            errors.append(f"Network direction '{self.direction}' must be 'auto', 'forward', or 'backward'")
        self.direction = normalized_direction

        normalized_gas_flow_model = (self.gas_flow_model or "").strip().lower()
        fluid_is_gas = False
        try:
            fluid_is_gas = self.fluid.is_gas()
        except AttributeError:
            fluid_is_gas = False

        if fluid_is_gas:
            if not normalized_gas_flow_model:
                normalized_gas_flow_model = "isothermal"
            if normalized_gas_flow_model not in {"isothermal", "adiabatic"}:
                errors.append(
                    f"Gas flow model '{self.gas_flow_model}' must be 'isothermal' or 'adiabatic'"
                )
            else:
                self.gas_flow_model = normalized_gas_flow_model
        else:
            if normalized_gas_flow_model and normalized_gas_flow_model not in {"isothermal", "adiabatic"}:
                errors.append(
                    f"Gas flow model '{self.gas_flow_model}' must be 'isothermal' or 'adiabatic'"
                )
            else:
                if normalized_gas_flow_model:
                    logger.warning(
                        "Liquid/vapor network '%s' specified gas_flow_model='%s'; this setting is ignored for liquid runs.",
                        self.name,
                        normalized_gas_flow_model,
                    )
                self.gas_flow_model = normalized_gas_flow_model or None

        if self.design_margin is not None and self.design_margin < 0:
            errors.append("Network design_margin must be non-negative")

        for attr_name in ("mass_flow_rate", "volumetric_flow_rate", "standard_flow_rate"):
            value = getattr(self, attr_name)
            if value is not None and value <= 0:
                errors.append(f"Network {attr_name} must be positive if provided")

        if errors:
            raise ValueError("; ".join(errors))

    def add_section(self, section: PipeSection) -> None:
        self.sections.append(section)
