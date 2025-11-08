import pytest

from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.solver.network_solver import NetworkSolver


def make_fluid() -> Fluid:
    return Fluid(
        name="water",
        mass_flow_rate=None,
        volumetric_flow_rate=0.05,
        phase="liquid",
        temperature=298.15,
        pressure=250000.0,
        density=998.2,
        molecular_weight=18.0,
        z_factor=1.0,
        specific_heat_ratio=1.0,
        viscosity=9.5e-4,
        standard_flow_rate=None,
        vapor_pressure=2000.0,
        critical_pressure=2.2e7,
    )


def make_section() -> PipeSection:
    control_valve = ControlValve(
        tag="CV-1",
        cv=None,
        cg=None,
        pressure_drop=2000.0,
        C1=None,
        FL=0.9,
        Fd=0.95,
        xT=0.7,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        valve_diameter=0.15,
    )
    orifice = Orifice(
        tag="FE-1",
        d_over_D_ratio=0.4,
        pressure_drop=800.0,
        pipe_diameter=0.15,
    )
    return PipeSection(
        id="sec-1",
        main_ID=0.15,
        input_ID=0.15,
        output_ID=0.15,
        schedule="40",
        roughness=4.6e-5,
        length=100.0,
        elevation_change=10.0,
        fitting_type="LR",
        fittings=[Fitting("elbow_90", 2)],
        fitting_K=None,
        pipe_length_K=None,
        user_K=None,
        piping_and_fitting_safety_factor=None,
        total_K=None,
        user_specified_fixed_loss=None,
        pipe_diameter=0.15,
        inlet_diameter=0.15,
        outlet_diameter=0.15,
        control_valve=control_valve,
        orifice=orifice,
    )


def test_network_solver_runs_all_calculations():
    fluid = make_fluid()
    section = make_section()
    network = Network(name="test", description=None, fluid=fluid, sections=[section])
    solver = NetworkSolver()
    result = solver.run(network)

    assert len(result.sections) == 1
    calc = section.calculation_output.pressure_drop
    assert calc.pipe_and_fittings is not None and calc.pipe_and_fittings > 0
    assert calc.control_valve_pressure_drop == 2000.0
    assert calc.orifice_pressure_drop == 800.0
    assert calc.total_segment_loss is not None and calc.total_segment_loss > 0
    assert section.calculation_output.pressure_drop.normalized_friction_loss is not None

    aggregate = result.aggregate.pressure_drop.total_segment_loss
    assert aggregate == pytest.approx(calc.total_segment_loss)
    assert section.result_summary.inlet.pressure is not None
    assert section.result_summary.outlet.pressure is not None


def make_gas_fluid() -> Fluid:
    return Fluid(
        name="natural_gas",
        mass_flow_rate=1.0,  # kg/s
        volumetric_flow_rate=None,
        phase="gas",
        temperature=298.15,  # K
        pressure=1000000.0,  # Pa (10 bar)
        density=7.0,  # kg/m3 (example density at reference conditions)
        molecular_weight=18.0,  # g/mol (example for methane)
        z_factor=0.9,
        specific_heat_ratio=1.3,
        viscosity=1.2e-5,  # Pa.s
        standard_flow_rate=None,
        vapor_pressure=None,
        critical_pressure=None,
    )



