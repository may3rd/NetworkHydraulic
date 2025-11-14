from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple

import pytest

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.testing.snapshots import snapshot_payload

FIXTURE_ROOT = Path(__file__).resolve().parents[1] / "fixtures"
NETWORKS_DIR = FIXTURE_ROOT / "networks"
EXPECTED_DIR = FIXTURE_ROOT / "expected"


def _fixture_pairs() -> List[Tuple[Path, Path]]:
    pairs: List[Tuple[Path, Path]] = []
    for config in sorted(NETWORKS_DIR.glob("*.yaml")):
        expected = EXPECTED_DIR / f"{config.stem}.json"
        if not expected.exists():
            raise FileNotFoundError(f"Missing snapshot for fixture {config}")
        pairs.append((config, expected))
    return pairs


@pytest.mark.parametrize("config_path, expected_path", _fixture_pairs())
def test_solver_matches_snapshots(config_path: Path, expected_path: Path) -> None:
    loader = ConfigurationLoader.from_yaml_path(config_path)
    network = loader.build_network()
    solver = NetworkSolver()
    result = solver.run(network)
    actual = snapshot_payload(
        network_name=network.name,
        config_path=str(config_path.relative_to(Path.cwd())),
        result=result,
    )

    with expected_path.open("r", encoding="utf-8") as handle:
        expected = json.load(handle)

    assert actual == expected

