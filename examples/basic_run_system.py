"""Example script showing how to run the system solver across multiple networks."""
from pathlib import Path

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.io import results as results_io
from network_hydraulic.solver.network_system_solver import NetworkSystemSolver


def main() -> None:
    config_path = Path(__file__).parent.parent / "config" / "gas_network.yaml"
    loader = ConfigurationLoader.from_yaml_path(config_path)
    system = loader.build_network_system()

    solver_settings = system.solver_settings
    solver_kwargs = {}
    if solver_settings.max_iterations is not None:
        solver_kwargs["max_iterations"] = solver_settings.max_iterations
    if solver_settings.tolerance is not None:
        solver_kwargs["tolerance"] = solver_settings.tolerance
    if solver_settings.relaxation is not None:
        solver_kwargs["relaxation"] = solver_settings.relaxation

    solver = NetworkSystemSolver(**solver_kwargs)
    result = solver.run(system)
    results_io.print_system_summary(system, result, debug=False)

    output_path = Path(__file__).parent / "output_system.yaml"
    results_io.write_system_output(output_path, result)


if __name__ == "__main__":
    main()
