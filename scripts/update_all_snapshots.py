#!/usr/bin/env python
"""Update every solver snapshot under tests/fixtures/expected."""
from __future__ import annotations

import json
from pathlib import Path
import sys

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.testing.snapshots import snapshot_payload


def update_snapshots(
    networks_dir: Path,
    expected_dir: Path,
    *,
    base_path: Path,
) -> None:
    solver = NetworkSolver()
    for config_path in sorted(networks_dir.glob("*.yaml")):
        loader = ConfigurationLoader.from_yaml_path(config_path)
        network = loader.build_network()
        result = solver.run(network)

        try:
            relative_config = config_path.relative_to(base_path)
        except ValueError:
            relative_config = config_path

        payload = snapshot_payload(
            network_name=network.name,
            config_path=str(relative_config),
            result=result,
        )
        output_path = expected_dir / f"{config_path.stem}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
        print(f"Updated {output_path}")


def main() -> None:
    base = Path(__file__).resolve().parent.parent
    networks_dir = base / "tests" / "fixtures" / "networks"
    expected_dir = base / "tests" / "fixtures" / "expected"

    if not networks_dir.exists():
        print(f"No networks directory at {networks_dir}", file=sys.stderr)
        raise SystemExit(1)

    update_snapshots(networks_dir=networks_dir, expected_dir=expected_dir, base_path=base)


if __name__ == "__main__":
    main()
