# Network Hydraulic Framework

Skeleton Python project for computing pressure losses across complex pipe networks. The intent is to keep models, calculators, and IO layers separated so simulations are reusable and easy to extend.

## Features in Scope
- Dataclasses for fluids, pipe sections, optional control valves and orifices
- Calculation output and result summary containers for per-section and network totals
- Calculator package with placeholders for friction, elevation, valve, and orifice losses
- Config-driven workflows via loaders and a CLI entry point
- Documentation, examples, and tests scaffolds

## Repo Layout
- `src/network_hydraulic/` core library (models, calculators, IO, CLI utilities)
- `config/` sample configuration files for networks
- `examples/` scripts or notebooks showing usage
- `docs/` architecture notes, formulas, API references
- `tests/` pytest-based skeleton covering key components

## Getting Started
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
network-hydraulic --config config/sample_network.yaml
```

## Next Steps
1. Implement actual hydraulic equations in calculator modules.
2. Flesh out config schema validation (Pydantic/dataclasses JSON).
3. Add end-to-end tests with representative networks and fluids.
