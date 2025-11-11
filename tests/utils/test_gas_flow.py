import pytest

from network_hydraulic.utils import gas_flow


def test_solve_adiabatic_zero_length_returns_boundary():
    boundary = 250000.0
    pressure, state = gas_flow.solve_adiabatic(
        boundary_pressure=boundary,
        temperature=320.0,
        mass_flow=4.0,
        diameter=0.15,
        length=0.0,
        friction_factor=0.015,
        k_additional=0.0,
        molar_mass=18.0,
        z_factor=1.0,
        gamma=1.31,
    )

    assert pressure == pytest.approx(boundary)
    assert state.pressure == pytest.approx(boundary)


def test_solve_adiabatic_forward_drops_pressure():
    boundary = 350000.0
    outlet_pressure, state = gas_flow.solve_adiabatic(
        boundary_pressure=boundary,
        temperature=330.0,
        mass_flow=5.0,
        diameter=0.12,
        length=60.0,
        friction_factor=0.02,
        k_additional=3.0,
        molar_mass=20.0,
        z_factor=0.95,
        gamma=1.33,
        is_forward=True,
        label="forward-sec",
    )

    assert outlet_pressure < boundary
    assert state.mach < 1.0


def test_solve_adiabatic_backward_raises_pressure():
    boundary = 150000.0
    inlet_pressure, state = gas_flow.solve_adiabatic(
        boundary_pressure=boundary,
        temperature=310.0,
        mass_flow=2.5,
        diameter=0.1,
        length=40.0,
        friction_factor=0.018,
        k_additional=1.5,
        molar_mass=22.0,
        z_factor=1.0,
        gamma=1.32,
        is_forward=False,
        label="backward-sec",
    )

    assert inlet_pressure > boundary
    assert state.pressure == pytest.approx(inlet_pressure)


def test_solve_isothermal_respects_zero_length():
    boundary = 101325.0
    pressure, state = gas_flow.solve_isothermal(
        inlet_pressure=boundary,
        temperature=300.0,
        mass_flow=1.0,
        diameter=0.2,
        length=0.0,
        friction_factor=0.01,
        k_additional=0.0,
        molar_mass=18.0,
        z_factor=1.0,
        gamma=1.2,
    )

    assert pressure == pytest.approx(boundary)
    assert state.pressure == pytest.approx(boundary)


def test_solve_isothermal_backward_solves_inlet():
    outlet_pressure = 120000.0
    inlet_pressure, state = gas_flow.solve_isothermal(
        inlet_pressure=outlet_pressure,
        temperature=305.0,
        mass_flow=1.5,
        diameter=0.18,
        length=25.0,
        friction_factor=0.012,
        k_additional=1.0,
        molar_mass=20.0,
        z_factor=1.0,
        gamma=1.2,
        is_forward=False,
    )

    assert inlet_pressure > outlet_pressure
    assert state.pressure == pytest.approx(inlet_pressure)


def test_solve_isothermal_accepts_fanning_factor():
    boundary = 150000.0
    # Darcy 0.04 should match Fanning 0.01
    darcy_pressure, _ = gas_flow.solve_isothermal(
        inlet_pressure=boundary,
        temperature=310.0,
        mass_flow=1.0,
        diameter=0.1,
        length=10.0,
        friction_factor=0.04,
        k_additional=0.0,
        molar_mass=18.0,
        z_factor=1.0,
        gamma=1.25,
    )
    fanning_pressure, _ = gas_flow.solve_isothermal(
        inlet_pressure=boundary,
        temperature=310.0,
        mass_flow=1.0,
        diameter=0.1,
        length=10.0,
        friction_factor=0.01,
        k_additional=0.0,
        molar_mass=18.0,
        z_factor=1.0,
        gamma=1.25,
        friction_factor_type="fanning",
    )
    assert fanning_pressure == pytest.approx(darcy_pressure, rel=1e-9)
