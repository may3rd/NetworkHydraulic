"""Command-line entry point."""
from __future__ import annotations

import logging
from pathlib import Path
import sys

import typer

from network_hydraulic.io import results as results_io
from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.utils.logging_config import configure_logging

app = typer.Typer(help="Hydraulic calculation framework")
logger = logging.getLogger(__name__)


def _execute_run(
    *,
    config: Path,
    output: Path | None,
    default_diameter: float | None,
    flow_rate: float | None,
    debug_fittings: bool,
) -> None:
    configure_logging()
    logger.info("Starting network-hydraulic run for config '%s'", config)

    try:
        loader = ConfigurationLoader.from_yaml_path(config)
        network = loader.build_network()
        logger.info("Loaded network '%s' with %d section(s)", network.name, len(network.sections))

        solver = NetworkSolver(
            default_pipe_diameter=default_diameter,
            volumetric_flow_rate=flow_rate,
        )
        result = solver.run(network)
    except ValueError as exc:
        typer.secho(f"Configuration error: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc
    except NotImplementedError as exc:  # pragma: no cover - placeholder
        typer.secho(str(exc), fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc
    else:
        results_io.print_summary(network, result, debug=debug_fittings)
        if output:
            results_io.write_output(output, network, result)
    logger.info("Completed run for network '%s'", network.name)


@app.command()
def run(
    config: Path = typer.Argument(..., help="Path to the YAML/JSON network configuration."),
    output: Path | None = typer.Option(
        None,
        "--output",
        "-o",
        help="Optional path to write the calculation results (YAML unless suffix is .json).",
    ),
    default_diameter: float | None = typer.Option(
        None,
        "--default-diameter",
        "-d",
        help="Fallback pipe diameter in meters when a section omits pipe_diameter.",
    ),
    flow_rate: float | None = typer.Option(
        None,
        "--flow-rate",
        "-f",
        help="Override volumetric flow rate (m^3/s) passed to calculators.",
    ),
    debug_fittings: bool = typer.Option(
        False,
        "--debug-fittings",
        help="Print per-fitting K-factor breakdowns in the CLI summary.",
    ),
) -> None:
    """Run a network calculation from a YAML config file."""
    _execute_run(
        config=config,
        output=output,
        default_diameter=default_diameter,
        flow_rate=flow_rate,
        debug_fittings=debug_fittings,
    )


@app.callback(invoke_without_command=True)
def main_command(
    ctx: typer.Context,
    output: Path | None = typer.Option(
        None,
        "--output",
        "-o",
        help="Optional path to write the calculation results (YAML unless suffix is .json).",
    ),
    default_diameter: float | None = typer.Option(
        None,
        "--default-diameter",
        "-d",
        help="Fallback pipe diameter in meters when a section omits pipe_diameter.",
    ),
    flow_rate: float | None = typer.Option(
        None,
        "--flow-rate",
        "-f",
        help="Override volumetric flow rate (m^3/s) passed to calculators.",
    ),
    debug_fittings: bool = typer.Option(
        False,
        "--debug-fittings",
        help="Print per-fitting K-factor breakdowns in the CLI summary.",
    ),
) -> None:
    """Allow backward-compatible invocation without the 'run' subcommand."""
    if ctx.invoked_subcommand:
        return
    # If no subcommand is invoked, and no config is provided via the main app arguments
    # (which is now handled by the `run` command after `sys.argv` manipulation),
    # then print help.
    typer.echo(ctx.get_help())
    raise typer.Exit(code=0)


def main() -> None:
    # Backward compatibility: allow `network-hydraulic config.yaml` by inserting the
    # `run` subcommand when the first argument looks like a file path.
    if len(sys.argv) > 1:
        first = sys.argv[1]
        if (
            first not in { "run", "--help", "-h", "--version", "-V" }
            and not first.startswith("-")
        ):
            sys.argv.insert(1, "run")
    app()


if __name__ == "__main__":
    main()
