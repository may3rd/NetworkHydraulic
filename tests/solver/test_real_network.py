"""
The real world pipe network problem.
"""

from __future__ import annotations

from math import pi

import pytest

from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.utils.pipe_dimensions import inner_diameter_from_nps
from network_hydraulic.utils.units import convert

MM_TO_M = 0.001
KPA_TO_PA = 1000.0
CP_TO_PA_S = 1e-3
ROUGHNESS_MM = 0.0457
EROSIONAL_CONSTANT = 100.0

REAL_SEGMENT_DATA = [
    {
        "id": "1",
        "description": "V-2101 to branch",
        "nominal_diameter_in": 8.0,
        "schedule": "40",
        "length_m": 37.599,
        "elevation_change_m": -23.59,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [
            {"type": "pipe_entrance_normal", "count": 1},
            {"type": "elbow_90", "count": 9},
            {"type": "tee_elbow", "count": 1},
            {"type": "pipe_exit", "count": 1},
        ],
    },
    {
        "id": "2",
        "description": "branch to suction",
        "nominal_diameter_in": 8.0,
        "schedule": "40",
        "length_m": 8.639,
        "elevation_change_m": -3.208,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [
            {"type": "elbow_90", "count": 3},
            {"type": "tee_elbow", "count": 1},
            {"type": "block_valve_full_line_size", "count": 1},
            {"type": "pipe_exit", "count": 1},
        ],
        "user_fixed_loss_kpa": 5.08,
        "output_dn_mm": 102.26,
    },
    {
        "id": "41",
        "description": "suction",
        "nominal_diameter_in": 4.0,
        "schedule": "40",
        "length_m": 0.708,
        "elevation_change_m": -0.712,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
    },
    {
        "id": "41-42",
        "description": "P-2104",
        "nominal_diameter_in": 4.0,
        "schedule": "40",
        "length_m": 0.0,
        "elevation_change_m": -258.4636509,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
    },
    {
        "id": "42",
        "description": "discharge",
        "nominal_diameter_in": 3.0,
        "schedule": "40",
        "length_m": 0.219,
        "elevation_change_m": 0.219,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
    },
    {
        "id": "3",
        "description": "discharge to branch circulate",
        "nominal_diameter_in": 6.0,
        "schedule": "40",
        "length_m": 21.294,
        "elevation_change_m": 3.975,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
        "user_fixed_loss_kpa": 15.30,
    },
    {
        "id": "4",
        "description": "branch circulate to branch D-4104",
        "nominal_diameter_in": 6.0,
        "schedule": "40",
        "length_m": 0.746,
        "elevation_change_m": 0.0,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
    },
    {
        "id": "5",
        "description": "branch D-4104 to branch E-2102",
        "nominal_diameter_in": 6.0,
        "schedule": "40",
        "length_m": 25.97,
        "elevation_change_m": -1.0,
        "erosional_constant": 100.0,
        "fitting_type": "LR",
        "fittings": [],
    },
]


def _diameter_override(segment: dict, prefix: str) -> float | None:
    mm_value = segment.get(f"{prefix}_dn_mm")
    if mm_value is not None:
        return mm_value * MM_TO_M
    nominal_in = segment.get(f"{prefix}_nominal_in")
    if nominal_in is not None:
        return inner_diameter_from_nps(nominal_in, segment["schedule"])
    return None


def _user_fixed_loss(segment: dict) -> float | None:
    if segment.get("user_fixed_loss_kpa") is None:
        return None
    return segment["user_fixed_loss_kpa"] * KPA_TO_PA


def _fittings(segment: dict) -> list[Fitting]:
    fittings: list[Fitting] = []
    for entry in segment.get("fittings", []):
        count = entry.get("count", 1)
        fittings.append(Fitting(type=entry["type"], count=int(count)))
    return fittings


def make_real_fluid() -> Fluid:
    """Build the field fluid definition from the engineering table."""

    temperature_k = 103.42 + 273.15
    mass_flow_rate = convert(90513.6, "kg/h", "kg/s")
    volumetric_flow_rate = convert(115.54, "m^3/h", "m^3/s")

    return Fluid(
        name="process-liquid",
        mass_flow_rate=mass_flow_rate,
        volumetric_flow_rate=volumetric_flow_rate,
        phase="liquid",
        temperature=temperature_k,
        pressure=convert(101.008, "kPag", "Pa"),
        density=783.4,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=0.247 * CP_TO_PA_S,
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )


def make_real_sections() -> list[PipeSection]:
    """Translate the field segment table into PipeSection objects."""

    sections: list[PipeSection] = []
    roughness_m = ROUGHNESS_MM * MM_TO_M
    for segment in REAL_SEGMENT_DATA:
        main_diameter = inner_diameter_from_nps(segment["nominal_diameter_in"], segment["schedule"])
        inlet_diameter = _diameter_override(segment, "input") or main_diameter
        outlet_diameter = _diameter_override(segment, "output") or main_diameter
        sections.append(
            PipeSection(
                id=segment["id"],
                schedule=segment["schedule"],
                roughness=roughness_m,
                length=segment["length_m"],
                elevation_change=segment["elevation_change_m"],
                fitting_type=segment.get("fitting_type", "LR"),
                fittings=_fittings(segment),
                fitting_K=None,
                pipe_length_K=None,
                user_K=None,
                piping_and_fitting_safety_factor=None,
                total_K=None,
                user_specified_fixed_loss=_user_fixed_loss(segment),
                pipe_NPD=segment["nominal_diameter_in"],
                pipe_diameter=main_diameter,
                inlet_diameter=inlet_diameter,
                outlet_diameter=outlet_diameter,
                erosional_constant=segment.get("erosional_constant", EROSIONAL_CONSTANT),
                mach_number=None,
                boundary_pressure=None,
                control_valve=None,
                orifice=None,
            )
        )
    return sections


def test_network_solver_handles_real_field_network():
    """
    Build the eight-segment field network and verify the solver preserves K-value definitions
    and aggregates pressure losses consistently.
    """

    fluid = make_real_fluid()
    sections = make_real_sections()
    network = Network(
        name="real-network",
        description="Field data derived from V-2101 / P-2104 loop",
        fluid=fluid,
        direction="forward",
        boundary_pressure=convert(101.008, "kPag", "Pa"),
        gas_flow_model="adiabatic",
        sections=sections,
    )
    solver = NetworkSolver(volumetric_flow_rate=fluid.volumetric_flow_rate)
    result = solver.run(network)

    assert len(result.sections) == len(REAL_SEGMENT_DATA)

    density = fluid.current_density()
    volumetric_flow = fluid.current_volumetric_flow_rate()

    for section in sections:
        drop = section.calculation_output.pressure_drop
        assert section.pipe_diameter is not None

        cross_section = 0.25 * pi * section.pipe_diameter**2
        assert cross_section > 0
        velocity = volumetric_flow / cross_section
        total_k = (section.fitting_K or 0.0) + (section.pipe_length_K or 0.0)
        expected_pipe_drop = 0.5 * density * velocity * velocity * total_k

        assert drop.pipe_and_fittings == pytest.approx(expected_pipe_drop, rel=0.05)

        component_sum = (
            (drop.pipe_and_fittings or 0.0)
            + (drop.elevation_change or 0.0)
            + (drop.control_valve_pressure_drop or 0.0)
            + (drop.orifice_pressure_drop or 0.0)
            + (drop.user_specified_fixed_loss or 0.0)
        )
        assert drop.total_segment_loss == pytest.approx(component_sum, rel=1e-6)

    total_loss_from_sections = sum(
        section.calculation_output.pressure_drop.total_segment_loss or 0.0 for section in sections
    )
    aggregate_total = result.aggregate.pressure_drop.total_segment_loss or 0.0
    assert aggregate_total == pytest.approx(total_loss_from_sections)

    dramatic_section = next(section for section in sections if section.id == "41-42")
    elevation_drop = dramatic_section.calculation_output.pressure_drop.elevation_change
    assert elevation_drop is not None and elevation_drop < 0.0
