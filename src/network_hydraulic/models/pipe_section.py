"""Pipe section definition."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.results import CalculationOutput, ResultSummary

ALLOWED_FITTING_TYPES = [
    "elbow_90",
    "elbow_45",
    "u_bend",
    "stub_in_elbow",
    "tee_elbow",
    "tee_through",
    "block_valve_full_line_size",
    "block_valve_reduced_trim_0.9d",
    "block_valve_reduced_trim_0.8d",
    "globe_valve",
    "diaphragm_valve",
    "butterfly_valve",
    "check_valve_swing",
    "check_valve_lift",
    "check_valve_tilting",
    "pipe_entrance_normal",
    "pipe_entrance_raise",
    "pipe_exit",
    "inlet_swage",
    "outlet_swage",
]


@dataclass(slots=True)
class Fitting:
    type: str
    count: int = 1

    def __post_init__(self) -> None:
        normalized_type = self.type.strip().lower()
        if normalized_type not in ALLOWED_FITTING_TYPES:
            raise ValueError(f"Unsupported fitting type '{self.type}'")
        if self.count <= 0:
            raise ValueError("Fitting count must be positive")
        self.type = normalized_type


@dataclass(slots=True)
class PipeSection:
    id: str
    schedule: str
    roughness: float
    length: float
    elevation_change: float
    fitting_type: str
    fittings: List[Fitting]
    fitting_K: Optional[float]
    pipe_length_K: Optional[float]
    user_K: Optional[float]
    piping_and_fitting_safety_factor: Optional[float]
    total_K: Optional[float]
    user_specified_fixed_loss: Optional[float]
    pipe_NPD: Optional[float] = None
    description: Optional[str] = None
    design_margin: Optional[float] = None
    pipe_diameter: Optional[float] = None
    inlet_diameter: Optional[float] = None
    outlet_diameter: Optional[float] = None
    erosional_constant: Optional[float] = None
    mach_number: Optional[float] = None
    boundary_pressure: Optional[float] = None
    direction: Optional[str] = None
    inlet_diameter_specified: bool = False
    outlet_diameter_specified: bool = False
    control_valve: Optional[ControlValve] = None
    orifice: Optional[Orifice] = None
    calculation_output: CalculationOutput = field(default_factory=CalculationOutput)
    result_summary: ResultSummary = field(default_factory=ResultSummary)
    design_flow_multiplier: float = 1.0
    design_mass_flow_rate: Optional[float] = None
    design_volumetric_flow_rate: Optional[float] = None

    def __post_init__(self) -> None:
        errors: list[str] = []

        if not self.id:
            errors.append("PipeSection id must be a non-empty string")
        
        if self.roughness < 0:
            errors.append("PipeSection roughness must be non-negative")
        
        if self.length < 0:
            errors.append("PipeSection length must be non-negative")
        
        if self.pipe_diameter is not None and self.pipe_diameter <= 0:
            errors.append("PipeSection pipe_diameter must be positive if provided")
        
        if self.inlet_diameter is not None and self.inlet_diameter <= 0:
            errors.append("PipeSection inlet_diameter must be positive if provided")
        
        if self.outlet_diameter is not None and self.outlet_diameter <= 0:
            errors.append("PipeSection outlet_diameter must be positive if provided")
        
        if self.piping_and_fitting_safety_factor is not None and self.piping_and_fitting_safety_factor <= 0:
            errors.append("PipeSection piping_and_fitting_safety_factor must be positive if provided")
        
        if self.erosional_constant is not None and self.erosional_constant <= 0:
            errors.append("PipeSection erosional_constant must be positive if provided")
        
        if not self.fitting_type:
            errors.append("PipeSection fitting_type must be a non-empty string")

        if errors:
            raise ValueError("; ".join(errors))
