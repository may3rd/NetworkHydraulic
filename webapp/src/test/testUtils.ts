/**
 * Custom testing utilities and helpers for React Testing Library
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { JestEnvironment } from '@jest/environment';
import { jest } from '@jest/globals';

// Custom render function that includes providers and context
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Mock stores to use for testing
   */
  mockStores?: {
    configuration?: any;
    calculation?: any;
    ui?: any;
    error?: any;
  };
  
  /**
   * Additional providers to wrap the component with
   */
  additionalProviders?: ReactElement[];
}

/**
 * Custom render function that includes all necessary providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    mockStores = {},
    additionalProviders = [],
    ...renderOptions
  } = options;

  // Create a wrapper component that includes all providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = children;

    // Add Zustand store provider if mock stores are provided
    if (Object.keys(mockStores).length > 0) {
      wrappedChildren = React.createElement(
        'div',
        { 'data-testid': 'mock-store-provider' },
        wrappedChildren
      );
    }

    // Add additional providers
    additionalProviders.forEach(provider => {
      wrappedChildren = React.createElement(
        provider.type,
        provider.props,
        wrappedChildren
      );
    });

    return wrappedChildren;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = (timeout = 5000) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

/**
 * Mock a successful calculation response
 */
export const mockCalculationSuccess = (overrides = {}) => ({
  success: true,
  result: {
    network: {
      name: 'Test Network',
      direction: 'forward',
      boundaryPressure: 101325,
    },
    sections: [
      {
        id: 'section-1',
        inletPressure: 101325,
        outletPressure: 100000,
        pressureDrop: 1325,
        velocity: 5.2,
        remarks: 'Normal operation',
      },
    ],
    summary: {
      inlet: { pressure: 101325, temperature: 293.15 },
      outlet: { pressure: 100000, temperature: 293.15 },
      pressureDrop: { total: 1325 },
    },
  },
  executionTime: 1.5,
  warnings: [],
  ...overrides,
});

/**
 * Mock a failed calculation response
 */
export const mockCalculationError = (message = 'Calculation failed', overrides = {}) => ({
  success: false,
  error: message,
  result: null,
  executionTime: 0,
  warnings: [],
  ...overrides,
});

/**
 * Mock validation results
 */
export const mockValidationResult = (isValid = true, errors = [], warnings = []) => ({
  isValid,
  errors,
  warnings,
  errorCount: errors.length,
  warningCount: warnings.length,
});

/**
 * Create a mock file for testing file upload components
 */
export const createMockFile = (
  name: string,
  content: string,
  type = 'application/json'
): File => {
  const blob = new Blob([content], { type });
  const file = Object.assign(blob, {
    name,
    lastModified: Date.now(),
  });
  return file as File;
};

/**
 * Mock a file upload event
 */
export const createMockFileEvent = (files: File[]) => ({
  target: {
    files,
    value: files[0]?.name || '',
  },
});

/**
 * Mock a drag and drop event
 */
export const createMockDragEvent = (
  type: string,
  files: File[] = []
): any => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  dataTransfer: {
    files,
    items: files.map(file => ({
      kind: 'file',
      type: file.type,
     getAsFile: () => file,
    })),
    types: ['Files'],
  },
});

/**
 * Mock network configuration data
 */
export const createMockNetworkConfig = (overrides = {}) => ({
  name: 'Test Network',
  description: 'Test hydraulic network',
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
  ...overrides,
});

/**
 * Mock fluid configuration data
 */
export const createMockFluidConfig = (overrides = {}) => ({
  phase: 'gas',
  temperature: 293.15,
  pressure: 101325,
  molecularWeight: 28.97,
  zFactor: 1.0,
  specificHeatRatio: 1.4,
  viscosity: 1.8e-5,
  massFlowRate: 0.1,
  density: 1.2,
  ...overrides,
});

/**
 * Mock pipe section data
 */
export const createMockPipeSection = (overrides = {}) => ({
  id: 'section-1',
  description: 'Test pipe section',
  pipeNPD: 2,
  schedule: '40',
  pipeDiameter: 0.0525,
  inletDiameter: 0.0525,
  outletDiameter: 0.0525,
  roughness: 4.6e-5,
  length: 100,
  elevationChange: 10,
  fittingType: 'LR',
  fittings: [],
  controlValve: null,
  orifice: null,
  designMargin: 0,
  userSpecifiedFixedLoss: 0,
  ...overrides,
});

/**
 * Mock form field values
 */
export const createMockFormValues = (overrides = {}) => ({
  network: createMockNetworkConfig(),
  fluid: createMockFluidConfig(),
  sections: [createMockPipeSection()],
  ...overrides,
});

/**
 * Mock API error response
 */
export const createMockApiError = (
  message: string,
  status = 500,
  field?: string
) => ({
  response: {
    data: {
      error: message,
      field,
      code: 'VALIDATION_ERROR',
    },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Internal Server Error',
  },
  message,
});

/**
 * Mock WebSocket message
 */
export const createMockWebSocketMessage = (type: string, data: any) => ({
  type,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Utility to create a mock Zustand store
 */
export const createMockStore = (initialState: any, actions: any) => ({
  ...initialState,
  ...actions,
});

/**
 * Mock progress updates for testing progress indicators
 */
export const createMockProgressUpdates = (steps = 10) => {
  const updates = [];
  for (let i = 0; i <= steps; i++) {
    updates.push({
      progress: (i / steps) * 100,
      message: `Step ${i + 1} of ${steps + 1}`,
      timestamp: new Date().toISOString(),
    });
  }
  return updates;
};

/**
 * Mock calculation history data
 */
export const createMockCalculationHistory = (count = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `calculation-${index + 1}`,
    name: `Calculation ${index + 1}`,
    timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    networkName: 'Test Network',
    sectionCount: 5,
    executionTime: 1.5 + index,
    hasErrors: false,
  }));
};

/**
 * Utility to flush promises (for testing async operations)
 */
export const flushPromises = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Mock console methods for testing error handling
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mocks = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
  
  Object.assign(console, mocks);
  
  return {
    mocks,
    restore: () => Object.assign(console, originalConsole),
  };
};

/**
 * Create a mock event for testing form interactions
 */
export const createMockEvent = (value: any, name?: string, type = 'change') => ({
  target: {
    value,
    name,
    type,
  },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});

/**
 * Mock router/location for testing navigation
 */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};


/**
 * Mock theme for testing responsive components
 */
export const mockTheme = {
  palette: {
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#dc004e', light: '#ff5983', dark: '#9c0036' },
    background: { default: '#ffffff', paper: '#f5f5f5' },
    text: { primary: '#000000', secondary: '#666666' },
  },
  spacing: (factor: number) => `${factor * 8}px`,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    up: (key: string) => `@media (min-width: ${mockTheme.breakpoints.values[key as keyof typeof mockTheme.breakpoints.values]}px)`,
    down: (key: string) => `@media (max-width: ${mockTheme.breakpoints.values[key as keyof typeof mockTheme.breakpoints.values]}px)`,
  },
  typography: {
    h1: { fontSize: '2.125rem', fontWeight: 500 },
    h2: { fontSize: '1.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
  },
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Re-export our custom render function
export { renderWithProviders as render };