"""Orchestrates per-section hydraulic calculations."""
from __future__ import annotations

import logging
from copy import deepcopy
from dataclasses import dataclass, fields
from math import pi, sqrt
from typing import Iterable, Optional, Set

from network_hydraulic.calculators.elevation import ElevationCalculator
from network_hydraulic.calculators.fittings import FittingLossCalculator
from network_hydraulic.calculators.hydraulics import FrictionCalculator
from network_hydraulic.calculators.normalization import NormalizedLossCalculator
from network_hydraulic.calculators.orifices import OrificeCalculator
from network_hydraulic.calculators.user_fixed_loss import UserFixedLossCalculator
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
from network_hydraulic.utils.gas_flow import (
    UNIVERSAL_GAS_CONSTANT,
    solve_adiabatic,
    solve_isothermal,
)

EROSIONAL_CONVERSION = 0.3048 * sqrt(16.018463)
logger = logging.getLogger(__name__)

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
            # Calculate total_K
            fitting_K = section.fitting_K or 0.0
            pipe_length_K = section.pipe_length_K or 0.0
            user_K = section.user_K or 0.0
            piping_and_fitting_safety_factor = section.piping_and_fitting_safety_factor or 1.0
            section.total_K = (fitting_K + pipe_length_K + user_K) * piping_and_fitting_safety_factor

            # Assign K-factors to pressure_drop details
            pressure_drop = section.calculation_output.pressure_drop
            pressure_drop.fitting_K = section.fitting_K
            pressure_drop.pipe_length_K = section.pipe_length_K
            pressure_drop.user_K = section.user_K
            pressure_drop.piping_and_fitting_safety_factor = section.piping_and_fitting_safety_factor
            pressure_drop.total_K = section.total_K

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
            UserFixedLossCalculator(),
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
        resolved_direction = self._resolve_direction(network, direction)
        network.direction = resolved_direction
        forward = resolved_direction != "backward"
        iterator = sections if forward else reversed(sections)
        boundary_hint = boundary if boundary is not None else self._default_boundary(network, forward)
        component_overrides = self._initialize_component_sections(sections, network)
        current = self._initial_pressure(network, forward, boundary_hint)
        vol_flow = self._determine_volumetric_flow(network)
        mass_flow = self._determine_mass_flow(network, vol_flow)
        gas_flow_model = self.gas_flow_model or network.gas_flow_model

        control_valve_calculator = ControlValveCalculator(
            fluid=network.fluid,
            volumetric_flow_rate=self.volumetric_flow_rate,
        )
        orifice_calculator = OrificeCalculator(
            fluid=network.fluid,
            default_pipe_diameter=self.default_pipe_diameter,
            mass_flow_rate=mass_flow,
        )

        if network.fluid.is_gas():
            for section in iterator:
                summary = section.result_summary
                if id(section) in component_overrides:
                    current = summary.outlet.pressure if forward else summary.inlet.pressure
                    continue
                
                # Use section's boundary pressure if provided, otherwise use the current pressure from the previous section
                section_start_pressure = section.boundary_pressure if section.boundary_pressure is not None else current

                if section_start_pressure is None:
                    break

                self._apply_pressure_dependent_losses(
                    section,
                    inlet_pressure=section_start_pressure,
                    control_valve_calculator=control_valve_calculator,
                    orifice_calculator=orifice_calculator,
                )

                loss = section.calculation_output.pressure_drop.total_segment_loss or 0.0

                # Gather parameters for gas flow solvers
                temperature = network.fluid.temperature
                molar_mass = network.fluid.molecular_weight
                z_factor = network.fluid.z_factor
                gamma = network.fluid.specific_heat_ratio
                length = section.length
                friction_factor = section.calculation_output.pressure_drop.frictional_factor
                k_total = section.total_K
                diameter = section.pipe_diameter or self.default_pipe_diameter
                roughness = section.roughness

                missing_params: list[str] = []
                positive_required = {
                    "temperature": temperature,
                    "mass_flow": mass_flow,
                    "diameter": diameter,
                    "molar_mass": molar_mass,
                    "z_factor": z_factor,
                    "gamma": gamma,
                }
                for name, value in positive_required.items():
                    if value is None or value <= 0:
                        missing_params.append(name)

                nullable_required = {
                    "length": length,
                    "friction_factor": friction_factor,
                    "k_total": k_total,
                    "roughness": roughness,
                }
                for name, value in nullable_required.items():
                    if value is None:
                        missing_params.append(name)

                if section_start_pressure is None:
                    missing_params.append("section_start_pressure")

                if missing_params:
                    logger.warning(
                        "Skipping gas section %s due to missing parameters: %s",
                        section.id,
                        ", ".join(missing_params),
                    )
                    summary.inlet.pressure = None
                    summary.outlet.pressure = None
                    current = None
                    continue

                if gas_flow_model == "isothermal":
                    if forward:
                        summary.inlet.pressure = section_start_pressure
                        outlet_pressure, _ = solve_isothermal(
                            inlet_pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=mass_flow,
                            diameter=diameter,
                            length=length,
                            roughness=roughness,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=True,
                        )
                        summary.outlet.pressure = outlet_pressure
                        current = outlet_pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        inlet_pressure, _ = solve_isothermal(
                            inlet_pressure=section_start_pressure, # Pass current as inlet_pressure for backward calculation
                            temperature=temperature,
                            mass_flow=mass_flow,
                            diameter=diameter,
                            length=length,
                            roughness=roughness,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=False,
                        )
                        summary.inlet.pressure = inlet_pressure
                        current = inlet_pressure
                    
                    # Update pipe_and_fittings and total_segment_loss for gas flow
                    if summary.inlet.pressure is not None and summary.outlet.pressure is not None:
                        total_pressure_drop = abs(summary.inlet.pressure - summary.outlet.pressure)
                        other_losses = (section.calculation_output.pressure_drop.elevation_change or 0.0) + \
                                       (section.calculation_output.pressure_drop.control_valve_pressure_drop or 0.0) + \
                                       (section.calculation_output.pressure_drop.orifice_pressure_drop or 0.0) + \
                                       (section.calculation_output.pressure_drop.user_specified_fixed_loss or 0.0)
                        
                        # Ensure frictional_loss is not negative
                        frictional_loss = max(0.0, total_pressure_drop - other_losses)
                        
                        section.calculation_output.pressure_drop.pipe_and_fittings = frictional_loss
                        section.calculation_output.pressure_drop.total_segment_loss = total_pressure_drop
                    
                    # Recalculate normalized loss after pipe_and_fittings is updated
                    NormalizedLossCalculator().calculate(section)

                elif gas_flow_model == "adiabatic":
                    if forward:
                        summary.inlet.pressure = section_start_pressure
                        outlet_pressure, _ = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=mass_flow,
                            diameter=diameter,
                            length=length,
                            roughness=roughness,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=True,
                            label=section.id,
                        )
                        summary.outlet.pressure = outlet_pressure
                        current = outlet_pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        inlet_pressure, _ = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=mass_flow,
                            diameter=diameter,
                            length=length,
                            roughness=roughness,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=False,
                            label=section.id,
                        )
                        summary.inlet.pressure = inlet_pressure
                        current = inlet_pressure

                    # Update pipe_and_fittings and total_segment_loss for gas flow
                    if summary.inlet.pressure is not None and summary.outlet.pressure is not None:
                        total_pressure_drop = abs(summary.inlet.pressure - summary.outlet.pressure)
                        other_losses = (section.calculation_output.pressure_drop.elevation_change or 0.0) + \
                                       (section.calculation_output.pressure_drop.control_valve_pressure_drop or 0.0) + \
                                       (section.calculation_output.pressure_drop.orifice_pressure_drop or 0.0) + \
                                       (section.calculation_output.pressure_drop.user_specified_fixed_loss or 0.0)
                        
                        # Ensure frictional_loss is not negative
                        frictional_loss = max(0.0, total_pressure_drop - other_losses)
                        
                        section.calculation_output.pressure_drop.pipe_and_fittings = frictional_loss
                        section.calculation_output.pressure_drop.total_segment_loss = total_pressure_drop
                    
                    # Recalculate normalized loss after pipe_and_fittings is updated
                    NormalizedLossCalculator().calculate(section)

                else:
                    # Fallback for unknown gas flow model, treat as liquid
                    loss = section.calculation_output.pressure_drop.total_segment_loss or 0.0
                    if forward:
                        summary.inlet.pressure = section_start_pressure
                        summary.outlet.pressure = self._safe_subtract(section_start_pressure, loss)
                        current = summary.outlet.pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        summary.inlet.pressure = self._safe_add(section_start_pressure, loss)
                        current = summary.inlet.pressure
                    
                    # Recalculate normalized loss after pipe_and_fittings is updated
                    NormalizedLossCalculator().calculate(section)
        else: # Liquid flow logic
            for section in iterator:
                summary = section.result_summary
                
                if id(section) in component_overrides:
                    current = summary.outlet.pressure if forward else summary.inlet.pressure
                    continue
                
                # Use section's boundary pressure if provided, otherwise use the current pressure from the previous section
                section_start_pressure = section.boundary_pressure if section.boundary_pressure is not None else current

                if section_start_pressure is None:
                    break

                self._apply_pressure_dependent_losses(
                    section,
                    inlet_pressure=section_start_pressure,
                    control_valve_calculator=control_valve_calculator,
                    orifice_calculator=orifice_calculator,
                )
                loss = section.calculation_output.pressure_drop.total_segment_loss or 0.0
                if forward:
                    summary.inlet.pressure = section_start_pressure
                    summary.outlet.pressure = self._safe_subtract(section_start_pressure, loss)
                    current = summary.outlet.pressure
                else:
                    summary.outlet.pressure = section_start_pressure
                    summary.inlet.pressure = self._safe_add(section_start_pressure, loss)
                    current = summary.inlet.pressure
                
                # Recalculate normalized loss after pipe_and_fittings is updated
                NormalizedLossCalculator().calculate(section)

        if forward:
            network.result_summary.inlet.pressure = sections[0].result_summary.inlet.pressure
            network.result_summary.outlet.pressure = sections[-1].result_summary.outlet.pressure
        else:
            network.result_summary.outlet.pressure = sections[-1].result_summary.outlet.pressure
            network.result_summary.inlet.pressure = sections[0].result_summary.inlet.pressure

    def _apply_pressure_dependent_losses(
        self,
        section: PipeSection,
        *,
        inlet_pressure: Optional[float],
        control_valve_calculator: ControlValveCalculator,
        orifice_calculator: OrificeCalculator,
    ) -> None:
        if inlet_pressure is None or inlet_pressure <= 0:
            return

        if section.control_valve:
            control_valve_calculator.calculate(
                section,
                inlet_pressure_override=inlet_pressure,
            )
        if section.orifice:
            orifice_calculator.calculate(
                section,
                inlet_pressure_override=inlet_pressure,
            )

    def _initial_pressure(
        self,
        network: Network,
        forward: bool,
        boundary: Optional[float],
    ) -> Optional[float]:
        if boundary and boundary > 0:
            return boundary
        summary = network.result_summary
        candidates = (
            [
                summary.inlet.pressure,
                network.upstream_pressure,
                network.boundary_pressure,
                network.fluid.pressure,
            ]
            if forward
            else [
                summary.outlet.pressure,
                network.downstream_pressure,
                network.boundary_pressure,
                network.fluid.pressure,
            ]
        )
        for candidate in candidates:
            if candidate and candidate > 0:
                return candidate
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
        for field_name in [
            "pipe_and_fittings",
            "elevation_change",
            "control_valve_pressure_drop",
            "orifice_pressure_drop",
            "user_specified_fixed_loss",
            "total_segment_loss",
            "normalized_friction_loss",
        ]:
            value = getattr(source, field_name)
            current = getattr(target, field_name)
            setattr(target, field_name, (current or 0.0) + (value or 0.0))

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
        if fluid.mass_flow_rate and fluid.mass_flow_rate > 0:
            try:
                density = fluid.current_density()
            except ValueError:
                density = fluid.density if fluid.density and fluid.density > 0 else None
            if density and density > 0:
                return fluid.mass_flow_rate / density
        return None

    def _determine_mass_flow(self, network: Network, vol_flow: Optional[float]) -> Optional[float]:
        fluid = network.fluid
        if fluid.mass_flow_rate and fluid.mass_flow_rate > 0:
            return fluid.mass_flow_rate
        density: Optional[float] = None
        try:
            density = fluid.current_density()
        except ValueError:
            if fluid.density and fluid.density > 0:
                density = fluid.density
        if vol_flow and vol_flow > 0 and density and density > 0:
            return vol_flow * density
        return None

    def _populate_section_state(
        self,
        section: PipeSection,
        fluid,
        vol_flow: Optional[float],
        mass_flow: Optional[float],
    ) -> None:
        summary = section.result_summary
        diameter = section.pipe_diameter or self.default_pipe_diameter
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
        if fluid.is_gas() and base_density and reference_pressure: # Added fluid.is_gas() check
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

    def _resolve_direction(self, network: Network, requested: Optional[str]) -> str:
        candidate = (requested or "").lower()
        if candidate in {"forward", "backward"}:
            return candidate
        net_dir = (network.direction or "").lower()
        if net_dir in {"forward", "backward"}:
            return net_dir
        if network.upstream_pressure and not network.downstream_pressure:
            return "forward"
        if network.downstream_pressure and not network.upstream_pressure:
            return "backward"
        return "forward"

    def _default_boundary(self, network: Network, forward: bool) -> Optional[float]:
        return (
            network.upstream_pressure if forward else network.downstream_pressure
        ) or network.boundary_pressure

    def _initialize_component_sections(
        self,
        sections: Iterable[PipeSection],
        network: Network,
    ) -> Set[int]:
        overrides: Set[int] = set()
        if network.upstream_pressure is None or network.downstream_pressure is None:
            return overrides
        for section in sections:
            if not self._is_component_only(section):
                continue
            overrides.add(id(section))
            section.direction = section.direction or "bidirectional"
            summary = section.result_summary
            summary.inlet.pressure = network.upstream_pressure
            summary.outlet.pressure = network.downstream_pressure
            drop_value = abs(network.upstream_pressure - network.downstream_pressure)
            pressure_drop = section.calculation_output.pressure_drop
            pressure_drop.total_segment_loss = drop_value
            if section.control_valve:
                section.control_valve.pressure_drop = drop_value
                pressure_drop.control_valve_pressure_drop = drop_value
            if section.orifice:
                section.orifice.pressure_drop = drop_value
                pressure_drop.orifice_pressure_drop = drop_value
            NormalizedLossCalculator().calculate(section)
        return overrides

    @staticmethod
    def _is_component_only(section: PipeSection) -> bool:
        has_length = section.length is not None and section.length > 0
        has_fittings = bool(section.fittings)
        has_control = section.control_valve is not None
        has_orifice = section.orifice is not None
        return (not has_length) and (not has_fittings) and (has_control or has_orifice)
