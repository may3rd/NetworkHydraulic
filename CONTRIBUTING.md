# Contributing

Thanks for helping improve Network Hydraulic!

## Development Basics

1. Create a virtualenv and install dependencies in editable mode:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .[dev]
   ```
2. Keep code formatted and linted by running `ruff`, `mypy`, and the relevant `pytest` suites before sending PRs.

## Verification Workflow

End-to-end solver behaviour is guarded by regression fixtures. Before opening a PR:

1. Run the snapshot suite:
   ```bash
   pytest tests/solver/test_snapshots.py
   ```
2. If your change intentionally affects solver results, regenerate the impacted snapshots using `scripts/update_snapshot.py` (see detailed instructions in [docs/verification.md](docs/verification.md)).
3. Include the updated fixture JSONs in your commit so reviewers can inspect the differences.

For more details—how fixtures are structured, how the snapshot serializer works, and where to put new configs—refer to [docs/verification.md](docs/verification.md).

