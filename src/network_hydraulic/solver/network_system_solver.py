"""Solver that orchestrates multiple interconnected networks."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict

from network_hydraulic.models.network_system import (
    NetworkBundle,
    NetworkResultBundle,
    NetworkSystem,
    NetworkSystemResult,
    SharedNodeGroup,
)
from network_hydraulic.solver.network_solver import NetworkSolver

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class NetworkSystemSolver:
    """Iteratively runs NetworkSolver over each bundle while syncing shared nodes."""

    network_solver: NetworkSolver = field(default_factory=NetworkSolver)
    max_iterations: int = 4
    tolerance: float = 1.0  # Pascals

    def run(self, system: NetworkSystem) -> NetworkSystemResult:
        shared_nodes = system.shared_nodes
        all_global_ids = list(shared_nodes.keys())
        canonical_pressures: Dict[str, float] = {}
        latest_results: Dict[str, NetworkResultBundle] = {}

        for iteration in range(self.max_iterations):
            new_pressures: Dict[str, float] = {}
            for bundle in system.bundles:
                overrides = self._build_overrides(bundle, canonical_pressures, shared_nodes)
                network_result = self.network_solver.run(
                    bundle.network,
                    node_pressure_overrides=overrides,
                )
                latest_results[bundle.id] = NetworkResultBundle(
                    bundle_id=bundle.id,
                    network=bundle.network,
                    result=network_result,
                )
                self._record_leader_pressures(
                    bundle,
                    network_result.node_pressures,
                    shared_nodes,
                    new_pressures,
                )
            for global_id in all_global_ids:
                if global_id not in new_pressures and global_id in canonical_pressures:
                    new_pressures[global_id] = canonical_pressures[global_id]

            if canonical_pressures and self._has_converged(canonical_pressures, new_pressures):
                canonical_pressures = new_pressures
                break
            canonical_pressures = new_pressures
        else:
            logger.warning(
                "Network system solver reached max iterations (%d) without convergence",
                self.max_iterations,
            )

        ordered_results = [
            latest_results[bundle.id]
            for bundle in system.bundles
            if bundle.id in latest_results
        ]
        return NetworkSystemResult(
            bundles=ordered_results,
            shared_node_pressures=canonical_pressures,
        )

    def _build_overrides(
        self,
        bundle: NetworkBundle,
        canonical_pressures: Dict[str, float],
        shared_nodes: Dict[str, SharedNodeGroup],
    ) -> Dict[str, float]:
        overrides: Dict[str, float] = {}
        for local_node, global_node in bundle.node_mapping.items():
            group = shared_nodes.get(global_node)
            if group is None or len(group.members) < 2:
                continue
            leader = group.members[0]
            if leader.network_id == bundle.id and leader.node_id == local_node:
                continue
            canonical_value = canonical_pressures.get(global_node)
            if canonical_value is None:
                continue
            overrides[local_node] = canonical_value + (group.pressure_bias or 0.0)
        return overrides

    @staticmethod
    def _record_leader_pressures(
        bundle: NetworkBundle,
        node_pressures: Dict[str, float],
        shared_nodes: Dict[str, SharedNodeGroup],
        accumulator: Dict[str, float],
    ) -> None:
        for local_node, global_node in bundle.node_mapping.items():
            group = shared_nodes.get(global_node)
            if group is None:
                continue
            leader = group.members[0]
            if leader.network_id != bundle.id or leader.node_id != local_node:
                continue
            pressure = node_pressures.get(local_node)
            if pressure is None:
                continue
            accumulator[global_node] = pressure

    def _has_converged(
        self,
        previous: Dict[str, float],
        current: Dict[str, float],
    ) -> bool:
        keys = set(previous.keys()) | set(current.keys())
        for key in keys:
            prev = previous.get(key)
            new = current.get(key)
            if prev is None or new is None:
                return False
            if abs(prev - new) > self.tolerance:
                return False
        return True
