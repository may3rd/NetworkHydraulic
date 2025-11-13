import * as yup from 'yup';

// Fluid Configuration Schema
export const fluidSchema = yup.object({
  name: yup.string().optional(),
  phase: yup.string().oneOf(['liquid', 'gas', 'vapor']).required('Phase is required'),
  temperature: yup
    .number()
    .positive('Temperature must be positive')
    .required('Temperature is required')
    .min(0, 'Temperature must be greater than 0'),
  pressure: yup
    .number()
    .positive('Pressure must be positive')
    .required('Pressure is required')
    .min(0, 'Pressure must be greater than 0'),
  density: yup
    .number()
    .positive('Density must be positive')
    .when('phase', {
      is: 'liquid',
      then: (schema) => schema.required('Density is required for liquid phase'),
      otherwise: (schema) => schema.optional()
    }),
  molecularWeight: yup
    .number()
    .positive('Molecular weight must be positive')
    .when('phase', {
      is: (phase: string) => phase !== 'liquid',
      then: (schema) => schema.required('Molecular weight is required for gas/vapor phase'),
      otherwise: (schema) => schema.optional()
    }),
  zFactor: yup
    .number()
    .min(0, 'Z-factor must be positive')
    .max(1.5, 'Z-factor seems unusually high')
    .when('phase', {
      is: (phase: string) => phase !== 'liquid',
      then: (schema) => schema.optional(),
      otherwise: (schema) => schema.notRequired()
    }),
  specificHeatRatio: yup
    .number()
    .min(1, 'Specific heat ratio must be at least 1')
    .max(2, 'Specific heat ratio seems unusually high')
    .when('phase', {
      is: (phase: string) => phase !== 'liquid',
      then: (schema) => schema.required('Specific heat ratio is required for gas phase'),
      otherwise: (schema) => schema.notRequired()
    }),
  viscosity: yup
    .number()
    .positive('Viscosity must be positive')
    .required('Viscosity is required'),
  massFlowRate: yup
    .number()
    .positive('Mass flow rate must be positive')
    .optional(),
  volumetricFlowRate: yup
    .number()
    .positive('Volumetric flow rate must be positive')
    .optional(),
  standardFlowRate: yup
    .number()
    .positive('Standard flow rate must be positive')
    .optional()
}).test('flow-rate-consistency', 'Either mass flow rate or volumetric flow rate must be specified', function(value) {
  if (!value) return true;
  const { massFlowRate, volumetricFlowRate, density } = value;
  
  if (!massFlowRate && !volumetricFlowRate) {
    return this.createError({
      path: 'massFlowRate',
      message: 'Either mass flow rate or volumetric flow rate must be specified'
    });
  }
  
  // If both are provided, check consistency
  if (massFlowRate && volumetricFlowRate && density) {
    const calculatedMassFlow = volumetricFlowRate * density;
    const tolerance = 0.05; // 5% tolerance
    if (Math.abs(calculatedMassFlow - massFlowRate) / massFlowRate > tolerance) {
      return this.createError({
        path: 'massFlowRate',
        message: 'Mass and volumetric flow rates are inconsistent with given density'
      });
    }
  }
  
  return true;
});

// Pipe Section Schema
export const pipeSectionSchema = yup.object({
  id: yup.string().required('Section ID is required').min(1, 'Section ID cannot be empty'),
  description: yup.string().optional(),
  schedule: yup.string().required('Pipe schedule is required'),
  pipeNPD: yup
    .number()
    .positive('Nominal pipe size must be positive')
    .optional(),
  pipeDiameter: yup
    .number()
    .positive('Pipe diameter must be positive')
    .optional(),
  inletDiameter: yup
    .number()
    .positive('Inlet diameter must be positive')
    .optional(),
  outletDiameter: yup
    .number()
    .positive('Outlet diameter must be positive')
    .optional(),
  roughness: yup
    .number()
    .positive('Roughness must be positive')
    .required('Roughness is required')
    .max(1e-3, 'Roughness value seems unusually high'),
  length: yup
    .number()
    .positive('Length must be positive')
    .required('Length is required'),
  elevationChange: yup
    .number()
    .required('Elevation change is required'),
  fittingType: yup.string().oneOf(['LR', 'SR']).required('Fitting type is required'),
  fittings: yup.array().of(
    yup.object({
      type: yup.string().required('Fitting type is required'),
      count: yup.number().integer().min(0).required('Fitting count is required'),
      kFactor: yup.number().positive().optional()
    })
  ).required('Fittings array is required'),
  controlValve: yup.object({
    type: yup.string().required('Valve type is required'),
    coefficient: yup.number().positive().required('Valve coefficient is required'),
    opening: yup.number().min(0).max(1).required('Valve opening must be between 0 and 1')
  }).optional(),
  orifice: yup.object({
    diameter: yup.number().positive().required('Orifice diameter is required'),
    coefficient: yup.number().positive().required('Orifice coefficient is required')
  }).optional(),
  boundaryPressure: yup.number().positive().optional(),
  direction: yup.string().oneOf(['forward', 'backward', 'bidirectional']).optional(),
  designMargin: yup.number().min(0).max(100).optional(),
  userSpecifiedFixedLoss: yup.number().positive().optional()
}).test('diameter-consistency', 'Diameter configuration is inconsistent', function(value) {
  if (!value) return true;
  
  const { pipeNPD, pipeDiameter, inletDiameter, outletDiameter } = value;
  
  // At least one diameter specification must be provided
  if (!pipeNPD && !pipeDiameter) {
    return this.createError({
      path: 'pipeDiameter',
      message: 'Either nominal pipe size or pipe diameter must be specified'
    });
  }
  
  // If inlet/outlet diameters are provided, they should be consistent
  if (inletDiameter && outletDiameter && Math.abs(inletDiameter - outletDiameter) > 1e-6) {
    // Allow small differences for tapered sections
    if (inletDiameter < outletDiameter * 0.5 || inletDiameter > outletDiameter * 2) {
      return this.createError({
        path: 'inletDiameter',
        message: 'Inlet and outlet diameters differ significantly. Check if this is intentional.'
      });
    }
  }
  
  return true;
});

// Network Configuration Schema
export const networkSchema = yup.object({
  name: yup.string().required('Network name is required').min(1, 'Network name cannot be empty'),
  description: yup.string().optional(),
  direction: yup.string().oneOf(['auto', 'forward', 'backward']).required('Flow direction is required'),
  boundaryPressure: yup.number().positive().optional(),
  upstreamPressure: yup.number().positive().optional(),
  downstreamPressure: yup.number().positive().optional(),
  gasFlowModel: yup.string().oneOf(['isothermal', 'adiabatic']).optional(),
  outputUnits: yup.object({
    pressure: yup.string().optional(),
    temperature: yup.string().optional(),
    length: yup.string().optional(),
    flowRate: yup.string().optional()
  }).optional(),
  designMargin: yup.number().min(0).max(100).optional()
}).test('pressure-consistency', 'Pressure boundary conditions are inconsistent', function(value) {
  if (!value) return true;
  
  const { direction, upstreamPressure, downstreamPressure, boundaryPressure } = value;
  
  // For auto direction, at least one pressure must be specified
  if (direction === 'auto' && !upstreamPressure && !downstreamPressure && !boundaryPressure) {
    return this.createError({
      path: 'upstreamPressure',
      message: 'At least one pressure boundary condition must be specified for auto direction'
    });
  }
  
  // Check for pressure consistency
  if (upstreamPressure && downstreamPressure && upstreamPressure <= downstreamPressure) {
    return this.createError({
      path: 'upstreamPressure',
      message: 'Upstream pressure should be higher than downstream pressure for forward flow'
    });
  }
  
  return true;
});

// Main Configuration Schema
export const configurationSchema = yup.object({
  network: networkSchema.required('Network configuration is required'),
  fluid: fluidSchema.required('Fluid configuration is required'),
  sections: yup
    .array()
    .of(pipeSectionSchema.required())
    .min(1, 'At least one pipe section must be defined')
    .required('Pipe sections are required'),
  components: yup.array().optional()
});

// Fitting Schema
export const fittingSchema = yup.object({
  type: yup.string().required('Fitting type is required'),
  count: yup.number().integer().min(1, 'Fitting count must be at least 1').required(),
  kFactor: yup.number().positive('K-factor must be positive').optional(),
  description: yup.string().optional()
});

// Component Schema (Valve, Orifice, etc.)
export const componentSchema = yup.object({
  type: yup.string().required('Component type is required'),
  description: yup.string().optional(),
  specifications: yup.object().required('Component specifications are required')
});

// Validation Result Schema
export const validationResultSchema = yup.object({
  isValid: yup.boolean().required(),
  errors: yup.array().of(
    yup.object({
      field: yup.string().required(),
      message: yup.string().required(),
      severity: yup.string().oneOf(['error', 'warning', 'info']).required(),
      code: yup.string().optional(),
      suggestion: yup.string().optional()
    })
  ).required(),
  warnings: yup.array().of(
    yup.object({
      field: yup.string().required(),
      message: yup.string().required(),
      severity: yup.string().oneOf(['warning', 'info']).required(),
      suggestion: yup.string().optional()
    })
  ).required(),
  info: yup.array().of(
    yup.object({
      field: yup.string().required(),
      message: yup.string().required(),
      severity: yup.string().oneOf(['info']).required()
    })
  ).required()
});

// Export all schemas
export const schemas = {
  fluid: fluidSchema,
  pipeSection: pipeSectionSchema,
  network: networkSchema,
  configuration: configurationSchema,
  fitting: fittingSchema,
  component: componentSchema,
  validationResult: validationResultSchema
};

// Type definitions from schemas
export type FluidConfig = yup.InferType<typeof fluidSchema>;
export type PipeSectionConfig = yup.InferType<typeof pipeSectionSchema>;
export type NetworkConfig = yup.InferType<typeof networkSchema>;
export type Configuration = yup.InferType<typeof configurationSchema>;
export type FittingConfig = yup.InferType<typeof fittingSchema>;
export type ComponentConfig = yup.InferType<typeof componentSchema>;
export type ValidationResult = yup.InferType<typeof validationResultSchema>;