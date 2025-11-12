"""Control valve pressure loss calculations using ISA/IEC correlations."""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

from network_hydraulic.calculators.base import LossCalculator
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection

MIN_PRESSURE = 1.0  # Pa to avoid zero/negative outlet pressures
PA_TO_PSI = 0.00014503773773020923
PSI_TO_PA = 1.0 / PA_TO_PSI
M3S_TO_GPM = 15850.323141489  # ISA liquid equations expect gal/min
M3S_TO_FT3H = 127133.526  # ISA gas equations expect ft^3/h
KELVIN_TO_RANKINE = 9.0 / 5.0
WATER_REFERENCE_DENSITY = 998.2071  # kg/m^3 at ~20°C
MW_AIR = 28.96443  # g/mol
MIN_EXPANSION_FACTOR = 6.0 / 9.0  # ISA minimum for compressible flow
MAX_ITERATIONS = 100
ITER_TOL = 1e-9


@dataclass
class ControlValveCalculator(LossCalculator):
    fluid: Fluid
    volumetric_flow_rate: Optional[float] = None

    def calculate(
        self,
        section: PipeSection,
        *,
        inlet_pressure_override: Optional[float] = None,
    ) -> None:
        valve = section.control_valve
        if valve is None:
            return

        valve.calculation_note = None
        self._apply_section_defaults(section, valve)
        if valve.cv is None and valve.cg:
            valve.cv = self._cv_from_cg(valve.cg, valve)
        if valve.pressure_drop is None and valve.cv is None:
            valve.calculation_note = (
                "Skipped control valve calculation: provide pressure_drop or Cv/Cg."
            )
            return

        flow = self._determine_flow_rate(section)
        if flow <= 0:
            valve.calculation_note = (
                "Skipped control valve calculation: unable to determine flow rate."
            )
            return

        inlet_pressure = (
            inlet_pressure_override
            if inlet_pressure_override is not None
            else self._inlet_pressure(section)
        )
        if inlet_pressure is None or inlet_pressure <= 0:
            raise ValueError("Control valve inlet pressure must be positive")

        if self.fluid.is_liquid():
            drop = self._apply_liquid(section, valve, flow, inlet_pressure)
        else:
            drop = self._apply_gas(section, valve, flow, inlet_pressure)

        pressure_drop = section.calculation_output.pressure_drop
        pressure_drop.control_valve_pressure_drop = drop
        baseline = pressure_drop.total_segment_loss or 0.0
        pressure_drop.total_segment_loss = baseline + drop

    # ------------------------------------------------------------------ #
    # ISA liquid handling
    # ------------------------------------------------------------------ #
    def _apply_liquid(
        self,
        section: PipeSection,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        if valve.pressure_drop is not None:
            drop = self._liquid_drop_from_spec(valve, flow_rate, inlet_pressure)
            valve.calculation_note = (
                f"Used specified pressure_drop ({self._format_drop(drop)})."
            )
        else:
            drop = self._liquid_drop_from_cv(valve, flow_rate, inlet_pressure)
            valve.pressure_drop = drop
            valve.calculation_note = (
                f"Calculated pressure_drop from Cv ({self._format_drop(drop)})."
            )
        return drop

    def _liquid_drop_from_spec(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        drop = max(valve.pressure_drop or 0.0, 0.0)
        max_drop = max(inlet_pressure - MIN_PRESSURE, MIN_PRESSURE)
        if drop > max_drop:
            raise ValueError("Specified control valve pressure drop exceeds inlet pressure")
        if valve.cv is None:
            valve.cv = self._liquid_cv_from_drop(valve, flow_rate, inlet_pressure, drop)
            if valve.cg is None:
                valve.cg = self._cg_from_cv(valve.cv, valve)
        return drop

    def _liquid_drop_from_cv(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        if valve.cv is None or valve.cv <= 0:
            raise ValueError("Control valve Cv must be positive to compute pressure drop")
        q_gpm = self._flow_to_gpm(flow_rate)
        if q_gpm <= 0:
            raise ValueError("Positive flow rate required for control valve calculation")

        sg = self._liquid_specific_gravity()
        fp = self._liquid_fp(valve, valve.cv)
        fl = self._liquid_fl(valve)
        ff = self._liquid_ff()

        p1_psi = inlet_pressure * PA_TO_PSI
        pv_psi = max(self.fluid.vapor_pressure or 0.0, 0.0) * PA_TO_PSI
        cav_limit = fl * fl * max(p1_psi - ff * pv_psi, 0.0)
        base_drop = (q_gpm / max(valve.cv * fp, 1e-9)) ** 2 * max(sg, 1e-6)
        drop_psi = base_drop if cav_limit <= 0 else min(base_drop, cav_limit)
        drop_pa = max(drop_psi * PSI_TO_PA, MIN_PRESSURE)
        max_possible = max(inlet_pressure - MIN_PRESSURE, MIN_PRESSURE)
        return min(drop_pa, max_possible)

    def _liquid_cv_from_drop(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
        drop: float,
    ) -> float:
        q_gpm = self._flow_to_gpm(flow_rate)
        if q_gpm <= 0:
            raise ValueError("Positive flow rate required for control valve calculation")
        drop_psi = max(drop, MIN_PRESSURE) * PA_TO_PSI
        p1_psi = inlet_pressure * PA_TO_PSI

        sg = self._liquid_specific_gravity()
        fl = self._liquid_fl(valve)
        ff = self._liquid_ff()
        pv_psi = max(self.fluid.vapor_pressure or 0.0, 0.0) * PA_TO_PSI
        cav_limit = fl * fl * max(p1_psi - ff * pv_psi, 0.0)

        fp = 1.0
        cv = valve.cv or 1.0
        for _ in range(MAX_ITERATIONS):
            old_fp = fp
            if cav_limit > 0 and drop_psi >= cav_limit:
                # Choked
                denominator = max(p1_psi - ff * pv_psi, 1e-6)
                cv = q_gpm * math.sqrt(sg / denominator) / max(fp * fl, 1e-9)
            else:
                cv = q_gpm * math.sqrt(sg / max(drop_psi, 1e-6)) / max(fp, 1e-9)
            fp = self._liquid_fp(valve, cv)
            if abs(fp - old_fp) < ITER_TOL:
                break
        return cv

    def _liquid_specific_gravity(self) -> float:
        density = self.fluid.current_density()
        return max(density / WATER_REFERENCE_DENSITY, 1e-6)

    def _liquid_ff(self) -> float:
        pv = self.fluid.vapor_pressure or 0.0
        pc = self.fluid.critical_pressure or 0.0
        if pv > 0 and pc > 0:
            value = 0.96 - 0.28 * math.sqrt(pv / pc)
            return max(min(value, 1.0), 0.2)
        return 0.96

    @staticmethod
    def _liquid_fl(valve) -> float:
        if valve.FL and valve.FL > 0:
            return valve.FL
        return 0.9  # Typical globe valve default

    # ------------------------------------------------------------------ #
    # ISA gas / vapor handling
    # ------------------------------------------------------------------ #
    def _apply_gas(
        self,
        section: PipeSection,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        if valve.pressure_drop is not None:
            drop = self._gas_drop_from_spec(valve, flow_rate, inlet_pressure)
            valve.calculation_note = (
                f"Used specified pressure_drop ({self._format_drop(drop)})."
            )
        else:
            drop = self._gas_drop_from_cv(valve, flow_rate, inlet_pressure)
            valve.pressure_drop = drop
            valve.calculation_note = (
                f"Calculated pressure_drop from Cv ({self._format_drop(drop)})."
            )
        return drop

    def _gas_drop_from_spec(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        drop = max(valve.pressure_drop or 0.0, 0.0)
        max_drop = max(inlet_pressure - MIN_PRESSURE, MIN_PRESSURE)
        if drop > max_drop:
            raise ValueError("Specified control valve pressure drop exceeds inlet pressure")
        if valve.cv is None:
            valve.cv = self._gas_cv_from_drop(valve, flow_rate, inlet_pressure, drop)
            if valve.cg is None:
                valve.cg = self._cg_from_cv(valve.cv, valve)
        return drop

    def _gas_drop_from_cv(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
    ) -> float:
        if valve.cv is None or valve.cv <= 0:
            raise ValueError("Control valve Cv must be positive to compute pressure drop")

        max_drop = max(inlet_pressure - MIN_PRESSURE, MIN_PRESSURE)
        low = MIN_PRESSURE
        high = max_drop

        for _ in range(MAX_ITERATIONS):
            mid = 0.5 * (low + high)
            required_cv = self._gas_cv_from_drop(valve, flow_rate, inlet_pressure, mid)
            if required_cv > valve.cv:
                low = mid
            else:
                high = mid
            if abs(high - low) < 1e-6:
                break
        return min(high, max_drop)

    def _gas_cv_from_drop(
        self,
        valve,
        flow_rate: float,
        inlet_pressure: float,
        drop: float,
    ) -> float:
        drop_psi = max(drop, MIN_PRESSURE) * PA_TO_PSI
        p1_psia = inlet_pressure * PA_TO_PSI
        if p1_psia <= 0:
            raise ValueError("Positive inlet pressure required for gas control valve")
        drop_psi = min(drop_psi, 0.99 * p1_psia)

        q_ft3h = self._flow_to_ft3h(flow_rate)
        if q_ft3h <= 0:
            raise ValueError("Positive flow rate required for control valve calculation")

        xt = self._gas_xt(valve)
        fk = self._gas_fk()
        x = drop_psi / p1_psia
        x_critical = fk * xt
        x_used = min(x, x_critical)
        x_used = max(x_used, 1e-6)

        y = max(MIN_EXPANSION_FACTOR, 1.0 - x_used / (3.0 * fk * xt))
        if y <= 0:
            y = MIN_EXPANSION_FACTOR

        gg = self._gas_specific_gravity()
        t_rankine = self.fluid.temperature * KELVIN_TO_RANKINE
        z_factor = max(self.fluid.z_factor or 1.0, 1e-3)

        fp = 1.0
        cv = valve.cv or 1.0
        for _ in range(MAX_ITERATIONS):
            old_fp = fp
            numerator = q_ft3h * math.sqrt(gg * t_rankine * z_factor)
            denominator = 1360.0 * fp * p1_psia * y * math.sqrt(x_used)
            cv = numerator / max(denominator, 1e-9)
            fp = self._gas_fp(valve, cv)
            if abs(fp - old_fp) < ITER_TOL:
                break
        return cv

    def _gas_specific_gravity(self) -> float:
        mw = self.fluid.molecular_weight or MW_AIR
        if mw <= 0:
            mw = MW_AIR
        if mw < 1.0:  # assume already kg/mol
            mw *= 1000.0
        return max(mw / MW_AIR, 1e-6)

    def _gas_fk(self) -> float:
        return max((self.fluid.specific_heat_ratio or 1.4) / 1.4, 1e-3)

    @staticmethod
    def _gas_xt(valve) -> float:
        if valve.xT and valve.xT > 0:
            return valve.xT
        return 0.7

    # ------------------------------------------------------------------ #
    # Shared helpers
    # ------------------------------------------------------------------ #
    def _flow_to_gpm(self, flow_rate: float) -> float:
        return flow_rate * M3S_TO_GPM

    def _flow_to_ft3h(self, flow_rate: float) -> float:
        return flow_rate * M3S_TO_FT3H

    @staticmethod
    def _format_drop(drop: float) -> str:
        return f"{drop:.6g} Pa"

    @staticmethod
    def _apply_section_defaults(section: PipeSection, valve) -> None:
        if valve.inlet_diameter is None:
            valve.inlet_diameter = section.inlet_diameter or section.pipe_diameter
        if valve.outlet_diameter is None:
            valve.outlet_diameter = section.outlet_diameter or section.pipe_diameter
        if valve.valve_diameter is None:
            valve.valve_diameter = section.pipe_diameter

    def _liquid_fp(self, valve, cv: float) -> float:
        d = valve.valve_diameter or valve.inlet_diameter or valve.outlet_diameter
        D1 = valve.inlet_diameter
        D2 = valve.outlet_diameter
        if not d or not D1 or not D2:
            return 1.0
        d_in = d * 39.37007874015748
        D1_in = D1 * 39.37007874015748
        D2_in = D2 * 39.37007874015748
        if min(d_in, D1_in, D2_in) <= 0:
            return 1.0

        beta1 = d_in / D1_in
        beta2 = d_in / D2_in
        beta1_sq = beta1 * beta1
        beta2_sq = beta2 * beta2

        fp = 1.0
        for _ in range(MAX_ITERATIONS):
            ktotal = (
                0.25 * (1 - beta1_sq) ** 2
                + (1 - beta2_sq) ** 2
                + (1 - beta1_sq * beta1_sq)
                + (1 - beta2_sq * beta2_sq)
            )
            denominator = (cv * cv * ktotal) / (890.0 * d_in**4) + 1.0
            new_fp = 1.0 / math.sqrt(max(denominator, 1e-12))
            if abs(new_fp - fp) < ITER_TOL:
                fp = new_fp
                break
            fp = new_fp
        return fp

    def _gas_fp(self, valve, cv: float) -> float:
        # Use same reducer loss logic as liquid; ISA references allow reuse.
        return self._liquid_fp(valve, cv)

    def _determine_flow_rate(self, section: PipeSection) -> float:
        flow = section.design_volumetric_flow_rate
        if flow and flow > 0:
            return flow
        if self.volumetric_flow_rate and self.volumetric_flow_rate > 0:
            return self.volumetric_flow_rate
        raise ValueError(
            f"Section '{section.id}' is missing a design volumetric flow rate for control valve calculations"
        )

    def _inlet_pressure(self, section: PipeSection) -> float:
        summary = section.result_summary.inlet
        if summary.pressure and summary.pressure > 0:
            return summary.pressure
        if self.fluid.pressure <= 0:
            raise ValueError("Fluid pressure must be positive for control valve calculations")
        return self.fluid.pressure

    def _cg_from_cv(self, cv: float, valve) -> Optional[float]:
        c1 = self._conversion_c1(valve)
        if c1:
            return c1 * cv
        return None

    def _cv_from_cg(self, cg: float, valve) -> float:
        c1 = self._conversion_c1(valve)
        if not c1:
            raise ValueError("Unable to convert Cg to Cv without valve C1 or xT")
        return cg / c1

    @staticmethod
    def _conversion_c1(valve) -> Optional[float]:
        if valve.C1 and valve.C1 > 0:
            return valve.C1
        if valve.xT and 0 < valve.xT < 1.0:
            return 31.6 / (valve.xT ** 0.5)
        return None
