/**
 * Sample hydraulic configurations for testing
 */

// Type definitions for testing
interface FluidConfiguration {
  phase: 'liquid' | 'gas' | 'vapor';
  temperature: number;
  pressure: number;
  density?: number;
  molecularWeight?: number;
  zFactor?: number;
  specificHeatRatio?: number;
  viscosity: number;
  massFlowRate?: number;
  volumetricFlowRate?: number;
  standardFlowRate?: number;
}

interface NetworkConfiguration {
  name: string;
  description?: string;
  direction: 'auto' | 'forward' | 'backward';
  boundaryPressure?: number;
  upstreamPressure?: number;
  downstreamPressure?: number;
  gasFlowModel?: 'isothermal' | 'adiabatic';
  outputUnits?: OutputUnitsConfiguration;
  designMargin?: number;
}

interface OutputUnitsConfiguration {
  pressure?: string;
  temperature?: string;
  length?: string;
  flowRate?: string;
}

interface PipeSection {
  id: string;
  description?: string;
  pipeNPD?: number;
  schedule: string;
  pipeDiameter?: number;
  inletDiameter?: number;
  outletDiameter?: number;
  roughness: number;
  length: number;
  elevationChange: number;
  fittingType: 'LR' | 'SR';
  fittings: Fitting[];
  controlValve?: ControlValve;
  orifice?: Orifice;
  boundaryPressure?: number;
  direction?: 'forward' | 'backward' | 'bidirectional';
  designMargin?: number;
  userSpecifiedFixedLoss?: number;
}

interface Fitting {
  type: string;
  count: number;
  kFactor: number;
}

interface ControlValve {
  type: string;
  cv: number;
  opening: number;
}

interface Orifice {
  diameter: number;
  betaRatio: number;
  coefficient: number;
}

// Sample fluid configurations
export const sampleFluids = {
  // Natural gas
  naturalGas: {
    phase: 'gas',
    temperature: 293.15,
    pressure: 101325,
    molecularWeight: 17.0,
    zFactor: 1.0,
    specificHeatRatio: 1.3,
    viscosity: 1.1e-5,
    massFlowRate: 0.5,
  } as FluidConfiguration,

  // Air
  air: {
    phase: 'gas',
    temperature: 293.15,
    pressure: 101325,
    molecularWeight: 28.97,
    zFactor: 1.0,
    specificHeatRatio: 1.4,
    viscosity: 1.8e-5,
    massFlowRate: 0.1,
  } as FluidConfiguration,

  // Water
  water: {
    phase: 'liquid',
    temperature: 293.15,
    pressure: 101325,
    density: 998,
    viscosity: 1.0e-3,
    volumetricFlowRate: 0.01,
  } as FluidConfiguration,

  // Steam
  steam: {
    phase: 'vapor',
    temperature: 473.15,
    pressure: 200000,
    molecularWeight: 18.0,
    zFactor: 0.95,
    specificHeatRatio: 1.3,
    viscosity: 1.5e-5,
    massFlowRate: 0.05,
  } as FluidConfiguration,
};

// Sample network configurations
export const sampleNetworks = {
  // Simple pipeline
  simplePipeline: {
    name: 'Simple Pipeline',
    description: 'Basic single pipeline configuration',
    direction: 'auto',
    boundaryPressure: 101325,
    upstreamPressure: 110000,
    downstreamPressure: 100000,
    gasFlowModel: 'isothermal',
    designMargin: 0,
    outputUnits: {
      pressure: 'kPa',
      temperature: '°C',
      length: 'm',
      flowRate: 'm³/s',
    },
  } as NetworkConfiguration,

  // Complex network
  complexNetwork: {
    name: 'Complex Network',
    description: 'Multi-section network with fittings',
    direction: 'forward',
    boundaryPressure: 200000,
    upstreamPressure: 250000,
    downstreamPressure: 150000,
    gasFlowModel: 'adiabatic',
    designMargin: 10,
    outputUnits: {
      pressure: 'psi',
      temperature: '°F',
      length: 'ft',
      flowRate: 'cfm',
    },
  } as NetworkConfiguration,
};

// Sample pipe sections
export const samplePipeSections = {
  // Straight pipe section
  straightSection: {
    id: 'section-1',
    description: 'Straight pipe section',
    pipeNPD: 2,
    schedule: '40',
    roughness: 4.6e-5,
    length: 100,
    elevationChange: 0,
    fittingType: 'LR',
    fittings: [],
    designMargin: 0,
    userSpecifiedFixedLoss: 0,
  } as PipeSection,

  // Section with elevation
  elevatedSection: {
    id: 'section-2',
    description: 'Elevated pipe section',
    pipeNPD: 3,
    schedule: '40',
    roughness: 4.6e-5,
    length: 50,
    elevationChange: 25,
    fittingType: 'SR',
    fittings: [
      {
        type: 'elbow',
        count: 2,
        kFactor: 0.9,
      },
    ],
    designMargin: 5,
    userSpecifiedFixedLoss: 1000,
  } as PipeSection,

  // Large diameter section
  largeSection: {
    id: 'section-3',
    description: 'Large diameter pipe',
    pipeNPD: 6,
    schedule: '40',
    roughness: 1.5e-4,
    length: 200,
    elevationChange: -10,
    fittingType: 'LR',
    fittings: [
      {
        type: 'gate_valve',
        count: 1,
        kFactor: 0.17,
      },
      {
        type: 'tee',
        count: 3,
        kFactor: 1.8,
      },
    ],
    controlValve: {
      type: 'globe_valve',
      cv: 50,
      opening: 75,
    },
    designMargin: 0,
    userSpecifiedFixedLoss: 0,
  } as PipeSection,

  // Section with orifice
  orificeSection: {
    id: 'section-4',
    description: 'Section with orifice plate',
    pipeNPD: 4,
    schedule: '40',
    roughness: 4.6e-5,
    length: 30,
    elevationChange: 5,
    fittingType: 'LR',
    fittings: [],
    orifice: {
      diameter: 0.025,
      betaRatio: 0.6,
      coefficient: 0.61,
    },
    designMargin: 0,
    userSpecifiedFixedLoss: 0,
  } as PipeSection,
};

// Complete configuration examples
export const completeConfigurations = {
  // Simple gas network
  simpleGasNetwork: {
    network: sampleNetworks.simplePipeline,
    fluid: sampleFluids.naturalGas,
    sections: [samplePipeSections.straightSection],
    components: [],
  },

  // Complex liquid network
  complexLiquidNetwork: {
    network: sampleNetworks.complexNetwork,
    fluid: sampleFluids.water,
    sections: [
      samplePipeSections.straightSection,
      samplePipeSections.elevatedSection,
      samplePipeSections.largeSection,
      samplePipeSections.orificeSection,
    ],
    components: [
      {
        type: 'control_valve',
        location: 'section-2',
        parameters: {
          cv: 25,
          opening: 80,
        },
      },
    ],
  },

  // Multi-phase network
  multiPhaseNetwork: {
    network: {
      ...sampleNetworks.simplePipeline,
      name: 'Multi-Phase Test Network',
    },
    fluid: sampleFluids.steam,
    sections: [
      {
        ...samplePipeSections.straightSection,
        id: 'steam-section-1',
        length: 75,
      },
      {
        ...samplePipeSections.elevatedSection,
        id: 'steam-section-2',
        length: 125,
        elevationChange: 50,
      },
    ],
    components: [],
  },
};

// Test scenarios
export const testScenarios = {
  // Validation test cases
  validationCases: {
    validConfiguration: completeConfigurations.simpleGasNetwork,
    
    invalidTemperature: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        temperature: -50, // Invalid: below absolute zero
      },
    },
    
    invalidPressure: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        pressure: -1000, // Invalid: negative pressure
      },
    },
    
    invalidFlowRate: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        massFlowRate: -0.1, // Invalid: negative flow rate
      },
    },
    
    missingRequiredField: {
      ...completeConfigurations.simpleGasNetwork,
      network: {
        ...completeConfigurations.simpleGasNetwork.network,
        name: '', // Invalid: empty name
      },
    },
  },

  // Calculation test cases
  calculationCases: {
    // Low pressure drop case
    lowPressureDrop: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        massFlowRate: 0.01, // Low flow rate
      },
      sections: [
        {
          ...samplePipeSections.straightSection,
          length: 10, // Short section
          pipeNPD: 4, // Large diameter
        },
      ],
    },

    // High pressure drop case
    highPressureDrop: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        massFlowRate: 5.0, // High flow rate
      },
      sections: [
        {
          ...samplePipeSections.straightSection,
          length: 500, // Long section
          pipeNPD: 1, // Small diameter
          fittings: [
            {
              type: 'elbow',
              count: 10,
              kFactor: 1.5,
            },
          ],
        },
      ],
    },

    // Critical flow case
    criticalFlow: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...sampleFluids.naturalGas,
        upstreamPressure: 500000, // High upstream pressure
        downstreamPressure: 101325,
      },
      sections: [
        {
          ...samplePipeSections.straightSection,
          length: 100,
          pipeNPD: 2,
        },
      ],
    },
  },

  // Edge cases
  edgeCases: {
    // Zero flow
    zeroFlow: {
      ...completeConfigurations.simpleGasNetwork,
      fluid: {
        ...completeConfigurations.simpleGasNetwork.fluid,
        massFlowRate: 0,
      },
    },

    // Maximum roughness
    highRoughness: {
      ...completeConfigurations.simpleGasNetwork,
      sections: [
        {
          ...samplePipeSections.straightSection,
          roughness: 0.001, // Very rough pipe
        },
      ],
    },

    // Large elevation change
    largeElevation: {
      ...completeConfigurations.simpleGasNetwork,
      sections: [
        {
          ...samplePipeSections.straightSection,
          elevationChange: 1000, // Very large elevation change
        },
      ],
    },
  },
};

// Configuration templates
export const configurationTemplates = {
  // Standard pipeline template
  standardPipeline: {
    name: 'Standard Pipeline Template',
    description: 'Template for standard pipeline calculations',
    network: sampleNetworks.simplePipeline,
    fluid: sampleFluids.air,
    sections: [samplePipeSections.straightSection],
    validation: {
      requiredFields: ['name', 'fluid.phase', 'fluid.temperature', 'sections'],
      constraints: {
        temperature: { min: 0, max: 2000 },
        pressure: { min: 0, max: 10000000 },
        flowRate: { min: 0, max: 1000 },
      },
    },
  },

  // Gas distribution template
  gasDistribution: {
    name: 'Gas Distribution Network Template',
    description: 'Template for gas distribution network analysis',
    network: sampleNetworks.complexNetwork,
    fluid: sampleFluids.naturalGas,
    sections: [
      samplePipeSections.straightSection,
      samplePipeSections.elevatedSection,
    ],
    components: [
      {
        type: 'regulator',
        location: 'inlet',
        parameters: {
          upstreamPressure: 500000,
          downstreamPressure: 200000,
        },
      },
    ],
  },

  // Liquid system template
  liquidSystem: {
    name: 'Liquid System Template',
    description: 'Template for liquid piping systems',
    network: {
      ...sampleNetworks.simplePipeline,
      gasFlowModel: undefined,
    },
    fluid: sampleFluids.water,
    sections: [
      samplePipeSections.straightSection,
      samplePipeSections.orificeSection,
    ],
    components: [
      {
        type: 'pump',
        location: 'inlet',
        parameters: {
          head: 50,
          efficiency: 0.85,
        },
      },
    ],
  },
};

export default {
  sampleFluids,
  sampleNetworks,
  samplePipeSections,
  completeConfigurations,
  testScenarios,
  configurationTemplates,
};