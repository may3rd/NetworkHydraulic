"""Orifice pressure loss calculations."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fluids.flow_meter import (
    ISO_5167_ORIFICE,
    differential_pressure_meter_C_epsilon,
    differential_pressure_meter_solver,
    dP_orifice,
)

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.components import Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection


@dataclass
class OrificeCalculator(LossCalculator):
    fluid: Fluid
    default_pipe_diameter: Optional[float] = None
    mass_flow_rate: Optional[float] = None

    def calculate(
        self,
        section: PipeSection,
        *,
        inlet_pressure_override: Optional[float] = None,
    ) -> None:
        orifice = section.orifice
        if orifice is None:
            return

        pressure_drop = section.calculation_output.pressure_drop
        if orifice.pressure_drop is not None:
            drop = max(orifice.pressure_drop, 0.0)
        else:
            drop = self._compute_drop(section, orifice, inlet_pressure_override)
            orifice.pressure_drop = drop

        pressure_drop.orifice_pressure_drop = drop
        baseline = pressure_drop.total_segment_loss or 0.0
        pressure_drop.total_segment_loss = baseline + drop

    def _compute_drop(
        self,
        section: PipeSection,
        orifice: Orifice,
        inlet_pressure_override: Optional[float],
    ) -> float:
        pipe_diameter = self._pipe_diameter(section)
        orifice_diameter = self._orifice_diameter(orifice, pipe_diameter)
        inlet_pressure = (
            inlet_pressure_override
            if inlet_pressure_override is not None
            else self._inlet_pressure(section)
        )
        if inlet_pressure is None or inlet_pressure <= 0:
            raise ValueError("Orifice inlet pressure must be positive")
        mass_flow = self._mass_flow_rate()
        density = self._fluid_density()
        viscosity = self._fluid_viscosity()
        isentropic_exponent = self._isentropic_exponent()
        meter_type = orifice.meter_type or ISO_5167_ORIFICE

        outlet_pressure = differential_pressure_meter_solver(
            D=pipe_diameter,
            D2=orifice_diameter,
            P1=inlet_pressure,
            P2=None,
            rho=density,
            mu=viscosity,
            k=isentropic_exponent,
            m=mass_flow,
            meter_type=meter_type,
            taps=orifice.taps,
            tap_position=orifice.tap_position,
            C_specified=orifice.discharge_coefficient,
            epsilon_specified=orifice.expansibility,
        )
        discharge_coefficient, _ = differential_pressure_meter_C_epsilon(
            D=pipe_diameter,
            D2=orifice_diameter,
            m=mass_flow,
            P1=inlet_pressure,
            P2=outlet_pressure,
            rho=density,
            mu=viscosity,
            k=isentropic_exponent,
            meter_type=meter_type,
            taps=orifice.taps,
            tap_position=orifice.tap_position,
            C_specified=orifice.discharge_coefficient,
            epsilon_specified=orifice.expansibility,
        )
        return dP_orifice(
            pipe_diameter,
            orifice_diameter,
            inlet_pressure,
            outlet_pressure,
            discharge_coefficient,
        )

    def _pipe_diameter(self, section: PipeSection) -> float:
        if section.orifice and section.orifice.pipe_diameter and section.orifice.pipe_diameter > 0:
            return section.orifice.pipe_diameter
        if section.pipe_diameter and section.pipe_diameter > 0:
            return section.pipe_diameter
        if self.default_pipe_diameter and self.default_pipe_diameter > 0:
            return self.default_pipe_diameter
        raise ValueError("Pipe diameter is required for orifice calculations")

    def _orifice_diameter(self, orifice: Orifice, pipe_diameter: float) -> float:
        if orifice.orifice_diameter and orifice.orifice_diameter > 0:
            return orifice.orifice_diameter
        if orifice.d_over_D_ratio and orifice.d_over_D_ratio > 0:
            return orifice.d_over_D_ratio * pipe_diameter
        raise ValueError("Either orifice diameter or d_over_D_ratio must be provided")

    def _inlet_pressure(self, section: PipeSection) -> float:
        summary = section.result_summary.inlet
        if summary.pressure and summary.pressure > 0:
            return summary.pressure
        if self.fluid.pressure <= 0:
            raise ValueError("Fluid pressure must be positive for orifice calculations")
        return self.fluid.pressure

    def _fluid_density(self) -> float:
        if self.fluid.density <= 0:
            raise ValueError("Fluid density must be positive for orifice calculations")
        return self.fluid.density

    def _fluid_viscosity(self) -> float:
        if self.fluid.viscosity <= 0:
            raise ValueError("Fluid viscosity must be positive for orifice calculations")
        return self.fluid.viscosity

    def _isentropic_exponent(self) -> float:
        if self.fluid.specific_heat_ratio and self.fluid.specific_heat_ratio > 0:
            return self.fluid.specific_heat_ratio
        return 1.4

    def _mass_flow_rate(self) -> float:
        if self.mass_flow_rate and self.mass_flow_rate > 0:
            return self.mass_flow_rate
        return self.fluid.current_mass_flow_rate()
