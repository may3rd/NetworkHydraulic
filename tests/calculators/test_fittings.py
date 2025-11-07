import math

import pytest

from network_hydraulic.calculators.fittings import INCHES_PER_METER, FittingLossCalculator
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.pipe_section import Fitting, PipeSection


def make_fluid(**overrides) -> Fluid:
    base = dict(
        name="water",
        mass_flow_rate=None,
        volumetric_flow_rate=0.08,
        phase="liquid",
        temperature=298.0,
        pressure=101325.0,
        density=998.2,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=8.9e-4,
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )
    base.update(overrides)
    return Fluid(**base)


def make_section(fittings, fitting_type="LR", **overrides) -> PipeSection:
    base = dict(
        id="sec",
        main_ID=0.15,
        input_ID=0.15,
        output_ID=0.15,
        schedule="40",
        roughness=4.6e-5,
        length=10.0,
        elevation_change=0.0,
        fitting_type=fitting_type,
        fittings=fittings,
        fitting_K=None,
        pipe_length_K=None,
        user_K=None,
        piping_and_fitting_safety_factor=None,
        total_K=None,
        user_specified_fixed_loss=None,
        pipe_diameter=0.15,
        inlet_diameter=0.18,
        outlet_diameter=0.2,
        control_valve=None,
        orifice=None,
    )
    base.update(overrides)
    return PipeSection(**base)


def reynolds(fluid: Fluid, diameter: float) -> float:
    q = fluid.current_volumetric_flow_rate()
    area = 0.25 * math.pi * diameter * diameter
    velocity = q / area
    return fluid.current_density() * velocity * diameter / fluid.viscosity


def two_k(k1: float, kinf: float, re: float, diameter: float) -> float:
    d_in = diameter * INCHES_PER_METER
    return k1 / re + kinf * (1.0 + 1.0 / d_in)


def test_standard_fitting_k_sum():
    fluid = make_fluid()
    fittings = [Fitting("elbow_90", 2), Fitting("tee_through", 1)]
    section = make_section(fittings)
    calculator = FittingLossCalculator(fluid=fluid)
    calculator.calculate(section)

    re = reynolds(fluid, section.pipe_diameter)
    expected = 2 * two_k(800.0, 0.2, re, section.pipe_diameter)
    expected += two_k(150.0, 0.05, re, section.pipe_diameter)
    assert section.fitting_K == pytest.approx(expected, rel=1e-6)


def test_swage_contributions_positive():
    fluid = make_fluid(volumetric_flow_rate=0.05)
    fittings = [Fitting("inlet_swage", 1), Fitting("outlet_swage", 1)]
    section = make_section(fittings)
    calculator = FittingLossCalculator(fluid=fluid)
    calculator.calculate(section)
    assert section.fitting_K > 0.0


def test_missing_pipe_diameter_raises():
    fluid = make_fluid()
    fittings = [Fitting("elbow_90", 1)]
    section = make_section(fittings, pipe_diameter=None)
    calculator = FittingLossCalculator(fluid=fluid)
    with pytest.raises(ValueError):
        calculator.calculate(section)
