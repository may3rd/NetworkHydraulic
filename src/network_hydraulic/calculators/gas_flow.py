"""Gas flow solvers for isothermal and adiabatic piping segments."""
from __future__ import annotations

from dataclasses import dataclass
from math import log, sqrt, pi
from re import M
from typing import Optional, Tuple

from fluids.compressible import isothermal_gas
from fluids.friction import Shacham_1980 as shacham_friction_factor
from scipy.optimize import brentq  # Import brentq

UNIVERSAL_GAS_CONSTANT = 8314.462618  # J/(kmol*K)
MIN_FANNO_TARGET = 1e-9
MIN_MACH = 1e-6
MIN_DARCY_F = 1e-8
MIN_LENGTH = 1e-9
MIN_VISCOSITY = 1e-12
MAX_ISOTHERMAL_ITER = 25
MAX_ADIABATIC_ITER = 25
ISOTHERMAL_TOL = 1e-6
ADIABATIC_TOL = 1e-9


def _normalize_friction_factor(value: float, factor_type: str) -> float:
    """Return Darcy friction factor regardless of the provided convention."""
    if value <= 0:
        return value
    normalized = (factor_type or "darcy").strip().lower()
    if normalized in {"darcy", "d"}:
        return value
    if normalized in {"fanning", "f"}:
        return 4.0 * value
    raise ValueError(
        f"Unknown friction_factor_type '{factor_type}'. Expected 'darcy' or 'fanning'.")


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
        return float('inf')  # Or handle as an error
    # Term 1: Contribution from Mach number change
    term1 = (1 - mach**2) / (gamma * mach**2)
    # Term 2: Contribution from entropy change due to friction (logarithmic term)
    term2 = ((gamma + 1) / (2 * gamma)) * log(((gamma + 1) *
                                               mach**2) / (2 * (1 + ((gamma - 1) / 2) * mach**2)))
    return term1 + term2


def _fanno_target_function(mach: float, fL_D_target: float, gamma: float) -> float:
    """Target function for root-finding: _fanno_fL_D(mach, gamma) - fL_D_target."""
    return _fanno_fL_D(mach, gamma) - fL_D_target


def _fanno_mach_from_fL_D(fL_D: float, gamma: float, initial_guess_mach: float, tol: float = 1e-9) -> float:
    """Iteratively solves for Mach number M given Fanno friction parameter 4fL*/D using brentq."""
    # Define search bounds based on initial guess
    if initial_guess_mach < 1.0:  # Subsonic flow
        a = 1e-6  # Lower bound for Mach number (cannot be zero)
        # Upper bound for subsonic Mach number (cannot reach 1.0)
        b = 1.0 - 1e-6
    else:  # Supersonic flow
        # Lower bound for supersonic Mach number (cannot reach 1.0)
        a = 1.0 + 1e-6
        b = 10.0  # Arbitrary high upper bound for Mach number

    try:
        mach = brentq(_fanno_target_function, a, b,
                      args=(fL_D, gamma), xtol=tol)
        return mach
    except ValueError as e:
        raise ValueError(
            f"Brentq failed to find Mach number for fL_D={fL_D}, gamma={gamma}, initial_guess_mach={initial_guess_mach}. Error: {e}")


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
    k_total: float,
    k_additional: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
    friction_factor_type: str = "darcy",
    viscosity: Optional[float] = None,
    roughness: Optional[float] = None,
) -> Tuple[float, GasState]:
    """"""
    if length is None or length <= 0:
        return inlet_pressure, _gas_state(inlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)

    k_total = k_total + k_additional

    if k_total == 0.0:
        return inlet_pressure, _gas_state(inlet_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)

    area = pi * diameter * diameter * 0.25

    # Helper functions
    def _k_total_term(k_total: float, P1: float, P2: float):
        return k_total + 2 * log(P1 / P2)

    upstream_pressure = inlet_pressure
    downstream_pressure: Optional[float] = None

    if is_forward:
        downstream_pressure_guess = 0.9 * upstream_pressure
        for _ in range(MAX_ISOTHERMAL_ITER):
            downstream_pressure = downstream_pressure_guess
            term_1 = _k_total_term(
                k_total, upstream_pressure, downstream_pressure)
            P2_2 = (upstream_pressure ** 2) - term_1 * ((mass_flow / area) **
                                                        2) * z_factor * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass
            downstream_pressure_guess = sqrt(P2_2)

            if abs(downstream_pressure_guess - downstream_pressure) <= ISOTHERMAL_TOL * downstream_pressure_guess:
                downstream_pressure = downstream_pressure_guess
                break

        if downstream_pressure is None:
            raise ValueError(
                "Isothermal solver failed to compute downstream pressure")
    else:
        downstream_pressure = inlet_pressure
        upstream_pressure_guess = 1.1 * downstream_pressure
        for _ in range(MAX_ISOTHERMAL_ITER):
            upstream_pressure = upstream_pressure_guess
            term_1 = _k_total_term(
                k_total, upstream_pressure, downstream_pressure)
            P1_2 = (downstream_pressure ** 2) + term_1 * ((mass_flow / area) **
                                                          2) * z_factor * UNIVERSAL_GAS_CONSTANT * temperature / molar_mass
            upstream_pressure_guess = sqrt(P1_2)

            if abs(upstream_pressure_guess - upstream_pressure) <= ISOTHERMAL_TOL * upstream_pressure_guess:
                upstream_pressure = upstream_pressure_guess
                break

        if upstream_pressure is None:
            raise ValueError(
                "Isothermal solver failed to compute upstream pressure")

    final_pressure = downstream_pressure if is_forward else upstream_pressure
    return final_pressure, _gas_state(final_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma)


def solve_adiabatic(
    boundary_pressure: float,
    temperature: float,
    mass_flow: float,
    diameter: float,
    length: float,
    friction_factor: float,
    k_total: float,
    k_additional: float,
    molar_mass: float,
    z_factor: float,
    gamma: float,
    is_forward: bool = True,
    *,
    label: Optional[str] = None,
    friction_factor_type: str = "darcy",
) -> Tuple[GasState, GasState]:
    if length is None or length <= 0:
        return _gas_state(boundary_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma), \
            _gas_state(boundary_pressure, temperature, mass_flow,
                       diameter, molar_mass, z_factor, gamma)

    k_total = k_total + k_additional

    if k_total == 0.0:
        return _gas_state(boundary_pressure, temperature, mass_flow, diameter, molar_mass, z_factor, gamma), \
            _gas_state(boundary_pressure, temperature, mass_flow,
                       diameter, molar_mass, z_factor, gamma)

    # Helper functions
    def _calculate_y(gamma: float, ma: float) -> float:
        return 1 + (gamma - 1) / 2 * ma ** 2

    def _find_ma(
        pressure: float,
        temperature: float,
        mass_flow: float,
        diameter: float,
        molar_mass: float,
        z_factor: float,
        gamma: float,
        is_forward: bool
    ) -> Tuple[float, float, float, float]:
        """
        """
        area = pi * diameter * diameter / 4.0

        # Initialize MA
        MA = (mass_flow / area) / pressure * sqrt(
            temperature * UNIVERSAL_GAS_CONSTANT * z_factor / molar_mass / gamma
        )
        MA_guess = MA
        for _ in range(MAX_ADIABATIC_ITER):
            y = _calculate_y(gamma, MA_guess)
            MA_new = MA / y

            if abs(MA_new - MA_guess) <= ADIABATIC_TOL:
                MA = MA_new
                break
            MA_guess = MA_new

        MA1 = MA_new
        Y1 = _calculate_y(gamma, MA1)

        direction_factor = 1.0 if is_forward else -1.0
        MA2_guess = (1.0 + direction_factor * 0.01) * MA1
        for _ in range(MAX_ADIABATIC_ITER):
            Y2 = _calculate_y(gamma, MA2_guess)
            BigA = (gamma + 1) / 2 * (MA2_guess ** 2 * Y1) / \
                (MA1 ** 2 * Y2) + k_total * gamma
            MA2_new = sqrt(
                (MA1 ** 2) / (1 - BigA * MA1 ** 2 * direction_factor))

            if abs(MA2_new - MA2_guess) <= ADIABATIC_TOL:
                MA2 = MA2_new
                break
            MA2_guess = MA2_new

        return MA1, MA2, Y1, Y2

    if is_forward:
        MA1, MA2, Y1, Y2 = _find_ma(boundary_pressure, temperature,
                                    mass_flow, diameter, molar_mass, z_factor, gamma, is_forward)
        inlet_pressure = boundary_pressure
        inlet_temperature = temperature / Y1
        outlet_pressure = inlet_pressure * MA1 / MA2 * sqrt(Y1 / Y2)
        outlet_temperature = inlet_temperature * Y1 / Y2
    else:
        MA2, MA1, Y2, Y1 = _find_ma(boundary_pressure, temperature,
                                    mass_flow, diameter, molar_mass, z_factor, gamma, is_forward)
        outlet_pressure = boundary_pressure
        outlet_temperature = temperature / Y2
        inlet_pressure = outlet_pressure * MA2 / MA1 * sqrt(Y2 / Y1)
        inlet_temperature = outlet_temperature * Y2 / Y1

    inlet_state = _gas_state(inlet_pressure, inlet_temperature,
                             mass_flow, diameter, molar_mass, z_factor, gamma)
    outlet_statae = _gas_state(
        outlet_pressure, outlet_temperature, mass_flow, diameter, molar_mass, z_factor, gamma)
    return inlet_state, outlet_statae


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
    density = (pressure * molar_mass) / (z_factor *
                                         UNIVERSAL_GAS_CONSTANT * temperature)
    area = pi * diameter * diameter / 4.0
    try:
        # Calculate flow velocity from mass flow rate, density, and pipe area
        velocity = mass_flow / (density * area)
    except ZeroDivisionError:
        raise ValueError(
            "Diameter and mass flow must be positive for gas state calculation.")
    # Calculate the speed of sound (sonic speed) for a real gas
    sonic = sqrt(gamma * z_factor * UNIVERSAL_GAS_CONSTANT *
                 temperature / molar_mass)  # Corrected sonic speed calculation
    return GasState(pressure=pressure, temperature=temperature, density=density, velocity=velocity, mach=velocity / sonic)
