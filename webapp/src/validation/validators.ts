import { ValidationError, ValidationWarning } from '../components/file/FilePreview';

// Hydraulic calculation validation functions

/**
 * Validates Reynolds number calculation and range
 */
export const validateReynoldsNumber = (
  velocity: number,
  diameter: number,
  density: number,
  viscosity: number,
  sectionId?: string
): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];
  
  if (!velocity || !diameter || !density || !viscosity) {
    return warnings;
  }
  
  const reynolds = (density * velocity * diameter) / viscosity;
  
  if (reynolds < 2000) {
    warnings.push({
      field: `section.${sectionId}.reynolds`,
      message: `Low Reynolds number (${reynolds.toFixed(0)}) indicates laminar flow`,
      severity: 'warning',
      path: sectionId ? `sections.${sectionId}` : 'fluid'
    });
  } else if (reynolds > 100000) {
    warnings.push({
      field: `section.${sectionId}.reynolds`,
      message: `High Reynolds number (${reynolds.toFixed(0)}) indicates turbulent flow`,
      severity: 'warning',
      path: sectionId ? `sections.${sectionId}` : 'fluid'
    });
  }
  
  return warnings;
};

/**
 * Validates velocity limits for different fluid types
 */
export const validateVelocity = (
  velocity: number,
  phase: string,
  sectionId?: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!velocity) return errors;
  
  const limits = {
    liquid: { min: 0.1, max: 15 }, // m/s
    gas: { min: 0.5, max: 30 },     // m/s
    vapor: { min: 0.5, max: 30 }    // m/s
  };
  
  const limit = limits[phase as keyof typeof limits];
  if (!limit) return errors;
  
  if (velocity < limit.min) {
    errors.push({
      field: `section.${sectionId}.velocity`,
      message: `Velocity (${velocity.toFixed(2)} m/s) is below recommended minimum (${limit.min} m/s)`,
      severity: 'warning',
      suggestion: 'Consider increasing flow rate or reducing pipe diameter',
      path: sectionId ? `sections.${sectionId}` : 'fluid'
    });
  }
  
  if (velocity > limit.max) {
    errors.push({
      field: `section.${sectionId}.velocity`,
      message: `Velocity (${velocity.toFixed(2)} m/s) exceeds recommended maximum (${limit.max} m/s)`,
      severity: 'error',
      suggestion: 'Consider reducing flow rate or increasing pipe diameter',
      path: sectionId ? `sections.${sectionId}` : 'fluid'
    });
  }
  
  return errors;
};

/**
 * Validates pressure drop calculations
 */
export const validatePressureDrop = (
  pressureDrop: number,
  inletPressure: number,
  sectionId?: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!pressureDrop || !inletPressure) return errors;
  
  // Check for excessive pressure drop
  const pressureDropRatio = pressureDrop / inletPressure;
  
  if (pressureDropRatio > 0.5) {
    errors.push({
      field: `section.${sectionId}.pressureDrop`,
      message: `Pressure drop (${pressureDrop.toFixed(2)} Pa) is ${pressureDropRatio.toFixed(1)}% of inlet pressure`,
      severity: 'warning',
      suggestion: 'Consider larger pipe diameter or smoother fittings',
      path: sectionId ? `sections.${sectionId}` : 'sections'
    });
  }
  
  // Check for negative pressure drop (unusual for single phase flow)
  if (pressureDrop < 0) {
    errors.push({
      field: `section.${sectionId}.pressureDrop`,
      message: `Negative pressure drop (${pressureDrop.toFixed(2)} Pa) detected`,
      severity: 'error',
      suggestion: 'Verify flow direction and boundary conditions',
      path: sectionId ? `sections.${sectionId}` : 'sections'
    });
  }
  
  return errors;
};

/**
 * Validates pipe diameter合理性
 */
export const validatePipeDiameter = (
  diameter: number,
  flowRate: number,
  velocity: number,
  phase: string,
  sectionId?: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!diameter || !flowRate) return errors;
  
  // Calculate expected diameter from flow rate and velocity
  const calculatedArea = flowRate / (velocity || 1); // Use 1 as default velocity if not provided
  const calculatedDiameter = 2 * Math.sqrt(calculatedArea / Math.PI);
  
  const diameterRatio = diameter / calculatedDiameter;
  
  if (diameterRatio > 2) {
    errors.push({
      field: `section.${sectionId}.diameter`,
      message: `Pipe diameter (${diameter.toFixed(3)} m) is significantly larger than needed`,
      severity: 'warning',
      suggestion: 'Consider smaller diameter to reduce cost and pressure drop',
      path: sectionId ? `sections.${sectionId}` : 'sections'
    });
  } else if (diameterRatio < 0.5) {
    errors.push({
      field: `section.${sectionId}.diameter`,
      message: `Pipe diameter (${diameter.toFixed(3)} m) may be too small for required flow rate`,
      severity: 'error',
      suggestion: 'Consider larger diameter to avoid excessive pressure drop',
      path: sectionId ? `sections.${sectionId}` : 'sections'
    });
  }
  
  return errors;
};

/**
 * Validates fluid properties consistency
 */
export const validateFluidProperties = (
  phase: string,
  temperature: number,
  pressure: number,
  density?: number,
  molecularWeight?: number,
  zFactor?: number,
  specificHeatRatio?: number
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Temperature validation
  if (temperature) {
    if (phase === 'liquid' && temperature < 273.15) {
      errors.push({
        field: 'fluid.temperature',
        message: `Temperature (${temperature.toFixed(2)} K) is below freezing`,
        severity: 'warning',
        suggestion: 'Verify if liquid will remain in liquid phase',
        path: 'fluid'
      });
    } else if (temperature > 600) {
      errors.push({
        field: 'fluid.temperature',
        message: `Temperature (${temperature.toFixed(2)} K) is very high`,
        severity: 'warning',
        suggestion: 'Consider material limitations and thermal effects',
        path: 'fluid'
      });
    }
  }
  
  // Pressure validation
  if (pressure) {
    if (pressure < 1000) {
      errors.push({
        field: 'fluid.pressure',
        message: `Pressure (${pressure.toFixed(2)} Pa) is very low`,
        severity: 'warning',
        suggestion: 'Verify pressure units and boundary conditions',
        path: 'fluid'
      });
    } else if (pressure > 10e6) {
      errors.push({
        field: 'fluid.pressure',
        message: `Pressure (${pressure.toFixed(2)} Pa) is very high`,
        severity: 'warning',
        suggestion: 'Consider pressure safety requirements',
        path: 'fluid'
      });
    }
  }
  
  // Density validation for liquids
  if (phase === 'liquid' && density) {
    if (density < 100) {
      errors.push({
        field: 'fluid.density',
        message: `Density (${density.toFixed(2)} kg/m³) is very low for liquid`,
        severity: 'error',
        suggestion: 'Verify fluid properties and units',
        path: 'fluid'
      });
    } else if (density > 2000) {
      errors.push({
        field: 'fluid.density',
        message: `Density (${density.toFixed(2)} kg/m³) is very high for liquid`,
        severity: 'warning',
        suggestion: 'Verify if this is a slurry or dense fluid',
        path: 'fluid'
      });
    }
  }
  
  // Molecular weight validation for gases
  if (phase !== 'liquid' && molecularWeight) {
    if (molecularWeight < 2) {
      errors.push({
        field: 'fluid.molecularWeight',
        message: `Molecular weight (${molecularWeight.toFixed(2)} kg/kmol) is very low`,
        severity: 'error',
        suggestion: 'Verify molecular weight units (should be kg/kmol)',
        path: 'fluid'
      });
    } else if (molecularWeight > 500) {
      errors.push({
        field: 'fluid.molecularWeight',
        message: `Molecular weight (${molecularWeight.toFixed(2)} kg/kmol) is very high`,
        severity: 'warning',
        suggestion: 'Verify if this is a heavy hydrocarbon or vapor',
        path: 'fluid'
      });
    }
  }
  
  // Z-factor validation for gases
  if (phase !== 'liquid' && zFactor !== undefined) {
    if (zFactor < 0.1 || zFactor > 2) {
      errors.push({
        field: 'fluid.zFactor',
        message: `Z-factor (${zFactor.toFixed(3)}) is outside normal range`,
        severity: 'error',
        suggestion: 'Verify gas composition and conditions',
        path: 'fluid'
      });
    }
  }
  
  // Specific heat ratio validation for gases
  if (phase !== 'liquid' && specificHeatRatio !== undefined) {
    if (specificHeatRatio < 1 || specificHeatRatio > 2) {
      errors.push({
        field: 'fluid.specificHeatRatio',
        message: `Specific heat ratio (${specificHeatRatio.toFixed(3)}) is outside normal range`,
        severity: 'error',
        suggestion: 'Verify gas properties',
        path: 'fluid'
      });
    }
  }
  
  return errors;
};

/**
 * Validates section continuity (diameter matching between sections)
 */
export const validateSectionContinuity = (
  sections: Array<{
    id: string;
    outletDiameter?: number;
    inletDiameter?: number;
    pipeDiameter?: number;
    pipeNPD?: number;
  }>
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (sections.length < 2) return errors;
  
  for (let i = 0; i < sections.length - 1; i++) {
    const currentSection = sections[i];
    const nextSection = sections[i + 1];
    
    const currentDiameter = currentSection.outletDiameter || currentSection.pipeDiameter;
    const nextDiameter = nextSection.inletDiameter || nextSection.pipeDiameter;
    
    if (currentDiameter && nextDiameter) {
      const diameterRatio = currentDiameter / nextDiameter;
      
      if (diameterRatio > 1.5 || diameterRatio < 0.67) {
        errors.push({
          field: `sections[${i}].outletDiameter`,
          message: `Significant diameter change between sections ${currentSection.id} and ${nextSection.id}`,
          severity: 'warning',
          suggestion: 'Consider gradual transition or special fittings',
          path: `sections[${i}]`
        });
      }
    }
  }
  
  return errors;
};

/**
 * Validates flow rate consistency across sections
 */
export const validateFlowRateConsistency = (
  sections: Array<{
    id: string;
    flowRate?: number;
    inletArea?: number;
    outletArea?: number;
  }>,
  fluid: { phase: string; density?: number }
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (sections.length < 2) return errors;
  
  // For incompressible flow, mass flow rate should be constant
  if (fluid.phase === 'liquid') {
    for (let i = 1; i < sections.length; i++) {
      const prevSection = sections[i - 1];
      const currentSection = sections[i];
      
      if (prevSection.flowRate && currentSection.flowRate) {
        const flowDifference = Math.abs(prevSection.flowRate - currentSection.flowRate) / prevSection.flowRate;
        
        if (flowDifference > 0.01) { // 1% tolerance
          errors.push({
            field: `sections[${i}].flowRate`,
            message: `Flow rate mismatch between sections ${prevSection.id} and ${currentSection.id}`,
            severity: 'error',
            suggestion: 'Verify mass balance and check for leaks or additions',
            path: `sections[${i}]`
          });
        }
      }
    }
  }
  
  return errors;
};

/**
 * Validates overall network configuration
 */
export const validateNetworkConfiguration = (
  network: {
    direction: string;
    upstreamPressure?: number;
    downstreamPressure?: number;
    boundaryPressure?: number;
  },
  sections: any[],
  fluid: { phase: string }
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  const { direction, upstreamPressure, downstreamPressure, boundaryPressure } = network;
  
  // Validate pressure boundary conditions
  if (direction === 'forward' && (!upstreamPressure || !downstreamPressure)) {
    errors.push({
      field: 'network.upstreamPressure',
      message: 'Both upstream and downstream pressures required for forward flow',
      severity: 'error',
      suggestion: 'Specify pressure at both boundaries',
      path: 'network'
    });
  }
  
  if (direction === 'backward' && (!upstreamPressure || !downstreamPressure)) {
    errors.push({
      field: 'network.downstreamPressure',
      message: 'Both upstream and downstream pressures required for backward flow',
      severity: 'error',
      suggestion: 'Specify pressure at both boundaries',
      path: 'network'
    });
  }
  
  // Validate section count
  if (sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'At least one pipe section must be defined',
      severity: 'error',
      suggestion: 'Add pipe sections to define the network',
      path: 'sections'
    });
  }
  
  // Validate gas flow model selection
  if (fluid.phase !== 'liquid' && !(network as any).gasFlowModel) {
    errors.push({
      field: 'network.gasFlowModel',
      message: 'Gas flow model must be specified for gas/vapor phases',
      severity: 'warning',
      suggestion: 'Select isothermal or adiabatic flow model',
      path: 'network'
    });
  }
  
  return errors;
};

// Export all validation functions
export const validationFunctions = {
  validateReynoldsNumber,
  validateVelocity,
  validatePressureDrop,
  validatePipeDiameter,
  validateFluidProperties,
  validateSectionContinuity,
  validateFlowRateConsistency,
  validateNetworkConfiguration
};