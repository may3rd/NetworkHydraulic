/**
 * Validation Service for Hydraulic Network Web Application
 * 
 * This service provides comprehensive validation capabilities including
 * form validation, configuration validation, real-time validation,
 * and validation rule management.
 */

import { 
  ValidationResult, 
  FieldValidationResult, 
  ValidationRule, 
  ValidationSchema, 
  ValidationConfig,
  FieldValidationState,
  FormValidationState,
  HydraulicValidationRule,
  PipeSectionValidation,
  FluidPropertiesValidation,
  NetworkConfigurationValidation,
  ValidationBatchResult,
  ValidationGroup,
  CrossFieldValidation,
  AsyncValidationRule,
  ValidationRuleBuilder,
  HydraulicValidationRuleBuilder
} from '../../types/error/validationTypes';
import { 
  ValidationError, 
  ErrorSeverity,
  createValidationError
} from '../../types/error/errorTypes';
import { VALIDATION_ERRORS } from '../../types/error/errorCodes';

export interface ValidationServiceConfig {
  debounceMs: number;
  enableAsyncValidation: boolean;
  enableCrossFieldValidation: boolean;
  enableConsistencyChecks: boolean;
  maxErrorsPerField: number;
  enableCaching: boolean;
  cacheTTL: number;
}

export interface ValidationCacheEntry {
  key: string;
  value: any;
  result: FieldValidationResult;
  timestamp: number;
  ttl: number;
}

class ValidationService {
  private config: ValidationServiceConfig;
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private validationSchemas: Map<string, ValidationSchema> = new Map();
  private validationCache: Map<string, ValidationCacheEntry> = new Map();
  private validationCallbacks: Map<string, (result: ValidationResult) => void> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<ValidationServiceConfig>) {
    this.config = {
      debounceMs: 300,
      enableAsyncValidation: true,
      enableCrossFieldValidation: true,
      enableConsistencyChecks: true,
      maxErrorsPerField: 5,
      enableCaching: true,
      cacheTTL: 60000, // 1 minute
      ...config
    };
  }

  /**
   * Validate a single field
   */
  async validateField(
    field: string, 
    value: any, 
    rules: ValidationRule[], 
    formData?: any
  ): Promise<FieldValidationResult> {
    const cacheKey = this.generateCacheKey(field, value, rules);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.result;
      }
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Apply validation rules
    for (const rule of rules) {
      const result = await this.applyValidationRule(field, value, rule, formData);
      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
      }
    }

    const result: FieldValidationResult = {
      field,
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };

    // Cache result
    if (this.config.enableCaching) {
      this.setCache(cacheKey, value, result);
    }

    return result;
  }

  /**
   * Validate form data against schema
   */
  async validateForm(
    formData: any,
    schema: ValidationSchema,
    config?: Partial<ValidationConfig>
  ): Promise<FormValidationState> {
    const validationConfig: ValidationConfig = {
      mode: 'all',
      validateBeforeSubmit: true,
      showErrors: true,
      showWarnings: true,
      debounceMs: this.config.debounceMs,
      maxErrorsPerField: this.config.maxErrorsPerField,
      enableAsyncValidation: this.config.enableAsyncValidation,
      enableCrossFieldValidation: this.config.enableCrossFieldValidation,
      enableConsistencyChecks: this.config.enableConsistencyChecks,
      ...config
    };

    const fields: Record<string, FieldValidationState> = {};
    const globalErrors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate individual fields
    for (const rule of schema.rules) {
      if (!fields[rule.field]) {
        fields[rule.field] = this.createInitialFieldState(rule.field, formData[rule.field]);
      }

      const fieldResult = await this.validateField(
        rule.field, 
        formData[rule.field], 
        [rule], 
        formData
      );

      fields[rule.field] = {
        ...fields[rule.field],
        isValid: fieldResult.isValid,
        errors: fieldResult.errors,
        warnings: fieldResult.warnings,
        lastValidated: new Date()
      };
    }

    const isValid = Object.values(fields).every(field => field.isValid) && 
                   globalErrors.length === 0;

    const validationState: FormValidationState = {
      isValid,
      isDirty: true,
      isSubmitting: false,
      isValidating: false,
      fields,
      globalErrors,
      warnings,
      lastValidation: new Date(),
      validationCount: 1
    };

    return validationState;
  }

  /**
   * Validate hydraulic network configuration
   */
  async validateHydraulicConfiguration(config: any): Promise<ValidationBatchResult> {
    const startTime = Date.now();
    const results: Record<string, FieldValidationResult> = {};
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate fluid properties
    const fluidValidation = await this.validateFluidProperties(config.fluid);
    this.addResultsToBatch('fluid', fluidValidation, results, errors, warnings);

    // Validate network configuration
    const networkValidation = await this.validateNetworkConfiguration(config.network);
    this.addResultsToBatch('network', networkValidation, results, errors, warnings);

    // Validate pipe sections
    if (config.sections && Array.isArray(config.sections)) {
      for (let i = 0; i < config.sections.length; i++) {
        const sectionValidation = await this.validatePipeSection(config.sections[i]);
        this.addResultsToBatch(`sections[${i}]`, sectionValidation, results, errors, warnings);
      }
    }

    const totalFields = Object.keys(results).length;
    const validFields = Object.values(results).filter(r => r.isValid).length;
    const invalidFields = totalFields - validFields;

    const batchResult: ValidationBatchResult = {
      batchId: `validation_${Date.now()}`,
      timestamp: new Date(),
      totalFields,
      validatedFields: totalFields,
      validFields,
      invalidFields,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errors,
      warnings,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      results,
      performance: {
        totalTime: Date.now() - startTime,
        averageValidationTime: (Date.now() - startTime) / totalFields,
        slowestField: undefined,
        fastestField: undefined
      } as any
    };

    return batchResult;
  }

  /**
   * Apply validation rule
   */
  private async applyValidationRule(
    field: string,
    value: any,
    rule: ValidationRule,
    formData?: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check condition if specified
    if (rule.condition && !rule.condition(value, formData)) {
      const emptyResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        criticalError: undefined as any,
        hasErrors: false,
        hasWarnings: false
      };
      return emptyResult;
    }

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          errors.push(createValidationError(
            field,
            rule.message || `${field} is required`,
            { severity: ErrorSeverity.ERROR }
          ));
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          errors.push(createValidationError(
            field,
            rule.message || `${field} must be at least ${rule.value}`,
            { severity: ErrorSeverity.ERROR }
          ));
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          errors.push(createValidationError(
            field,
            rule.message || `${field} must not exceed ${rule.value}`,
            { severity: ErrorSeverity.ERROR }
          ));
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !(rule.value as RegExp).test(value)) {
          errors.push(createValidationError(
            field,
            rule.message || `${field} format is invalid`,
            { severity: ErrorSeverity.ERROR }
          ));
        }
        break;

      case 'custom':
        const customValidator = rule.value as (value: any, formData: any) => boolean;
        if (customValidator && !customValidator(value, formData)) {
          errors.push(createValidationError(
            field,
            rule.message || `${field} validation failed`,
            { severity: ErrorSeverity.ERROR }
          ));
        }
        break;

      case 'consistency':
        const otherField = (rule.value as any).otherField;
        const validator = (rule.value as any).validator;
        if (formData && formData[otherField] !== undefined) {
          const otherValue = formData[otherField];
          if (!validator(value, otherValue)) {
            errors.push(createValidationError(
              field,
              rule.message || `${field} is not consistent with ${otherField}`,
              { severity: ErrorSeverity.WARNING }
            ));
          }
        }
        break;
    }

    const criticalError = errors.find(e => e.severity === ErrorSeverity.CRITICAL);
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      criticalError: criticalError || undefined as any,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
    return result;
  }

  /**
   * Validate fluid properties
   */
  private async validateFluidProperties(fluid: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate phase
    if (fluid.phase && !['liquid', 'gas', 'vapor'].includes(fluid.phase)) {
      errors.push(createValidationError(
        'fluid.phase',
        'Invalid fluid phase. Must be liquid, gas, or vapor',
        { severity: ErrorSeverity.ERROR }
      ));
    }

    const criticalError = errors.find(e => e.severity === ErrorSeverity.CRITICAL);
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      criticalError: criticalError || undefined as any,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
    return result;
  }

  /**
   * Validate network configuration
   */
  private async validateNetworkConfiguration(network: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate direction
    if (network.direction && !['auto', 'forward', 'backward'].includes(network.direction)) {
      errors.push(createValidationError(
        'network.direction',
        'Invalid flow direction. Must be auto, forward, or backward',
        { severity: ErrorSeverity.ERROR }
      ));
    }

    const criticalError = errors.find(e => e.severity === ErrorSeverity.CRITICAL);
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      criticalError: criticalError || undefined as any,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
    return result;
  }

  /**
   * Validate pipe section
   */
  private async validatePipeSection(section: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate required fields
    if (!section.id) {
      errors.push(createValidationError(
        'section.id',
        'Section ID is required',
        { severity: ErrorSeverity.ERROR }
      ));
    }

    // Validate dimensions
    if (section.pipeDiameter && section.pipeDiameter <= 0) {
      errors.push(createValidationError(
        'section.pipeDiameter',
        'Pipe diameter must be positive',
        { severity: ErrorSeverity.ERROR }
      ));
    }

    if (section.length && section.length <= 0) {
      errors.push(createValidationError(
        'section.length',
        'Pipe length must be positive',
        { severity: ErrorSeverity.ERROR }
      ));
    }

    const criticalError = errors.find(e => e.severity === ErrorSeverity.CRITICAL);
    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      criticalError: criticalError || undefined as any,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
    return result;
  }

  /**
   * Add results to batch
   */
  private addResultsToBatch(
    prefix: string,
    validation: ValidationResult,
    results: Record<string, FieldValidationResult>,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      results[prefix] = {
        field: prefix,
        isValid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: []
      };
    }

    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  /**
   * Create initial field state
   */
  private createInitialFieldState(field: string, value: any): FieldValidationState {
    return {
      field,
      value,
      isValid: true,
      isDirty: false,
      isTouched: false,
      isLoading: false,
      errors: [],
      warnings: [],
      suggestions: [],
      lastValidated: null
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(field: string, value: any, rules: ValidationRule[]): string {
    return `${field}_${JSON.stringify(value)}_${rules.length}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): ValidationCacheEntry | null {
    const entry = this.validationCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.validationCache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cache
   */
  private setCache(key: string, value: any, result: FieldValidationResult): void {
    const entry: ValidationCacheEntry = {
      key,
      value,
      result,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL
    };

    this.validationCache.set(key, entry);
  }

  /**
   * Register validation schema
   */
  registerSchema(name: string, schema: ValidationSchema): void {
    this.validationSchemas.set(name, schema);
  }

  /**
   * Get validation schema
   */
  getSchema(name: string): ValidationSchema | undefined {
    return this.validationSchemas.get(name);
  }

  /**
   * Register validation rules for a field
   */
  registerRules(field: string, rules: ValidationRule[]): void {
    this.validationRules.set(field, rules);
  }

  /**
   * Get validation rules for a field
   */
  getRules(field: string): ValidationRule[] {
    return this.validationRules.get(field) || [];
  }

  /**
   * Subscribe to validation results
   */
  subscribeToValidation(callback: (result: ValidationResult) => void): () => void {
    const id = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.validationCallbacks.set(id, callback);
    
    return () => {
      this.validationCallbacks.delete(id);
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ValidationServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Clear validation rules
   */
  clearRules(): void {
    this.validationRules.clear();
  }

  /**
   * Clear validation schemas
   */
  clearSchemas(): void {
    this.validationSchemas.clear();
  }
}

// Create default instance
export const validationService = new ValidationService();

// Export default instance methods for convenience
export const validateField = validationService.validateField.bind(validationService);
export const validateForm = validationService.validateForm.bind(validationService);
export const validateHydraulicConfiguration = validationService.validateHydraulicConfiguration.bind(validationService);
export const registerSchema = validationService.registerSchema.bind(validationService);
export const getSchema = validationService.getSchema.bind(validationService);
export const registerRules = validationService.registerRules.bind(validationService);
export const getRules = validationService.getRules.bind(validationService);
export const subscribeToValidation = validationService.subscribeToValidation.bind(validationService);
export const updateConfig = validationService.updateConfig.bind(validationService);
export const clearCache = validationService.clearCache.bind(validationService);

export default ValidationService;