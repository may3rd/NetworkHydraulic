import pytest

from network_hydraulic.calculators.valves import (
    ControlValveCalculator,
    PA_TO_PSI,
)
from network_hydraulic.models.components import ControlValve
from network_hydraulic.models.fluid import Fluid


def _liquid_fluid() -> Fluid:
    return Fluid(
        name="water",
        phase="liquid",
        temperature=298.15,
        pressure=250000.0,
        density=998.0,
        viscosity=1e-3,
    )


def _gas_fluid() -> Fluid:
    return Fluid(
        name="nitrogen",
        phase="gas",
        temperature=305.0,
        pressure=450000.0,
        density=4.0,
        molecular_weight=28.0,
        z_factor=0.95,
        specific_heat_ratio=1.38,
        viscosity=1.2e-5,
    )


def _valve() -> ControlValve:
    diameter = 0.05
    return ControlValve(
        tag="CV-1",
        cv=20.0,
        cg=None,
        pressure_drop=None,
        C1=None,
        FL=0.9,
        Fd=None,
        xT=0.75,
        inlet_diameter=diameter,
        outlet_diameter=diameter,
        valve_diameter=diameter,
    )


def test_liquid_drop_and_cv_are_inverse_operations():
    fluid = _liquid_fluid()
    calc = ControlValveCalculator(fluid=fluid)
    valve = _valve()
    flow = 0.002  # m^3/s
    inlet_pressure = 3.0e5

    drop = calc._liquid_drop_from_cv(valve, flow, inlet_pressure)
    inferred_cv = calc._liquid_cv_from_drop(valve, flow, inlet_pressure, drop)

    assert inferred_cv == pytest.approx(valve.cv, rel=1e-3)
    assert drop > 0
    assert drop < inlet_pressure


def test_liquid_drop_respects_cavitation_limit():
    fluid = _liquid_fluid()
    calc = ControlValveCalculator(fluid=fluid)
    valve = _valve()
    valve.cv = 5.0  # drive larger drop
    flow = 0.01
    inlet_pressure = 2.5e5

    drop = calc._liquid_drop_from_cv(valve, flow, inlet_pressure)
    pv = fluid.vapor_pressure or 0.0
    ff = calc._liquid_ff()
    fl = calc._liquid_fl(valve)
    p1_psi = inlet_pressure * PA_TO_PSI
    pv_psi = pv * PA_TO_PSI
    cav_limit = fl * fl * max(p1_psi - ff * pv_psi, 0.0)

    assert 0 <= drop <= inlet_pressure
    if pv > 0:
        assert drop * PA_TO_PSI <= cav_limit + 1e-6


def test_gas_drop_yields_consistent_cv():
    fluid = _gas_fluid()
    calc = ControlValveCalculator(fluid=fluid)
    valve = _valve()
    valve.cv = 40.0
    flow = 0.12
    inlet_pressure = 4.0e5

    drop = calc._gas_drop_from_cv(valve, flow, inlet_pressure)
    inferred_cv = calc._gas_cv_from_drop(valve, flow, inlet_pressure, drop)

    assert drop > 0
    assert drop < inlet_pressure
    assert inferred_cv == pytest.approx(valve.cv, rel=1e-2)
