"""Standalone runner for the adjustable control valve optimizer."""
from __future__ import annotations

from pathlib import Path

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.io import results as results_io
from network_hydraulic.utils.units import converts

from network_hydraulic.optimizer import optimize_control_valves
from network_hydraulic.optimizer.advanced_valve_optimizer import advanced_optimize_control_valves

from network_hydraulic.cli.app import _execute_run

if __name__ == "__main__":
    config_path = Path("config/test_valve_network.yaml")
    loader = ConfigurationLoader.from_yaml_path(config_path)
    network = loader.build_network()
    residual = optimize_control_valves(network)
    solver = NetworkSolver()
    result = solver.run(network)
    
    # results_io.print_summary(network, result, debug=False)
    
    if residual is not None:
        print(f"Optimizer control valve pressure drop: {converts(residual, "Pa", "kPa"):.3f} kPa.")
        
    residual, iters, converged = advanced_optimize_control_valves(
        network,
        tolerance=1000.0,      # 0.01 bar acceptance
        damping_factor=0.65,
        max_iterations=25,
        verbose=True,
    )
    
    result = solver.run(network)
    # results_io.print_summary(network, result, debug=False)
    
    if residual is not None:
        print(f"Optimizer control valve pressure drop: {converts(residual, "Pa", "kPa"):.3f} kPa.")
