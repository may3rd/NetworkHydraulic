# TODO

## Topology Digraph
- [x] Summarize current flat section list and direction flag; explain goal to use directed graph for topology management (nodes=section endpoints, edges=sections).
- [x] Define graph abstractions plus builder; Network now owns a topology that `ConfigurationLoader` populates.
- [x] Extend the solver traversal to respect the directed adjacency by ordering sections via the topology graph.
- [x] Add solver regression tests that prove topology ordering and backward propagation.
- [x] Update IO configuration tests and CLI logging to cover branching, direction overrides, and disconnected nodes.
- Note risks: ensure existing linear configs still work, add validation for disconnected nodes, include CLI warnings for ambiguous direction settings, document new schema fields if any.
