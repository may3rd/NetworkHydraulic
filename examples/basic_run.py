"""Minimal script showing how to run the network solver once implemented."""
from pathlib import Path

from network_hydraulic.io import loader
from network_hydraulic.solver import network_solver


def main() -> None:
    config_path = Path(__file__).parent.parent / "config" / "sample_network.yaml"
    config = loader.ConfigurationLoader.from_path(config_path)
    network = config.build_network()
    solver = network_solver.NetworkSolver()
    results = solver.run(network)
    print(results)


if __name__ == "__main__":
    main()
