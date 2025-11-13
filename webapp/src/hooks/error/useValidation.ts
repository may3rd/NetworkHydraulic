/**
 * Validation State Management Hook for Hydraulic Network Web Application
 * 
 * This hook provides validation state management for forms and real-time validation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FieldValidationState,
  FormValidationState,
  ValidationRule,
  ValidationSchema,
  ValidationConfig
} from '../../types/error/validationTypes';
import { ValidationError } from '../../types/error/errorTypes';
import { validationService } from '../../services/error/validationService';

export interface UseValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  enableAsyncValidation?: boolean;
  enableCrossFieldValidation?: boolean;
}

export interface UseValidationReturn {
  // State
  formState: FormValidationState;
  fieldStates: Record<string, FieldValidationState>;
  
  // Field validation
  validateField: (field: string, value: any, rules?: ValidationRule[]) => Promise<void>;
  validateForm: (data: any, schema: ValidationSchema) => Promise<FormValidationState>;
  setFieldValue: (field: string, value: any, validate?: boolean) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
  
  // Form state
  resetForm: () => void;
  clearValidation: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  
  // Getters
  getFieldValue: (field: string) => any;
  getFieldError: (field: string) => ValidationError | null;
  getFieldErrors: (field: string) => ValidationError[];
  isFieldValid: (field: string) => boolean;
  hasFormErrors: boolean;
  isValid: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  mode: 'onChange',
  validateBeforeSubmit: true,
  showErrors: true,
  showWarnings: true,
  debounceMs: 300,
  maxErrorsPerField: 5,
  enableAsyncValidation: true,
  enableCrossFieldValidation: true,
  enableConsistencyChecks: true
};

function useValidation(
  initialData: Record<string, any> = {},
  options: UseValidationOptions = {}
): UseValidationReturn {
  const [formState, setFormState] = useState<FormValidationState>({
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    isValidating: false,
    fields: {},
    globalErrors: [],
    warnings: [],
    lastValidation: null,
    validationCount: 0
  });

  const [fieldStates, setFieldStates] = useState<Record<string, FieldValidationState>>({});
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const config = { ...DEFAULT_CONFIG, ...options };

  // Initialize field states
  useEffect(() => {
    const initialFieldStates: Record<string, FieldValidationState> = {};
    Object.keys(initialData).forEach(field => {
      initialFieldStates[field] = {
        field,
        value: initialData[field],
        isValid: true,
        isDirty: false,
        isTouched: false,
        isLoading: false,
        errors: [],
        warnings: [],
        suggestions: [],
        lastValidated: null
      };
    });
    setFieldStates(initialFieldStates);
  }, [initialData]);

  // Validate single field
  const validateField = useCallback(async (
    field: string, 
    value: any, 
    rules: ValidationRule[] = []
  ): Promise<void> => {
    if (!rules || rules.length === 0) return;

    const fieldState = fieldStates[field];
    if (!fieldState) return;

    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        isLoading: true
      }
    }));

    try {
      const result = await validationService.validateField(field, value, rules, {
        ...initialData,
        [field]: value
      });

      setFieldStates(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
          lastValidated: new Date()
        }
      }));

      // Update form state
      setFormState(prev => {
        const allFieldsValid = Object.values({
          ...prev.fields,
          [field]: { ...fieldState, isValid: result.isValid }
        }).every(f => f.isValid);
        
        return {
          ...prev,
          isValid: allFieldsValid && prev.globalErrors.length === 0,
          validationCount: prev.validationCount + 1
        };
      });

    } catch (error) {
      console.error(`Validation error for field ${field}:`, error);
    } finally {
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isLoading: false
        }
      }));
    }
  }, [fieldStates, initialData]);

  // Debounced field validation
  const debouncedValidateField = useCallback((
    field: string, 
    value: any, 
    rules: ValidationRule[] = []
  ) => {
    // Clear existing timer
    const existingTimer = debounceTimers.current.get(field);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      validateField(field, value, rules);
      debounceTimers.current.delete(field);
    }, config.debounceMs);

    debounceTimers.current.set(field, timer);
  }, [validateField, config.debounceMs]);

  // Set field value
  const setFieldValue = useCallback((field: string, value: any, validate = true) => {
    // Update field state
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        isDirty: true
      }
    }));

    // Update initial data
    initialData[field] = value;

    // Validate if requested
    if (validate && config.validateOnChange) {
      const rules = validationService.getRules(field);
      debouncedValidateField(field, value, rules);
    }
  }, [initialData, config.validateOnChange, debouncedValidateField]);

  // Set field touched
  const setFieldTouched = useCallback((field: string, touched = true) => {
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        isTouched: touched
      }
    }));
  }, []);

  // Validate entire form
  const validateForm = useCallback(async (
    data: any, 
    schema: ValidationSchema
  ): Promise<FormValidationState> => {
    setFormState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await validationService.validateForm(data, schema, config);
      
      // Update field states from validation result
      setFieldStates(prev => {
        const newFieldStates = { ...prev };
        Object.keys(result.fields).forEach(field => {
          newFieldStates[field] = {
            ...newFieldStates[field],
            isValid: result.fields[field].isValid,
            errors: result.fields[field].errors,
            warnings: result.fields[field].warnings,
            lastValidated: new Date()
          };
        });
        return newFieldStates;
      });

      setFormState(result);
      return result;

    } catch (error) {
      console.error('Form validation error:', error);
      throw error;
    } finally {
      setFormState(prev => ({ ...prev, isValidating: false }));
    }
  }, [config]);

  // Reset form
  const resetForm = useCallback(() => {
    const resetFieldStates: Record<string, FieldValidationState> = {};
    
    Object.keys(initialData).forEach(field => {
      resetFieldStates[field] = {
        field,
        value: initialData[field],
        isValid: true,
        isDirty: false,
        isTouched: false,
        isLoading: false,
        errors: [],
        warnings: [],
        suggestions: [],
        lastValidated: null
      };
    });

    setFieldStates(resetFieldStates);
    setFormState({
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      isValidating: false,
      fields: resetFieldStates,
      globalErrors: [],
      warnings: [],
      lastValidation: null,
      validationCount: 0
    });
  }, [initialData]);

  // Clear validation
  const clearValidation = useCallback(() => {
    const clearedFieldStates = Object.keys(fieldStates).reduce((acc, field) => {
      acc[field] = {
        ...fieldStates[field],
        errors: [],
        warnings: [],
        isValid: true
      };
      return acc;
    }, {} as Record<string, FieldValidationState>);

    setFieldStates(clearedFieldStates);
    setFormState(prev => ({
      ...prev,
      globalErrors: [],
      warnings: [],
      isValid: true
    }));
  }, [fieldStates]);

  // Set submitting state
  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState(prev => ({ ...prev, isSubmitting }));
  }, []);

  // Get field value
  const getFieldValue = useCallback((field: string) => {
    return fieldStates[field]?.value;
  }, [fieldStates]);

  // Get field error
  const getFieldError = useCallback((field: string) => {
    const errors = fieldStates[field]?.errors || [];
    return errors.length > 0 ? errors[0] : null;
  }, [fieldStates]);

  // Get field errors
  const getFieldErrors = useCallback((field: string) => {
    return fieldStates[field]?.errors || [];
  }, [fieldStates]);

  // Check if field is valid
  const isFieldValid = useCallback((field: string) => {
    return fieldStates[field]?.isValid ?? true;
  }, [fieldStates]);

  // Check if form has errors
  const hasFormErrors = !formState.isValid;

  // Overall validation state
  const isValid = formState.isValid;

  return {
    // State
    formState,
    fieldStates,
    
    // Field validation
    validateField,
    validateForm,
    setFieldValue,
    setFieldTouched,
    
    // Form state
    resetForm,
    clearValidation,
    setIsSubmitting,
    
    // Getters
    getFieldValue,
    getFieldError,
    getFieldErrors,
    isFieldValid,
    hasFormErrors,
    isValid
  };
}

export default useValidation;