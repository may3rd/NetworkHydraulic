/**
 * Test constants and sample data for hydraulic network testing
 */

// Test timeouts
export const TEST_TIMEOUT = 5000;
export const ASYNC_TEST_TIMEOUT = 10000;
export const CALCULATION_TEST_TIMEOUT = 30000;

// Test file names and content
export const TEST_FILE_NAMES = {
  YAML_CONFIG: 'test-network.yaml',
  JSON_CONFIG: 'test-network.json',
  EXCEL_EXPORT: 'test-results.xlsx',
  PDF_EXPORT: 'test-report.pdf',
  CSV_EXPORT: 'test-data.csv',
};

export const TEST_FILE_CONTENTS = {
  YAML_CONFIG: `
network:
  name: Test Network
  description: Test hydraulic network configuration
  direction: auto
  boundary_pressure: 101325
  upstream_pressure: 110000
  downstream_pressure: 100000
  gas_flow_model: isothermal
  design_margin: 0

fluid:
  phase: gas
  temperature: 293.15
  pressure: 101325
  molecular_weight: 28.97
  z_factor: 1.0
  specific_heat_ratio: 1.4
  viscosity: 1.8e-5
  mass_flow_rate: 0.1

sections:
  - id: section-1
    description: Main pipeline
    pipe_npd: 2
    schedule: 40
    roughness: 4.6e-5
    length: 100
    elevation_change: 10
    fitting_type: LR
    fittings: []
    design_margin: 0
`,
  
  JSON_CONFIG: JSON.stringify({
    network: {
      name: 'Test Network',
      description: 'Test hydraulic network configuration',
      direction: 'auto',
      boundary_pressure: 101325,
      upstream_pressure: 110000,
      downstream_pressure: 100000,
      gas_flow_model: 'isothermal',
      design_margin: 0,
    },
    fluid: {
      phase: 'gas',
      temperature: 293.15,
      pressure: 101325,
      molecular_weight: 28.97,
      z_factor: 1.0,
      specific_heat_ratio: 1.4,
      viscosity: 1.8e-5,
      mass_flow_rate: 0.1,
    },
    sections: [
      {
        id: 'section-1',
        description: 'Main pipeline',
        pipe_npd: 2,
        schedule: '40',
        roughness: 4.6e-5,
        length: 100,
        elevation_change: 10,
        fitting_type: 'LR',
        fittings: [],
        design_margin: 0,
      },
    ],
  }),
};

// Test validation error messages
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_NUMBER: 'Must be a valid number',
  INVALID_POSITIVE: 'Must be a positive number',
  INVALID_RANGE: 'Value must be between {min} and {max}',
  INVALID_SELECTION: 'Please select a valid option',
  INVALID_FILE: 'Invalid file format or content',
  NETWORK_NAME_REQUIRED: 'Network name is required',
  FLUID_PHASE_REQUIRED: 'Fluid phase selection is required',
  SECTIONS_REQUIRED: 'At least one pipe section is required',
  DIAMETER_MISMATCH: 'Pipe diameter does not match adjacent sections',
  FLOW_RATE_CONSISTENCY: 'Mass and volumetric flow rates are inconsistent',
  PRESSURE_RANGE: 'Pressure must be within valid range',
  TEMPERATURE_RANGE: 'Temperature must be above absolute zero',
  LENGTH_RANGE: 'Length must be a positive value',
  ROUGHNESS_RANGE: 'Roughness must be a positive value',
};

// Test success messages
export const SUCCESS_MESSAGES = {
  CONFIGURATION_SAVED: 'Configuration saved successfully',
  CALCULATION_STARTED: 'Calculation started',
  CALCULATION_COMPLETED: 'Calculation completed successfully',
  CALCULATION_CANCELLED: 'Calculation cancelled',
  FILE_UPLOADED: 'File uploaded successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  VALIDATION_PASSED: 'Configuration validation passed',
  NETWORK_LOADED: 'Network configuration loaded',
};

// Test warning messages
export const WARNING_MESSAGES = {
  LARGE_NETWORK: 'Large network detected, calculation may take longer',
  APPROXIMATE_RESULTS: 'Results are approximate, verify critical values',
  DEPRECATED_FEATURE: 'This feature is deprecated, please update configuration',
  PERFORMANCE_IMPACT: 'Large dataset may impact performance',
  ESTIMATED_VALUES: 'Some values are estimated from defaults',
  RECOMMEND_REVIEW: 'Manual review recommended for critical applications',
};

// Test API endpoints
export const TEST_API_ENDPOINTS = {
  CALCULATE: '/api/calculate',
  VALIDATE: '/api/validate',
  UPLOAD: '/api/upload-config',
  TEMPLATES: '/api/templates',
  FITTINGS: '/api/fittings',
  RESULTS: '/api/results',
  EXPORT: '/api/export',
  HISTORY: '/api/history',
  STATUS: '/api/status',
};

// Mock API responses
export const MOCK_API_RESPONSES = {
  CALCULATION_SUCCESS: {
    success: true,
    result: {
      network: {
        name: 'Test Network',
        direction: 'forward',
        boundaryPressure: 101325,
        fluid: {
          phase: 'gas',
          temperature: 293.15,
          pressure: 101325,
          molecularWeight: 28.97,
        },
      },
      sections: [
        {
          id: 'section-1',
          inletPressure: 101325,
          outletPressure: 100000,
          pressureDrop: 1325,
          velocity: 5.2,
          reynoldsNumber: 50000,
          frictionFactor: 0.02,
          remarks: 'Normal operation',
        },
      ],
      summary: {
        inlet: { pressure: 101325, temperature: 293.15 },
        outlet: { pressure: 100000, temperature: 293.15 },
        pressureDrop: { total: 1325, friction: 1000, fittings: 200, elevation: 125 },
      },
      executionTime: 1.5,
      warnings: [],
    },
  },
  
  CALCULATION_ERROR: {
    success: false,
    error: 'Calculation failed due to invalid input parameters',
    result: null,
    executionTime: 0,
    warnings: ['Invalid pipe diameter specified'],
  },
  
  VALIDATION_SUCCESS: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  
  VALIDATION_ERROR: {
    isValid: false,
    errors: [
      {
        field: 'fluid.temperature',
        message: 'Temperature must be above 0 K',
        severity: 'error',
        code: 'INVALID_TEMPERATURE',
      },
    ],
    warnings: [
      {
        field: 'sections[0].diameter',
        message: 'Pipe diameter is at minimum recommended size',
        severity: 'warning',
        code: 'SMALL_DIAMETER',
      },
    ],
  },
};

// Test user interactions
export const USER_INTERACTIONS = {
  CLICK: 'click',
  CHANGE: 'change',
  INPUT: 'input',
  SUBMIT: 'submit',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  FOCUS: 'focus',
  BLUR: 'blur',
  DRAG_START: 'dragstart',
  DRAG_END: 'dragend',
  DROP: 'drop',
  PASTE: 'paste',
  COPY: 'copy',
  CUT: 'cut',
};

// Test keyboard keys
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
};

// Test breakpoints for responsive design
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 960,
  LG: 1280,
  XL: 1920,
};

// Test themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Test network configurations
export const TEST_NETWORKS = {
  SIMPLE: {
    name: 'Simple Network',
    sections: 1,
    complexity: 'low',
  },
  MEDIUM: {
    name: 'Medium Network',
    sections: 5,
    complexity: 'medium',
  },
  COMPLEX: {
    name: 'Complex Network',
    sections: 20,
    complexity: 'high',
  },
};

// Test calculation scenarios
export const CALCULATION_SCENARIOS = {
  GAS_FLOW: {
    fluid: { phase: 'gas', temperature: 293.15, pressure: 101325 },
    sections: [{ length: 100, diameter: 0.0525, roughness: 4.6e-5 }],
  },
  
  LIQUID_FLOW: {
    fluid: { phase: 'liquid', temperature: 293.15, pressure: 101325, density: 1000 },
    sections: [{ length: 50, diameter: 0.1, roughness: 1.5e-4 }],
  },
  
  HIGH_PRESSURE: {
    fluid: { phase: 'gas', temperature: 323.15, pressure: 500000 },
    sections: [{ length: 200, diameter: 0.025, roughness: 4.6e-5 }],
  },
  
  MULTI_SECTION: {
    fluid: { phase: 'gas', temperature: 293.15, pressure: 101325 },
    sections: [
      { id: '1', length: 50, diameter: 0.1 },
      { id: '2', length: 75, diameter: 0.075 },
      { id: '3', length: 100, diameter: 0.05 },
    ],
  },
};

// Test export formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
  XML: 'xml',
};

// Test file sizes
export const FILE_SIZES = {
  SMALL: 1024, // 1KB
  MEDIUM: 1024 * 100, // 100KB
  LARGE: 1024 * 1024, // 1MB
  XLARGE: 1024 * 1024 * 10, // 10MB
};

// Test performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  CALCULATION_FAST: 1000, // ms
  CALCULATION_MEDIUM: 5000, // ms
  CALCULATION_SLOW: 10000, // ms
  RENDER_FAST: 100, // ms
  RENDER_MEDIUM: 500, // ms
  RENDER_SLOW: 1000, // ms
};

// Test error scenarios
export const ERROR_SCENARIOS = {
  NETWORK_ERROR: {
    type: 'network',
    message: 'Network request failed',
    code: 'NETWORK_ERROR',
  },
  
  VALIDATION_ERROR: {
    type: 'validation',
    message: 'Configuration validation failed',
    code: 'VALIDATION_ERROR',
  },
  
  CALCULATION_ERROR: {
    type: 'calculation',
    message: 'Calculation engine error',
    code: 'CALCULATION_ERROR',
  },
  
  FILE_ERROR: {
    type: 'file',
    message: 'File processing error',
    code: 'FILE_ERROR',
  },
  
  EXPORT_ERROR: {
    type: 'export',
    message: 'Export operation failed',
    code: 'EXPORT_ERROR',
  },
};

// Test accessibility roles
export const A11Y_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  FORM: 'form',
  TABLE: 'table',
  GRID: 'grid',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
};

// Test data attributes for testing
export const TEST_IDS = {
  // Layout
  HEADER: 'header',
  SIDEBAR: 'sidebar',
  MAIN_CONTENT: 'main-content',
  FOOTER: 'footer',
  
  // Navigation
  NAVIGATION_MENU: 'navigation-menu',
  NAVIGATION_ITEM: 'navigation-item',
  
  // Configuration
  CONFIGURATION_FORM: 'configuration-form',
  FLUID_PROPERTIES: 'fluid-properties',
  NETWORK_SETTINGS: 'network-settings',
  PIPE_SECTIONS: 'pipe-sections',
  
  // Calculation
  CALCULATION_CONTROLS: 'calculation-controls',
  PROGRESS_INDICATOR: 'progress-indicator',
  VALIDATION_PANEL: 'validation-panel',
  
  // Results
  RESULTS_DASHBOARD: 'results-dashboard',
  RESULTS_TABLE: 'results-table',
  NETWORK_DIAGRAM: 'network-diagram',
  EXPORT_OPTIONS: 'export-options',
  
  // Forms
  SUBMIT_BUTTON: 'submit-button',
  RESET_BUTTON: 'reset-button',
  CANCEL_BUTTON: 'cancel-button',
  SAVE_BUTTON: 'save-button',
  
  // Inputs
  TEXT_INPUT: 'text-input',
  NUMBER_INPUT: 'number-input',
  SELECT_INPUT: 'select-input',
  CHECKBOX_INPUT: 'checkbox-input',
  RADIO_INPUT: 'radio-input',
};

export default {
  TEST_TIMEOUT,
  ASYNC_TEST_TIMEOUT,
  CALCULATION_TEST_TIMEOUT,
  TEST_FILE_NAMES,
  TEST_FILE_CONTENTS,
  VALIDATION_ERRORS,
  SUCCESS_MESSAGES,
  WARNING_MESSAGES,
  TEST_API_ENDPOINTS,
  MOCK_API_RESPONSES,
  USER_INTERACTIONS,
  KEYBOARD_KEYS,
  BREAKPOINTS,
  THEMES,
  TEST_NETWORKS,
  CALCULATION_SCENARIOS,
  EXPORT_FORMATS,
  FILE_SIZES,
  PERFORMANCE_THRESHOLDS,
  ERROR_SCENARIOS,
  A11Y_ROLES,
  TEST_IDS,
};