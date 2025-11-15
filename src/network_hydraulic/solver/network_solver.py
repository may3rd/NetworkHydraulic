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
from dataclasses import dataclass
from math import pi, sqrt
from typing import Iterable, Optional

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
from network_hydraulic.calculators.gas_flow import (
    UNIVERSAL_GAS_CONSTANT,
    GasState,
    solve_adiabatic,
    solve_isothermal,
)
from network_hydraulic.utils import pipe_dimensions

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
            fluid=fluid,
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
        has_pipeline = section.has_pipeline_segment
        has_user_loss = (
            section.user_specified_fixed_loss is not None and section.user_specified_fixed_loss > 0
        )
        has_component = (
            section.control_valve is not None or section.orifice is not None or has_user_loss
        )
        if not has_pipeline and not has_component:
            errors.append(
                f"Section '{section.id}' must define either a pipeline segment or a control valve/orifice"
            )
        if has_pipeline:
            diameter = section.pipe_diameter or self.default_pipe_diameter
            if diameter is None or diameter <= 0:
                errors.append("pipe diameter is required")
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
                base_mass_flow * multiplier * section.flow_splitting_factor if base_mass_flow is not None else None
            )
            section.mass_flow_rate = section.design_mass_flow_rate
            section.temperature = network.boundary_temperature
            section.pressure = network.boundary_pressure

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
        resolved_direction = self._resolve_direction(network, self.direction)
        network.direction = resolved_direction
        forward = resolved_direction != "backward"
        iterator = sections if forward else reversed(sections)
        boundary_hint = boundary if boundary is not None else network.boundary_pressure
        current = self._initial_pressure(network, forward, boundary_hint)
        current_temperature = network.boundary_temperature
        mass_flow = network.mass_flow_rate
        gas_flow_model = self.gas_flow_model or network.gas_flow_model

        control_valve_calculator = ControlValveCalculator(
            fluid=network.fluid,
        )
        orifice_calculator = OrificeCalculator(
            fluid=network.fluid,
            default_pipe_diameter=self.default_pipe_diameter,
            mass_flow_rate=mass_flow,
        )

        if network.fluid.is_gas():
            for section in iterator:
                summary = section.result_summary
                
                # Use section's boundary pressure if provided, otherwise use the current pressure from the previous section
                section_start_pressure = section.boundary_pressure if section.boundary_pressure is not None else current

                if section_start_pressure is None:
                    break

                if section.temperature is None or section.temperature <= 0:
                    section.temperature = current_temperature
                section_start_temperature = section.temperature
                section.pressure = section_start_pressure
                has_pipeline = section.has_pipeline_segment

                self._apply_pressure_dependent_losses(
                    section,
                    inlet_pressure=section_start_pressure,
                    control_valve_calculator=control_valve_calculator,
                    orifice_calculator=orifice_calculator,
                    mass_flow_override=section.mass_flow_rate,
                )

                loss = section.calculation_output.pressure_drop.total_segment_loss or 0.0

                if not has_pipeline:
                    if forward:
                        summary.inlet.pressure = section_start_pressure
                        summary.outlet.pressure = self._safe_subtract(section_start_pressure, loss)
                        current = summary.outlet.pressure
                    else:
                        summary.outlet.pressure = section_start_pressure
                        summary.inlet.pressure = self._safe_add(section_start_pressure, loss)
                        current = summary.inlet.pressure

                    NormalizedLossCalculator().calculate(section)

                    entry_state = summary.inlet if forward else summary.outlet
                    exit_state = summary.outlet if forward else summary.inlet
                    self._apply_section_entry_state(section, entry_state, section_start_temperature)
                    exit_pressure = exit_state.pressure
                    if exit_pressure is not None:
                        current = exit_pressure
                    exit_temperature = exit_state.temperature
                    if exit_temperature is not None and exit_temperature > 0:
                        current_temperature = exit_temperature
                    continue

                # Gather parameters for gas flow solvers
                temperature = section.temperature
                pressure = section.pressure
                molar_mass = network.fluid.molecular_weight
                z_factor = network.fluid.z_factor
                gamma = network.fluid.specific_heat_ratio
                length = section.length or 0.0
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
                    "pressure": pressure,
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
                        self._apply_critical_pressure(section, inlet_state, gas_flow_model)
                        outlet_pressure, outlet_state = solve_isothermal(
                            inlet_pressure=section_start_pressure,
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_total=k_total,
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
                        # self._apply_critical_pressure(section, outlet_state, gas_flow_model)
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
                            k_total=k_total,
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
                        self._apply_critical_pressure(section, inlet_state, gas_flow_model)
                        current = inlet_pressure
                    
                    # Update pipe_and_fittings and total_segment_loss for gas flow
                    self._update_gas_friction_losses(section)

                    entry_state = summary.inlet if forward else summary.outlet
                    exit_state = summary.outlet if forward else summary.inlet
                    self._apply_section_entry_state(section, entry_state, section_start_temperature)
                    exit_pressure = exit_state.pressure
                    if exit_pressure is not None:
                        current = exit_pressure
                    exit_temperature = exit_state.temperature
                    if exit_temperature is not None and exit_temperature > 0:
                        current_temperature = exit_temperature

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
                        self._apply_critical_pressure(section, inlet_state, gas_flow_model)
                        inlet_state, outlet_state = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=True,
                            label=section.id,
                            friction_factor_type=self.friction_factor_type,
                        )
                        outlet_pressure = outlet_state.pressure
                        summary.outlet.pressure = outlet_pressure
                        self._apply_gas_state(summary.inlet, inlet_state)
                        self._apply_gas_state(summary.outlet, outlet_state)
                        # self._apply_critical_pressure(section, outlet_state, gas_flow_model)
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
                        inlet_state, outlet_state = solve_adiabatic(
                            boundary_pressure=section_start_pressure, # Use boundary_pressure
                            temperature=temperature,
                            mass_flow=section_mass_flow,
                            diameter=diameter,
                            length=length,
                            friction_factor=friction_factor,
                            k_total=k_total,
                            k_additional=k_additional,
                            molar_mass=molar_mass,
                            z_factor=z_factor,
                            gamma=gamma,
                            is_forward=False,
                            label=section.id,
                            friction_factor_type=self.friction_factor_type,
                        )
                        inlet_pressure = inlet_state.pressure
                        summary.inlet.pressure = inlet_pressure
                        self._apply_gas_state(summary.inlet, inlet_state)
                        self._apply_gas_state(summary.outlet, outlet_state)
                        self._apply_critical_pressure(section, inlet_state, gas_flow_model)
                        current = inlet_pressure

                    # Update pipe_and_fittings and total_segment_loss for gas flow
                    self._update_gas_friction_losses(section)
                    entry_state = summary.inlet if forward else summary.outlet
                    exit_state = summary.outlet if forward else summary.inlet
                    self._apply_section_entry_state(section, entry_state, section_start_temperature)
                    exit_pressure = exit_state.pressure
                    if exit_pressure is not None:
                        current = exit_pressure
                    exit_temperature = exit_state.temperature
                    if exit_temperature is not None and exit_temperature > 0:
                        current_temperature = exit_temperature

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

                    entry_state = summary.inlet if forward else summary.outlet
                    exit_state = summary.outlet if forward else summary.inlet
                    self._apply_section_entry_state(section, entry_state, section_start_temperature)
                    exit_pressure = exit_state.pressure
                    if exit_pressure is not None:
                        current = exit_pressure
                    exit_temperature = exit_state.temperature
                    if exit_temperature is not None and exit_temperature > 0:
                        current_temperature = exit_temperature
        else: # Liquid flow logic
            for section in iterator:
                summary = section.result_summary
                
                # Use section's boundary pressure if provided, otherwise use the current pressure from the previous section
                section_start_pressure = section.boundary_pressure if section.boundary_pressure is not None else current

                if section_start_pressure is None:
                    break

                if section.temperature is None or section.temperature <= 0:
                    section.temperature = current_temperature
                section_start_temperature = section.temperature
                section.pressure = section_start_pressure

                self._apply_pressure_dependent_losses(
                    section,
                    inlet_pressure=section_start_pressure,
                    control_valve_calculator=control_valve_calculator,
                    orifice_calculator=orifice_calculator,
                    mass_flow_override=section.mass_flow_rate,
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

                entry_state = summary.inlet if forward else summary.outlet
                exit_state = summary.outlet if forward else summary.inlet
                self._apply_section_entry_state(section, entry_state, section_start_temperature)
                exit_pressure = exit_state.pressure
                if exit_pressure is not None:
                    current = exit_pressure

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
        mass_flow_override: Optional[float] = None,
    ) -> None:
        if inlet_pressure is None or inlet_pressure <= 0:
            if section.control_valve or section.orifice:
                raise ValueError(
                    f"Section '{section.id}' requires a valid inlet pressure for component calculations"
                )
            return

        pressure_drop = section.calculation_output.pressure_drop
        ignored = section.calculation_output.ignored_components

        if section.has_pipeline_segment:
            if section.control_valve:
                ignored.append("Control valve ignored because section includes a pipeline segment.")
            if section.orifice:
                ignored.append("Orifice ignored because section includes a pipeline segment.")
            if section.user_specified_fixed_loss:
                ignored.append("User-defined fixed loss ignored because section includes a pipeline segment.")
            pressure_drop.control_valve_pressure_drop = 0.0
            pressure_drop.orifice_pressure_drop = 0.0
            return

        if section.control_valve:
            control_valve_calculator.calculate(
                section,
                inlet_pressure_override=inlet_pressure,
            )
            if section.orifice:
                ignored.append("Orifice ignored because control valve takes precedence in this section.")
            if section.user_specified_fixed_loss:
                ignored.append("User-defined fixed loss ignored because control valve takes precedence in this section.")
            pressure_drop.orifice_pressure_drop = 0.0
            return

        if section.orifice:
            orifice_calculator.calculate(
                section,
                inlet_pressure_override=inlet_pressure,
                mass_flow_override=mass_flow_override,
            )
            if section.user_specified_fixed_loss:
                ignored.append("User-defined fixed loss ignored because orifice takes precedence in this section.")

    def _update_gas_friction_losses(self, section: PipeSection) -> None:
        """Derive friction + normalized losses directly from gas solver pressures."""
        pd = section.calculation_output.pressure_drop
        summary = section.result_summary
        inlet_pressure = summary.inlet.pressure
        outlet_pressure = summary.outlet.pressure
        if inlet_pressure is None or outlet_pressure is None:
            return

        total_drop = abs(inlet_pressure - outlet_pressure)
        pd.total_segment_loss = total_drop

        other_losses = (
            (pd.elevation_change or 0.0)
            + (pd.control_valve_pressure_drop or 0.0)
            + (pd.orifice_pressure_drop or 0.0)
            + (pd.user_specified_fixed_loss or 0.0)
        )
        frictional_loss = max(0.0, total_drop - other_losses)
        pd.pipe_and_fittings = frictional_loss

        pipe_k = section.pipe_length_K or 0.0
        total_k = pipe_k + (section.fitting_K or 0.0)
        pipe_only_drop = None
        if pipe_k > 0 and total_k > 0:
            pipe_only_drop = frictional_loss * (pipe_k / total_k)

        length = section.length or 0.0
        if pipe_only_drop is not None and length > 0:
            # Report pipe-only drop scaled to a 100 m reference length.
            pd.normalized_friction_loss = pipe_only_drop / length * 100.0
        else:
            pd.normalized_friction_loss = None

    @staticmethod
    def _apply_section_entry_state(
        section: PipeSection,
        entry_state: StatePoint,
        fallback_temperature: Optional[float],
    ) -> None:
        if entry_state.pressure is not None:
            section.pressure = entry_state.pressure
        temperature = entry_state.temperature
        if temperature is not None and temperature > 0:
            section.temperature = temperature
        elif fallback_temperature is not None and fallback_temperature > 0:
            section.temperature = fallback_temperature

    def _initial_pressure(
        self,
        network: Network,
        forward: bool,
        boundary: Optional[float],
    ) -> Optional[float]:
        if boundary and boundary > 0:
            return boundary
        if network.boundary_pressure and network.boundary_pressure > 0:
            return network.boundary_pressure
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
                section.temperature,
                section.pressure,
            )

    def _populate_section_state(
        self,
        section: PipeSection,
        fluid,
        mass_flow: Optional[float],
        temperature: Optional[float],
        pressure: Optional[float],
    ) -> None:
        summary = section.result_summary
        pipe_diameter = section.pipe_diameter or self.default_pipe_diameter
        if not pipe_diameter or pipe_diameter <= 0:
            return
        pipe_area = pi * pipe_diameter * pipe_diameter * 0.25
        inlet_diameter = section.inlet_diameter or pipe_diameter
        outlet_diameter = section.outlet_diameter or pipe_diameter

        inlet_area = (
            pi * inlet_diameter * inlet_diameter * 0.25
            if inlet_diameter and inlet_diameter > 0
            else pipe_area
        )
        outlet_area = (
            pi * outlet_diameter * outlet_diameter * 0.25
            if outlet_diameter and outlet_diameter > 0
            else pipe_area
        )
        
        if temperature is None or temperature <= 0:
            raise ValueError("temperature must be set and positive for section state calculations")
        if pressure is None or pressure <= 0:
            raise ValueError("pressure must be set and positive for section state calculations")

        vol_flow = None
        if section.mass_flow_rate is not None:
            try:
                vol_flow = section.current_volumetric_flow_rate(fluid)
            except ValueError:
                vol_flow = None

        velocity = None
        velocity_in = None
        velocity_out = None
        if vol_flow and vol_flow > 0:
            if pipe_area and pipe_area > 0:
                velocity = vol_flow / pipe_area
            if inlet_area and inlet_area > 0:
                velocity_in = vol_flow / inlet_area
            if outlet_area and outlet_area > 0:
                velocity_out = vol_flow / outlet_area
        
        base_density = fluid.current_density(temperature, pressure)
        reference_pressure = pressure
        reference_temperature = temperature
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
        if velocity and phase in {"gas", "vapor"} and fluid.specific_heat_ratio and temperature and fluid.molecular_weight:
            rs = UNIVERSAL_GAS_CONSTANT / fluid.molecular_weight
            sound_speed = sqrt(max(fluid.specific_heat_ratio, 1.0) * rs * temperature)
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
        flow_momentum_in = (
            inlet_density * velocity_in * velocity_in if inlet_density and velocity_in is not None else None
        )
        flow_momentum_out = (
            outlet_density * velocity_out * velocity_out if outlet_density and velocity_out is not None else None
        )
        section.mach_number = mach
        extra_warnings = list(section.calculation_output.ignored_components)
        remarks = self._build_remarks(
            section,
            summary,
            mach,
            velocity,
            erosional_velocity_in,
            extra_warnings=extra_warnings,
        )
        section.calculation_output.ignored_components.clear()
        self._assign_state(
            summary.inlet,
            fluid,
            inlet_density,
            velocity_in or velocity,
            velocity,
            erosional_velocity_in,
            flow_momentum_in,
            mach if phase in {"gas", "vapor"} else None,
            remarks,
            temperature,
            pressure,
        )
        self._assign_state(
            summary.outlet,
            fluid,
            outlet_density,
            velocity_out or velocity,
            velocity,
            erosional_velocity_out,
            flow_momentum_out,
            mach if phase in {"gas", "vapor"} else None,
            remarks,
            temperature,
            pressure,
        )

    @staticmethod
    def _assign_state(
        state,
        fluid, # fluid is not used here, but kept for compatibility
        density: Optional[float],
        velocity: Optional[float],
        pipe_velocity: Optional[float],
        erosional_velocity: Optional[float],
        flow_momentum: Optional[float],
        mach: Optional[float],
        remarks: str,
        temperature: Optional[float],
        pressure: Optional[float],
    ) -> None:
        if state.temperature is None and temperature is not None:
            state.temperature = temperature
        if state.pressure is None and pressure is not None:
            state.pressure = pressure
        if state.density is None and density is not None:
            state.density = density
        if state.velocity is None and velocity is not None:
            state.velocity = velocity
        if state.pipe_velocity is None and pipe_velocity is not None:
            state.pipe_velocity = pipe_velocity
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
        *,
        extra_warnings: Optional[list[str]] = None,
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
        if extra_warnings:
            warnings.extend(extra_warnings)
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
            gamma=gamma,
            molar_mass=molar_mass,
            z_factor=z_factor,
        )

    @staticmethod
    def _apply_gas_state(target: StatePoint, gas_state: Optional[GasState]) -> None:
        if target is None or gas_state is None:
            return
        target.temperature = gas_state.temperature
        target.density = gas_state.density
        target.velocity = gas_state.velocity
        target.pipe_velocity = gas_state.velocity
        target.mach_number = gas_state.mach

    @staticmethod
    def _apply_critical_pressure(section: PipeSection, gas_state: Optional[GasState], gas_flow_model: Optional[str] = "adiabatic") -> None:
        if gas_state is None:
            return

        mass_flow = section.mass_flow_rate
        pipe_dimensions = section.pipe_diameter or 0.0
        if pipe_dimensions and pipe_dimensions < 0:
            raise ValueError("Pipe diameter must be positive")
        area = pi * pipe_dimensions * pipe_dimensions * 0.25
        temperature = gas_state.temperature
        molar_mass = gas_state.molar_mass
        z_state = gas_state.z_factor
        gamma = gas_state.gamma
        
        if gas_flow_model == "adiabatic":
            critical = mass_flow / area * sqrt(UNIVERSAL_GAS_CONSTANT * temperature / gamma / molar_mass / (1 + (gamma - 1) / 2))
        elif gas_flow_model == "isothermal":
            critical = mass_flow / area * sqrt(UNIVERSAL_GAS_CONSTANT * temperature / gamma / mass_flow / 3600)
        else:
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
            return candidate # 1. Explicitly requested direction (solver arg)

        net_dir = (network.direction or "").lower()
        if net_dir in {"forward", "backward"}:
            return net_dir
        
        # Default
        return "forward"
