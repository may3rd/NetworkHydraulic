// Fluid Configuration Types
export interface FluidConfiguration {
  name?: string;
  phase: 'liquid' | 'gas' | 'vapor';
  temperature: number; // Kelvin
  pressure: number; // Pascal
  density?: number; // kg/m³ (required for liquids)
  molecularWeight?: number; // kg/kmol (required for gases)
  zFactor?: number; // (required for gases)
  specificHeatRatio?: number; // (required for gases)
  viscosity: number; // Pa·s
  massFlowRate?: number; // kg/s
  volumetricFlowRate?: number; // m³/s
  standardFlowRate?: number; // m³/s
}

// Network Configuration Types
export interface NetworkConfiguration {
  name: string;
  description?: string;
  direction: 'auto' | 'forward' | 'backward';
  boundaryPressure?: number; // Pascal
  upstreamPressure?: number; // Pascal
  downstreamPressure?: number; // Pascal
  gasFlowModel?: 'isothermal' | 'adiabatic';
  outputUnits?: OutputUnitsConfiguration;
  designMargin?: number; // percentage
}

// Pipe Section Types
export interface PipeSection {
  id: string;
  description?: string;
  schedule: string;
  pipeNPD?: number; // Nominal Pipe Size (inches)
  pipeDiameter?: number; // meters (alternative to pipeNPD)
  inletDiameter?: number; // meters
  outletDiameter?: number; // meters
  roughness: number; // meters
  length: number; // meters
  elevationChange: number; // meters
  fittingType: 'LR' | 'SR';
  fittings: Fitting[];
  controlValve?: ControlValve;
  orifice?: Orifice;
  boundaryPressure?: number; // Pascal
  direction?: 'forward' | 'backward' | 'bidirectional';
  designMargin?: number; // percentage
  userSpecifiedFixedLoss?: number; // Pascal
}

export interface Fitting {
  type: string;
  quantity: number;
  kFactor?: number;
  description?: string;
}

export interface ControlValve {
  type: string;
  cv: number; // Flow coefficient
  openingPercentage: number;
  pressureDrop?: number;
}

export interface Orifice {
  diameter: number;
  thickness: number;
  dischargeCoefficient: number;
  pressureDrop?: number;
}

// Output Units Configuration
export interface OutputUnitsConfiguration {
  pressure?: string; // e.g., 'Pa', 'kPa', 'bar', 'psi'
  temperature?: string; // e.g., 'K', 'C', 'F'
  length?: string; // e.g., 'm', 'mm', 'in'
  flowRate?: string; // e.g., 'm3/s', 'L/min', 'gpm'
  velocity?: string; // e.g., 'm/s', 'ft/s'
  density?: string; // e.g., 'kg/m3', 'lb/ft3'
}

// API Request/Response Types
export interface CalculationRequest {
  configuration: {
    network: NetworkConfiguration;
    fluid: FluidConfiguration;
    sections: PipeSection[];
  };
  options?: {
    validateOnly?: boolean;
    includeDebugInfo?: boolean;
    outputFormat?: 'standard' | 'detailed';
  };
}

export interface CalculationResult {
  success: boolean;
  network: {
    name: string;
    direction: string;
    boundaryPressure: number;
    fluid: FluidConfiguration;
  };
  sections: SectionResult[];
  summary: {
    inlet: StatePoint;
    outlet: StatePoint;
    pressureDrop: PressureDropSummary;
  };
  warnings?: string[];
  executionTime: number; // seconds
  metadata: {
    version: string;
    timestamp: string;
    solver: string;
  };
}

export interface SectionResult {
  id: string;
  inletPressure: number;
  outletPressure: number;
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  elevationChange: number;
  fittingsPressureDrop: number;
  valvePressureDrop?: number;
  orificePressureDrop?: number;
  userSpecifiedLoss?: number;
  remarks?: string;
}

export interface StatePoint {
  pressure: number;
  temperature: number;
  density: number;
  velocity: number;
  elevation?: number;
}

export interface PressureDropSummary {
  total: number;
  friction: number;
  fittings: number;
  elevation: number;
  components: number;
  percentage: {
    friction: number;
    fittings: number;
    elevation: number;
    components: number;
  };
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
  suggestion?: string;
}

// Component Configuration Types
export interface ComponentConfiguration {
  type: 'controlValve' | 'orifice' | 'userDefined';
  properties: any;
}

// File Upload Types
export interface ConfigurationFile {
  name: string;
  content: string;
  type: 'yaml' | 'json';
  size: number;
}

export interface TemplateConfiguration {
  id: string;
  name: string;
  description: string;
  configuration: CalculationRequest['configuration'];
  category: string;
  tags: string[];
}