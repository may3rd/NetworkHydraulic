"""Gas flow solvers for isothermal and adiabatic piping segments."""
from __future__ import annotations

from dataclasses import dataclass
from math import log, sqrt, pi
from typing import Optional, Tuple

from fluids.compressible import isothermal_gas
from fluids.friction import Shacham_1980 as shacham_friction_factor
from scipy.optimize import brentq # Import brentq

UNIVERSAL_GAS_CONSTANT = 8314.462618  # J/(kmol*K)
MIN_FANNO_TARGET = 1e-9
MIN_MACH = 1e-6
MIN_DARCY_F = 1e-8
MIN_LENGTH = 1e-9
MIN_VISCOSITY = 1e-12
MAX_ISOTHERMAL_ITER = 25
ISOTHERMAL_TOL = 1e-6

def _normalize_friction_factor(value: float, factor_type: str) -> float:
    """Return Darcy friction factor regardless of the provided convention."""
    if value <= 0:
        return value
    normalized = (factor_type or "darcy").strip().lower()
    if normalized in {"darcy", "d"}:
        return value
    if normalized in {"fanning", "f"}:
        return 4.0 * value
    raise ValueError(f"Unknown friction_factor_type '{factor_type}'. Expected 'darcy' or 'fanning'.")


@dataclass
class GasState:
    pressure: float = 101.325
    temperature: float = 298.15
    density: float = 1.0
    velocity: float = 0.0
    mach: float = 0.0
    molar_mass: float = 28.9644
    z_factor: float = 0.0
    gamma: float = 1.4
    critical_pressure: Optional[float] = None


def _fanno_fL_D(mach: float, gamma: float) -> float:
    """
    Calculates the Darcy-based Fanno friction parameter (f_D * L*/D).

    This parameter represents the dimensionless length required for a flow to reach sonic conditions
    (Mach 1) from a given initial Mach number, considering friction. It's a key component
    in Fanno flow equations for adiabatic flow in constant-area ducts with friction.

    Args:
        mach (float): The current Mach number of the flow.
        gamma (float): The ratio of specific heats (Cp/Cv) for the gas.

    Returns:
        float: The Fanno friction parameter (f_D * L*/D).
    """
    if mach <= 0:
        return float('inf') # Or handle as an error
    # Term 1: Contribution from Mach number change
    term1 = (1 - mach**2) / (gamma * mach**2)
    # Term 2: Contribution from entropy change due to friction (logarithmic term)
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
    """
    Calculates P/P* (pressure to critical pressure ratio) for Fanno flow.

    This ratio relates the static pressure at a given Mach number to the static pressure
    at the sonic (critical) condition (Mach 1) in Fanno flow.

    Args:
        mach (float): The current Mach number of the flow.
        gamma (float): The ratio of specific heats (Cp/Cv) for the gas.

    Returns:
        float: The ratio of static pressure to critical static pressure (P/P*).
    """
    return (1 / mach) * sqrt((gamma + 1) / (2 * (1 + ((gamma - 1) / 2) * mach**2)))


def _fanno_temperature_ratio(mach: float, gamma: float) -> float:
    """
    Calculates T/T* (temperature to critical temperature ratio) for Fanno flow.

    This ratio relates the static temperature at a given Mach number to the static temperature
    at the sonic (critical) condition (Mach 1) in Fanno flow.

    Args:
        mach (float): The current Mach number of the flow.
        gamma (float): The ratio of specific heats (Cp/Cv) for the gas.

    Returns:
        float: The ratio of static temperature to critical static temperature (T/T*).
    """
    return (gamma + 1) / (2 * (1 + ((gamma - 1) / 2) * mach**2))


def solve_isothermal(
    inlet_pressure: float,
    temperature: float,
    mass_flow: float,
    diameter: float,
    length: float,
    friction_factor: float,
    k_additional: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
    friction_factor_type: str = "darcy",
    viscosity: Optional[float] = None,
    roughness: Optional[float] = None,
) -> Tuple[float, GasState]:
    """Use fluids.compressible.isothermal_gas to compute outlet pressure (Darcy friction factor)."""
    if length is None or length <= 0:
        return inlet_pressure, _gas_state(inlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    equiv_length = max(length + max(k_additional, 0.0) * diameter / max(friction_factor, MIN_DARCY_F), 0.0)
    fd = max(_normalize_friction_factor(friction_factor, friction_factor_type), MIN_DARCY_F)

    mu = max(viscosity or 0.0, MIN_VISCOSITY)
    area = pi * diameter * diameter * 0.25
    rel_roughness = (roughness or 0.0) / diameter if diameter > 0 else 0.0

    def density_from_pressure(pressure: float) -> float:
        return (pressure * molar_mass) / (z_factor * UNIVERSAL_GAS_CONSTANT * temperature)

    upstream_pressure = inlet_pressure
    downstream_pressure: Optional[float] = None
    rho_guess = density_from_pressure(upstream_pressure)

    for _ in range(MAX_ISOTHERMAL_ITER):
        if is_forward:
            downstream_pressure = isothermal_gas(
                rho=rho_guess,
                fd=fd,
                P1=upstream_pressure,
                L=equiv_length,
                D=diameter,
                m=mass_flow,
            )
            upstream_pressure = inlet_pressure
        else:
            downstream_pressure = inlet_pressure
            upstream_pressure = isothermal_gas(
                rho=rho_guess,
                fd=fd,
                P2=downstream_pressure,
                L=equiv_length,
                D=diameter,
                m=mass_flow,
            )

        if downstream_pressure is None:
            raise ValueError("Isothermal solver failed to compute downstream pressure")

        rho_up = density_from_pressure(upstream_pressure)
        rho_down = density_from_pressure(downstream_pressure)
        rho_avg = 0.5 * (rho_up + rho_down)
        velocity = mass_flow / max(rho_avg * area, MIN_VISCOSITY)
        reynolds = rho_avg * abs(velocity) * diameter / mu
        if reynolds <= 0:
            break
        new_fd = max(
            _normalize_friction_factor(
                shacham_friction_factor(Re=reynolds, eD=rel_roughness),
                "darcy",
            ),
            MIN_DARCY_F,
        )
        if abs(new_fd - fd) <= ISOTHERMAL_TOL * fd and abs(rho_avg - rho_guess) <= ISOTHERMAL_TOL * rho_guess:
            rho_guess = rho_avg
            fd = new_fd
            break
        rho_guess = rho_avg
        fd = new_fd

    if downstream_pressure is None:
        raise ValueError("Failed to determine isothermal pressure drop")

    final_pressure = downstream_pressure if is_forward else upstream_pressure
    return final_pressure, _gas_state(final_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)


def solve_adiabatic(
    boundary_pressure: float,
    temperature: float,
    mass_flow: float,
    diameter: float,
    length: float,
    friction_factor: float,
    k_additional: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
    *,
    label: Optional[str] = None,
    friction_factor_type: str = "darcy",
) -> Tuple[float, GasState]:
    """Fanno-flow solver for adiabatic piping segments using Darcy friction factors."""
    base_state = _gas_state(boundary_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    M1 = max(base_state.mach, MIN_MACH)
    P1 = base_state.pressure
    T1 = base_state.temperature

    pipe_length = max(length or 0.0, 0.0)
    additional_length = 0.0
    fd = max(_normalize_friction_factor(friction_factor, friction_factor_type), MIN_DARCY_F)
    if k_additional and k_additional > 0:
        additional_length = (k_additional * diameter) / fd
    equiv_length = pipe_length + additional_length

    if equiv_length <= MIN_LENGTH:
        return boundary_pressure, base_state

    fanno_param_pipe = fd * equiv_length / diameter
    if fanno_param_pipe <= 0:
        return boundary_pressure, base_state

    f_initial = _fanno_fL_D(M1, gamma)
    target = f_initial - fanno_param_pipe if is_forward else f_initial + fanno_param_pipe
    choked = False
    if is_forward and target <= MIN_FANNO_TARGET:
        target = MIN_FANNO_TARGET
        choked = True

    target = max(target, MIN_FANNO_TARGET)
    try:
        M2 = _fanno_mach_from_fL_D(target, gamma, M1)
    except ValueError:
        M2 = 1.0 - 1e-6
        choked = True

    P_ratio_final = _fanno_pressure_ratio(M2, gamma)
    P_ratio_initial = _fanno_pressure_ratio(M1, gamma)
    critical_pressure = P1 / P_ratio_initial if P_ratio_initial > 0 else None
    base_state.critical_pressure = critical_pressure
    T_ratio_final = _fanno_temperature_ratio(M2, gamma)
    T_ratio_initial = _fanno_temperature_ratio(M1, gamma)

    final_pressure = P1 * (P_ratio_final / P_ratio_initial)
    final_temperature = T1 * (T_ratio_final / T_ratio_initial)

    if choked and label:
        from logging import getLogger

        getLogger(__name__).warning(
            "Section %s reached sonic conditions under adiabatic flow; limiting to Mach 1.",
            label,
        )

    if not choked and critical_pressure and critical_pressure > 0 and final_pressure <= critical_pressure:
        choked = True
        final_pressure = critical_pressure
        final_temperature = final_temperature  # temperature already accounts for downstream Mach; we treat at sonic limit
        if label:
            from logging import getLogger
            getLogger(__name__).warning(
                "Section %s resulted in outlet pressure below the critical pressure; limited to P*.",
                label,
            )

    final_state = _gas_state(final_pressure, final_temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    final_state.critical_pressure = critical_pressure
    return final_pressure, final_state



def _gas_state(pressure: float, temperature: float, mass_flow: float, diameter: float, molar_mass: float, z_factor: float, gamma: float) -> GasState:
    """
    Calculates the state properties of a gas at a given point in the pipe.

    This function computes density, velocity, and Mach number based on the provided
    thermodynamic and flow parameters.

    Args:
        pressure (float): Absolute pressure of the gas.
        temperature (float): Absolute temperature of the gas.
        mass_flow (float): Mass flow rate of the gas.
        diameter (float): Inner diameter of the pipe.
        molar_mass (float): Molar mass of the gas.
        z_factor (float): Compressibility factor of the gas.
        gamma (float): Ratio of specific heats (Cp/Cv) for the gas.

    Returns:
        GasState: A dataclass containing the calculated gas properties.
    """
    # Calculate gas density using the real gas law (considering compressibility factor Z)
    density = (pressure * molar_mass) / (z_factor * UNIVERSAL_GAS_CONSTANT * temperature)
    area = pi * diameter * diameter / 4.0
    try:
        # Calculate flow velocity from mass flow rate, density, and pipe area
        velocity = mass_flow / (density * area)
    except ZeroDivisionError:
        raise ValueError("Diameter and mass flow must be positive for gas state calculation.")
    # Calculate the speed of sound (sonic speed) for a real gas
    sonic = sqrt(gamma * z_factor * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass) # Corrected sonic speed calculation
    return GasState(pressure=pressure, temperature=temperature, density=density, velocity=velocity, mach=velocity / sonic)
