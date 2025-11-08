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

## Gaps and Potential Improvements

### 1. Network Topology (Most Significant Gap)
*   **Current Limitation**: The solver currently only handles linear, sequential pipelines (a simple list of `PipeSection` objects). It cannot model real-world networks with branches (tees) or loops.
*   **Improvement**: Evolve the `Network` model into a graph-based structure (e.g., using `networkx`). This would enable the implementation of a true network solver (e.g., using the Hardy Cross method or a simultaneous equation approach) to balance flows and pressures across a complex system.

### 2. Component Library
*   **Gap**: No support for components that add energy, such as **pumps** or **compressors**.
*   **Gap**: Control valve and orifice models are passive (calculating drop for a given flow) and do not simulate active control (e.g., a valve maintaining a set downstream pressure).
*   **Improvement**: Introduce new calculator and model classes for pumps and compressors. Enhance valve models to support iterative solutions for achieving setpoint conditions.

### 3. Fluid & Thermal Modeling
*   **Gap**: The solver is strictly **single-phase**. It cannot handle two-phase flow (gas/liquid, slurries).
*   **Gap**: Fluid properties (viscosity, and for liquids, density) are assumed constant. No heat transfer model is present to account for temperature changes.
*   **Improvement**: Introduce two-phase flow correlations. Implement a thermal model to track temperature changes and update fluid properties dynamically. Integrate with a dedicated thermodynamic property library.

### 4. Solver Flexibility
*   **Gap**: It can only solve for pressure given a fixed flow rate. A common requirement is to solve for the flow rate given fixed inlet and outlet pressures.
*   **Improvement**: Implement a new solver mode that iteratively adjusts the flow rate until the calculated outlet pressure matches the specified boundary condition. This would be a natural extension of a more advanced network solver.