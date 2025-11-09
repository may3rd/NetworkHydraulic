import json
from pathlib import Path

import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.models.pipe_section import Fitting
from network_hydraulic.utils.units import convert


def section_cfg(**overrides):
    base = {
        "id": "sec-1",
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


def test_loader_builds_structured_fittings():
    loader = ConfigurationLoader(raw={})
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
    loader = ConfigurationLoader(raw={})
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
    loader = ConfigurationLoader(raw={})
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
                "fluid": {
                    "name": "gas",
                    "phase": "gas",
                    "mass_flow_rate": 2.0,
                    "temperature": 300.0,
                    "pressure": 101325.0,
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


def test_loader_aligns_adjacent_pipe_diameters():
    raw = {
        "network": {
            "name": "adjacent",
            "direction": "forward",
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "temperature": 300.0,
                "pressure": 101325.0,
                "density": 1000.0,
                "viscosity": 1e-3,
            },
            "sections": [
                section_cfg(id="s1", pipe_diameter=0.1, inlet_diameter=0.1, outlet_diameter=0.1),
                section_cfg(
                    id="s2",
                    pipe_diameter=0.2,
                    inlet_diameter=None,
                    outlet_diameter=0.2,
                    fittings=[],
                ),
            ],
        }
    }
    loader = ConfigurationLoader(raw=raw)
    network = loader.build_network()
    first, second = network.sections

    assert first.pipe_diameter == pytest.approx(0.1)
    assert second.pipe_diameter == pytest.approx(0.2)
    assert second.inlet_diameter == pytest.approx(first.pipe_diameter)
    assert first.inlet_diameter == pytest.approx(0.1)
    summary = {f.type: f.count for f in second.fittings}
    assert summary.get("inlet_swage") == 1


def test_loader_from_json_path(tmp_path: Path):
    config = {
        "network": {
            "name": "json-network",
            "direction": "forward",
            "boundary_pressure": 101325.0,
            "fluid": {
                "name": "water",
                "phase": "liquid",
                "temperature": {"value": 25.0, "unit": "degC"},
                "pressure": 250000.0,
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
