/**
 * Error Hooks Index for Hydraulic Network Web Application
 * 
 * This module exports all error-related hooks for easy import and usage.
 */

export { default as useError } from './useError';
export { default as useValidation } from './useValidation';

// Export types for convenience
export type { UseErrorOptions, UseErrorReturn } from './useError';
export type { UseValidationOptions, UseValidationReturn } from './useValidation';