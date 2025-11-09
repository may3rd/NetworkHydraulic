import math

import pytest

from network_hydraulic.calculators.hydraulics import FrictionCalculator
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import PipeSection


def make_fluid(**overrides) -> Fluid:
    base = dict(
        name="water",
        mass_flow_rate=None,
        volumetric_flow_rate=0.02,
        phase="liquid",
        temperature=298.15,
        pressure=101325.0,
        density=998.2,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=1.0e-3,
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )
    base.update(overrides)
    return Fluid(**base)


def make_section(**overrides) -> PipeSection:
    base = dict(
        id="sec",
        schedule="40",
        roughness=4.6e-5,
        length=50.0,
        elevation_change=0.0,
        fitting_type="LR",
        fittings=[],
        fitting_K=None,
        pipe_length_K=None,
        user_K=None,
        piping_and_fitting_safety_factor=None,
        total_K=None,
        user_specified_fixed_loss=None,
        pipe_NPD=None,
        pipe_diameter=0.1,
        inlet_diameter=0.1,
        outlet_diameter=0.1,
        erosional_constant=None,
        mach_number=None,
        boundary_pressure=None,
        control_valve=None,
        orifice=None,
    )
    base.update(overrides)
    return PipeSection(**base)


def expected_drop(fluid: Fluid, section: PipeSection) -> float:
    area = math.pi * section.pipe_diameter * section.pipe_diameter / 4.0
    velocity = fluid.current_volumetric_flow_rate() / area
    reynolds = fluid.current_density() * velocity * section.pipe_diameter / fluid.viscosity
    from fluids.friction import friction_factor

    rel_roughness = (section.roughness or 0.0) / section.pipe_diameter
    f_val = friction_factor(Re=reynolds, eD=rel_roughness)
    pipe_k = f_val * (section.length / section.pipe_diameter)
    total_k = pipe_k + (section.fitting_K or 0.0)
    return total_k * fluid.current_density() * velocity**2 / 2.0


def test_friction_drop_matches_reference():
    fluid = make_fluid()
    section = make_section()
    calculator = FrictionCalculator(fluid=fluid)
    calculator.calculate(section)
    drop = section.calculation_output.pressure_drop.pipe_and_fittings
    assert drop == pytest.approx(expected_drop(fluid, section))


def test_custom_flow_rate_used():
    fluid = make_fluid(volumetric_flow_rate=None, mass_flow_rate=1.0)
    section = make_section()
    calc = FrictionCalculator(fluid=fluid, volumetric_flow_rate=0.01)
    calc.calculate(section)
    base_drop = section.calculation_output.pressure_drop.pipe_and_fittings
    assert base_drop > 0.0


def test_missing_diameter_raises():
    fluid = make_fluid()
    section = make_section(pipe_diameter=None)
    calc = FrictionCalculator(fluid=fluid)
    with pytest.raises(ValueError):
        calc.calculate(section)


def test_friction_includes_fitting_k():
    fluid = make_fluid()
    section = make_section()
    section.fitting_K = 5.0
    calc = FrictionCalculator(fluid=fluid)
    calc.calculate(section)
    drop = section.calculation_output.pressure_drop.pipe_and_fittings
    assert drop == pytest.approx(expected_drop(fluid, section))
