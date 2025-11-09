import pytest
from fluids.control_valve import convert_flow_coefficient, size_control_valve_g, size_control_valve_l

from network_hydraulic.calculators.valves import ControlValveCalculator
from network_hydraulic.models.components import ControlValve
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection


def make_section(control_valve: ControlValve) -> PipeSection:
    return PipeSection(
        id="sec",
        schedule="40",
        roughness=1e-4,
        length=10.0,
        elevation_change=0.0,
        fitting_type="SCRD",
        fittings=[],
        fitting_K=None,
        pipe_length_K=None,
        user_K=None,
        piping_and_fitting_safety_factor=None,
        total_K=None,
        user_specified_fixed_loss=None,
        pipe_NPD=None,
        pipe_diameter=0.15,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        erosional_constant=None,
        mach_number=None,
        boundary_pressure=None,
        control_valve=control_valve,
        orifice=None,
    )


def liquid_fluid() -> Fluid:
    return Fluid(
        name="water",
        mass_flow_rate=None,
        volumetric_flow_rate=0.1,
        phase="liquid",
        temperature=300.0,
        pressure=680e3,
        density=965.4,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=3.1472e-4,
        standard_flow_rate=None,
        vapor_pressure=70.1e3,
        critical_pressure=22120e3,
    )


def gas_fluid() -> Fluid:
    return Fluid(
        name="gas",
        mass_flow_rate=None,
        volumetric_flow_rate=0.8,
        phase="gas",
        temperature=310.0,
        pressure=600e3,
        density=45.0,
        molecular_weight=20.0,
        z_factor=0.92,
        specific_heat_ratio=1.3,
        viscosity=1.4e-5,
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )


def test_liquid_cv_from_pressure_drop():
    fluid = liquid_fluid()
    drop = 460e3
    valve = ControlValve(
        tag="CV-1",
        cv=None,
        cg=None,
        pressure_drop=drop,
        C1=None,
        FL=0.9,
        Fd=0.46,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        valve_diameter=0.15,
    )
    section = make_section(valve)
    calc = ControlValveCalculator(fluid=fluid)
    calc.calculate(section)
    kv_expected = size_control_valve_l(
        rho=fluid.density,
        Psat=fluid.vapor_pressure,
        Pc=fluid.critical_pressure,
        mu=fluid.viscosity,
        P1=fluid.pressure,
        P2=fluid.pressure - drop,
        Q=fluid.volumetric_flow_rate,
        D1=valve.inlet_diameter,
        D2=valve.outlet_diameter,
        d=valve.valve_diameter,
        FL=valve.FL,
        Fd=valve.Fd,
    )
    cv_expected = convert_flow_coefficient(kv_expected, "Kv", "Cv")
    assert pytest.approx(valve.cv, rel=1e-4) == cv_expected
    assert valve.cg is None
    assert section.calculation_output.pressure_drop.control_valve_pressure_drop == drop


def test_liquid_drop_sets_cg_when_c1_present():
    fluid = liquid_fluid()
    drop = 100e3
    valve = ControlValve(
        tag="CV-1",
        cv=None,
        cg=None,
        pressure_drop=drop,
        C1=15.0,
        FL=0.9,
        Fd=0.95,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        valve_diameter=0.15,
    )
    section = make_section(valve)
    ControlValveCalculator(fluid=fluid).calculate(section)
    assert valve.cv is not None
    assert valve.cg == pytest.approx(15.0 * valve.cv)


def test_pressure_drop_from_cg_only():
    fluid = liquid_fluid()
    drop = 460e3
    base_valve = ControlValve(
        tag="base",
        cv=None,
        cg=None,
        pressure_drop=drop,
        C1=12.0,
        FL=0.9,
        Fd=0.46,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        valve_diameter=0.15,
    )
    base_section = make_section(base_valve)
    calc = ControlValveCalculator(fluid=fluid)
    calc.calculate(base_section)
    expected_cv = base_valve.cv
    expected_cg = 12.0 * expected_cv

    valve = ControlValve(
        tag="CV-cg",
        cv=None,
        cg=expected_cg,
        pressure_drop=None,
        C1=12.0,
        FL=0.9,
        Fd=0.46,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        valve_diameter=0.15,
    )
    section = make_section(valve)
    calc.calculate(section)
    assert pytest.approx(valve.pressure_drop, rel=1e-4) == drop


def test_liquid_pressure_drop_from_cv():
    fluid = liquid_fluid()
    kv = size_control_valve_l(
        rho=fluid.density,
        Psat=fluid.vapor_pressure,
        Pc=fluid.critical_pressure,
        mu=fluid.viscosity,
        P1=fluid.pressure,
        P2=fluid.pressure - 460e3,
        Q=fluid.volumetric_flow_rate,
    )
    cv = convert_flow_coefficient(kv, "Kv", "Cv")
    valve = ControlValve(tag="CV-2", cv=cv, cg=None, pressure_drop=None, C1=None)
    section = make_section(valve)
    calc = ControlValveCalculator(fluid=fluid)
    calc.calculate(section)
    assert pytest.approx(valve.pressure_drop, rel=1e-4) == 460e3


def test_gas_valve_drop_from_cv():
    fluid = gas_fluid()
    kv = size_control_valve_g(
        T=fluid.temperature,
        MW=fluid.molecular_weight,
        mu=fluid.viscosity,
        gamma=fluid.specific_heat_ratio,
        Z=fluid.z_factor,
        P1=fluid.pressure,
        P2=fluid.pressure - 120e3,
        Q=fluid.volumetric_flow_rate,
    )
    cv = convert_flow_coefficient(kv, "Kv", "Cv")
    valve = ControlValve(tag="CV-3", cv=cv, cg=None, pressure_drop=None, C1=None)
    section = make_section(valve)
    calc = ControlValveCalculator(fluid=fluid)
    calc.calculate(section)
    assert pytest.approx(valve.pressure_drop, rel=1e-4) == 120e3


def test_missing_flow_rate_raises():
    fluid = Fluid(
        name="bad",
        mass_flow_rate=None,
        volumetric_flow_rate=None,
        phase="liquid",
        temperature=300.0,
        pressure=100e3,
        density=1000.0,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=1e-3,
        standard_flow_rate=None,
        vapor_pressure=10e3,
        critical_pressure=22e6,
    )
    valve = ControlValve(tag="CV-4", cv=10.0, cg=None, pressure_drop=None, C1=None)
    section = make_section(valve)
    calc = ControlValveCalculator(fluid=fluid)
    with pytest.raises(ValueError):
        calc.calculate(section)
