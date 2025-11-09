from network_hydraulic.calculators.elevation import ElevationCalculator
from network_hydraulic.models.pipe_section import PipeSection


def make_section(**overrides):
    base = dict(
        id="sec",
        schedule="40",
        roughness=1e-4,
        length=100.0,
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
        control_valve=None,
        orifice=None,
    )
    base.update(overrides)
    return PipeSection(**base)


def test_elevation_drop_uphill():
    section = make_section(elevation_change=10.0)
    calculator = ElevationCalculator(fluid_density=1000.0)
    calculator.calculate(section)
    assert section.calculation_output.pressure_drop.elevation_change == 98066.5
    assert section.calculation_output.pressure_drop.total_segment_loss == 98066.5


def test_elevation_gain_downhill():
    section = make_section(elevation_change=-5.0)
    calculator = ElevationCalculator(fluid_density=850.0)
    calculator.calculate(section)
    expected = -850.0 * 9.80665 * 5.0
    assert section.calculation_output.pressure_drop.elevation_change == expected
    assert section.calculation_output.pressure_drop.total_segment_loss == expected


def test_elevation_ignored_for_gas():
    section = make_section(elevation_change=50.0)
    calculator = ElevationCalculator(fluid_density=600.0, phase="gas")
    calculator.calculate(section)
    assert section.calculation_output.pressure_drop.elevation_change == 0.0
    assert section.calculation_output.pressure_drop.total_segment_loss is None


def test_invalid_density():
    try:
        ElevationCalculator(fluid_density=0.0)
    except ValueError as exc:
        assert "fluid_density" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("Expected ValueError for zero density")
