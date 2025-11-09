"""Simple entry point to run the network solver for ad-hoc testing."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.io import results as result_io
from network_hydraulic.solver.network_solver import NetworkSolver


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Network Hydraulic calculations")
    parser.add_argument(
        "--config",
        type=Path,
        required=True,
        help="Path to the network configuration YAML file",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write calculation results as YAML",
    )
    parser.add_argument(
        "--default-diameter",
        type=float,
        help="Fallback pipe diameter (m) when not specified in a section",
    )
    parser.add_argument(
        "--flow-rate",
        type=float,
        help="Override volumetric flow rate (m^3/s) for calculators",
    )
    parser.add_argument(
        "--debug-fittings",
        action="store_true",
        help="Print per-fitting K contributions for each section",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    loader = ConfigurationLoader.from_yaml_path(args.config)
    network = loader.build_network()
    solver = NetworkSolver(
        default_pipe_diameter=args.default_diameter,
        volumetric_flow_rate=args.flow_rate,
    )
    try:
        result = solver.run(network)
    except Exception as exc:  # pragma: no cover - manual testing helper
        print(f"Calculation failed: {exc}")
        return

    result_io.print_summary(network, result, debug=args.debug_fittings)

    if args.output:
        result_io.write_output(args.output, network, result)


if __name__ == "__main__":
    main()
