from pathlib import Path

import pytest
import yaml

from network_hydraulic.io import results as results_io
from network_hydraulic.models.fluid import Fluid, GAS_CONSTANT
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import PipeSection
from network_hydraulic.models.results import (
    CalculationOutput,
    NetworkResult,
    PressureDropDetails,
    ResultSummary,
    SectionResult,
    StatePoint,
)


def build_section(section_id: str = "sec-1") -> PipeSection:
    return PipeSection(
        id=section_id,
        main_ID=0.1,
        input_ID=0.1,
        output_ID=0.1,
        schedule="40",
        roughness=1e-4,
        length=5.0,
        elevation_change=0.0,
        fitting_type="SCRD",
        fittings=[],
        fitting_K=None,
        pipe_length_K=None,
        user_K=None,
        piping_and_fitting_safety_factor=None,
        total_K=None,
        user_specified_fixed_loss=None,
        pipe_NPD=4.0,
        pipe_diameter=0.1,
        inlet_diameter=0.1,
        outlet_diameter=0.1,
        erosional_constant=None,
        mach_number=None,
        control_valve=None,
        orifice=None,
    )


def build_fluid() -> Fluid:
    return Fluid(
        name="gas",
        mass_flow_rate=2.0,
        volumetric_flow_rate=None,
        phase="gas",
        temperature=300.0,
        pressure=150000.0,
        density=5.0,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.3,
        viscosity=1.0e-5,
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )


def make_summary(density: float) -> ResultSummary:
    inlet_state = StatePoint(pressure=2e5, temperature=300.0, density=density)
    outlet_state = StatePoint(pressure=1.9e5, temperature=300.0, density=density)
    return ResultSummary(inlet=inlet_state, outlet=outlet_state)


def make_results(summary: ResultSummary) -> SectionResult:
    calc = CalculationOutput(pressure_drop=PressureDropDetails())
    return SectionResult(section_id="sec-1", calculation=calc, summary=summary)


def test_write_output_includes_flow_rates(tmp_path: Path):
    section = build_section()
    fluid = build_fluid()
    network = Network(
        name="demo",
        description=None,
        fluid=fluid,
        direction="forward",
        boundary_pressure=150000.0,
        gas_flow_model="isothermal",
        sections=[section],
    )
    summary = make_summary(density=4.0)
    section_result = make_results(summary)
    network_result = NetworkResult(sections=[section_result], aggregate=CalculationOutput(), summary=summary)

    out_path = tmp_path / "result.yaml"
    results_io.write_output(out_path, network, network_result)

    with out_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)

    flow_summary = data["network"]["summary"]["flow"]
    actual_expected = fluid.mass_flow_rate / summary.inlet.density
    mw = fluid.molecular_weight / 1000.0
    std_density = results_io.STANDARD_PRESSURE * mw / (GAS_CONSTANT * results_io.STANDARD_TEMPERATURE)
    standard_expected = fluid.mass_flow_rate / std_density
    assert flow_summary["volumetric_actual"] == pytest.approx(actual_expected)
    assert flow_summary["volumetric_standard"] == pytest.approx(standard_expected)
    fluid_block = data["network"]["fluid"]
    assert fluid_block["volumetric_flow_rate"] == pytest.approx(actual_expected)
    assert fluid_block["standard_flow_rate"] == pytest.approx(standard_expected)

    section_flow = data["network"]["sections"][0]["calculation_result"]["flow"]
    assert section_flow["volumetric_actual"] == pytest.approx(actual_expected)
    assert section_flow["volumetric_standard"] == pytest.approx(standard_expected)
