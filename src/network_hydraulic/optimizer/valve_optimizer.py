"""Support tuning adjustable control valves to hit downstream target pressures."""
from __future__ import annotations

from copy import deepcopy
from typing import Optional

from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.solver.network_solver import NetworkSolver


def optimize_control_valves(
    network: Network,
    *,
    tolerance: float = 10.0,
) -> Optional[float]:
    """Solve upstream and downstream subgraphs to compute the adjustable valve drop."""

    if not network.downstream_pressure:
        return None
    adjustable_sections = [
        section
        for section in network.sections
        if section.control_valve and section.control_valve.adjustable
    ]
    if not adjustable_sections:
        return None
    # For now support single adjustable valve per run.
    adjustable_section = adjustable_sections[0]
    solver = NetworkSolver()
    start_node, end_node = solver._section_node_ids(
        adjustable_section, network.topology, forward=True
    )
    upstream_sections = network.sections[: network.sections.index(adjustable_section)]
    downstream_sections = network.sections[network.sections.index(adjustable_section) + 1 :]

    upstream_pressure = _solve_subnetwork(
        network,
        upstream_sections,
        solver,
        forward=True,
        target_node=start_node,
        boundary=network.boundary_pressure,
    )
    downstream_pressure = _solve_subnetwork(
        network,
        downstream_sections,
        solver,
        forward=False,
        target_node=end_node,
        boundary=network.downstream_pressure,
    )

    if upstream_pressure is None or downstream_pressure is None:
        return None
    if downstream_pressure > upstream_pressure:
        raise ValueError(
            f"Downstream pressure {downstream_pressure:.2f} Pa exceeds upstream pressure {upstream_pressure:.2f} Pa; unable to tune adjustable valve."
        )

    if upstream_pressure is None or downstream_pressure is None:
        return None

    drop = max(upstream_pressure - downstream_pressure, 0.0)
    if drop < tolerance:
        drop = drop
    if adjustable_section.control_valve:
        adjustable_section.control_valve.pressure_drop = drop
    return abs(upstream_pressure - downstream_pressure)


def _solve_subnetwork(
    network: Network,
    sections: list[PipeSection],
    solver: NetworkSolver,
    *,
    forward: bool,
    boundary: Optional[float],
    target_node: Optional[str],
) -> Optional[float]:
    if not sections:
        return boundary
    trial = deepcopy(network)
    trial.sections = [deepcopy(section) for section in sections]
    trial.direction = "forward" if forward else "backward"
    trial.downstream_pressure = boundary if not forward else None
    trial.rebuild_topology()
    result = solver.run(trial)
    if target_node and target_node in result.node_pressures:
        return result.node_pressures[target_node]
    # fallback to section summary
    section = sections[-1] if forward else sections[0]
    summary = result.sections[-1].summary if forward else result.sections[0].summary
    return summary.outlet.pressure if forward else summary.inlet.pressure
