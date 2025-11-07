import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.models.pipe_section import Fitting


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
    # 6\" schedule 40 has an ID of 0.15408 m
    assert section.main_ID == pytest.approx(0.15408, rel=1e-5)
    assert section.pipe_diameter == pytest.approx(0.15408, rel=1e-5)
