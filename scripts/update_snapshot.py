#!/usr/bin/env python
"""Generate solver snapshot JSON for a given network config."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.testing.snapshots import snapshot_payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate solver snapshot for a network config.")
    parser.add_argument("--config", type=Path, required=True, help="Path to network YAML config.")
    parser.add_argument("--output", type=Path, required=True, help="Path to write snapshot JSON.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    loader = ConfigurationLoader.from_yaml_path(args.config)
    network = loader.build_network()
    solver = NetworkSolver()
    result = solver.run(network)

    payload = snapshot_payload(
        network_name=network.name,
        config_path=str(args.config),
        result=result,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)


if __name__ == "__main__":
    main()
