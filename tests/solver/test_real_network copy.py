"""
The real world pipe network problem.
"""

from __future__ import annotations

from pathlib import Path
import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver

FIXTURE_DIR = Path(__file__).resolve().parent

def test_real_network_from_yaml():
    """
    Test the real network from yaml file.
    """
    config_path = FIXTURE_DIR / "real_network.yaml"
    assert config_path.exists(), f"Missing real network config at {config_path}"

    loader = ConfigurationLoader.from_yaml_path(config_path)
    network = loader.build_network()
    volumetric_flow = network.fluid.current_volumetric_flow_rate()
    solver = NetworkSolver(volumetric_flow_rate=volumetric_flow)
    result = solver.run(network)
    assert len(result.sections) == 3
    # Section 1: id '1'
    section = next(
        section for section in result.sections if section.section_id == "1")
    assert section.calculation.pressure_drop.fitting_K == pytest.approx(
        2.98838849, rel=1e-3)
    assert section.calculation.pressure_drop.pipe_length_K == pytest.approx(
        2.852220624, rel=1e-3)
    assert section.calculation.pressure_drop.pipe_and_fittings == pytest.approx(
        2.261151819*1000, rel=1e-3)
    assert section.calculation.pressure_drop.total_segment_loss == pytest.approx(
        -179031.631040898, rel=1e-3)

    # Section 1: id '2'
    section = next(
        section for section in result.sections if section.section_id == "2")
    assert section.calculation.pressure_drop.fitting_K == pytest.approx(
        6.490860589, rel=1e-3)
    assert section.calculation.pressure_drop.pipe_length_K == pytest.approx(
        0.65534546, rel=1e-3)
    assert section.calculation.pressure_drop.pipe_and_fittings == pytest.approx(
        2.766604732*1000, rel=1e-3)
    assert section.calculation.pressure_drop.total_segment_loss == pytest.approx(
        -16.81032488*1000, rel=1e-3)

    assert result.sections, "Expected at least one section result"
    assert result.aggregate.pressure_drop.total_segment_loss is not None

