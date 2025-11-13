/**
 * Validation Types for Hydraulic Network Web Application
 * 
 * This module defines validation-related types for form validation,
 * configuration validation, and real-time validation feedback.
 */

import { ErrorSeverity, ValidationError } from './errorTypes';

// Basic validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  criticalError?: ValidationError;
  hasErrors: boolean;
  hasWarnings: boolean;
}

// Field validation result interface
export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
}

// Validation rule interface
export interface ValidationRule {
  field: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom' | 'consistency';
  value?: any;
  message: string;
  severity?: ErrorSeverity;
  dependsOn?: string[];
  condition?: (value: any, formData: any) => boolean;
}

// Validation schema interface
export interface ValidationSchema {
  rules: ValidationRule[];
  groups?: ValidationGroup[];
  crossField?: CrossFieldValidation[];
  async?: AsyncValidationRule[];
}

// Validation group interface
export interface ValidationGroup {
  name: string;
  fields: string[];
  condition?: (formData: any) => boolean;
  message?: string;
  severity?: ErrorSeverity;
}

// Cross-field validation interface
export interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => ValidationResult;
  message: string;
  severity?: ErrorSeverity;
}

// Async validation rule interface
export interface AsyncValidationRule {
  field: string;
  validator: (value: any, formData: any) => Promise<ValidationResult>;
  debounceMs?: number;
  message: string;
  severity?: ErrorSeverity;
}

// Field validation state interface
export interface FieldValidationState {
  field: string;
  value: any;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isLoading: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  lastValidated: Date | null;
}

// Form validation state interface
export interface FormValidationState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  fields: Record<string, FieldValidationState>;
  globalErrors: ValidationError[];
  warnings: ValidationError[];
  lastValidation: Date | null;
  validationCount: number;
}

// Validation configuration interface
export interface ValidationConfig {
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  validateBeforeSubmit: boolean;
  showErrors: boolean;
  showWarnings: boolean;
  debounceMs: number;
  maxErrorsPerField: number;
  enableAsyncValidation: boolean;
  enableCrossFieldValidation: boolean;
  enableConsistencyChecks: boolean;
}

// Hydraulic-specific validation interfaces
export interface HydraulicValidationRule {
  type: 'flow_rate' | 'pressure' | 'diameter' | 'velocity' | 'reynolds' | 'loss';
  constraints: {
    min?: number;
    max?: number;
    units?: string;
    phase?: string[];
    fluidType?: string[];
  };
  message: string;
  severity?: ErrorSeverity;
}

// Pipe section validation interface
export interface PipeSectionValidation {
  sectionId: string;
  basicGeometry: ValidationResult;
  hydraulicProperties: ValidationResult;
  fittingsValidation: ValidationResult;
  continuityValidation: ValidationResult;
  phaseCompatibility: ValidationResult;
}

// Fluid properties validation interface
export interface FluidPropertiesValidation {
  phase: ValidationResult;
  thermodynamicProperties: ValidationResult;
  flowConditions: ValidationResult;
  consistency: ValidationResult;
}

// Network configuration validation interface
export interface NetworkConfigurationValidation {
  boundaryConditions: ValidationResult;
  flowDirection: ValidationResult;
  outputUnits: ValidationResult;
  designMargin: ValidationResult;
  topology: ValidationResult;
}

// Real-time validation result interface
export interface RealTimeValidationResult {
  field: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  performance: {
    validationTime: number;
    ruleCount: number;
    asyncRules: number;
  };
}

// Validation batch result interface
export interface ValidationBatchResult {
  batchId: string;
  timestamp: Date;
  totalFields: number;
  validatedFields: number;
  validFields: number;
  invalidFields: number;
  totalErrors: number;
  totalWarnings: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  criticalError?: ValidationError;
  hasErrors: boolean;
  hasWarnings: boolean;
  results: Record<string, FieldValidationResult>;
  performance: {
    totalTime: number;
    averageValidationTime: number;
    slowestField?: string;
    fastestField?: string;
  };
}

// Validation suggestion interface
export interface ValidationSuggestion {
  type: 'correction' | 'alternative' | 'explanation' | 'best_practice';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action?: () => void;
  field?: string;
  relatedFields?: string[];
}

// Validation performance metrics interface
export interface ValidationPerformance {
  field: string;
  validationTime: number;
  ruleCount: number;
  asyncRuleCount: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: Date;
}

// Validation cache interface
export interface ValidationCache {
  key: string;
  value: any;
  result: FieldValidationResult;
  timestamp: Date;
  ttl: number;
}

// Validation session interface
export interface ValidationSession {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  formId?: string;
  fieldStates: Record<string, FieldValidationState>;
  validationCount: number;
  errorCount: number;
  warningCount: number;
  performance: {
    averageValidationTime: number;
    totalValidationTime: number;
    slowestField?: string;
  };
}

// Configuration validation interface for hydraulic networks
export interface ConfigurationValidation {
  fluidProperties: FluidPropertiesValidation;
  pipeSections: PipeSectionValidation[];
  networkConfiguration: NetworkConfigurationValidation;
  components: ValidationResult[];
  overall: ValidationResult;
}

// Hydraulic calculation validation interface
export interface HydraulicCalculationValidation {
  preCalculation: ValidationResult;
  duringCalculation: ValidationResult[];
  postCalculation: ValidationResult;
  convergence: ValidationResult;
  physicalConsistency: ValidationResult;
}

// File validation interface
export interface FileValidation {
  format: ValidationResult;
  size: ValidationResult;
  content: ValidationResult;
  schema: ValidationResult;
  dependencies: ValidationResult;
}

// Create validation result helper function
export function createValidationResult(
  isValid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationError[] = []
): ValidationResult {
  const criticalError = errors.find(e => e.severity === ErrorSeverity.CRITICAL);
  
  return {
    isValid,
    errors,
    warnings,
    criticalError: criticalError !== undefined ? criticalError : undefined,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  };
}

// Create field validation result helper function
export function createFieldValidationResult(
  field: string,
  isValid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationError[] = []
): FieldValidationResult {
  return {
    field,
    isValid,
    errors,
    warnings,
    suggestions: errors.map(e => e.suggestion).filter(Boolean) as string[]
  };
}

// Validation rule builder helper
export class ValidationRuleBuilder {
  private rules: ValidationRule[] = [];

  addRequired(field: string, message?: string): this {
    this.rules.push({
      field,
      type: 'required',
      message: message || `${field} is required`,
      severity: ErrorSeverity.ERROR
    });
    return this;
  }

  addMin(field: string, min: number, message?: string): this {
    this.rules.push({
      field,
      type: 'min',
      value: min,
      message: message || `${field} must be at least ${min}`,
      severity: ErrorSeverity.WARNING
    });
    return this;
  }

  addMax(field: string, max: number, message?: string): this {
    this.rules.push({
      field,
      type: 'max',
      value: max,
      message: message || `${field} must not exceed ${max}`,
      severity: ErrorSeverity.WARNING
    });
    return this;
  }

  addPattern(field: string, pattern: RegExp, message?: string): this {
    this.rules.push({
      field,
      type: 'pattern',
      value: pattern,
      message: message || `${field} format is invalid`,
      severity: ErrorSeverity.ERROR
    });
    return this;
  }

  addCustom(field: string, validator: (value: any) => boolean, message: string): this {
    this.rules.push({
      field,
      type: 'custom',
      value: validator,
      message,
      severity: ErrorSeverity.ERROR
    });
    return this;
  }

  addConsistency(field: string, otherField: string, validator: (value1: any, value2: any) => boolean, message: string): this {
    this.rules.push({
      field,
      type: 'consistency',
      value: { otherField, validator },
      message,
      severity: ErrorSeverity.WARNING,
      dependsOn: [otherField]
    });
    return this;
  }

  build(): ValidationRule[] {
    return this.rules;
  }
}

// Hydraulic validation rule builder helper
export class HydraulicValidationRuleBuilder {
  private rules: HydraulicValidationRule[] = [];

  addFlowRateRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'flow_rate',
      constraints,
      message,
      severity: ErrorSeverity.WARNING
    });
    return this;
  }

  addPressureRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'pressure',
      constraints,
      message,
      severity: ErrorSeverity.ERROR
    });
    return this;
  }

  addDiameterRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'diameter',
      constraints,
      message,
      severity: ErrorSeverity.WARNING
    });
    return this;
  }

  addVelocityRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'velocity',
      constraints,
      message,
      severity: ErrorSeverity.ERROR
    });
    return this;
  }

  addReynoldsRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'reynolds',
      constraints,
      message,
      severity: ErrorSeverity.INFO
    });
    return this;
  }

  addLossRule(constraints: HydraulicValidationRule['constraints'], message: string): this {
    this.rules.push({
      type: 'loss',
      constraints,
      message,
      severity: ErrorSeverity.WARNING
    });
    return this;
  }

  build(): HydraulicValidationRule[] {
    return this.rules;
  }
}