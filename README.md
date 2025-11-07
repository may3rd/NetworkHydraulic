# Network Hydraulic Framework

Skeleton Python project for computing pressure losses across complex pipe networks. The intent is to keep models, calculators, and IO layers separated so simulations are reusable and easy to extend.

## Features in Scope
- Dataclasses for fluids, pipe sections, optional control valves and orifices
- Calculation output and result summary containers for per-section and network totals
- Calculator package with placeholders for friction, elevation, valve, and orifice losses
- Config-driven workflows via loaders and a CLI entry point
- Documentation, examples, and tests scaffolds
- Unit conversion helpers and common pipe-dimension tables for quick prototyping

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

## Usage

### CLI entry point
```bash
network-hydraulic --config config/sample_network.yaml \
                  --output results/sample.json
```
- Result files include each section’s `calculation_result.flow` plus matching network-level `fluid.volumetric_flow_rate` and `fluid.standard_flow_rate` derived from solver outputs (0 °C & 1 atm for gas).

### Library
```python
from network_hydraulic import models, solver

network = models.Network.from_file("config/sample_network.yaml")
result = solver.NetworkSolver().solve(network)
print(result.summary())
```

## Configuration Hints
- Numeric fields accept either bare SI values or `{value, unit}` mappings and are normalized by the loader.
- Example:
  ```yaml
  boundary_pressure:
    value: 85
    unit: barg
  sections:
    - length:
        value: 400
        unit: ft
  ```
- Gauge units (e.g., `barg`, `psig`) and temperature aliases (`degC`, `degF`) are resolved automatically.

## Development

1. Install dev extras: `pip install -e .[dev]`
2. Run linting and type checks (optional):
   ```bash
   ruff check src tests
   mypy src
   ```
3. Execute tests: `pytest`

Common caches and virtual environments are ignored via `.gitignore`. If you added tracked artifacts before creating the file, run:
```bash
git ls-files -ci --exclude-from=.gitignore -z | xargs -0 git rm --cached
```

## Next Steps
1. Validate and extend hydraulic calculators with additional loss models.
2. Flesh out config schema validation (Pydantic/dataclasses JSON).
3. Add end-to-end tests with representative networks and fluids.
4. Benchmark solver performance with synthetic and real networks.
