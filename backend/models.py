"""Pydantic models for API requests and responses.

This module defines all the Pydantic models used for request validation,
response formatting, and data transfer between the API and the
network-hydraulic integration layer.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class Phase(str, Enum):
    """Fluid phase enumeration."""
    LIQUID = "liquid"
    GAS = "gas"
    VAPOR = "vapor"


class FlowDirection(str, Enum):
    """Flow direction enumeration."""
    AUTO = "auto"
    FORWARD = "forward"
    BACKWARD = "backward"


class GasFlowModel(str, Enum):
    """Gas flow model enumeration."""
    ISOTHERMAL = "isothermal"
    ADIABATIC = "adiabatic"


class FittingType(str, Enum):
    """Fitting type enumeration."""
    LR = "LR"
    SR = "SR"


class ErrorType(str, Enum):
    """Error type enumeration."""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"
    CALCULATION_ERROR = "CALCULATION_ERROR"
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR"
    SYSTEM_ERROR = "SYSTEM_ERROR"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    TIMEOUT = "TIMEOUT"


# Request Models
class QuantityModel(BaseModel):
    """Model for quantities with units."""
    value: float = Field(..., gt=0, description="Numeric value")
    unit: str = Field(..., min_length=1, description="Unit of measurement")
    
    @validator('unit')
    def validate_unit(cls, v):
        """Validate unit format."""
        if not v or not v.strip():
            raise ValueError("Unit cannot be empty")
        return v.strip()


class FittingModel(BaseModel):
    """Model for pipe fittings."""
    type: str = Field(..., min_length=1, description="Fitting type")
    count: int = Field(..., gt=0, description="Number of fittings")
    
    @validator('type')
    def validate_fitting_type(cls, v):
        """Validate fitting type."""
        allowed_types = [
            "elbow_90", "elbow_45", "u_bend", "stub_in_elbow", "tee_elbow",
            "tee_through", "block_valve_full_line_size", "block_valve_reduced_trim_0.9d",
            "block_valve_reduced_trim_0.8d", "globe_valve", "diaphragm_valve",
            "butterfly_valve", "check_valve_swing", "lift_check_valve",
            "tilting_check_valve", "pipe_entrance_normal", "pipe_entrance_raise",
            "pipe_exit", "inlet_swage", "outlet_swage"
        ]
        if v.lower() not in allowed_types:
            raise ValueError(f"Unsupported fitting type: {v}")
        return v.lower()


class ControlValveModel(BaseModel):
    """Model for control valves."""
    tag: Optional[str] = Field(None, description="Valve tag identifier")
    cv: Optional[float] = Field(None, gt=0, description="Valve flow coefficient")
    cg: Optional[float] = Field(None, gt=0, description="Gas flow coefficient")
    pressure_drop: Optional[float] = Field(None, gt=0, description="Pressure drop")
    C1: Optional[float] = Field(None, gt=0, description="Valve coefficient")
    FL: Optional[float] = Field(None, gt=0, description="Liquid pressure recovery factor")
    Fd: Optional[float] = Field(None, gt=0, description="Valve sizing coefficient")
    xT: Optional[float] = Field(None, gt=0, description="Pressure drop ratio")
    inlet_diameter: Optional[float] = Field(None, gt=0, description="Inlet diameter")
    outlet_diameter: Optional[float] = Field(None, gt=0, description="Outlet diameter")
    valve_diameter: Optional[float] = Field(None, gt=0, description="Valve diameter")
    calculation_note: Optional[str] = Field(None, description="Calculation notes")


class OrificeModel(BaseModel):
    """Model for orifice plates."""
    tag: Optional[str] = Field(None, description="Orifice tag identifier")
    d_over_D_ratio: Optional[float] = Field(None, ge=0, le=1, description="Diameter ratio")
    pressure_drop: Optional[float] = Field(None, gt=0, description="Pressure drop")
    pipe_diameter: Optional[float] = Field(None, gt=0, description="Pipe diameter")
    orifice_diameter: Optional[float] = Field(None, gt=0, description="Orifice diameter")
    meter_type: Optional[str] = Field(None, description="Meter type")
    taps: Optional[str] = Field(None, description="Tap type")
    tap_position: Optional[str] = Field(None, description="Tap position")
    discharge_coefficient: Optional[float] = Field(None, gt=0, description="Discharge coefficient")
    expansibility: Optional[float] = Field(None, gt=0, description="Expansibility factor")
    calculation_note: Optional[str] = Field(None, description="Calculation notes")


class PipeSectionModel(BaseModel):
    """Model for pipe sections."""
    id: str = Field(..., min_length=1, description="Section identifier")
    description: Optional[str] = Field(None, description="Section description")
    schedule: str = Field(default="40", description="Pipe schedule")
    pipe_NPD: Optional[float] = Field(None, gt=0, description="Nominal pipe size")
    pipe_diameter: Optional[float] = Field(None, gt=0, description="Pipe diameter in meters")
    inlet_diameter: Optional[float] = Field(None, gt=0, description="Inlet diameter in meters")
    outlet_diameter: Optional[float] = Field(None, gt=0, description="Outlet diameter in meters")
    roughness: float = Field(..., ge=0, description="Pipe roughness")
    length: float = Field(..., gt=0, description="Pipe length in meters")
    elevation_change: float = Field(default=0, description="Elevation change in meters")
    fitting_type: FittingType = Field(default=FittingType.LR, description="Fitting type")
    fittings: List[FittingModel] = Field(default_factory=list, description="List of fittings")
    control_valve: Optional[ControlValveModel] = Field(None, description="Control valve")
    orifice: Optional[OrificeModel] = Field(None, description="Orifice plate")
    boundary_pressure: Optional[float] = Field(None, gt=0, description="Boundary pressure")
    direction: Optional[FlowDirection] = Field(None, description="Flow direction")
    design_margin: Optional[float] = Field(None, ge=0, description="Design margin percentage")
    user_specified_fixed_loss: Optional[float] = Field(None, gt=0, description="Fixed loss")
    
    @validator('id')
    def validate_section_id(cls, v):
        """Validate section ID."""
        if not v or not v.strip():
            raise ValueError("Section ID cannot be empty")
        return v.strip()


class OutputUnitsModel(BaseModel):
    """Model for output units configuration."""
    pressure: Optional[str] = Field(None, description="Pressure unit")
    pressure_drop: Optional[str] = Field(None, description="Pressure drop unit")
    temperature: Optional[str] = Field(None, description="Temperature unit")
    density: Optional[str] = Field(None, description="Density unit")
    velocity: Optional[str] = Field(None, description="Velocity unit")
    volumetric_flow_rate: Optional[str] = Field(None, description="Volumetric flow rate unit")
    mass_flow_rate: Optional[str] = Field(None, description="Mass flow rate unit")
    flow_momentum: Optional[str] = Field(None, description="Flow momentum unit")


class FluidModel(BaseModel):
    """Model for fluid properties."""
    name: Optional[str] = Field(None, description="Fluid name")
    phase: Phase = Field(..., description="Fluid phase")
    temperature: Union[float, QuantityModel] = Field(..., description="Temperature")
    pressure: Union[float, QuantityModel] = Field(..., description="Pressure")
    density: Optional[Union[float, QuantityModel]] = Field(None, description="Density")
    molecular_weight: Optional[Union[float, QuantityModel]] = Field(None, description="Molecular weight")
    z_factor: Optional[float] = Field(None, gt=0, description="Compressibility factor")
    specific_heat_ratio: Optional[float] = Field(None, gt=0, description="Specific heat ratio")
    viscosity: Union[float, QuantityModel] = Field(..., description="Viscosity")
    vapor_pressure: Optional[Union[float, QuantityModel]] = Field(None, description="Vapor pressure")
    critical_pressure: Optional[Union[float, QuantityModel]] = Field(None, description="Critical pressure")
    
    @validator('z_factor')
    def validate_z_factor(cls, v):
        """Validate z-factor for gases."""
        if v is not None and v <= 0:
            raise ValueError("Z-factor must be positive")
        return v
    
    @validator('specific_heat_ratio')
    def validate_specific_heat_ratio(cls, v):
        """Validate specific heat ratio for gases."""
        if v is not None and v <= 0:
            raise ValueError("Specific heat ratio must be positive")
        return v
    
    class Config:
        use_enum_values = True


class NetworkModel(BaseModel):
    """Model for network configuration."""
    name: str = Field(..., min_length=1, description="Network name")
    description: Optional[str] = Field(None, description="Network description")
    direction: FlowDirection = Field(default=FlowDirection.AUTO, description="Flow direction")
    boundary_pressure: Optional[Union[float, QuantityModel]] = Field(None, description="Boundary pressure")
    upstream_pressure: Optional[Union[float, QuantityModel]] = Field(None, description="Upstream pressure")
    downstream_pressure: Optional[Union[float, QuantityModel]] = Field(None, description="Downstream pressure")
    gas_flow_model: Optional[GasFlowModel] = Field(None, description="Gas flow model")
    output_units: Optional[OutputUnitsModel] = Field(None, description="Output units")
    design_margin: Optional[float] = Field(None, ge=0, description="Design margin percentage")
    mass_flow_rate: Optional[Union[float, QuantityModel]] = Field(None, description="Mass flow rate")
    volumetric_flow_rate: Optional[Union[float, QuantityModel]] = Field(None, description="Volumetric flow rate")
    standard_flow_rate: Optional[Union[float, QuantityModel]] = Field(None, description="Standard flow rate")
    
    class Config:
        use_enum_values = True


class ConfigurationModel(BaseModel):
    """Complete configuration model."""
    network: NetworkModel = Field(..., description="Network configuration")
    fluid: FluidModel = Field(..., description="Fluid configuration")
    sections: List[PipeSectionModel] = Field(..., min_items=1, description="Pipe sections")


class CalculationOptionsModel(BaseModel):
    """Calculation options."""
    validate_only: bool = Field(default=False, description="Validate only, don't calculate")
    include_debug_info: bool = Field(default=False, description="Include debug information")
    output_format: str = Field(default="standard", description="Output format")


class CalculationRequestModel(BaseModel):
    """Request model for hydraulic calculations."""
    configuration: ConfigurationModel = Field(..., description="Network configuration")
    options: Optional[CalculationOptionsModel] = Field(default_factory=CalculationOptionsModel, description="Calculation options")


class ValidationResult(BaseModel):
    """Validation result model."""
    valid: bool = Field(..., description="Whether configuration is valid")
    errors: List[str] = Field(default_factory=list, description="List of validation errors")
    warnings: List[str] = Field(default_factory=list, description="List of validation warnings")
    field_errors: Dict[str, str] = Field(default_factory=dict, description="Field-specific errors")


# Response Models
class ErrorModel(BaseModel):
    """Error response model."""
    code: ErrorType = Field(..., description="Error code")
    message: str = Field(..., min_length=1, description="Error message")
    details: Optional[str] = Field(None, description="Detailed error information")
    field: Optional[str] = Field(None, description="Field where error occurred")
    suggestion: Optional[str] = Field(None, description="Suggestion to fix error")


class APIResponseModel(BaseModel):
    """Base API response model."""
    success: bool = Field(..., description="Whether request was successful")
    error: Optional[ErrorModel] = Field(None, description="Error information if unsuccessful")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    request_id: Optional[str] = Field(None, description="Request identifier")


class CalculationResponseModel(APIResponseModel):
    """Calculation response model."""
    result: Optional[Dict[str, Any]] = Field(None, description="Calculation results")
    execution_time: Optional[float] = Field(None, description="Execution time in seconds")
    warnings: List[str] = Field(default_factory=list, description="Calculation warnings")


class FittingPropertiesModel(BaseModel):
    """Fitting properties response model."""
    type: str = Field(..., description="Fitting type")
    description: str = Field(..., description="Fitting description")
    typical_k_factor: float = Field(..., gt=0, description="Typical K-factor")
    range: Optional[Dict[str, float]] = Field(None, description="Typical range")
    notes: Optional[str] = Field(None, description="Additional notes")


class CalculationHistoryModel(BaseModel):
    """Calculation history model."""
    id: str = Field(..., description="Calculation ID")
    name: str = Field(..., description="Calculation name")
    description: Optional[str] = Field(None, description="Calculation description")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    status: str = Field(..., description="Calculation status")
    result_available: bool = Field(..., description="Whether results are available")


class FileUploadResponseModel(APIResponseModel):
    """File upload response model."""
    file_id: Optional[str] = Field(None, description="Uploaded file identifier")
    filename: Optional[str] = Field(None, description="Original filename")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    content_type: Optional[str] = Field(None, description="Content type")


class TemplateModel(BaseModel):
    """Configuration template model."""
    id: str = Field(..., description="Template identifier")
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    category: str = Field(..., description="Template category")
    configuration: Dict[str, Any] = Field(..., description="Template configuration")


# WebSocket Models
class WebSocketMessageModel(BaseModel):
    """WebSocket message model."""
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(..., description="Message data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


class ProgressUpdateModel(BaseModel):
    """Progress update model."""
    progress: float = Field(..., ge=0, le=100, description="Progress percentage")
    message: str = Field(..., description="Progress message")
    stage: str = Field(..., description="Current calculation stage")


# Background Task Models
class TaskStatus(str, Enum):
    """Background task status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BackgroundTaskModel(BaseModel):
    """Background task model."""
    task_id: str = Field(..., description="Task identifier")
    status: TaskStatus = Field(..., description="Task status")
    progress: float = Field(default=0, ge=0, le=100, description="Task progress")
    message: str = Field(default="", description="Task message")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result")
    error: Optional[str] = Field(None, description="Error message if failed")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Task creation time")
    completed_at: Optional[datetime] = Field(None, description="Task completion time")