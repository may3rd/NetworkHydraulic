import pytest

from network_hydraulic.models.network import Network
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


def make_network(**overrides) -> Network:
    fluid = make_fluid()
    defaults = dict(
        name="test_network",
        description=None,
        fluid=fluid,
        direction="auto",
        boundary_pressure=None,
        upstream_pressure=None,
        downstream_pressure=None,
        gas_flow_model=None,
        sections=[],
        design_margin=None,
        mass_flow_rate=1.0,
        volumetric_flow_rate=None,
        standard_flow_rate=None,
    )
    defaults.update(overrides)
    return Network(**defaults)


def test_network_post_init_valid_inputs():
    network = make_network()
    assert network.direction == "auto"
    assert network.gas_flow_model is None
    assert network.design_margin is None


def test_network_post_init_normalizes_direction():
    network = make_network(direction="FORWARD ")
    assert network.direction == "forward"


def test_network_post_init_normalizes_gas_flow_model():
    network = make_network(gas_flow_model=" ADIABATIC")
    assert network.gas_flow_model == "adiabatic"


def test_network_post_init_raises_for_invalid_direction():
    with pytest.raises(ValueError, match="Network direction 'invalid' must be 'auto', 'forward', or 'backward'"):
        make_network(direction="invalid")


def test_network_post_init_raises_for_invalid_gas_flow_model():
    with pytest.raises(ValueError, match="Gas flow model 'unknown' must be 'isothermal' or 'adiabatic'"):
        make_network(gas_flow_model="unknown")


def test_network_defaults_gas_flow_model_for_gas_fluid():
    gas_fluid = make_fluid(phase="gas")
    network = make_network(fluid=gas_fluid, gas_flow_model=None)
    assert network.gas_flow_model == "isothermal"


def test_network_post_init_raises_for_negative_design_margin():
    with pytest.raises(ValueError, match="Network design_margin must be non-negative"):
        make_network(design_margin=-5.0)
