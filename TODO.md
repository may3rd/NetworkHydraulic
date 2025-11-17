# TODO

## Topology Digraph
- [x] Summarize current flat section list and direction flag; explain goal to use directed graph for topology management (nodes=section endpoints, edges=sections).
- [x] Define graph abstractions plus builder; Network now owns a topology that `ConfigurationLoader` populates.
- [x] Extend the solver traversal to respect the directed adjacency by ordering sections via the topology graph.
- [x] Add solver regression tests that prove topology ordering and backward propagation.
- [x] Update IO configuration tests and CLI logging to cover branching, direction overrides, and disconnected nodes.
- Note risks: ensure existing linear configs still work, add validation for disconnected nodes, include CLI warnings for ambiguous direction settings, document new schema fields if any.

## Control Valve / Component Loss Ordering
- [ ] Research how to reconcile component-specific losses (`control_valve`, `orifice`, `user_specified_fixed_loss`) with gas-flow solver outputs so pipe/friction losses stay accurate.
- [ ] Design an approach to split graph solving when adjustable valves are present (e.g., upstream/downstream sub-networks) and document the flow in this TODO.
- [ ] Implement reconciliation in the solver such that the highest-priority component is enforced per section and the reported `total_segment_loss` / `pipe_and_fittings` remain consistent for gas flows.
- [ ] Add tests (including nested branches) to cover cases where user-fixed loss coexists with pipeline segments or control valves.
