import { useState, useCallback } from 'react';
import * as yup from 'yup';
import { ValidationResult, ValidationError, ValidationWarning } from '../components/file/FilePreview';

export interface UseValidationOptions {
  schema?: yup.Schema<any>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceTime?: number;
}

export const useValidation = (options: UseValidationOptions = {}) => {
  const {
    schema,
    validateOnChange = true,
    validateOnBlur = true,
    debounceTime = 300
  } = options;

  const [validationResults, setValidationResults] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    info: []
  });

  const [isValidating, setIsValidating] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Main validation function
  const validateData = useCallback(async (data: any): Promise<ValidationResult> => {
    setIsValidating(true);

    const results: ValidationResult[] = [];

    try {
      // Schema validation
      if (schema) {
        try {
          await schema.validate(data, { abortEarly: false });
          results.push({
            isValid: true,
            errors: [],
            warnings: [],
            info: []
          });
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            const schemaErrors: ValidationError[] = error.inner.map((innerError) => ({
              field: innerError.path || 'unknown',
              message: innerError.message,
              severity: 'error',
              suggestion: getSuggestionForField(innerError.path || '')
            }));

            results.push({
              isValid: false,
              errors: schemaErrors,
              warnings: [],
              info: []
            });
          }
        }
      } else {
        // If no schema, assume valid
        results.push({
          isValid: true,
          errors: [],
          warnings: [],
          info: []
        });
      }

      // Merge all validation results
      const mergedResult = mergeValidationResults(results);
      setValidationResults(mergedResult);

      return mergedResult;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          field: 'validation',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          suggestion: 'Please check the data format'
        }],
        warnings: [],
        info: []
      };

      setValidationResults(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [schema]);

  // Field-specific validation
  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    formData: any
  ): Promise<ValidationResult> => {
    const fieldData = { ...formData, [fieldName]: value };
    return validateData(fieldData);
  }, [validateData]);

  // Touch field (for showing validation on blur)
  const touchField = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, []);

  // Reset validation state
  const resetValidation = useCallback(() => {
    setValidationResults({
      isValid: false,
      errors: [],
      warnings: [],
      info: []
    });
    setTouchedFields(new Set());
  }, []);

  // Get field validation state
  const getFieldState = useCallback((fieldName: string) => {
    const fieldErrors = validationResults.errors.filter(error => 
      error.field === fieldName || error.field.startsWith(`${fieldName}.`)
    );
    
    const fieldWarnings = validationResults.warnings.filter(warning => 
      warning.field === fieldName || warning.field.startsWith(`${fieldName}.`)
    );

    const hasError = fieldErrors.length > 0;
    const hasWarning = fieldWarnings.length > 0;
    const isTouched = touchedFields.has(fieldName);

    return {
      hasError,
      hasWarning,
      isTouched,
      error: fieldErrors[0]?.message,
      warning: fieldWarnings[0]?.message,
      isValid: !hasError && (!hasWarning || fieldWarnings.every(w => w.severity === 'warning'))
    };
  }, [validationResults, touchedFields]);

  // Get all errors for a section
  const getSectionErrors = useCallback((sectionName: string) => {
    return validationResults.errors.filter(error => 
      error.field.startsWith(`${sectionName}.`) || error.field === sectionName
    );
  }, [validationResults.errors]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const errorCount = validationResults.errors.length;
    const warningCount = validationResults.warnings.length;
    const infoCount = validationResults.info.length;

    return {
      errorCount,
      warningCount,
      infoCount,
      isValid: validationResults.isValid,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      severity: errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success'
    };
  }, [validationResults]);

  return {
    // State
    validationResults,
    isValidating,
    touchedFields,

    // Actions
    validateData,
    validateField,
    touchField,
    resetValidation,

    // Getters
    getFieldState,
    getSectionErrors,
    getValidationSummary,

    // Utilities
    hasErrors: validationResults.errors.length > 0,
    hasWarnings: validationResults.warnings.length > 0,
    isValid: validationResults.isValid
  };
};

// Helper function to merge validation results
const mergeValidationResults = (results: ValidationResult[]): ValidationResult => {
  const merged: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  };

  for (const result of results) {
    if (!result.isValid) {
      merged.isValid = false;
    }

    merged.errors.push(...result.errors);
    merged.warnings.push(...result.warnings);
    merged.info.push(...result.info);
  }

  return merged;
};

// Helper function to get suggestions for fields
const getSuggestionForField = (field: string): string => {
  const suggestions: Record<string, string> = {
    'fluid.temperature': 'Ensure temperature is in Kelvin',
    'fluid.pressure': 'Ensure pressure is in Pascals',
    'fluid.density': 'Density should be in kg/m³ for liquids',
    'fluid.molecularWeight': 'Molecular weight should be in kg/kmol for gases',
    'fluid.viscosity': 'Viscosity should be in Pa·s',
    'network.name': 'Provide a descriptive name for the network',
    'network.direction': 'Choose auto for automatic direction detection',
    'sections': 'Add at least one pipe section to define the network',
    'sections.length': 'Length should be in meters',
    'sections.diameter': 'Diameter should be in meters',
    'sections.roughness': 'Roughness should be in meters (typically 1e-6 to 1e-3)',
    'sections.elevationChange': 'Elevation change should be in meters'
  };

  return suggestions[field] || 'Please check the field format and units';
};

export default useValidation;