import pytest

from network_hydraulic.models.fluid import Fluid


def make_fluid(**overrides) -> Fluid:
    defaults = dict(
        name="test",
        phase="liquid",
        temperature=300.0,
        pressure=101325.0,
        density=1000.0,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=1e-3,
        vapor_pressure=None,
        critical_pressure=None,
    )
    defaults.update(overrides)
    return Fluid(**defaults)


def test_phase_helpers():
    fluid = make_fluid(phase="Gas")
    assert fluid.phase_key() == "gas"
    assert fluid.is_gas() is True
    assert fluid.is_liquid() is False


def test_gas_density_from_state():
    fluid = make_fluid(
        phase="gas",
        density=0.0,
        pressure=2.5e6,
        temperature=330.0,
        molecular_weight=20.0,
        z_factor=0.85,
    )
    expected = fluid.pressure * (fluid.molecular_weight / 1000.0) / (
        8.314462618 * fluid.temperature * fluid.z_factor
    )
    assert fluid.current_density() == pytest.approx(expected)


def test_gas_flow_conversions_use_gas_density():
    fluid = make_fluid(
        phase="gas",
        pressure=1.8e6,
        temperature=315.0,
        molecular_weight=18.0,
        z_factor=0.92,
    )
    assert fluid.current_density() > 0


def test_fluid_post_init_raises_for_non_positive_temperature():
    with pytest.raises(ValueError, match="fluid.temperature must be positive"):
        make_fluid(temperature=0.0)
    with pytest.raises(ValueError, match="fluid.temperature must be positive"):
        make_fluid(temperature=-10.0)


def test_fluid_post_init_raises_for_non_positive_pressure():
    with pytest.raises(ValueError, match="fluid.pressure must be positive"):
        make_fluid(pressure=0.0)
    with pytest.raises(ValueError, match="fluid.pressure must be positive"):
        make_fluid(pressure=-10.0)


def test_fluid_post_init_raises_for_non_positive_viscosity():
    with pytest.raises(ValueError, match="fluid.viscosity must be positive"):
        make_fluid(viscosity=0.0)
    with pytest.raises(ValueError, match="fluid.viscosity must be positive"):
        make_fluid(viscosity=-10.0)


def test_fluid_post_init_raises_for_liquid_missing_density():
    with pytest.raises(ValueError, match="fluid.density must be provided and positive for liquids"):
        make_fluid(phase="liquid", density=None)
    with pytest.raises(ValueError, match="fluid.density must be provided and positive for liquids"):
        make_fluid(phase="liquid", density=0.0)


def test_fluid_post_init_raises_for_gas_missing_molecular_weight():
    with pytest.raises(ValueError, match="fluid.molecular_weight must be provided and positive for gases"):
        make_fluid(phase="gas", molecular_weight=None)
    with pytest.raises(ValueError, match="fluid.molecular_weight must be provided and positive for gases"):
        make_fluid(phase="gas", molecular_weight=0.0)


def test_fluid_post_init_raises_for_gas_missing_z_factor():
    with pytest.raises(ValueError, match="fluid.z_factor must be provided and positive for gases"):
        make_fluid(phase="gas", z_factor=None)
    with pytest.raises(ValueError, match="fluid.z_factor must be provided and positive for gases"):
        make_fluid(phase="gas", z_factor=0.0)


def test_fluid_post_init_raises_for_gas_missing_specific_heat_ratio():
    with pytest.raises(ValueError, match="fluid.specific_heat_ratio must be provided and positive for gases"):
        make_fluid(phase="gas", specific_heat_ratio=None)
    with pytest.raises(ValueError, match="fluid.specific_heat_ratio must be provided and positive for gases"):
        make_fluid(phase="gas", specific_heat_ratio=0.0)


def test_fluid_post_init_raises_for_invalid_phase():
    with pytest.raises(ValueError, match="fluid.phase must be 'liquid', 'gas', or 'vapor'"):
        make_fluid(phase="solid")
