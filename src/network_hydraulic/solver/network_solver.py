"""Orchestrates per-section hydraulic calculations and state propagation.

Example:

    from network_hydraulic.models.fluid import Fluid
    from network_hydraulic.models.network import Network
    from network_hydraulic.models.pipe_section import PipeSection, Fitting
    from network_hydraulic.solver.network_solver import NetworkSolver

    fluid = Fluid(...)
    network = Network(name="test", description=None, fluid=fluid, sections=[...])
    solver = NetworkSolver()
    result = solver.run(network)
"""
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
    StatePoint,
)
from network_hydraulic.utils.gas_flow import (
    UNIVERSAL_GAS_CONSTANT,
    GasState,
    solve_adiabatic,
    solve_isothermal,
)

EROSIONAL_CONVERSION = 0.3048 * sqrt(16.018463)
logger = logging.getLogger(__name__)

@dataclass
class NetworkSolver:
    """Runs calculations for all pipe sections in a network."""

    default_pipe_diameter: Optional[float] = None
    direction: Optional[str] = None
    boundary_pressure: Optional[float] = None
    gas_flow_model: Optional[str] = None
    friction_factor_type: str = "darcy"

    def run(self, network: Network) -> NetworkResult:

        calculators = self._build_calculators(network)
        result = NetworkResult()

        sections = list(network.sections)
        logger.info(
            "Starting solver run for network '%s' (%d section(s))",
            network.name,
            len(sections),
        )
        for section in sections:
            self._reset_section(section)

        base_mass_flow = network.mass_flow_rate
        self._assign_design_flows(sections, network, base_mass_flow)

        for section in sections:
            self._validate_section_prerequisites(section)
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
        logger.info("Completed solver run for network '%s'", network.name)
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
                friction_factor_type=self.friction_factor_type,
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
        section.design_flow_multiplier = 1.0
        section.design_mass_flow_rate = None

    def _validate_section_prerequisites(self, section: PipeSection) -> None:
        errors: list[str] = []
        diameter = section.pipe_diameter or self.default_pipe_diameter
        if diameter is None or diameter <= 0:
            errors.append("pipe diameter is required")
        if section.length is None:
            errors.append("length must be provided")
        if errors:
            raise ValueError(
                f"Section '{section.id}' is invalid: {', '.join(errors)}"
            )

    def _assign_design_flows(
        self,
        sections: Iterable[PipeSection],
        network: Network,
        base_mass_flow: Optional[float],
    ) -> None:
        for section in sections:
            multiplier = self._design_multiplier(section, network)
            section.design_flow_multiplier = multiplier
            section.design_mass_flow_rate = (
                base_mass_flow * multiplier if base_mass_flow is not None else None
            )
            section.mass_flow_rate = section.design_mass_flow_rate

    @staticmethod
    def _design_multiplier(section: PipeSection, network: Network) -> float:
        margin = (
            section.design_margin
            if section.design_margin is not None
            else network.design_margin
        )
        if margin is None:
            return 1.0
        return 1.0 + margin / 100.0

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
        mass_flow = network.mass_flow_rate
        gas_flow_model = self.gas_flow_model or network.gas_flow_model

        control_valve_calculator = ControlValveCalculator(
            fluid=network.fluid,
        )
        orifice_calculator = OrificeCalculator(
            fluid=network.fluid,
            default_pipe_diameter=self.default_pipe_diameter,
            mass_flow_rate=mass_flow, # This will be updated per section
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

                # Update orifice calculator with section's mass flow rate
                orifice_calculator.mass_flow_rate = section.mass_flow_rate

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
                pipe_k = section.pipe_length_K or 0.0
                k_additional = max((k_total or 0.0) - pipe_k, 0.0)
                diameter = section.pipe_diameter or self.default_pipe_diameter
                roughness = section.roughness or 0.0
                viscosity = network.fluid.viscosity

                section_mass_flow = section.mass_flow_rate
                missing_params: list[str] = []
                positive_required = {
                    "temperature": temperature,
                    "mass_flow": section_mass_flow,
                    "diameter": diameter,
                    "molar_mass": molar_mass,
                    "z_factor": z_factor,
                    "gamma": gamma,
                    "viscosity": viscosity,
                }
                for name, value in positive_required.items():
                    if value is None or value <= 0:
                        missing_params.append(name)

                nullable_required = {
                    "length": length,
                    "friction_factor": friction_factor,
                    "k_total": k_total,
                }
                for name, value in nullable_required.items():
                    if value is None:
                        missing_params.append(name)

                if section_start_pressure is None:
                    missing_params.append("section_start_pressure")

                if missing_params:
                    raise ValueError(
                        f"Section '{section.id}' is missing required gas-flow inputs: {', '.join(missing_params)}"
                    )

                if gas_flow_model == "isothermal":
                    if forward:
                        summary.inlet.pressure = section_start_pressure
                        inlet_state = self._gas_state_from_conditions(
                            pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                        )
                        self._apply_gas_state(summary.inlet, inlet_state)
                        self._apply_critical_pressure(section, inlet_state)
                        outlet_pressure, outlet_state = solve_isothermal(
                            inlet_pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=True,
                            friction_factor_type=self.friction_factor_type,
                            viscosity=viscosity,
                            roughness=roughness,
                        )
                        summary.outlet.pressure = outlet_pressure
                        self._apply_gas_state(summary.outlet, outlet_state)
                        self._apply_critical_pressure(section, outlet_state)
                        current = outlet_pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        outlet_state = self._gas_state_from_conditions(
                            pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                        )
                        self._apply_gas_state(summary.outlet, outlet_state)
                        inlet_pressure, inlet_state = solve_isothermal(
                            inlet_pressure=section_start_pressure, # Pass current as inlet_pressure for backward calculation
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=False,
                            friction_factor_type=self.friction_factor_type,
                            viscosity=viscosity,
                            roughness=roughness,
                        )
                        summary.inlet.pressure = inlet_pressure
                        self._apply_gas_state(summary.inlet, inlet_state)
                        self._apply_critical_pressure(section, inlet_state)
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
                        inlet_state = self._gas_state_from_conditions(
                            pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                        )
                        self._apply_gas_state(summary.inlet, inlet_state)
                        self._apply_critical_pressure(section, inlet_state)
                        outlet_pressure, outlet_state = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=True,
                            label=section.id,
                            friction_factor_type=self.friction_factor_type,
                        )
                        summary.outlet.pressure = outlet_pressure
                        self._apply_gas_state(summary.outlet, outlet_state)
                        self._apply_critical_pressure(section, outlet_state)
                        current = outlet_pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        outlet_state = self._gas_state_from_conditions(
                            pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                        )
                        self._apply_gas_state(summary.outlet, outlet_state)
                        inlet_pressure, inlet_state = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=False,
                            label=section.id,
                            friction_factor_type=self.friction_factor_type,
                        )
                        summary.inlet.pressure = inlet_pressure
                        self._apply_gas_state(summary.inlet, inlet_state)
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

                # Update orifice calculator with section's mass flow rate
                orifice_calculator.mass_flow_rate = section.mass_flow_rate

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
            if section.control_valve or section.orifice:
                raise ValueError(
                    f"Section '{section.id}' requires a valid inlet pressure for component calculations"
                )
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
        fluid = network.fluid
        for section in sections:
            self._populate_section_state(
                section,
                fluid,
                section.mass_flow_rate,
            )

    def _populate_section_state(
        self,
        section: PipeSection,
        fluid,
        mass_flow: Optional[float],
    ) -> None:
        summary = section.result_summary
        diameter = section.pipe_diameter or self.default_pipe_diameter
        if not diameter or diameter <= 0:
            return
        area = pi * diameter * diameter * 0.25
        
        vol_flow = None
        if section.mass_flow_rate is not None:
            try:
                vol_flow = section.current_volumetric_flow_rate(fluid)
            except ValueError:
                vol_flow = None

        velocity = None
        if vol_flow and vol_flow > 0 and area > 0:
            velocity = vol_flow / area
        
        base_density = fluid.current_density()
        reference_pressure = fluid.pressure if fluid.pressure and fluid.pressure > 0 else None
        reference_temperature = fluid.temperature if fluid.temperature and fluid.temperature > 0 else None
        inlet_density = base_density
        outlet_density = base_density
        if fluid.is_gas() and base_density and reference_pressure:
            inlet_density = self._recomputed_density(
                base_density=base_density,
                reference_pressure=reference_pressure,
                reference_temperature=reference_temperature,
                target_pressure=summary.inlet.pressure,
                target_temperature=summary.inlet.temperature,
            )
            outlet_density = self._recomputed_density(
                base_density=base_density,
                reference_pressure=reference_pressure,
                reference_temperature=reference_temperature,
                target_pressure=summary.outlet.pressure,
                target_temperature=summary.outlet.temperature,
            )
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
        if state.temperature is None:
            state.temperature = fluid.temperature
        if state.density is None and density is not None:
            state.density = density
        if state.velocity is None and velocity is not None:
            state.velocity = velocity
        if state.erosional_velocity is None and erosional_velocity is not None:
            state.erosional_velocity = erosional_velocity
        if state.flow_momentum is None and flow_momentum is not None:
            state.flow_momentum = flow_momentum
        if state.mach_number is None and mach is not None:
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

    @staticmethod
    def _gas_state_from_conditions(
        *,
        pressure: Optional[float],
        temperature: Optional[float],
        mass_flow: Optional[float],
        diameter: Optional[float],
        molar_mass: Optional[float],
        z_factor: Optional[float],
        gamma: Optional[float],
    ) -> Optional[GasState]:
        if (
            pressure is None
            or pressure <= 0
            or temperature is None
            or temperature <= 0
            or diameter is None
            or diameter <= 0
            or molar_mass is None
            or molar_mass <= 0
            or z_factor is None
            or z_factor <= 0
        ):
            return None
        area = pi * diameter * diameter * 0.25
        density = pressure * molar_mass / (z_factor * UNIVERSAL_GAS_CONSTANT * temperature)
        velocity = None
        if mass_flow and mass_flow > 0 and density > 0 and area > 0:
            velocity = mass_flow / (density * area)
        sonic = None
        if gamma and gamma > 0:
            sonic = sqrt(max(gamma, 1e-9) * z_factor * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass)
        mach = velocity / sonic if velocity is not None and sonic not in (None, 0) else None
        return GasState(
            pressure=pressure,
            temperature=temperature,
            density=density,
            velocity=velocity,
            mach=mach,
        )

    @staticmethod
    def _apply_gas_state(target: StatePoint, gas_state: Optional[GasState]) -> None:
        if target is None or gas_state is None:
            return
        target.temperature = gas_state.temperature
        target.density = gas_state.density
        target.velocity = gas_state.velocity
        target.mach_number = gas_state.mach

    @staticmethod
    def _apply_critical_pressure(section: PipeSection, gas_state: Optional[GasState]) -> None:
        if gas_state is None:
            return
        critical = gas_state.critical_pressure
        if critical is None:
            return
        section.calculation_output.pressure_drop.critical_pressure = critical

    @staticmethod
    def _recomputed_density(
        *,
        base_density: Optional[float],
        reference_pressure: Optional[float],
        reference_temperature: Optional[float],
        target_pressure: Optional[float],
        target_temperature: Optional[float],
    ) -> Optional[float]:
        if (
            base_density is None
            or reference_pressure is None
            or reference_pressure <= 0
            or target_pressure is None
            or target_pressure <= 0
        ):
            return base_density
        density = base_density * (target_pressure / reference_pressure)
        if (
            reference_temperature
            and reference_temperature > 0
            and target_temperature
            and target_temperature > 0
        ):
            density *= reference_temperature / target_temperature
        return density

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
