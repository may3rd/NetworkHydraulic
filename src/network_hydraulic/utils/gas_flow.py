"""Gas flow solvers for isothermal and adiabatic piping segments."""
from __future__ import annotations

from dataclasses import dataclass
from math import log, sqrt
from typing import Tuple

from fluids.compressible import isothermal_gas

UNIVERSAL_GAS_CONSTANT = 8314.462618  # J/(kmol*K)


@dataclass
class GasState:
    pressure: float
    temperature: float
    density: float
    velocity: float
    mach: float


def solve_isothermal(
    inlet_pressure: float,
    temperature: float,
    mass_flow: float,
    diameter: float,
    length: float,
    roughness: float,
    friction_factor: float,
    k_total: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
) -> Tuple[float, GasState]:
    """Use fluids.compressible.isothermal_gas to compute outlet pressure."""
    if length is None or length <= 0:
        return inlet_pressure, _gas_state(inlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    equiv_length = max(length + k_total * diameter / max(friction_factor, 1e-12), 0.0)
    fd = 4 * friction_factor # Convert Fanning friction factor to Darcy friction factor

    # Estimate average density using inlet conditions for the initial call
    # The fluids library's isothermal_gas function expects an average density.
    # For a single pass, we'll use the inlet density as an approximation.
    rho = (inlet_pressure * molar_mass) / (z_factor * UNIVERSAL_GAS_CONSTANT * temperature)

    if is_forward:
        outlet_pressure = isothermal_gas(
            rho=rho,
            fd=fd,
            P1=inlet_pressure,
            L=equiv_length,
            D=diameter,
            m=mass_flow,
        )
    else:
        # For backward calculation, we are given the outlet pressure (which is 'inlet_pressure' in this context)
        # and we want to find the inlet pressure (P1).
        # The fluids.compressible.isothermal_gas function solves for the missing parameter.
        # So, we pass P2 as the known outlet pressure and let it solve for P1.
        outlet_pressure = inlet_pressure # This is the known outlet pressure
        inlet_pressure = isothermal_gas(
            rho=rho,
            fd=fd,
            P2=outlet_pressure,
            L=equiv_length,
            D=diameter,
            m=mass_flow,
        )
        # The function returns the solved P1, so we need to assign it correctly
        return inlet_pressure, _gas_state(inlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    return outlet_pressure if is_forward else inlet_pressure, _gas_state(inlet_pressure if is_forward else outlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)


def solve_adiabatic(
    boundary_pressure: float,
    temperature: float,
    mass_flow: float,
    diameter: float,
    length: float,
    roughness: float,
    friction_factor: float,
    k_total: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
) -> Tuple[float, GasState]:
    """Simplified adiabatic solver based on VB FindMa logic."""
    area = 3.141592653589793 * diameter * diameter / 4.0
    k_total = max(k_total, 1e-12)
    current_pressure = boundary_pressure
    density = (current_pressure * molar_mass) / (UNIVERSAL_GAS_CONSTANT * temperature)
    velocity = mass_flow / (density * area)
    sonic = sqrt(gamma * UNIVERSAL_GAS_CONSTANT / molar_mass * temperature)
    mach1 = velocity / sonic
    mach2 = find_ma(mach1, gamma, friction_factor * length / diameter + k_total, 1 if is_forward else -1)
    if mach2 <= 0:
        return current_pressure, GasState(current_pressure, temperature, density, velocity, mach1)
    y1 = 1.0 + 0.5 * (gamma - 1.0) * mach1 * mach1
    y2 = 1.0 + 0.5 * (gamma - 1.0) * mach2 * mach2
    if is_forward:
        outlet = current_pressure * (mach1 / mach2) * sqrt(y1 / y2)
        return outlet, GasState(current_pressure, temperature, density, velocity, mach1)
    inlet = current_pressure * (mach1 / mach2) * sqrt(y2 / y1)
    return inlet, GasState(current_pressure, temperature, density, velocity, mach1)


def find_ma(mach1: float, gamma: float, k_total: float, factor: int) -> float:
    """Translate VB FindMa."""
    tol = 1e-8
    y1 = 1.0 + 0.5 * (gamma - 1.0) * mach1 * mach1
    mach2 = max(1.01 * mach1, 1e-6)
    prev = -mach1
    while abs(mach2 - prev) > tol:
        prev = mach2
        y2 = 1.0 + 0.5 * (gamma - 1.0) * mach2 * mach2
        aval = 0.5 * (gamma - 1.0) * log((mach2 * mach2 * y1) / (mach1 * mach1 * y2)) + k_total * gamma
        denom = 1.0 - aval * mach1 * mach1 * factor
        if denom <= 0:
            return -1.0
        mach2 = sqrt(abs(mach1 * mach1 / denom))
    return mach2


def _gas_state(pressure: float, temperature: float, mass_flow: float, diameter: float, molar_mass: float, z_factor: float, gamma: float) -> GasState:
    density = (pressure * molar_mass) / (UNIVERSAL_GAS_CONSTANT * temperature)
    area = 3.141592653589793 * diameter * diameter / 4.0
    velocity = mass_flow / (density * area)
    sonic = sqrt(gamma * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass)
    return GasState(pressure=pressure, temperature=temperature, density=density, velocity=velocity, mach=velocity / sonic)
