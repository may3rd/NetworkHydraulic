// Sample configuration templates for different hydraulic network scenarios

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'industrial' | 'gas' | 'liquid' | 'advanced' | 'custom';
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  content: any;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  version?: string;
  isFeatured?: boolean;
  estimatedTime?: string;
}

// Basic Liquid System Template
export const basicLiquidSystem: Template = {
  id: 'basic-liquid-001',
  name: 'Basic Liquid Pipeline',
  description: 'Simple liquid pipeline with single phase flow',
  category: 'basic',
  complexity: 'simple',
  tags: ['liquid', 'pipeline', 'basic', 'single-phase'],
  estimatedTime: '2-5 minutes',
  author: 'System',
  version: '1.0',
  isFeatured: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: {
    network: {
      name: 'Basic Liquid Pipeline',
      description: 'Simple pipeline system for liquid transport',
      direction: 'forward',
      boundaryPressure: 200000,
      outputUnits: {
        pressure: 'kPa',
        temperature: 'C',
        length: 'm',
        flowRate: 'L/min'
      },
      designMargin: 10
    },
    fluid: {
      name: 'Water',
      phase: 'liquid',
      temperature: 293.15, // 20°C
      pressure: 200000, // 200 kPa
      density: 998, // kg/m³
      viscosity: 0.001, // Pa·s
      massFlowRate: 10 // kg/s
    },
    sections: [
      {
        id: 'section-1',
        description: 'Main pipeline section',
        schedule: '40',
        pipeNPD: 4, // 4 inch NPS
        roughness: 4.6e-5, // m (steel pipe)
        length: 100, // m
        elevationChange: 10, // m
        fittingType: 'LR',
        fittings: [
          {
            type: '90-ell',
            count: 4,
            kFactor: 0.9
          },
          {
            type: 'gate-valve',
            count: 2,
            kFactor: 0.17
          }
        ]
      }
    ]
  }
};

// Gas Transmission System Template
export const gasTransmissionSystem: Template = {
  id: 'gas-transmission-001',
  name: 'Gas Transmission Pipeline',
  description: 'High-pressure gas transmission system with compressibility effects',
  category: 'gas',
  complexity: 'medium',
  tags: ['gas', 'transmission', 'high-pressure', 'compressible'],
  estimatedTime: '5-10 minutes',
  author: 'System',
  version: '1.0',
  isFeatured: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: {
    network: {
      name: 'Gas Transmission Pipeline',
      description: 'High-pressure natural gas transmission system',
      direction: 'forward',
      upstreamPressure: 8000000, // 8 MPa
      downstreamPressure: 5000000, // 5 MPa
      gasFlowModel: 'isothermal',
      outputUnits: {
        pressure: 'MPa',
        temperature: 'C',
        length: 'km',
        flowRate: 'MMSCFD'
      }
    },
    fluid: {
      name: 'Natural Gas',
      phase: 'gas',
      temperature: 303.15, // 30°C
      pressure: 8000000, // 8 MPa
      molecularWeight: 18.5, // kg/kmol
      zFactor: 0.92,
      specificHeatRatio: 1.28,
      viscosity: 1.2e-5, // Pa·s
      standardFlowRate: 50 // MMSCFD
    },
    sections: [
      {
        id: 'section-1',
        description: 'Main transmission line',
        schedule: '40',
        pipeNPD: 24, // 24 inch NPS
        roughness: 4.6e-5, // m
        length: 50000, // m
        elevationChange: 50, // m
        fittingType: 'LR',
        fittings: [
          {
            type: 'welded-ell',
            count: 8,
            kFactor: 0.5
          },
          {
            type: 'ball-valve',
            count: 3,
            kFactor: 0.1
          }
        ]
      },
      {
        id: 'section-2',
        description: 'Reducing section',
        schedule: '40',
        pipeNPD: 16, // 16 inch NPS
        roughness: 4.6e-5,
        length: 10000, // m
        elevationChange: 20, // m
        fittingType: 'SR',
        fittings: [
          {
            type: 'concentric-reducer',
            count: 1,
            kFactor: 0.05
          }
        ]
      }
    ]
  }
};

// Industrial Process System Template
export const industrialProcessSystem: Template = {
  id: 'industrial-process-001',
  name: 'Industrial Process System',
  description: 'Complex industrial process with multiple branches and equipment',
  category: 'industrial',
  complexity: 'complex',
  tags: ['industrial', 'process', 'branching', 'equipment'],
  estimatedTime: '10-20 minutes',
  author: 'System',
  version: '1.0',
  isFeatured: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: {
    network: {
      name: 'Industrial Process System',
      description: 'Multi-branch industrial process with pumps and heat exchangers',
      direction: 'auto',
      boundaryPressure: 300000,
      outputUnits: {
        pressure: 'bar',
        temperature: 'C',
        length: 'm',
        flowRate: 'm3/h'
      }
    },
    fluid: {
      name: 'Process Fluid',
      phase: 'liquid',
      temperature: 350, // 77°C
      pressure: 300000, // 3 bar
      density: 850, // kg/m³
      viscosity: 0.002, // Pa·s
      massFlowRate: 50 // kg/s
    },
    sections: [
      {
        id: 'section-1',
        description: 'Main process line',
        schedule: '80',
        pipeNPD: 6, // 6 inch NPS
        roughness: 4.6e-5,
        length: 50, // m
        elevationChange: 0, // m
        fittingType: 'LR',
        fittings: [
          {
            type: '90-ell',
            count: 6,
            kFactor: 0.9
          },
          {
            type: 'check-valve',
            count: 1,
            kFactor: 2.0
          }
        ],
        controlValve: {
          type: 'globe-valve',
          coefficient: 50,
          opening: 0.75
        }
      },
      {
        id: 'section-2',
        description: 'Heat exchanger bypass',
        schedule: '40',
        pipeNPD: 4, // 4 inch NPS
        roughness: 4.6e-5,
        length: 30, // m
        elevationChange: 5, // m
        fittingType: 'SR',
        fittings: [
          {
            type: '45-ell',
            count: 4,
            kFactor: 0.4
          }
        ],
        orifice: {
          diameter: 0.05, // m
          coefficient: 0.62
        }
      }
    ]
  }
};

// Cryogenic System Template
export const cryogenicSystem: Template = {
  id: 'cryogenic-001',
  name: 'Cryogenic Liquid System',
  description: 'Low temperature liquid system with special considerations',
  category: 'advanced',
  complexity: 'complex',
  tags: ['cryogenic', 'low-temperature', 'liquid', 'specialized'],
  estimatedTime: '15-25 minutes',
  author: 'System',
  version: '1.0',
  isFeatured: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: {
    network: {
      name: 'Cryogenic Liquid System',
      description: 'Liquid nitrogen distribution system with insulation considerations',
      direction: 'forward',
      upstreamPressure: 500000, // 5 bar
      downstreamPressure: 300000, // 3 bar
      outputUnits: {
        pressure: 'bar',
        temperature: 'K',
        length: 'm',
        flowRate: 'kg/s'
      }
    },
    fluid: {
      name: 'Liquid Nitrogen',
      phase: 'liquid',
      temperature: 77.36, // Boiling point at 1 atm
      pressure: 500000, // 5 bar
      density: 807, // kg/m³
      viscosity: 1.56e-4, // Pa·s
      massFlowRate: 5 // kg/s
    },
    sections: [
      {
        id: 'section-1',
        description: 'Insulated supply line',
        schedule: '40',
        pipeNPD: 2, // 2 inch NPS
        roughness: 1.5e-6, // m (polished stainless steel)
        length: 100, // m
        elevationChange: 20, // m
        fittingType: 'LR',
        fittings: [
          {
            type: 'sanitary-ell',
            count: 8,
            kFactor: 0.7
          },
          {
            type: 'diaphragm-valve',
            count: 2,
            kFactor: 1.5
          }
        ]
      },
      {
        id: 'section-2',
        description: 'Distribution manifold',
        schedule: '40',
        pipeNPD: 1, // 1 inch NPS
        roughness: 1.5e-6,
        length: 25, // m
        elevationChange: 5, // m
        fittingType: 'SR',
        fittings: [
          {
            type: 'sanitary-tee',
            count: 3,
            kFactor: 2.0
          }
        ]
      }
    ]
  }
};

// Simple Gas Vent System Template
export const simpleGasVent: Template = {
  id: 'simple-gas-vent-001',
  name: 'Simple Gas Vent System',
  description: 'Basic atmospheric vent system for gas release',
  category: 'basic',
  complexity: 'simple',
  tags: ['gas', 'vent', 'atmospheric', 'safety'],
  estimatedTime: '2-5 minutes',
  author: 'System',
  version: '1.0',
  isFeatured: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: {
    network: {
      name: 'Gas Vent System',
      description: 'Simple vent to atmosphere',
      direction: 'forward',
      upstreamPressure: 200000, // 2 bar
      downstreamPressure: 101325, // Atmospheric
      gasFlowModel: 'adiabatic',
      outputUnits: {
        pressure: 'kPa',
        temperature: 'C',
        length: 'm',
        flowRate: 'm3/h'
      }
    },
    fluid: {
      name: 'Process Gas',
      phase: 'gas',
      temperature: 300, // 27°C
      pressure: 200000, // 2 bar
      molecularWeight: 28.97, // Air
      zFactor: 1.0,
      specificHeatRatio: 1.4,
      viscosity: 1.8e-5, // Pa·s
      volumetricFlowRate: 100 // m3/h
    },
    sections: [
      {
        id: 'section-1',
        description: 'Vent pipe',
        schedule: '40',
        pipeNPD: 2, // 2 inch NPS
        roughness: 4.6e-5,
        length: 10, // m
        elevationChange: 5, // m
        fittingType: 'SR',
        fittings: [
          {
            type: '90-ell',
            count: 2,
            kFactor: 0.9
          },
          {
            type: 'vent-stack',
            count: 1,
            kFactor: 1.0
          }
        ]
      }
    ]
  }
};

// Export all templates
export const templates: Template[] = [
  basicLiquidSystem,
  gasTransmissionSystem,
  industrialProcessSystem,
  cryogenicSystem,
  simpleGasVent
];

// Template categories for filtering
export const templateCategories = [
  { value: 'all', label: 'All Templates', count: templates.length },
  { value: 'basic', label: 'Basic', count: templates.filter(t => t.category === 'basic').length },
  { value: 'liquid', label: 'Liquid Systems', count: templates.filter(t => t.category === 'liquid').length },
  { value: 'gas', label: 'Gas Systems', count: templates.filter(t => t.category === 'gas').length },
  { value: 'industrial', label: 'Industrial', count: templates.filter(t => t.category === 'industrial').length },
  { value: 'advanced', label: 'Advanced', count: templates.filter(t => t.category === 'advanced').length }
];

// Get template by ID
export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(template => template.id === id);
};

// Get templates by category
export const getTemplatesByCategory = (category: string): Template[] => {
  if (category === 'all') return templates;
  return templates.filter(template => template.category === category);
};

// Get featured templates
export const getFeaturedTemplates = (): Template[] => {
  return templates.filter(template => template.isFeatured);
};

// Get templates by complexity
export const getTemplatesByComplexity = (complexity: string): Template[] => {
  return templates.filter(template => template.complexity === complexity);
};

// Search templates by tags
export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return templates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};