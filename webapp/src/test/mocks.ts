/**
 * Mock implementations for external dependencies used in tests
 */

import { jest } from '@jest/globals';

// Mock API Client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  create: jest.fn(),
};

// Mock calculation service
export const mockCalculationService = {
  calculate: jest.fn(),
  validate: jest.fn(),
  getStatus: jest.fn(),
  cancel: jest.fn(),
  getHistory: jest.fn(),
};

// Mock export service
export const mockExportService = {
  exportToPDF: jest.fn(),
  exportToExcel: jest.fn(),
  exportToJSON: jest.fn(),
  exportToCSV: jest.fn(),
};

// Mock validation service
export const mockValidationService = {
  validateConfiguration: jest.fn(),
  validateFluidProperties: jest.fn(),
  validateNetworkSettings: jest.fn(),
  validatePipeSections: jest.fn(),
  getValidationErrors: jest.fn(),
};

// Mock error handler
export const mockErrorHandler = {
  handleError: jest.fn(),
  clearError: jest.fn(),
  getErrors: jest.fn(),
  hasErrors: jest.fn(),
};

// Mock WebSocket manager
export const mockWebSocketManager = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isConnected: jest.fn(),
};

// Mock progress tracker
export const mockProgressTracker = {
  start: jest.fn(),
  update: jest.fn(),
  complete: jest.fn(),
  error: jest.fn(),
  reset: jest.fn(),
  onProgress: jest.fn(),
  offProgress: jest.fn(),
};

// Mock file upload handler
export const mockFileUpload = {
  uploadFile: jest.fn(),
  validateFile: jest.fn(),
  parseFile: jest.fn(),
  getFileContent: jest.fn(),
};

// Mock Zustand stores
export const mockConfigurationStore = {
  network: {},
  fluid: {},
  sections: [],
  components: [],
  validation: { isValid: true, errors: [], warnings: [] },
  updateNetwork: jest.fn(),
  updateFluid: jest.fn(),
  addSection: jest.fn(),
  updateSection: jest.fn(),
  removeSection: jest.fn(),
  validateConfiguration: jest.fn(),
  resetConfiguration: jest.fn(),
  loadConfiguration: jest.fn(),
};

export const mockCalculationStore = {
  status: 'idle' as const,
  progress: 0,
  result: null,
  error: null,
  configuration: '',
  startCalculation: jest.fn(),
  cancelCalculation: jest.fn(),
  setProgress: jest.fn(),
  setResult: jest.fn(),
  setError: jest.fn(),
  clearResult: jest.fn(),
};

export const mockUIStore = {
  activeView: 'config' as const,
  theme: 'light' as const,
  sidebarExpanded: true,
  notifications: [],
  setActiveView: jest.fn(),
  toggleTheme: jest.fn(),
  toggleSidebar: jest.fn(),
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
};

export const mockErrorStore = {
  errors: [],
  warnings: [],
  addError: jest.fn(),
  addWarning: jest.fn(),
  clearError: jest.fn(),
  clearAll: jest.fn(),
  hasErrors: jest.fn(),
};

// Mock hooks
export const mockUseCalculation = {
  calculate: jest.fn(),
  cancel: jest.fn(),
  reset: jest.fn(),
  status: 'idle' as const,
  progress: 0,
  result: null,
  error: null,
  isCalculating: false,
};

export const mockUseValidation = {
  validate: jest.fn(),
  validateField: jest.fn(),
  clearErrors: jest.fn(),
  errors: {},
  isValid: true,
  isDirty: false,
};

export const mockUseNetworkDiagram = {
  nodes: [],
  edges: [],
  updateNodes: jest.fn(),
  updateEdges: jest.fn(),
  fitView: jest.fn(),
  exportDiagram: jest.fn(),
  importDiagram: jest.fn(),
};

export const mockUseExport = {
  exportPDF: jest.fn(),
  exportExcel: jest.fn(),
  exportJSON: jest.fn(),
  isExporting: false,
  exportProgress: 0,
};

export const mockUseError = {
  error: null,
  addError: jest.fn(),
  clearError: jest.fn(),
  hasError: false,
  showError: jest.fn(),
};

// Mock browser APIs
export const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  readText: jest.fn(() => Promise.resolve('mocked text')),
};

export const mockNotification = jest.fn();

// Mock PDF generation
export const mockJsPDF = jest.fn(() => ({
  text: jest.fn(),
  addPage: jest.fn(),
  save: jest.fn(),
  setFontSize: jest.fn(),
  setTextColor: jest.fn(),
}));

// Mock Excel export
export const mockXLSX = {
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
};

// Mock chart components
export const mockChart = {
  render: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  resize: jest.fn(),
};

// Mock file system operations
export const mockFS = {
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
};

// Setup all mocks
export const setupMocks = () => {
  // Mock window APIs
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
  });

  Object.defineProperty(window, 'navigator', {
    value: {
      clipboard: mockClipboard,
    },
  });

  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn(() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });

  // Mock external libraries
  jest.mock('axios', () => ({
    create: jest.fn(() => mockApiClient),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }));

  jest.mock('jspdf', () => ({
    jsPDF: mockJsPDF,
  }));

  jest.mock('xlsx', () => mockXLSX);

  jest.mock('chart.js', () => ({
    Chart: jest.fn(() => mockChart),
    Line: jest.fn(),
    Bar: jest.fn(),
    Pie: jest.fn(),
  }));
};

// Reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
  
  // Reset mock implementations
  Object.values({
    mockApiClient,
    mockCalculationService,
    mockExportService,
    mockValidationService,
    mockErrorHandler,
    mockWebSocketManager,
    mockProgressTracker,
    mockFileUpload,
    mockConfigurationStore,
    mockCalculationStore,
    mockUIStore,
    mockErrorStore,
    mockUseCalculation,
    mockUseValidation,
    mockUseNetworkDiagram,
    mockUseExport,
    mockUseError,
  }).forEach(mock => {
    Object.values(mock).forEach(fn => {
      if (typeof fn === 'function' && jest.isMockFunction(fn)) {
        fn.mockReset();
      }
    });
  });
};

// Mock successful API responses
export const mockSuccessResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

// Mock error responses
export const mockErrorResponse = (message: string, status = 500) => ({
  response: {
    data: { error: message },
    status,
    statusText: 'Internal Server Error',
  },
  message,
});

// Mock calculation results
export const mockCalculationResult = {
  success: true,
  network: {
    name: 'Test Network',
    direction: 'forward',
    boundaryPressure: 101325,
    fluid: {
      phase: 'gas',
      temperature: 293.15,
      pressure: 101325,
      molecularWeight: 28.97,
      zFactor: 1.0,
      specificHeatRatio: 1.4,
      viscosity: 1.8e-5,
      massFlowRate: 0.1,
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
    inlet: {
      pressure: 101325,
      temperature: 293.15,
      density: 1.2,
      velocity: 1.0,
    },
    outlet: {
      pressure: 100000,
      temperature: 293.15,
      density: 1.1,
      velocity: 5.2,
    },
    pressureDrop: {
      total: 1325,
      friction: 1000,
      fittings: 200,
      elevation: 125,
    },
  },
  warnings: [],
  executionTime: 1.5,
  metadata: {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    solver: 'network-hydraulic',
  },
};

// Mock validation errors
export const mockValidationErrors = [
  {
    field: 'fluid.temperature',
    message: 'Temperature must be above 0 K',
    severity: 'error',
    code: 'INVALID_TEMPERATURE',
    suggestion: 'Enter a positive temperature value',
  },
  {
    field: 'sections[0].diameter',
    message: 'Pipe diameter is too small',
    severity: 'warning',
    code: 'SMALL_DIAMETER',
    suggestion: 'Consider using a larger diameter pipe',
  },
];

// Mock network configuration
export const mockNetworkConfig = {
  name: 'Test Network',
  description: 'Test hydraulic network',
  direction: 'auto',
  boundaryPressure: 101325,
  upstreamPressure: 110000,
  downstreamPressure: 100000,
  gasFlowModel: 'isothermal',
  designMargin: 0,
};

// Mock fluid configuration
export const mockFluidConfig = {
  phase: 'gas',
  temperature: 293.15,
  pressure: 101325,
  molecularWeight: 28.97,
  zFactor: 1.0,
  specificHeatRatio: 1.4,
  viscosity: 1.8e-5,
  massFlowRate: 0.1,
};

// Mock pipe sections
export const mockPipeSections = [
  {
    id: 'section-1',
    description: 'Main pipeline',
    pipeNPD: 2,
    schedule: '40',
    roughness: 4.6e-5,
    length: 100,
    elevationChange: 10,
    fittingType: 'LR',
    fittings: [],
    designMargin: 0,
  },
];