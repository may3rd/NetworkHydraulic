import * as yup from 'yup';
import { ValidationError, ValidationWarning, ValidationResult } from '../components/file/FilePreview';
import { schemas, type Configuration, type FluidConfig, type PipeSectionConfig } from './schemas';

/**
 * Validates a configuration object against the Yup schema
 */
export const validateConfiguration = async (config: any): Promise<ValidationResult> => {
  try {
    await schemas.configuration.validate(config, { abortEarly: false });
    return {
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: ValidationError[] = error.inner.map((innerError) => ({
        field: innerError.path || 'unknown',
        message: innerError.message,
        severity: 'error',
        suggestion: getSuggestionForField(innerError.path || '')
      }));
      
      return {
        isValid: false,
        errors,
        warnings: [],
        info: []
      };
    }
    
    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed with unknown error',
        severity: 'error',
        suggestion: 'Please check the configuration format'
      }],
      warnings: [],
      info: []
    };
  }
};

/**
 * Validates individual configuration sections
 */
export const validateConfigurationSection = async (
  section: string, 
  data: any
): Promise<ValidationResult> => {
  try {
    const sectionSchema = getSectionSchema(section);
    if (!sectionSchema) {
      return {
        isValid: false,
        errors: [{
          field: section,
          message: `Unknown configuration section: ${section}`,
          severity: 'error',
          suggestion: 'Please use a valid configuration section'
        }],
        warnings: [],
        info: []
      };
    }
    
    await sectionSchema.validate(data, { abortEarly: false });
    return {
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: ValidationError[] = error.inner.map((innerError) => ({
        field: `${section}.${innerError.path || 'unknown'}`,
        message: innerError.message,
        severity: 'error',
        suggestion: getSuggestionForField(`${section}.${innerError.path || ''}`)
      }));
      
      return {
        isValid: false,
        errors,
        warnings: [],
        info: []
      };
    }
    
    return {
      isValid: false,
      errors: [{
        field: section,
        message: 'Section validation failed',
        severity: 'error',
        suggestion: 'Please check the section format'
      }],
      warnings: [],
      info: []
    };
  }
};

/**
 * Gets the appropriate schema for a configuration section
 */
const getSectionSchema = (section: string) => {
  switch (section) {
    case 'fluid':
      return schemas.fluid;
    case 'network':
      return schemas.network;
    case 'sections':
      return yup.array().of(schemas.pipeSection);
    case 'fittings':
      return schemas.fitting;
    case 'components':
      return schemas.component;
    default:
      return null;
  }
};

/**
 * Gets suggestions for common validation errors
 */
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

/**
 * Validates YAML content and converts to JSON
 */
export const validateYamlContent = (yamlContent: string): ValidationResult => {
  try {
    // Basic YAML structure validation
    if (!yamlContent.trim()) {
      return {
        isValid: false,
        errors: [{
          field: 'yaml',
          message: 'YAML content cannot be empty',
          severity: 'error',
          suggestion: 'Please provide YAML content'
        }],
        warnings: [],
        info: []
      };
    }
    
    // Check for common YAML issues
    const warnings: ValidationWarning[] = [];
    
    // Check for tabs (YAML should use spaces)
    if (yamlContent.includes('\t')) {
      warnings.push({
        field: 'yaml.indentation',
        message: 'YAML should use spaces for indentation, not tabs',
        severity: 'warning',
        suggestion: 'Replace tabs with spaces (typically 2 spaces per level)'
      });
    }
    
    // Check for common configuration patterns
    const lines = yamlContent.split('\n');
    let hasNetwork = false;
    let hasFluid = false;
    let hasSections = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('network:')) hasNetwork = true;
      if (trimmedLine.startsWith('fluid:')) hasFluid = true;
      if (trimmedLine.startsWith('sections:')) hasSections = true;
    }
    
    if (!hasNetwork) {
      warnings.push({
        field: 'yaml.structure',
        message: 'Missing network configuration',
        severity: 'warning',
        suggestion: 'Add network section with name and direction'
      });
    }
    
    if (!hasFluid) {
      warnings.push({
        field: 'yaml.structure',
        message: 'Missing fluid configuration',
        severity: 'warning',
        suggestion: 'Add fluid section with phase, temperature, and pressure'
      });
    }
    
    if (!hasSections) {
      warnings.push({
        field: 'yaml.structure',
        message: 'Missing pipe sections',
        severity: 'warning',
        suggestion: 'Add sections array with at least one pipe section'
      });
    }
    
    return {
      isValid: true,
      errors: [],
      warnings,
      info: [{
        field: 'yaml',
        message: 'YAML structure appears valid',
        severity: 'info'
      }]
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'yaml',
        message: 'Invalid YAML format',
        severity: 'error',
        suggestion: 'Check YAML syntax and structure'
      }],
      warnings: [],
      info: []
    };
  }
};

/**
 * Validates JSON content
 */
export const validateJsonContent = (jsonContent: string): ValidationResult => {
  try {
    if (!jsonContent.trim()) {
      return {
        isValid: false,
        errors: [{
          field: 'json',
          message: 'JSON content cannot be empty',
          severity: 'error',
          suggestion: 'Please provide JSON content'
        }],
        warnings: [],
        info: []
      };
    }
    
    const parsed = JSON.parse(jsonContent);
    
    // Check for required top-level keys
    const warnings: ValidationWarning[] = [];
    const requiredKeys = ['network', 'fluid', 'sections'];
    
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        warnings.push({
          field: `json.${key}`,
          message: `Missing required key: ${key}`,
          severity: 'warning',
          suggestion: `Add ${key} to the configuration`
        });
      }
    }
    
    return {
      isValid: true,
      errors: [],
      warnings,
      info: [{
        field: 'json',
        message: 'JSON structure is valid',
        severity: 'info'
      }]
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'json',
        message: 'Invalid JSON format',
        severity: 'error',
        suggestion: 'Check JSON syntax and structure'
      }],
      warnings: [],
      info: []
    };
  }
};

/**
 * Formats validation results for display
 */
export const formatValidationResults = (results: ValidationResult): string => {
  const { isValid, errors, warnings, info } = results;
  
  if (isValid) {
    return 'Configuration is valid';
  }
  
  const messages: string[] = [];
  
  if (errors.length > 0) {
    messages.push(`Errors: ${errors.length}`);
    errors.forEach(error => {
      messages.push(`  - ${error.field}: ${error.message}`);
    });
  }
  
  if (warnings.length > 0) {
    messages.push(`Warnings: ${warnings.length}`);
    warnings.forEach(warning => {
      messages.push(`  - ${warning.field}: ${warning.message}`);
    });
  }
  
  if (info.length > 0) {
    messages.push(`Info: ${info.length}`);
    info.forEach(infoItem => {
      messages.push(`  - ${infoItem.field}: ${infoItem.message}`);
    });
  }
  
  return messages.join('\n');
};

/**
 * Merges multiple validation results
 */
export const mergeValidationResults = (results: ValidationResult[]): ValidationResult => {
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

/**
 * Checks if configuration has changed significantly
 */
export const hasSignificantChanges = (
  oldConfig: any,
  newConfig: any,
  threshold: number = 0.1
): boolean => {
  try {
    // Compare key configuration values
    const comparisons = [
      { path: 'fluid.temperature', threshold },
      { path: 'fluid.pressure', threshold },
      { path: 'fluid.density', threshold },
      { path: 'network.upstreamPressure', threshold },
      { path: 'network.downstreamPressure', threshold }
    ];
    
    for (const comparison of comparisons) {
      const oldValue = getValueAtPath(oldConfig, comparison.path);
      const newValue = getValueAtPath(newConfig, comparison.path);
      
      if (oldValue !== undefined && newValue !== undefined && oldValue !== 0) {
        const change = Math.abs(newValue - oldValue) / oldValue;
        if (change > comparison.threshold) {
          return true;
        }
      }
    }
    
    // Check for section count changes
    const oldSections = oldConfig?.sections?.length || 0;
    const newSections = newConfig?.sections?.length || 0;
    
    if (oldSections !== newSections) {
      return true;
    }
    
    return false;
  } catch (error) {
    return true; // Assume changes if comparison fails
  }
};

/**
 * Gets a value from an object using a dot-notation path
 */
const getValueAtPath = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Sanitizes configuration by removing invalid values
 */
export const sanitizeConfiguration = (config: any): any => {
  const sanitized = JSON.parse(JSON.stringify(config));
  
  // Remove undefined values
  const removeUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined).filter(item => item !== undefined);
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          result[key] = removeUndefined(value);
        }
      }
      return Object.keys(result).length > 0 ? result : undefined;
    }
    return obj;
  };
  
  return removeUndefined(sanitized);
};

// Export all utility functions
export const validationUtils = {
  validateConfiguration,
  validateConfigurationSection,
  validateYamlContent,
  validateJsonContent,
  formatValidationResults,
  mergeValidationResults,
  hasSignificantChanges,
  sanitizeConfiguration
};