"""Integration layer for network-hydraulic library.

This module provides a wrapper around the network-hydraulic library,
converting API requests to network-hydraulic format and vice versa.
It handles data conversion, error handling, and provides a clean
interface for the FastAPI endpoints.
"""

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import yaml
from fastapi import UploadFile
from network_hydraulic.io.loader import ConfigurationLoader
from network_hydraulic.models.components import ControlValve, Orifice
from network_hydraulic.models.fluid import Fluid
from network_hydraulic.models.network import Network
from network_hydraulic.models.pipe_section import Fitting, PipeSection
from network_hydraulic.models.results import NetworkResult
from network_hydraulic.solver.network_solver import NetworkSolver
from network_hydraulic.utils.units import convert as unit_convert

from backend.exceptions import (
    ConfigurationError,
    ConfigurationParseError,
    NetworkHydraulicIntegrationError,
    UnsupportedFileTypeError,
    ValidationError,
    create_network_hydraulic_error,
    create_validation_error,
)
from backend.models import (
    CalculationRequestModel,
    ConfigurationModel,
    ControlValveModel,
    FittingModel,
    FluidModel,
    NetworkModel,
    OrificeModel,
    PipeSectionModel,
    QuantityModel,
)

logger = logging.getLogger(__name__)


class HydraulicCalculator:
    """Main calculator class that wraps network-hydraulic functionality."""
    
    def __init__(self, network_hydraulic_path: Optional[str] = None):
        """Initialize the hydraulic calculator.
        
        Args:
            network_hydraulic_path: Path to network-hydraulic source code
        """
        self.network_hydraulic_path = network_hydraulic_path
        self.solver = NetworkSolver()
    
    def calculate(self, request: CalculationRequestModel) -> Dict[str, Any]:
        """Execute hydraulic calculation from API request.
        
        Args:
            request: Calculation request with configuration and options
            
        Returns:
            Dictionary containing calculation results
            
        Raises:
            ValidationError: If configuration is invalid
            HydraulicCalculationError: If calculation fails
        """
        try:
            logger.info(f"Starting calculation for network: {request.configuration.network.name}")
            
            # Convert API configuration to network-hydraulic format
            network = self._build_network_from_config(request.configuration)
            
            # Execute calculation
            result = self.solver.run(network)
            
            # Convert results to API response format
            return self._format_results(result, network, request.options)
            
        except Exception as e:
            logger.error(f"Calculation failed: {e}", exc_info=True)
            raise create_network_hydraulic_error(
                f"Calculation failed: {str(e)}",
                original_exception=e,
                suggestion="Please check your configuration and try again",
            )
    
    def validate_configuration(self, config: ConfigurationModel) -> Dict[str, Any]:
        """Validate configuration without running calculation.
        
        Args:
            config: Configuration to validate
            
        Returns:
            Dictionary with validation results
            
        Raises:
            ValidationError: If configuration is invalid
        """
        try:
            logger.info(f"Validating configuration for network: {config.network.name}")
            
            # Try to build network (this will validate the configuration)
            network = self._build_network_from_config(config)
            
            return {
                "valid": True,
                "errors": [],
                "warnings": [],
                "field_errors": {}
            }
            
        except ValidationError:
            # Re-raise validation errors
            raise
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            raise create_validation_error(
                field="configuration",
                message=f"Configuration validation failed: {str(e)}",
                suggestion="Please check your configuration format and values",
            )
    
    def _build_network_from_config(self, config: ConfigurationModel) -> Network:
        """Convert API configuration to network-hydraulic Network object.
        
        Args:
            config: API configuration model
            
        Returns:
            Network object for network-hydraulic
        """
        try:
            # Build fluid
            fluid = self._build_fluid(config.fluid)
            
            # Build pipe sections
            sections = [self._build_pipe_section(section) for section in config.sections]
            
            # Build network
            network = Network(
                name=config.network.name,
                description=config.network.description,
                fluid=fluid,
                direction=config.network.direction.value,
                boundary_pressure=self._extract_quantity_value(config.network.boundary_pressure),
                upstream_pressure=self._extract_quantity_value(config.network.upstream_pressure),
                downstream_pressure=self._extract_quantity_value(config.network.downstream_pressure),
                gas_flow_model=config.network.gas_flow_model.value if config.network.gas_flow_model else None,
                sections=sections,
                design_margin=config.network.design_margin,
                mass_flow_rate=self._extract_quantity_value(config.network.mass_flow_rate),
                volumetric_flow_rate=self._extract_quantity_value(config.network.volumetric_flow_rate),
                standard_flow_rate=self._extract_quantity_value(config.network.standard_flow_rate),
            )
            
            return network
            
        except Exception as e:
            logger.error(f"Failed to build network from configuration: {e}")
            raise create_network_hydraulic_error(
                f"Failed to build network from configuration: {str(e)}",
                original_exception=e,
                suggestion="Please check your configuration format",
            )
    
    def _build_fluid(self, fluid_config: FluidModel) -> Fluid:
        """Convert API fluid configuration to network-hydraulic Fluid object.
        
        Args:
            fluid_config: API fluid configuration
            
        Returns:
            Fluid object for network-hydraulic
        """
        try:
            # Extract quantities with unit conversion
            temperature = self._extract_quantity_value(fluid_config.temperature, "K")
            pressure = self._extract_quantity_value(fluid_config.pressure, "Pa")
            density = self._extract_quantity_value(fluid_config.density, "kg/m^3") if fluid_config.density else None
            viscosity = self._extract_quantity_value(fluid_config.viscosity, "Pa*s")
            molecular_weight = self._extract_quantity_value(fluid_config.molecular_weight, "kg/kmol") if fluid_config.molecular_weight else None
            vapor_pressure = self._extract_quantity_value(fluid_config.vapor_pressure, "Pa") if fluid_config.vapor_pressure else None
            critical_pressure = self._extract_quantity_value(fluid_config.critical_pressure, "Pa") if fluid_config.critical_pressure else None
            
            return Fluid(
                name=fluid_config.name,
                phase=fluid_config.phase.value,
                temperature=temperature,
                pressure=pressure,
                density=density,
                molecular_weight=molecular_weight,
                z_factor=fluid_config.z_factor,
                specific_heat_ratio=fluid_config.specific_heat_ratio,
                viscosity=viscosity,
                vapor_pressure=vapor_pressure,
                critical_pressure=critical_pressure,
            )
            
        except Exception as e:
            logger.error(f"Failed to build fluid: {e}")
            raise create_validation_error(
                field="fluid",
                message=f"Invalid fluid configuration: {str(e)}",
                suggestion="Please check fluid properties and units",
            )
    
    def _build_pipe_section(self, section_config: PipeSectionModel) -> PipeSection:
        """Convert API pipe section to network-hydraulic PipeSection object.
        
        Args:
            section_config: API pipe section configuration
            
        Returns:
            PipeSection object for network-hydraulic
        """
        try:
            # Build fittings
            fittings = [self._build_fitting(fitting) for fitting in section_config.fittings]
            
            # Build control valve if present
            control_valve = None
            if section_config.control_valve:
                control_valve = self._build_control_valve(section_config.control_valve)
            
            # Build orifice if present
            orifice = None
            if section_config.orifice:
                orifice = self._build_orifice(section_config.orifice)
            
            return PipeSection(
                id=section_config.id,
                schedule=section_config.schedule,
                roughness=section_config.roughness,
                length=section_config.length,
                elevation_change=section_config.elevation_change,
                fitting_type=section_config.fitting_type.value,
                fittings=fittings,
                control_valve=control_valve,
                orifice=orifice,
                pipe_NPD=section_config.pipe_NPD,
                description=section_config.description,
                design_margin=section_config.design_margin,
                pipe_diameter=section_config.pipe_diameter,
                inlet_diameter=section_config.inlet_diameter,
                outlet_diameter=section_config.outlet_diameter,
                erosional_constant=section_config.erosional_constant,
                boundary_pressure=self._extract_quantity_value(section_config.boundary_pressure),
                direction=section_config.direction.value if section_config.direction else None,
                base_mass_flow_rate=self._extract_quantity_value(section_config.mass_flow_rate) if hasattr(section_config, 'mass_flow_rate') and section_config.mass_flow_rate else None,
                base_volumetric_flow_rate=self._extract_quantity_value(section_config.volumetric_flow_rate) if hasattr(section_config, 'volumetric_flow_rate') and section_config.volumetric_flow_rate else None,
                user_specified_fixed_loss=self._extract_quantity_value(section_config.user_specified_fixed_loss) if section_config.user_specified_fixed_loss else None,
            )
            
        except Exception as e:
            logger.error(f"Failed to build pipe section {section_config.id}: {e}")
            raise create_validation_error(
                field=f"sections.{section_config.id}",
                message=f"Invalid section configuration: {str(e)}",
                suggestion="Please check section properties and values",
            )
    
    def _build_fitting(self, fitting_config: FittingModel) -> Fitting:
        """Convert API fitting to network-hydraulic Fitting object.
        
        Args:
            fitting_config: API fitting configuration
            
        Returns:
            Fitting object for network-hydraulic
        """
        return Fitting(
            type=fitting_config.type,
            count=fitting_config.count,
        )
    
    def _build_control_valve(self, valve_config: ControlValveModel) -> ControlValve:
        """Convert API control valve to network-hydraulic ControlValve object.
        
        Args:
            valve_config: API control valve configuration
            
        Returns:
            ControlValve object for network-hydraulic
        """
        return ControlValve(
            tag=valve_config.tag,
            cv=valve_config.cv,
            cg=valve_config.cg,
            pressure_drop=self._extract_quantity_value(valve_config.pressure_drop, "Pa") if valve_config.pressure_drop else None,
            C1=valve_config.C1,
            FL=valve_config.FL,
            Fd=valve_config.Fd,
            xT=valve_config.xT,
            inlet_diameter=self._extract_quantity_value(valve_config.inlet_diameter, "m") if valve_config.inlet_diameter else None,
            outlet_diameter=self._extract_quantity_value(valve_config.outlet_diameter, "m") if valve_config.outlet_diameter else None,
            valve_diameter=self._extract_quantity_value(valve_config.valve_diameter, "m") if valve_config.valve_diameter else None,
            calculation_note=valve_config.calculation_note,
        )
    
    def _build_orifice(self, orifice_config: OrificeModel) -> Orifice:
        """Convert API orifice to network-hydraulic Orifice object.
        
        Args:
            orifice_config: API orifice configuration
            
        Returns:
            Orifice object for network-hydraulic
        """
        return Orifice(
            tag=orifice_config.tag,
            d_over_D_ratio=orifice_config.d_over_D_ratio,
            pressure_drop=self._extract_quantity_value(orifice_config.pressure_drop, "Pa") if orifice_config.pressure_drop else None,
            pipe_diameter=self._extract_quantity_value(orifice_config.pipe_diameter, "m") if orifice_config.pipe_diameter else None,
            orifice_diameter=self._extract_quantity_value(orifice_config.orifice_diameter, "m") if orifice_config.orifice_diameter else None,
            meter_type=orifice_config.meter_type,
            taps=orifice_config.taps,
            tap_position=orifice_config.tap_position,
            discharge_coefficient=orifice_config.discharge_coefficient,
            expansibility=self._extract_quantity_value(orifice_config.expansibility) if orifice_config.expansibility else None,
            calculation_note=orifice_config.calculation_note,
        )
    
    def _extract_quantity_value(
        self,
        quantity: Optional[Union[float, QuantityModel]],
        target_unit: Optional[str] = None,
    ) -> Optional[float]:
        """Extract numeric value from quantity, handling unit conversion.
        
        Args:
            quantity: Quantity value (float or QuantityModel)
            target_unit: Target unit for conversion
            
        Returns:
            Numeric value (with unit conversion if applicable)
        """
        if quantity is None:
            return None
        
        if isinstance(quantity, (int, float)):
            return float(quantity)
        
        if isinstance(quantity, QuantityModel):
            if target_unit and quantity.unit != target_unit:
                try:
                    return unit_convert(quantity.value, quantity.unit, target_unit)
                except Exception as e:
                    logger.warning(f"Unit conversion failed: {quantity.unit} to {target_unit}: {e}")
                    return quantity.value
            return quantity.value
        
        return None
    
    def _format_results(
        self,
        result: NetworkResult,
        network: Network,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Format network-hydraulic results for API response.
        
        Args:
            result: NetworkResult from network-hydraulic
            network: Original Network object
            options: Calculation options
            
        Returns:
            Formatted results dictionary
        """
        try:
            # Basic result structure
            formatted_result = {
                "network": {
                    "name": network.name,
                    "direction": network.direction,
                    "boundary_pressure": network.boundary_pressure,
                    "fluid": self._format_fluid(network.fluid),
                },
                "sections": [self._format_section_result(section) for section in result.sections],
                "summary": {
                    "inlet": self._format_state_point(result.summary.inlet),
                    "outlet": self._format_state_point(result.summary.outlet),
                    "pressure_drop": self._format_pressure_drop(result.aggregate.pressure_drop),
                },
                "warnings": [],
                "execution_time": 0.0,
                "metadata": {
                    "version": "1.0.0",
                    "timestamp": datetime.utcnow().isoformat(),
                    "solver": "network-hydraulic",
                },
            }
            
            # Add debug info if requested
            if options and options.get("include_debug_info", False):
                formatted_result["debug"] = {
                    "network_sections": len(network.sections),
                    "solver_config": {
                        "default_pipe_diameter": self.solver.default_pipe_diameter,
                        "friction_factor_type": self.solver.friction_factor_type,
                    },
                }
            
            return formatted_result
            
        except Exception as e:
            logger.error(f"Failed to format results: {e}")
            raise create_network_hydraulic_error(
                f"Failed to format calculation results: {str(e)}",
                original_exception=e,
                suggestion="Please contact support",
            )
    
    def _format_fluid(self, fluid: Fluid) -> Dict[str, Any]:
        """Format fluid for API response.
        
        Args:
            fluid: Fluid object
            
        Returns:
            Formatted fluid dictionary
        """
        return {
            "name": fluid.name,
            "phase": fluid.phase,
            "temperature": fluid.temperature,
            "pressure": fluid.pressure,
            "density": fluid.density,
            "viscosity": fluid.viscosity,
            "molecular_weight": fluid.molecular_weight,
            "z_factor": fluid.z_factor,
            "specific_heat_ratio": fluid.specific_heat_ratio,
        }
    
    def _format_section_result(self, section_result) -> Dict[str, Any]:
        """Format section result for API response.
        
        Args:
            section_result: SectionResult object
            
        Returns:
            Formatted section result dictionary
        """
        return {
            "section_id": section_result.section_id,
            "calculation": self._format_calculation_output(section_result.calculation),
            "summary": {
                "inlet": self._format_state_point(section_result.summary.inlet),
                "outlet": self._format_state_point(section_result.summary.outlet),
            },
        }
    
    def _format_calculation_output(self, calculation_output) -> Dict[str, Any]:
        """Format calculation output for API response.
        
        Args:
            calculation_output: CalculationOutput object
            
        Returns:
            Formatted calculation output dictionary
        """
        return {
            "pressure_drop": self._format_pressure_drop(calculation_output.pressure_drop),
        }
    
    def _format_pressure_drop(self, pressure_drop) -> Dict[str, Any]:
        """Format pressure drop for API response.
        
        Args:
            pressure_drop: PressureDropDetails object
            
        Returns:
            Formatted pressure drop dictionary
        """
        return {
            "total_segment_loss": pressure_drop.total_segment_loss,
            "pipe_and_fittings": pressure_drop.pipe_and_fittings,
            "elevation_change": pressure_drop.elevation_change,
            "control_valve_pressure_drop": pressure_drop.control_valve_pressure_drop,
            "orifice_pressure_drop": pressure_drop.orifice_pressure_drop,
            "user_specified_fixed_loss": pressure_drop.user_specified_fixed_loss,
            "frictional_factor": pressure_drop.frictional_factor,
            "reynolds_number": pressure_drop.reynolds_number,
            "total_K": pressure_drop.total_K,
            "fitting_K": pressure_drop.fitting_K,
            "pipe_length_K": pressure_drop.pipe_length_K,
            "user_K": pressure_drop.user_K,
            "piping_and_fitting_safety_factor": pressure_drop.piping_and_fitting_safety_factor,
        }
    
    def _format_state_point(self, state_point) -> Dict[str, Any]:
        """Format state point for API response.
        
        Args:
            state_point: StatePoint object
            
        Returns:
            Formatted state point dictionary
        """
        return {
            "pressure": state_point.pressure,
            "temperature": state_point.temperature,
            "density": state_point.density,
            "velocity": state_point.velocity,
            "mach_number": state_point.mach_number,
            "erosional_velocity": state_point.erosional_velocity,
            "flow_momentum": state_point.flow_momentum,
            "remarks": state_point.remarks,
        }
    
    @staticmethod
    def parse_configuration_file(content: bytes, filename: str) -> Dict[str, Any]:
        """Parse configuration file (YAML or JSON).
        
        Args:
            content: File content as bytes
            filename: Original filename
            
        Returns:
            Parsed configuration dictionary
            
        Raises:
            UnsupportedFileTypeError: If file type is not supported
            ConfigurationParseError: If parsing fails
        """
        file_extension = Path(filename).suffix.lower()
        
        try:
            if file_extension in ['.yaml', '.yml']:
                try:
                    config = yaml.safe_load(content.decode('utf-8'))
                    return config
                except yaml.YAMLError as e:
                    raise ConfigurationParseError(
                        f"Invalid YAML format: {str(e)}",
                        file_type='yaml',
                        suggestion="Please check YAML syntax and try again",
                    )
            elif file_extension == '.json':
                try:
                    config = yaml.safe_load(content.decode('utf-8'))
                    return config
                except Exception as e:
                    raise ConfigurationParseError(
                        f"Invalid JSON format: {str(e)}",
                        file_type='json',
                        suggestion="Please check JSON syntax and try again",
                    )
            else:
                raise UnsupportedFileTypeError(
                    file_extension,
                    suggestion="Please upload a YAML (.yaml, .yml) or JSON (.json) file",
                )
                
        except UnicodeDecodeError as e:
            raise ConfigurationParseError(
                "File encoding error: Unable to decode file content",
                file_type=file_extension,
                suggestion="Please ensure the file is UTF-8 encoded",
            )
        except Exception as e:
            raise ConfigurationParseError(
                f"Unexpected error while parsing file: {str(e)}",
                file_type=file_extension,
                suggestion="Please check the file format and try again",
            )


# Global calculator instance
hydraulic_calculator = HydraulicCalculator()