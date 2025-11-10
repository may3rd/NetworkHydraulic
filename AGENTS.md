# Network Hydraulic – Agent Guide

Cheat sheet for coding agents who need quick context about the hydraulic solver project.

## Project Snapshot
- **Goal**: Read YAML network configs, build strongly typed models, run sequential loss calculators, and emit per-section + aggregate results.
- **Runtime**: Python 3.10+, packaging via `setuptools`; CLI exposed as `network-hydraulic`.
- **Core dependencies**: `pydantic`, `typer`, `ruamel.yaml`, `fluids`. Dev extras include `pytest`, `ruff`, `mypy`.
- **Style defaults**: Ruff line length 100, strict mypy, dataclasses with `slots=True`, prefer explicit type hints.

## Repository Map
| Path | Purpose |
| --- | --- |
| `src/network_hydraulic/models/` | Dataclasses for fluids, pipe sections, fittings, valves, results, and networks. |
| `src/network_hydraulic/calculators/` | Loss calculators (friction, fittings, elevation, valves, orifices) plus normalization helpers. |
| `src/network_hydraulic/solver/` | `NetworkSolver` orchestrates calculator execution, pressure profile propagation, and summaries. |
| `src/network_hydraulic/io/loader.py` | Parses YAML configs, performs unit normalization, builds model graph. |
| `src/network_hydraulic/utils/` | Unit conversion helpers, pipe dimension tables, gas-flow constants. |
| `src/network_hydraulic/cli/app.py` | Typer-based CLI (`network-hydraulic run --config …`). |
| `config/` | Sample configs and expected outputs (`sample_network.yaml`, fittings reference). |
| `examples/`, `docs/` | Usage demos and architecture notes. |
| `tests/` | Pytest suites for calculators, IO, models, solver integration. |
| `src/unit_converter/` | Vendored third-party package kept for future integration (rarely edited). |

## Domain & Data Model Notes
- **Units**: Configuration loader accepts either bare SI numbers or `{value, unit}` dicts. See `ConfigurationLoader._quantity` for supported units; values normalize to SI for internal storage. Include units in new config fields to avoid ambiguity.
- **Sections**: `PipeSection` requires explicit IDs, diameters, roughness, and length. Loader auto-adds inlet/outlet swage fittings when diameters differ by more than `SWAGE_TOLERANCE`.
- **Fittings**: Allowed types enumerated in `models/pipe_section.py`. Validations run in dataclass `__post_init__`. Reuse these definitions rather than duplicating strings.
- **Calculators**: Each module mutates `PipeSection.calculation_output`. Implement new loss models by conforming to `LossCalculator` protocol in `calculators/base.py` and append them in `NetworkSolver._build_calculators`.
- **Solver flow**: `NetworkSolver.run()` resets section state, runs calculators in order, applies directional pressure profile (forward/backward), then backfills network summaries and volumetric/mass flow data. Respect `_apply_pressure_profile` semantics when changing boundary conditions.
- **IO**: `ConfigurationLoader.from_yaml_path()` is the single entry for YAML ingestion. Keep new schema fields additive and ensure they propagate through loader -> models -> calculators to maintain CLI compatibility.
- **Output units**: `network.output_units` is optional in configs; when provided it sets the units used by result writers/printouts (pressure vs pressure_drop, temperature, density, velocity, volumetric & mass flow). Defaults remain SI.
- **Design margins**: `design_margin` (percent) can be set at the network level and overridden per section; the CLI summary reports design-adjusted mass/volumetric flow rates using `(1 + margin/100)`.
- **Two-phase roadmap** *(planned)*: upcoming work will add a two-phase flow path driven by `fluids.two_phase.two_phase_dP`. Expect new config fields for liquid/vapor properties, mass quality, and a section-level switch. Calculators/solver will branch to the two-phase solver, fittings K aggregation will be revisited, and tests/docs will follow once the current gas-network validation finishes.
- **Network direction**: Leave `direction` as `"auto"` when possible so upstream/downstream pressures can determine flow direction. Use `upstream_pressure` / `downstream_pressure` in configs when you need boundary-driven runs.

## Development Workflow
1. **Environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .[dev]
   ```
2. **Run the CLI**
   ```bash
   network-hydraulic run --config config/sample_network.yaml
   ```
   The CLI stops on `NotImplementedError` placeholders; use this to validate plumbing while calculators are incomplete.
3. **Testing & Quality**
   - Unit tests: `pytest`
   - Lint: `ruff check src tests`
   - Types: `mypy src`
   - Optional: run targeted tests (e.g., `pytest tests/solver/test_network_solver.py::test_solver_propagates_boundary`).
4. **Fixtures & Paths**: `tests/conftest.py` prepends `src/` to `PYTHONPATH`; reference modules directly (e.g., `from network_hydraulic.solver import …`) without extra path hacks.

## Coding Standards & Tips
- Prefer dataclasses (often `slots=True`) for all model/data containers; mutation happens through dedicated helpers.
- Keep functions pure where possible; calculators should only mutate the provided section output.
- Guard against `None` for user-supplied optional quantities; follow `_safe_add/_safe_subtract` patterns in the solver.
- Leverage utility helpers:
  - `units.convert()` for unit math.
  - `pipe_dimensions.inner_diameter_from_nps()` to translate NPS + schedule into meters.
  - `gas_flow.UNIVERSAL_GAS_CONSTANT` and related functions for state computations.
- When augmenting configuration schema, mirror new keys inside `ConfigurationLoader` and corresponding dataclasses, then extend tests under `tests/io/`.
- Keep logging/output minimal; CLI relies on Typer’s default messaging. Prefer returning data structures and let IO layers handle formatting.

## Helpful References
- Architecture overview: `docs/architecture.md`.
- Sample network definition: `config/sample_network.yaml`.
- Expected result skeleton: `config/sample_results.yaml`.
- Example fittings metadata: `config/fittings_skeleton.yaml`.

Use this guide as the first stop before diving into the codebase; extend it whenever new tooling, workflows, or patterns are introduced.
