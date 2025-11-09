"""Gas flow solvers for isothermal and adiabatic piping segments."""
from __future__ import annotations

from dataclasses import dataclass
from math import log, sqrt, pi
from typing import Tuple

from fluids.compressible import isothermal_gas
from scipy.optimize import brentq # Import brentq

UNIVERSAL_GAS_CONSTANT = 8314.462618  # J/(kmol*K)


@dataclass
class GasState:
    pressure: float
    temperature: float
    density: float
    velocity: float
    mach: float


def _fanno_fL_D(mach: float, gamma: float) -> float:
    """Calculates the Fanno friction parameter 4fL*/D."""
    if mach <= 0:
        return float('inf') # Or handle as an error
    term1 = (1 - mach**2) / (gamma * mach**2)
    term2 = ((gamma + 1) / (2 * gamma)) * log(((gamma + 1) * mach**2) / (2 * (1 + ((gamma - 1) / 2) * mach**2)))
    return term1 + term2

def _fanno_target_function(mach: float, fL_D_target: float, gamma: float) -> float:
    """Target function for root-finding: _fanno_fL_D(mach, gamma) - fL_D_target."""
    return _fanno_fL_D(mach, gamma) - fL_D_target


def _fanno_mach_from_fL_D(fL_D: float, gamma: float, initial_guess_mach: float, tol: float = 1e-9) -> float:
    """Iteratively solves for Mach number M given Fanno friction parameter 4fL*/D using brentq."""
    # Define search bounds based on initial guess
    if initial_guess_mach < 1.0: # Subsonic flow
        a = 1e-6 # Lower bound for Mach number (cannot be zero)
        b = 1.0 - 1e-6 # Upper bound for subsonic Mach number (cannot reach 1.0)
    else: # Supersonic flow
        a = 1.0 + 1e-6 # Lower bound for supersonic Mach number (cannot reach 1.0)
        b = 10.0 # Arbitrary high upper bound for Mach number

    try:
        mach = brentq(_fanno_target_function, a, b, args=(fL_D, gamma), xtol=tol)
        return mach
    except ValueError as e:
        raise ValueError(f"Brentq failed to find Mach number for fL_D={fL_D}, gamma={gamma}, initial_guess_mach={initial_guess_mach}. Error: {e}")


def _fanno_pressure_ratio(mach: float, gamma: float) -> float:
    """Calculates P/P* (pressure to critical pressure ratio)."""
    return (1 / mach) * sqrt((gamma + 1) / (2 * (1 + ((gamma - 1) / 2) * mach**2)))


def _fanno_temperature_ratio(mach: float, gamma: float) -> float:
    """Calculates T/T* (temperature to critical temperature ratio)."""
    return (gamma + 1) / (2 * (1 + ((gamma - 1) / 2) * mach**2))


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
    """Full Fanno Flow solver for adiabatic piping segments."""
    if length is None or length <= 0:
        return boundary_pressure, _gas_state(boundary_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)

    # Calculate initial Mach number and other properties
    initial_state = _gas_state(boundary_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    M1 = initial_state.mach
    P1 = initial_state.pressure
    T1 = initial_state.temperature

    if M1 <= 1e-6: # Handle very low Mach number case
        return P1, initial_state

    # Calculate Fanno friction parameter for the pipe
    fd = 4 * friction_factor # Convert Fanning friction factor to Darcy friction factor
    # Equivalent length includes minor losses (k_total)
    equiv_length = length + k_total * diameter / max(fd, 1e-12)
    fanno_param_pipe = fd * equiv_length / diameter

    # Determine initial Fanno friction parameter (4fL*/D)1
    fL_D_1 = _fanno_fL_D(M1, gamma)

    # Calculate Fanno friction parameter at the outlet (or inlet for backward flow)
    if is_forward:
        fL_D_2 = fL_D_1 - fanno_param_pipe
    else:
        # For backward flow, boundary_pressure is the outlet pressure.
        # So M1, P1, T1 are actually M_outlet, P_outlet, T_outlet.
        # We need to find the inlet conditions.
        # fL_D_1 is (4fL*/D)_outlet.
        # We want (4fL*/D)_inlet = (4fL*/D)_outlet + (4fL/D)_pipe
        fL_D_2 = fL_D_1 + fanno_param_pipe # This fL_D_2 is actually fL_D_inlet

    # Ensure fL_D_2 is non-negative to avoid physical impossibilities (choking)
    fL_D_2 = max(0.0, fL_D_2)

    # Solve for Mach number at the outlet (or inlet for backward flow)
    if abs(fL_D_2) < 1e-9: # If fL_D_2 is approximately 0, then M2 is 1.0 (sonic)
        M2 = 1.0
    else:
        M2 = _fanno_mach_from_fL_D(fL_D_2, gamma, M1)

    # Calculate final pressure and temperature
    # P2/P1 = (P/P*)_final / (P/P*)_initial
    # T2/T1 = (T/T*)_final / (T/T*)_initial
    P_ratio_final = _fanno_pressure_ratio(M2, gamma)
    P_ratio_initial = _fanno_pressure_ratio(M1, gamma)
    T_ratio_final = _fanno_temperature_ratio(M2, gamma)
    T_ratio_initial = _fanno_temperature_ratio(M1, gamma)

    if is_forward:
        outlet_pressure = P1 * (P_ratio_final / P_ratio_initial)
        outlet_temperature = T1 * (T_ratio_final / T_ratio_initial)
        final_pressure = outlet_pressure
        final_temperature = outlet_temperature
    else:
        # For backward flow, M2 is M_inlet, P_ratio_final is (P/P*)_inlet, T_ratio_final is (T/T*)_inlet
        # P1 is P_outlet, T1 is T_outlet
        inlet_pressure = P1 * (P_ratio_final / P_ratio_initial)
        inlet_temperature = T1 * (T_ratio_final / T_ratio_initial)
        final_pressure = inlet_pressure
        final_temperature = inlet_temperature

    return final_pressure, _gas_state(final_pressure, final_temperature, mass_flow, diameter, molar_mass, z_factor, gamma)


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
    area = pi * diameter * diameter / 4.0
    velocity = mass_flow / (density * area)
    sonic = sqrt(gamma * z_factor * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass) # Corrected sonic speed calculation
    return GasState(pressure=pressure, temperature=temperature, density=density, velocity=velocity, mach=velocity / sonic)
