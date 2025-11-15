"""Pipe friction and fitting losses."""
from __future__ import annotations

from dataclasses import dataclass
from math import pi, log10
from typing import Optional

# from fluids.friction import friction_factor as colebrook_friction_factor

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection


@dataclass
class FrictionCalculator(LossCalculator):
    """Compute straight-pipe resistance using the Darcy–Weisbach equation."""

    fluid: Fluid
    default_pipe_diameter: Optional[float] = None
    friction_factor_override: Optional[float] = None
    friction_factor_type: str = "darcy"

    def calculate(self, section: PipeSection) -> None:
        pressure_drop = section.calculation_output.pressure_drop
        if not section.has_pipeline_segment:
            section.pipe_length_K = 0.0
            pressure_drop.pipe_and_fittings = 0.0
            return
        diameter = self._pipe_diameter(section)
        area = 0.25 * pi * diameter * diameter

        if section.temperature is None or section.temperature <= 0:
            raise ValueError("section.temperature must be set and positive for friction calculations")
        if section.pressure is None or section.pressure <= 0:
            raise ValueError("section.pressure must be set and positive for friction calculations")

        flow_rate = self._determine_flow_rate(section)
        velocity = flow_rate / area

        density = self.fluid.current_density(section.temperature, section.pressure)
        viscosity = self._require_positive(self.fluid.viscosity, "viscosity")
        reynolds = density * abs(velocity) * diameter / viscosity
        if reynolds <= 0:
            raise ValueError("Unable to compute Reynolds number for friction calculation")

        length = section.length or 0.0
        friction = 0.0  # Initialize friction
        if length > 0:
            friction = self._friction_factor(reynolds, section.roughness or 0.0, diameter)
            pipe_k = self._pipe_k(friction, length, diameter)
        else:
            pipe_k = 0.0
        section.pipe_length_K = pipe_k
        fitting_k = section.fitting_K or 0.0
        total_k = pipe_k + fitting_k
        if total_k <= 0:
            delta_p = 0.0
        else:
            delta_p = total_k * density * velocity * velocity / 2.0

        pressure_drop.pipe_and_fittings = delta_p
        total = pressure_drop.total_segment_loss or 0.0
        pressure_drop.total_segment_loss = total + delta_p
        pressure_drop.reynolds_number = reynolds
        pressure_drop.frictional_factor = self._convert_for_output(friction)
        pressure_drop.flow_scheme = self._determine_flow_scheme(reynolds)

    def _determine_flow_scheme(self, reynolds: float) -> str:
        if reynolds < 2000:
            return "laminar"
        elif reynolds > 4000:
            return "turbulent"
        else:
            return "transition"

    def _determine_flow_rate(self, section: PipeSection) -> float:
        try:
            flow_rate = section.current_volumetric_flow_rate(self.fluid)
        except ValueError as e:
            raise ValueError(f"Volumetric flow rate is required for friction calculations: {e}")
        return flow_rate

    def _pipe_diameter(self, section: PipeSection) -> float:
        for candidate in (section.pipe_diameter, self.default_pipe_diameter):
            if candidate and candidate > 0:
                return candidate
        raise ValueError("Pipe diameter is required for friction calculations")

    @staticmethod
    def _pipe_k(friction: float, length: float, diameter: float) -> float:
        if friction <= 0 or length <= 0 or diameter <= 0:
            return 0.0
        return friction * (length / diameter)

    def _friction_factor(self, reynolds: float, roughness: float, diameter: float) -> float:
        if self.friction_factor_override and self.friction_factor_override > 0:
            return self._to_darcy(self.friction_factor_override)
        rel_roughness = roughness / diameter if diameter > 0 and roughness > 0 else 0.0
        # ff = colebrook_friction_factor(Re=reynolds, eD=rel_roughness, Method="Serghides_2")
        ff = self._calculate_friction_factor(reynolds, diameter, roughness)
        return ff

    def _to_darcy(self, value: float) -> float:
        kind = (self.friction_factor_type or "darcy").strip().lower()
        if kind in {"darcy", "d"}:
            return value
        if kind in {"fanning", "f"}:
            return value * 4.0
        raise ValueError(f"Unknown friction_factor_type '{self.friction_factor_type}'. Expected 'darcy' or 'fanning'.")

    def _convert_for_output(self, darcy_value: float) -> float:
        kind = (self.friction_factor_type or "darcy").strip().lower()
        if kind in {"darcy", "d"}:
            return darcy_value
        if kind in {"fanning", "f"}:
            return darcy_value / 4.0
        raise ValueError(f"Unknown friction_factor_type '{self.friction_factor_type}'. Expected 'darcy' or 'fanning'.")

    @staticmethod
    def _require_positive(value: Optional[float], name: str) -> float:  # pragma: no cover - defensive
        if value is None or value <= 0:
            raise ValueError(f"{name} must be positive for friction calculations")
        return value

    def _calculate_friction_factor(self, reynolds_number, pipe_diameter, absolute_roughness):
        """
        Calculates the Darcy-Weisbach friction factor (f) based on flow regime.

        This function implements the logic from the provided Excel formula:
        =IF(Re > 2100, [Serghide/Explicit Eq.], 64/Re)

        Args:
            reynolds_number (float): The Reynolds Number (Re) for the flow (dimensionless).
            pipe_diameter (float): The internal diameter of the pipe (D) (in any unit, e.g., meters).
            absolute_roughness (float): The absolute roughness of the pipe (epsilon) 
                                        (in the *same unit* as pipe_diameter).

        Returns:
            float: The Darcy-Weisbach friction factor (f) (dimensionless).
                Returns float('inf') or raises an exception if math domain errors occur
                (e.g., negative log input due to invalid parameters).
        """
        
        # --- Input Validation ---
        if reynolds_number <= 0:
            raise ValueError("Reynolds number must be positive.")
        if pipe_diameter <= 0:
            raise ValueError("Pipe diameter must be positive.")
        if absolute_roughness < 0:
            raise ValueError("Absolute roughness cannot be negative.")
        
        # --- Laminar Flow (Re <= 2100) ---
        if reynolds_number <= 2100:
            # Simple exact formula for laminar flow
            return 64 / reynolds_number
        
        # --- Turbulent Flow (Re > 2100) ---
        else:
            # This is the Serghide equation from your Excel file,
            # an explicit approximation of the Colebrook-White equation.
            
            try:
                # Calculate relative roughness
                relative_roughness = absolute_roughness / pipe_diameter
                
                # Break down the equation for clarity
                
                # Term 1: (epsilon/D) / 3.7
                term1 = relative_roughness / 3.7
                
                # Term 2: (14.5 / Re)
                term2 = 14.5 / reynolds_number
                
                # Inner log: LOG( (epsilon/D)/3.7 + (14.5/Re) )
                inner_log = log10(term1 + term2)
                
                # Term 3: 5.02 / Re * (Inner Log)
                term3 = (5.02 / reynolds_number) * inner_log
                
                # Outer log: LOG( (epsilon/D)/3.7 - Term 3 )
                outer_log = log10(term1 - term3)
                
                # Final calculation: 1 / (-2 * Outer Log)^2
                friction_factor = 1 / ((-2 * outer_log) ** 2)
                
                return friction_factor
                
            except ValueError as e:
                # This can happen if the arguments to log10 are non-positive
                print(f"Error during calculation (check inputs): {e}")
                raise