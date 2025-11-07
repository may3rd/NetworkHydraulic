"""Orchestrates per-section hydraulic calculations."""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, fields
from math import pi, sqrt
from typing import Iterable, Optional

from network_hydraulic.calculators.elevation import ElevationCalculator
from network_hydraulic.calculators.fittings import FittingLossCalculator
from network_hydraulic.calculators.hydraulics import FrictionCalculator
from network_hydraulic.calculators.normalization import NormalizedLossCalculator
from network_hydraulic.calculators.orifices import OrificeCalculator
from network_hydraulic.calculators.valves import ControlValveCalculator
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.models.results import (
    CalculationOutput,
    NetworkResult,
    PressureDropDetails,
    ResultSummary,
    SectionResult,
)
from network_hydraulic.utils.gas_flow import UNIVERSAL_GAS_CONSTANT

EROSIONAL_CONVERSION = 0.3048 * sqrt(16.018463)

@dataclass
class NetworkSolver:
    """Runs calculations for all pipe sections in a network."""

    default_pipe_diameter: Optional[float] = None
    volumetric_flow_rate: Optional[float] = None
    direction: Optional[str] = None
    boundary_pressure: Optional[float] = None
    gas_flow_model: Optional[str] = None

    def run(self, network: Network) -> NetworkResult:
        network.fluid.ensure_valid()
        calculators = self._build_calculators(network)
        result = NetworkResult()

        sections = list(network.sections)
        for section in sections:
            self._reset_section(section)
            for calculator in calculators:
                calculator.calculate(section)

        self._apply_pressure_profile(
            sections,
            network,
            direction=self.direction or network.direction,
            boundary=self.boundary_pressure if self.boundary_pressure is not None else network.boundary_pressure,
        )
        self._populate_states(sections, network)
        self._set_network_summary(network, sections)

        for section in sections:
            result.sections.append(
                SectionResult(
                    section_id=section.id,
                    calculation=section.calculation_output,
                    summary=section.result_summary,
                )
            )
            self._accumulate(result.aggregate.pressure_drop, section.calculation_output.pressure_drop)

        result.summary = network.result_summary
        return result

    def _build_calculators(self, network: Network) -> Iterable:
        fluid = network.fluid
        elevation = ElevationCalculator(
            fluid_density=fluid.current_density(),
            phase=fluid.phase,
        )
        return [
            FittingLossCalculator(
                fluid=fluid,
                default_pipe_diameter=self.default_pipe_diameter,
            ),
            FrictionCalculator(
                fluid=fluid,
                default_pipe_diameter=self.default_pipe_diameter,
                volumetric_flow_rate=self.volumetric_flow_rate,
            ),
            elevation,
            ControlValveCalculator(
                fluid=fluid,
                volumetric_flow_rate=self.volumetric_flow_rate,
            ),
            OrificeCalculator(
                fluid=fluid,
                default_pipe_diameter=self.default_pipe_diameter,
            ),
            NormalizedLossCalculator(),
        ]

    @staticmethod
    def _reset_section(section: PipeSection) -> None:
        section.calculation_output = CalculationOutput()
        section.result_summary = ResultSummary()
        section.fitting_K = None
        section.pipe_length_K = None

    def _apply_pressure_profile(
        self,
        sections: Iterable[PipeSection],
        network: Network,
        direction: str,
        boundary: Optional[float],
    ) -> None:
        sections = list(sections)
        if not sections:
            return
        direction = (direction or "forward").lower()
        forward = direction != "backward"
        iterator = sections if forward else reversed(sections)
        current = self._initial_pressure(network, forward, boundary)
        for section in iterator:
            summary = section.result_summary
            loss = section.calculation_output.pressure_drop.total_segment_loss or 0.0
            if forward:
                summary.inlet.pressure = current
                summary.outlet.pressure = self._safe_subtract(current, loss)
                current = summary.outlet.pressure
            else:
                summary.outlet.pressure = current
                summary.inlet.pressure = self._safe_add(current, loss)
                current = summary.inlet.pressure

        if forward:
            network.result_summary.inlet.pressure = sections[0].result_summary.inlet.pressure
            network.result_summary.outlet.pressure = sections[-1].result_summary.outlet.pressure
        else:
            network.result_summary.outlet.pressure = sections[-1].result_summary.outlet.pressure
            network.result_summary.inlet.pressure = sections[0].result_summary.inlet.pressure

    def _initial_pressure(
        self,
        network: Network,
        forward: bool,
        boundary: Optional[float],
    ) -> Optional[float]:
        if boundary and boundary > 0:
            return boundary
        summary = network.result_summary
        candidate = summary.inlet.pressure if forward else summary.outlet.pressure
        if candidate and candidate > 0:
            return candidate
        if network.fluid.pressure and network.fluid.pressure > 0:
            return network.fluid.pressure
        return None

    @staticmethod
    def _safe_subtract(value: Optional[float], delta: float) -> Optional[float]:
        if value is None:
            return None
        return value - delta

    @staticmethod
    def _safe_add(value: Optional[float], delta: float) -> Optional[float]:
        if value is None:
            return None
        return value + delta

    @staticmethod
    def _accumulate(target: PressureDropDetails, source: PressureDropDetails) -> None:
        for field in fields(PressureDropDetails):
            value = getattr(source, field.name)
            if value is None:
                continue
            current = getattr(target, field.name)
            setattr(target, field.name, (current or 0.0) + value)

    def _populate_states(self, sections: Iterable[PipeSection], network: Network) -> None:
        sections = list(sections)
        if not sections:
            return
        vol_flow = self._determine_volumetric_flow(network)
        mass_flow = self._determine_mass_flow(network, vol_flow)
        fluid = network.fluid
        for section in sections:
            self._populate_section_state(section, fluid, vol_flow, mass_flow)

    def _determine_volumetric_flow(self, network: Network) -> Optional[float]:
        if self.volumetric_flow_rate and self.volumetric_flow_rate > 0:
            return self.volumetric_flow_rate
        fluid = network.fluid
        if fluid.volumetric_flow_rate and fluid.volumetric_flow_rate > 0:
            return fluid.volumetric_flow_rate
        if fluid.mass_flow_rate and fluid.mass_flow_rate > 0 and fluid.density > 0:
            return fluid.mass_flow_rate / fluid.density
        return None

    def _determine_mass_flow(self, network: Network, vol_flow: Optional[float]) -> Optional[float]:
        fluid = network.fluid
        if fluid.mass_flow_rate and fluid.mass_flow_rate > 0:
            return fluid.mass_flow_rate
        if vol_flow and vol_flow > 0 and fluid.density > 0:
            return vol_flow * fluid.density
        return None

    def _populate_section_state(
        self,
        section: PipeSection,
        fluid,
        vol_flow: Optional[float],
        mass_flow: Optional[float],
    ) -> None:
        summary = section.result_summary
        diameter = section.pipe_diameter or section.main_ID or self.default_pipe_diameter
        if not diameter or diameter <= 0:
            return
        area = pi * diameter * diameter * 0.25
        velocity = None
        if vol_flow and vol_flow > 0 and area > 0:
            velocity = vol_flow / area
        base_density = fluid.current_density()
        reference_pressure = fluid.pressure if fluid.pressure and fluid.pressure > 0 else None
        inlet_density = base_density
        outlet_density = base_density
        if base_density and reference_pressure:
            if summary.inlet.pressure:
                inlet_density = base_density * summary.inlet.pressure / reference_pressure
            if summary.outlet.pressure:
                outlet_density = base_density * summary.outlet.pressure / reference_pressure
        phase = (fluid.phase or "").lower()
        mach = None
        if velocity and phase in {"gas", "vapor"} and fluid.specific_heat_ratio and fluid.temperature and fluid.molecular_weight:
            rs = UNIVERSAL_GAS_CONSTANT / fluid.molecular_weight
            sound_speed = sqrt(max(fluid.specific_heat_ratio, 1.0) * rs * fluid.temperature)
            if sound_speed > 0:
                mach = velocity / sound_speed
        eros_const = section.erosional_constant if section.erosional_constant is not None else 100.0
        eros_const_si = eros_const * EROSIONAL_CONVERSION
        erosional_velocity_in = None
        erosional_velocity_out = None
        if inlet_density and inlet_density > 0:
            erosional_velocity_in = eros_const_si / sqrt(inlet_density)
        if outlet_density and outlet_density > 0:
            erosional_velocity_out = eros_const_si / sqrt(outlet_density)
        flow_momentum_in = inlet_density * velocity * velocity if inlet_density and velocity is not None else None
        flow_momentum_out = outlet_density * velocity * velocity if outlet_density and velocity is not None else None
        section.mach_number = mach
        remarks = self._build_remarks(section, summary, mach, velocity, erosional_velocity_in)
        self._assign_state(
            summary.inlet,
            fluid,
            inlet_density,
            velocity,
            erosional_velocity_in,
            flow_momentum_in,
            mach if phase in {"gas", "vapor"} else None,
            remarks,
        )
        self._assign_state(
            summary.outlet,
            fluid,
            outlet_density,
            velocity,
            erosional_velocity_out,
            flow_momentum_out,
            mach if phase in {"gas", "vapor"} else None,
            remarks,
        )

    @staticmethod
    def _assign_state(
        state,
        fluid,
        density: Optional[float],
        velocity: Optional[float],
        erosional_velocity: Optional[float],
        flow_momentum: Optional[float],
        mach: Optional[float],
        remarks: str,
    ) -> None:
        state.temperature = fluid.temperature
        state.density = density
        state.velocity = velocity
        state.erosional_velocity = erosional_velocity
        state.flow_momentum = flow_momentum
        state.mach_number = mach
        state.remarks = remarks

    def _build_remarks(
        self,
        section: PipeSection,
        summary: ResultSummary,
        mach: Optional[float],
        velocity: Optional[float],
        erosional_velocity: Optional[float],
    ) -> str:
        warnings: list[str] = []
        drop = section.calculation_output.pressure_drop.total_segment_loss or 0.0
        inlet_pressure = summary.inlet.pressure
        if inlet_pressure and drop > inlet_pressure:
            warnings.append("Pressure drop exceeds inlet pressure")
        if velocity and erosional_velocity and velocity > erosional_velocity:
            warnings.append(f"Velocity {velocity:.2f} m/s exceeds erosional limit {erosional_velocity:.2f} m/s")
        if mach and mach >= 1.0:
            warnings.append(f"Mach {mach:.2f} exceeds sonic conditions")
        elif mach and mach > 0.7:
            warnings.append(f"Mach {mach:.2f} exceeds 0.7 threshold")
        return "; ".join(warnings) if warnings else "OK"

    def _set_network_summary(self, network: Network, sections: Iterable[PipeSection]) -> None:
        sections = list(sections)
        if not sections:
            network.result_summary = ResultSummary()
            return
        network.result_summary = ResultSummary(
            inlet=deepcopy(sections[0].result_summary.inlet),
            outlet=deepcopy(sections[-1].result_summary.outlet),
        )
