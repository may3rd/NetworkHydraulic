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
source .venv/bin/activate    # .venv\Scripts\Activate.ps1 on Windows
pip install -e .[dev]
network-hydraulic run config/sample_network.yaml --output build/result.yaml
```

## Usage

### CLI entry point
```bash
network-hydraulic run config/sample_network.yaml \
                      --output results/sample.json \
                      --default-diameter 0.15 \
                      --flow-rate 0.025 \
                      --debug-fittings
```
- Result files include each section’s `calculation_result.flow` plus matching network-level `mass_flow_rate`, `volumetric_flow_rate`, and (for gases) `standard_flow_rate` derived from solver outputs (0 °C & 1 atm for gas).

### Library
```python
from network_hydraulic import models, solver

network = models.Network.from_file("config/sample_network.yaml")
result = solver.NetworkSolver().solve(network)
print(result.summary())
```

## Configuration Hints
- Numeric fields accept either bare SI values or `{value, unit}` mappings and are normalized by the loader.
- Add optional `output_units` inside the `network` block to control how result writers/printouts are labeled (pressure vs pressure_drop, temperature, density, velocity, volumetric & mass flow). Defaults remain SI.
- Use `design_margin` (percent) on `network` or individual `sections` to document design flows; section values override the network margin when present.
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
- **Network requirements** (enforced during load):
  - Provide positive `boundary_pressure`, `boundary_temperature`, and `viscosity`.
  - Liquids must include `density`.
  - Gases/vapors must include `molecular_weight`, `z_factor`, and `specific_heat_ratio`.
  - When optional flow rates are omitted, the solver derives them from the provided properties.
- **Flow direction**:
  - Set `direction` explicitly (`forward`, `backward`, or `auto` which defaults to `forward`).
  - Per-section `boundary_pressure` overrides are still honored, enabling constrained control-valve/orifice segments even in a sequential solve.

## Documentation & References
- [User Manual](docs/user_manual.md): step-by-step instructions for installing, running, logging, and troubleshooting.
- [Configuration Reference](docs/configuration_reference.md): exhaustive list of network/section keys, fittings, and component fields.
- Sample network definition: `config/sample_network.yaml`.
- Expected results skeleton: `config/sample_results.yaml`.
- Example fittings metadata: `config/fittings_skeleton.yaml`.
- Architecture overview: `docs/architecture.md`.
- Fanno flow overview (basis for the adiabatic solver): [Flows with friction (Fanno flows)](https://kyleniemeyer.github.io/gas-dynamics-notes/compressible-flows/friction.html).

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

## Frontend Portal

The `frontend/` directory hosts the React + Vite web application described in `docs/react_app_design.md`. From the root:
```bash
cd frontend
npm install
npm run dev
```

Use `npm run build` for production bundles and `npm run preview` to inspect a built version locally. The portal mirrors the CLI flow, letting you upload configs, track execution history, and inspect pressure profiles in a Material-UI dashboard.

## Backend API

The Python package now exposes a FastAPI endpoint that the portal can call. Install the requirements and run the server locally:

```bash
pip install -e .[dev]
uvicorn network_hydraulic.api.app:app --reload --port 8000
```

Launch the frontend with `VITE_API_BASE_URL` pointing at the running API (the default is `http://localhost:8000`):

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

The backend accepts POSTs to `/api/calculate` with the uploaded YAML/JSON text, runs the solver, and returns summaries the UI already consumes.

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
*   **Gap**: Fluid properties (viscosity, and for liquids, density) are assumed constant.
*   **Addressed**: The adiabatic gas flow model now accurately accounts for temperature changes using full Fanno Flow equations.
*   **Improvement**: Introduce two-phase flow correlations. Implement a thermal model to track temperature changes and update fluid properties dynamically. Integrate with a dedicated thermodynamic property library.

### 4. Solver Flexibility
*   **Gap**: It can only solve for pressure given a fixed flow rate. A common requirement is to solve for the flow rate given fixed inlet and outlet pressures.
*   **Improvement**: Implement a new solver mode that iteratively adjusts the flow rate until the calculated outlet pressure matches the specified boundary condition. This would be a natural extension of a more advanced network solver.
