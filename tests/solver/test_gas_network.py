from __future__ import annotations

from pathlib import Path
import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver

FIXTURE_DIR = Path(__file__).resolve().parent


def test_gas_network():
    """
    Test the real network from yaml file.
    """
    config_path = FIXTURE_DIR / "real_network.yaml"
    assert config_path.exists(
    ), f"Missing real network config at {config_path}"
