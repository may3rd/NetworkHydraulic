# TODO

## Topology Digraph
- Summarize current flat section list and direction flag; explain goal to use directed graph for topology management (nodes=section endpoints, edges=sections).
- Add steps: define graph abstractions, extend configuration loader to annotate nodes/build adjacency, adjust solver traversal (forward/backward) to follow adjacency, handle branching/loops/direction overrides, update tests (IO/solver) for new graph behavior.
- Note risks: ensure existing linear configs still work, add validation for disconnected nodes, include CLI warnings for ambiguous direction settings, document new schema fields if any.
