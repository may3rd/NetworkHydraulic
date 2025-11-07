"""Command-line entry point."""
from __future__ import annotations

from pathlib import Path

import typer

from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver

app = typer.Typer(help="Hydraulic calculation framework")


@app.command()
def run(config: Path) -> None:
    """Run a network calculation from a YAML config file."""
    loader = ConfigurationLoader.from_path(config)
    network = loader.build_network()
    solver = NetworkSolver()
    try:
        solver.run(network)
    except NotImplementedError as exc:  # pragma: no cover - placeholder
        typer.secho(str(exc), fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc


def main() -> None:
    app()


if __name__ == "__main__":
    main()
