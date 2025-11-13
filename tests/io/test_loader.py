import json
from pathlib import Path

import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.models.pipe_section import Fitting
from network_hydraulic.utils.units import convert


def section_cfg(**overrides):
    base = {
        "id": "sec-1",
        "description": None,
        "main_ID": 0.2,
        "input_ID": 0.2,
        "output_ID": 0.2,
        "schedule": "40",
        "roughness": 1e-4,
        "length": 10.0,
        "elevation_change": 0.0,
        "fitting_type": "SCRD",
        "fittings": [],
        "pipe_diameter": 0.15,
        "inlet_diameter": 0.15,
        "outlet_diameter": 0.15,
        "control_valve": None,
        "orifice": None,
    }
    base.update(overrides)
    return base


def liquid_network_cfg(fluid_overrides=None, **network_overrides):
    fluid = {
        "name": "water",
        "phase": "liquid",
        "density": 1000.0,
        "viscosity": 1e-3,
    }
    if fluid_overrides:
        fluid.update(fluid_overrides)

    network = {
        "name": "net",
        "direction": "forward",
        "mass_flow_rate": 1.0, 
        "temperature": 300.0,
        "pressure": 101325.0,
        "fluid": fluid,
        "sections": [section_cfg()],
    }
    if network_overrides:
        network.update(network_overrides)
    return {"network": network}


def test_loader_builds_structured_fittings():
    raw_config = {
        "network": {
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            }
        }
    }
    loader = ConfigurationLoader(raw=raw_config)
    cfg = section_cfg(
        fittings=[
            {"type": "elbow_90", "count": 2},
            {"type": "tee_through", "count": 1},
        ]
    )
    section = loader._build_section(cfg)
    assert isinstance(section.fittings[0], Fitting)
    assert [(f.type, f.count) for f in section.fittings] == [
        ("elbow_90", 2),
        ("tee_through", 1),
    ]


def test_loader_auto_adds_swage_fittings():
    raw_config = {
        "network": {
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            }
        }
    }
    loader = ConfigurationLoader(raw=raw_config)
    cfg = section_cfg(
        main_ID=0.2,
        input_ID=0.25,
        output_ID=0.1,
        fittings=[],
        pipe_diameter=0.15,
        inlet_diameter=None,
        outlet_diameter=None,
    )
    section = loader._build_section(cfg)
    summary = {f.type: f.count for f in section.fittings}
    assert summary["inlet_swage"] == 1
    assert summary["outlet_swage"] == 1


def test_loader_derives_diameter_from_npd():
    raw_config = {
        "network": {
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            }
        }
    }
    loader = ConfigurationLoader(raw=raw_config)
    cfg = section_cfg(main_ID=None, pipe_NPD=6.0, schedule="40", pipe_diameter=None, inlet_diameter=None, outlet_diameter=None)
    section = loader._build_section(cfg)
    # 6" schedule 40 has an ID of 0.15408 m
    assert section.pipe_diameter == pytest.approx(0.15408, rel=1e-5)


def test_loader_converts_units_when_specified():
    loader = ConfigurationLoader(
        raw={
            "network": {
                "boundary_pressure": {"value": 50, "unit": "barg"},
                "direction": "forward",
                "mass_flow_rate": 2.0,
                "temperature": 300.0,
                "pressure": 101325.0,
                "fluid": {
                    "name": "gas",
                    "phase": "gas",
                    "density": 15.0,
                    "molecular_weight": 18.0,
                    "z_factor": 1.0,
                    "specific_heat_ratio": 1.3,
                    "viscosity": 1.1e-5,
                },
                "sections": [
                    section_cfg(
                        length={"value": 100, "unit": "ft"},
                        elevation_change={"value": 12, "unit": "ft"},
                        roughness={"value": 1.5, "unit": "mm"},
                        control_valve={"pressure_drop": {"value": 5, "unit": "psig"}},
                    )
                ],
            }
        }
    )
    network = loader.build_network()
    assert network.boundary_pressure == pytest.approx(convert(50, "barg", "Pa"))
    section = network.sections[0]
    assert section.length == pytest.approx(convert(100, "ft", "m"))
    assert section.elevation_change == pytest.approx(convert(12, "ft", "m"))
    assert section.roughness == pytest.approx(convert(1.5, "mm", "m"))
    assert section.control_valve is not None
    assert section.control_valve.pressure_drop == pytest.approx(convert(5, "psig", "Pa"))


def test_loader_rejects_unknown_network_key():
    raw = liquid_network_cfg()
    raw["network"]["unknown_key"] = 10
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="Unknown keys in network"):
        loader.build_network()


def test_loader_rejects_unknown_section_key():
    raw = liquid_network_cfg()
    raw["network"]["sections"][0]["unexpected"] = 42
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match=r"Unknown keys in section 'sec-1'"):
        loader.build_network()


def test_loader_captures_section_description():
    raw = liquid_network_cfg()
    raw["network"]["sections"][0]["description"] = "Feed line to compressor"
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    assert network.sections[0].description == "Feed line to compressor"


def test_loader_requires_section_length():
    raw = liquid_network_cfg()
    raw["network"]["sections"][0].pop("length")
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match=r"section\.length .*sec-1"):
        loader.build_network()


def test_loader_aligns_adjacent_pipe_diameters():
    upstream = section_cfg(id="s1", pipe_diameter=0.1, fittings=[])
    upstream["output_ID"] = None
    upstream.pop("outlet_diameter", None)
    downstream = section_cfg(
        id="s2",
        pipe_diameter=0.2,
        fittings=[],
    )
    downstream["input_ID"] = None
    downstream.pop("inlet_diameter", None)
    downstream["outlet_diameter"] = 0.2

    raw = {
        "network": {
            "name": "adjacent",
            "direction": "forward",
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                upstream,
                downstream,
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    first, second = network.sections

    assert first.pipe_diameter == pytest.approx(0.1)
    assert second.pipe_diameter == pytest.approx(0.2)
    assert second.inlet_diameter == pytest.approx(first.pipe_diameter)
    summary = {f.type: f.count for f in second.fittings}
    assert summary.get("inlet_swage") == 1


def test_loader_does_not_add_swage_for_near_equal_diameters():
    upstream = section_cfg(
        id="s1",
        main_ID=0.15408,
        input_ID=0.15408,
        output_ID=0.15408,
        pipe_diameter=0.15408,
        inlet_diameter=0.15408,
        outlet_diameter=0.15408,
        fittings=[],
    )
    downstream = section_cfg(
        id="s2",
        main_ID=0.1540805,
        input_ID=None,
        output_ID=None,
        pipe_diameter=0.1540805,
        inlet_diameter=None,
        outlet_diameter=0.1540805,
        fittings=[],
    )
    raw = {
        "network": {
            "name": "tolerance",
            "direction": "forward",
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                upstream,
                downstream,
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    _, second = network.sections
    assert not any(f.type == "inlet_swage" for f in second.fittings)


def test_loader_respects_user_defined_diameters_between_sections():
    raw = {
        "network": {
            "name": "adjacent",
            "direction": "forward",
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                section_cfg(
                    id="s1",
                    pipe_diameter=0.1,
                    outlet_diameter=0.2,
                    fittings=[],
                ),
                section_cfg(
                    id="s2",
                    pipe_diameter=0.2,
                    inlet_diameter=0.2,
                    fittings=[],
                ),
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    first, second = network.sections
    assert not any(f.type == "inlet_swage" for f in second.fittings)
    assert second.inlet_diameter == pytest.approx(0.2)
    assert first.outlet_diameter == pytest.approx(0.2)


def test_loader_defaults_elevation_change_to_zero_when_missing():
    raw_config = {
        "network": {
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            }
        }
    }
    loader = ConfigurationLoader(raw=raw_config)
    cfg = section_cfg()
    cfg.pop("elevation_change")
    section = loader._build_section(cfg)
    assert section.elevation_change == 0.0


def test_loader_parses_output_units_block():
    raw = {
        "network": {
            "name": "units",
            "direction": "forward",
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "output_units": {
                "pressure": "kPag",
                "pressure_drop": "kPa",
                "temperature": "degC",
            },
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                section_cfg(),
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    units = network.output_units
    assert units.pressure == "kPag"
    assert units.pressure_drop == "kPa"
    assert units.temperature == "degC"


def test_loader_normalizes_fitting_aliases():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": 300.0,
            "pressure": 101325.0,
        }
    )
    raw["network"]["sections"][0]["fittings"] = [
        {"type": "check_valve_tilting", "count": 2},
    ]
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    fitting = network.sections[0].fittings[0]
    assert fitting.type == "tilting_check_valve"
    assert fitting.count == 2


def test_loader_design_margin_honors_section_override():
    raw = {
        "network": {
            "name": "margin",
            "direction": "forward",
            "design_margin": 8.0,
            "mass_flow_rate": 1.0,
            "temperature": 300.0,
            "pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                section_cfg(id="s1", design_margin=12.0),
                section_cfg(id="s2"),
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    s1, s2 = network.sections
    assert s1.design_margin == 12.0
    assert s2.design_margin is None
    assert network.design_margin == 8.0


def test_loader_from_json_path(tmp_path: Path):
    config = {
        "network": {
            "name": "json-network",
            "direction": "forward",
            "boundary_pressure": 101325.0,
            "mass_flow_rate": 1.0, 
            "temperature": {"value": 25.0, "unit": "degC"},
            "pressure": 250000.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "density": 997.0,
                "viscosity": 1.0e-3,
            },
            "sections": [
                section_cfg(
                    length=50.0,
                    elevation_change=0.0,
                    fittings=[{"type": "elbow_90", "count": 2}],
                )
            ],
        }
    }
    json_path = tmp_path / "network.json"
    json_path.write_text(json.dumps(config), encoding="utf-8")

    loader = ConfigurationLoader.from_json_path(json_path)
    network = loader.build_network()

    assert network.name == "json-network"
    assert len(network.sections) == 1
    section = network.sections[0]
    assert section.length == 50.0
    assert section.fittings[0].type == "elbow_90"


def test_loader_raises_for_invalid_unit_string():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": {
                "value": 100.0,
                "unit": "invalid_unit",
            },
            "pressure": 101325.0,
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="Unit \\('invalid_unit',\\) doesn't exist !"):
        loader.build_network()


def test_loader_raises_for_non_numeric_quantity_string():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": "not_a_number K",
            "pressure": 101325.0,
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="network.temperature must be numeric"):
        loader.build_network()


def test_loader_raises_for_non_numeric_quantity_value_in_map():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": {
                "value": "not_a_number",
                "unit": "K",
            },
            "pressure": 101325.0,
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="network.temperature value must be numeric"):
        loader.build_network()


def test_loader_raises_for_missing_unit_in_map():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": {
                "value": 100.0,
                "unit": None,
            },
            "pressure": 101325.0,
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="Unit \\('None',\\) doesn't exist !"):
        loader.build_network()


def test_loader_raises_for_missing_required_positive_quantity():
    raw = liquid_network_cfg(
        network_overrides={
            "temperature": None,
            "pressure": 101325.0,
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="network.temperature must be provided"):
        loader.build_network()


def test_loader_raises_for_invalid_fluid_phase():
    raw = liquid_network_cfg(
        fluid_overrides={
            "phase": "solid",
        }
    )
    loader = ConfigurationLoader(raw=raw)
    with pytest.raises(ValueError, match="fluid.phase must be 'liquid', 'gas', or 'vapor'"):
        loader.build_network()
