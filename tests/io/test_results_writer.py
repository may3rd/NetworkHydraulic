import json
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
from network_hydraulic.models.output_units import OutputUnits
from network_hydraulic.utils.units import convert


def build_section(section_id: str = "sec-1") -> PipeSection:
    return PipeSection(
        id=section_id,
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
        boundary_pressure=None,
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
    assert data["network"]["upstream_pressure"] is None
    assert data["network"]["downstream_pressure"] is None
    assert data["network"]["output_units"] == {
        "pressure": "Pa",
        "pressure_drop": "Pa",
        "temperature": "K",
        "density": "kg/m^3",
        "velocity": "m/s",
        "volumetric_flow_rate": "m^3/s",
        "mass_flow_rate": "kg/s",
        "flow_momentum": "Pa",
    }


def test_write_output_respects_custom_output_units(tmp_path: Path):
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
    network.output_units = OutputUnits(
        pressure="kPag",
        pressure_drop="kPa",
        temperature="degC",
        density="kg/m^3",
        velocity="ft/s",
        volumetric_flow_rate="m^3/h",
        mass_flow_rate="kg/h",
    )
    summary = make_summary(density=4.0)
    section_result = make_results(summary)
    pd = section_result.calculation.pressure_drop
    pd.pipe_and_fittings = 5000.0
    pd.total_segment_loss = 5000.0
    network_result = NetworkResult(sections=[section_result], aggregate=CalculationOutput(), summary=summary)

    out_path = tmp_path / "custom_units.yaml"
    results_io.write_output(out_path, network, network_result)

    with out_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)

    units_block = data["network"]["output_units"]
    assert units_block["pressure"] == "kPag"
    boundary_expected = convert(150000.0, "Pa", "kPag")
    assert data["network"]["boundary_pressure"] == pytest.approx(boundary_expected)

    fluid_block = data["network"]["fluid"]
    assert fluid_block["pressure"] == pytest.approx(boundary_expected)
    assert fluid_block["temperature"] == pytest.approx(convert(300.0, "K", "degC"))
    assert fluid_block["mass_flow_rate"] == pytest.approx(convert(2.0, "kg/s", "kg/h"))

    flow_summary = data["network"]["summary"]["flow"]
    actual_expected = convert(2.0 / summary.inlet.density, "m^3/s", "m^3/h")
    assert flow_summary["volumetric_actual"] == pytest.approx(actual_expected)

    section_drop = data["network"]["sections"][0]["calculation_result"]["pressure_drop"]
    assert section_drop["pipe_and_fittings"] == pytest.approx(convert(5000.0, "Pa", "kPa"))
    assert section_drop["total"] == pytest.approx(convert(5000.0, "Pa", "kPa"))


def test_write_output_writes_json_when_requested(tmp_path: Path):
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

    out_path = tmp_path / "result.json"
    results_io.write_output(out_path, network, network_result)

    with out_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    assert "network" in data
    assert data["network"]["name"] == "demo"


def test_section_description_included_in_output(tmp_path: Path):
    section = build_section()
    section.description = "Feed gas from knockout drum"
    fluid = build_fluid()
    network = Network(
        name="demo",
        description="Overall feed network",
        fluid=fluid,
        direction="forward",
        boundary_pressure=150000.0,
        gas_flow_model="isothermal",
        sections=[section],
    )
    summary = make_summary(density=4.0)
    section_result = make_results(summary)
    network_result = NetworkResult(sections=[section_result], aggregate=CalculationOutput(), summary=summary)

    out_path = tmp_path / "section_description.yaml"
    results_io.write_output(out_path, network, network_result)

    with out_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)
    assert data["network"]["sections"][0]["description"] == "Feed gas from knockout drum"


def test_print_summary_output(capfd):
    section = build_section()
    fluid = build_fluid()
    network = Network(
        name="demo-summary",
        description="A demo network for summary printing",
        fluid=fluid,
        direction="forward",
        boundary_pressure=150000.0,
        gas_flow_model="isothermal",
        sections=[section],
    )
    network.output_units = OutputUnits(
        pressure="kPag",
        pressure_drop="kPa",
        temperature="degC",
        density="kg/m^3",
        velocity="m/s",
        volumetric_flow_rate="m^3/h",
        mass_flow_rate="kg/h",
    )
    summary = make_summary(density=4.0)
    section_result = make_results(summary)
    pd = section_result.calculation.pressure_drop
    pd.pipe_and_fittings = 5000.0
    pd.control_valve_pressure_drop = 1000.0
    pd.orifice_pressure_drop = 500.0
    # Removed pd.elevation = 200.0
    pd.total_segment_loss = 6700.0
    section_result.summary.inlet.pressure = 150000.0
    section_result.summary.outlet.pressure = 143300.0
    section_result.summary.inlet.temperature = 300.0
    section_result.summary.outlet.temperature = 299.5
    section_result.summary.inlet.velocity = 10.0
    section_result.summary.outlet.velocity = 10.5
    section_result.summary.inlet.mach_number = 0.1
    section_result.summary.outlet.mach_number = 0.11
    section_result.summary.inlet.flow_momentum = 1000.0
    section_result.summary.outlet.flow_momentum = 1050.0
    section_result.summary.inlet.erosional_velocity = 20.0
    section_result.summary.outlet.erosional_velocity = 20.5
    section_result.summary.inlet.remarks = "OK"
    section_result.summary.outlet.remarks = "OK"

    network_result = NetworkResult(sections=[section_result], aggregate=section_result.calculation, summary=summary)

    results_io.print_summary(network, network_result)

    out, err = capfd.readouterr()
    assert "Network: demo-summary" in out
    assert "Section sec-1:" in out
    assert "Section ID: sec-1" in out
    assert "Description: A demo network for summary printing" in out

    # Test with None values
    network.description = None
    network.fluid.name = None
    network.gas_flow_model = "isothermal" # Keep valid for Network.__post_init__
    network_result.aggregate.pressure_drop.control_valve_pressure_drop = None
    network_result.aggregate.pressure_drop.orifice_pressure_drop = None
    section_result.summary.inlet.mach_number = None
    section_result.summary.outlet.mach_number = None
    section_result.summary.inlet.flow_momentum = None
    section_result.summary.outlet.flow_momentum = None
    section_result.summary.inlet.erosional_velocity = None
    section_result.summary.outlet.erosional_velocity = None
    section_result.summary.inlet.remarks = None
    section_result.summary.outlet.remarks = None

    results_io.print_summary(network, network_result)
    out, err = capfd.readouterr()
    assert "Description: —" in out
    assert "Flow Type (gas): isothermal" in out
    assert "Control Valve Loss: — kPa" in out
    assert "Orifice Loss: — kPa" in out
    assert "Mach: —" in out
    assert "Mach: —" in out
    assert "Flow Momentum (rho V^2): — Pa" in out
    assert "Flow Momentum (rho V^2): — Pa" in out
    assert "Erosional Velocity: — m/s" in out
    assert "Erosional Velocity: — m/s" in out


def test_write_results_with_none_values(tmp_path: Path):
    section = build_section()
    fluid = build_fluid()
    fluid.mass_flow_rate = None # Set to None
    fluid.volumetric_flow_rate = None # Set to None
    network = Network(
        name="none-values",
        description=None, # Set to None
        fluid=fluid,
        direction="forward",
        boundary_pressure=None, # Set to None
        gas_flow_model="isothermal", # Corrected to a valid value
        sections=[section],
    )
    summary = make_summary(density=4.0)
    summary.inlet.mach_number = None
    summary.outlet.mach_number = None
    section_result = make_results(summary)
    pd = section_result.calculation.pressure_drop
    pd.control_valve_pressure_drop = None
    pd.orifice_pressure_drop = None
    # Removed pd.elevation = None
    network_result = NetworkResult(sections=[section_result], aggregate=section_result.calculation, summary=summary)

    out_path = tmp_path / "none_result.yaml"
    results_io.write_output(out_path, network, network_result)

    with out_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle)

    # Assert that None values are represented as null or omitted
    assert data["network"]["description"] is None
    assert data["network"]["boundary_pressure"] is None
    assert data["network"]["gas_flow_model"] == "isothermal" # Should not be None
    assert data["network"]["fluid"]["mass_flow_rate"] is None
    assert data["network"]["fluid"]["volumetric_flow_rate"] == 0.0 # Corrected assertion
    assert data["network"]["sections"][0]["calculation_result"]["summary"]["inlet"]["mach_number"] is None
    assert data["network"]["sections"][0]["calculation_result"]["summary"]["outlet"]["mach_number"] is None
    assert data["network"]["sections"][0]["calculation_result"]["pressure_drop"]["control_valve"] is None
    assert data["network"]["sections"][0]["calculation_result"]["pressure_drop"]["orifice"] is None
    # Removed assert data["network"]["sections"][0]["calculation_result"]["pressure_drop"]["elevation"] is None
