# API Reference

This document provides comprehensive information about the application's API integration, endpoints, data structures, and integration patterns.

## Table of Contents

- [API Overview](#api-overview)
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [WebSocket Integration](#websocket-integration)
- [Service Layer](#service-layer)
- [Examples](#examples)

## API Overview

The Hydraulic Network Web Application integrates with a FastAPI backend that provides hydraulic calculation capabilities. The API follows REST principles and includes WebSocket endpoints for real-time updates.

### API Base URL

```typescript
// Environment-based configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws';
```

### API Versioning

The API uses URL-based versioning:

```
https://api.example.com/api/v1/
```

Current version: `v1`

### Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}
```

## Base Configuration

### API Client Setup

```typescript
// api/client.ts
import axios from 'axios';
import { handleApiError } from './errorHandler';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Check for success flag in data
    if (response.data && !response.data.success) {
      throw new Error(response.data.message || 'Request failed');
    }
    return response;
  },
  handleApiError
);
```

### Environment Configuration

```typescript
// Environment variables
interface ApiEnvironment {
  VITE_API_BASE_URL: string;
  VITE_WEBSOCKET_URL: string;
  VITE_API_TIMEOUT: string;
  VITE_ENABLE_API_LOGGING: string;
}

// Configuration helper
export const getApiConfig = (): ApiEnvironment => ({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  VITE_WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws',
  VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT || '30000',
  VITE_ENABLE_API_LOGGING: import.meta.env.VITE_ENABLE_API_LOGGING || 'false',
});
```

## Authentication

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication:

```typescript
// auth/authService.ts
export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { token, refresh_token } = response.data.data;
    
    this.setTokens(token, refresh_token);
    return response.data.data;
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );

    const newToken = response.data.data.token;
    this.setToken(newToken);
    return newToken;
  }

  static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
```

### Authentication Hooks

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const authData = await AuthService.login(credentials);
      setUser(authData.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const token = AuthService.getToken();
      if (token && !AuthService.isTokenExpired(token)) {
        const response = await apiClient.get<ApiResponse<User>>('/auth/me');
        setUser(response.data.data);
      }
    } catch (error) {
      AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };
};
```

## Error Handling

### Error Types

```typescript
// types/error.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// api/errorHandler.ts
export const handleApiError = (error: AxiosError): never => {
  let appError: AppError;

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        appError = {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          details: data,
          timestamp: new Date().toISOString(),
        };
        // Redirect to login or refresh token
        handleAuthError();
        break;
        
      case 403:
        appError = {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Access forbidden',
          code: 'FORBIDDEN',
          details: data,
          timestamp: new Date().toISOString(),
        };
        break;
        
      case 404:
        appError = {
          type: ErrorType.NOT_FOUND,
          message: 'Resource not found',
          code: 'NOT_FOUND',
          details: data,
          timestamp: new Date().toISOString(),
        };
        break;
        
      case 422:
        appError = {
          type: ErrorType.VALIDATION_ERROR,
          message: data.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: data.details || data,
          timestamp: new Date().toISOString(),
        };
        break;
        
      case 500:
      default:
        appError = {
          type: ErrorType.SERVER_ERROR,
          message: data.message || 'Server error',
          code: `HTTP_${status}`,
          details: data,
          timestamp: new Date().toISOString(),
        };
        break;
    }
  } else if (error.request) {
    // Network error
    appError = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    };
  } else {
    // Other error
    appError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
      timestamp: new Date().toISOString(),
    };
  }

  // Log error
  console.error('API Error:', appError);
  
  // Dispatch error to error boundary or error handling system
  dispatchError(appError);
  
  throw appError;
};
```

## Endpoints

### Configuration Endpoints

```typescript
// Configuration API endpoints
export class ConfigurationService {
  private static BASE_URL = '/configurations';

  // Create new configuration
  static async create(config: NetworkConfiguration): Promise<Configuration> {
    const response = await apiClient.post<ApiResponse<Configuration>>(
      this.BASE_URL,
      config
    );
    return response.data.data;
  }

  // Get configuration by ID
  static async getById(id: string): Promise<Configuration> {
    const response = await apiClient.get<ApiResponse<Configuration>>(
      `${this.BASE_URL}/${id}`
    );
    return response.data.data;
  }

  // Update configuration
  static async update(id: string, config: Partial<NetworkConfiguration>): Promise<Configuration> {
    const response = await apiClient.put<ApiResponse<Configuration>>(
      `${this.BASE_URL}/${id}`,
      config
    );
    return response.data.data;
  }

  // Delete configuration
  static async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }

  // List configurations
  static async list(params?: ListParams): Promise<ListResponse<Configuration>> {
    const response = await apiClient.get<ApiResponse<ListResponse<Configuration>>>(
      this.BASE_URL,
      { params }
    );
    return response.data.data;
  }

  // Validate configuration
  static async validate(config: NetworkConfiguration): Promise<ValidationResult> {
    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      `${this.BASE_URL}/validate`,
      config
    );
    return response.data.data;
  }

  // Import configuration from file
  static async import(file: File): Promise<Configuration> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<Configuration>>(
      `${this.BASE_URL}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  // Export configuration to file
  static async export(id: string, format: 'json' | 'yaml' | 'xml'): Promise<Blob> {
    const response = await apiClient.get(
      `${this.BASE_URL}/${id}/export`,
      {
        params: { format },
        responseType: 'blob',
      }
    );
    return response.data;
  }
}
```

### Calculation Endpoints

```typescript
// Calculation API endpoints
export class CalculationService {
  private static BASE_URL = '/calculations';

  // Start new calculation
  static async start(config: NetworkConfiguration): Promise<CalculationJob> {
    const response = await apiClient.post<ApiResponse<CalculationJob>>(
      `${this.BASE_URL}/start`,
      config
    );
    return response.data.data;
  }

  // Get calculation status
  static async getStatus(jobId: string): Promise<CalculationStatus> {
    const response = await apiClient.get<ApiResponse<CalculationStatus>>(
      `${this.BASE_URL}/${jobId}/status`
    );
    return response.data.data;
  }

  // Get calculation results
  static async results(jobId: string): Promise<CalculationResults> {
    const response = await apiClient.get<ApiResponse<CalculationResults>>(
      `${this.BASE_URL}/${jobId}/results`
    );
    return response.data.data;
  }

  // Cancel calculation
  static async cancel(jobId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${jobId}/cancel`);
  }

  // List calculation history
  static async listHistory(params?: ListParams): Promise<ListResponse<CalculationJob>> {
    const response = await apiClient.get<ApiResponse<ListResponse<CalculationJob>>>(
      `${this.BASE_URL}/history`,
      { params }
    );
    return response.data.data;
  }

  // Get calculation logs
  static async getLogs(jobId: string): Promise<CalculationLog[]> {
    const response = await apiClient.get<ApiResponse<CalculationLog[]>>(
      `${this.BASE_URL}/${jobId}/logs`
    );
    return response.data.data;
  }
}
```

### Results Endpoints

```typescript
// Results API endpoints
export class ResultsService {
  private static BASE_URL = '/results';

  // Get detailed results for a calculation
  static async getDetailedResults(jobId: string): Promise<DetailedResults> {
    const response = await apiClient.get<ApiResponse<DetailedResults>>(
      `${this.BASE_URL}/${jobId}/detailed`
    );
    return response.data.data;
  }

  // Get results summary
  static async getSummary(jobId: string): Promise<ResultsSummary> {
    const response = await apiClient.get<ApiResponse<ResultsSummary>>(
      `${this.BASE_URL}/${jobId}/summary`
    );
    return response.data.data;
  }

  // Export results
  static async export(jobId: string, format: ExportFormat, options?: ExportOptions): Promise<Blob> {
    const response = await apiClient.post(
      `${this.BASE_URL}/${jobId}/export`,
      { format, options },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Generate report
  static async generateReport(jobId: string, reportType: ReportType): Promise<Blob> {
    const response = await apiClient.post(
      `${this.BASE_URL}/${jobId}/report`,
      { report_type: report_type },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Compare results between calculations
  static async compare(jobIds: string[]): Promise<ComparisonResults> {
    const response = await apiClient.post<ApiResponse<ComparisonResults>>(
      `${this.BASE_URL}/compare`,
      { job_ids: jobIds }
    );
    return response.data.data;
  }
}
```

## Data Models

### Configuration Models

```typescript
// types/models/configuration.ts
export interface NetworkConfiguration {
  id?: string;
  name: string;
  description?: string;
  fluidProperties: FluidProperties;
  networkSettings: NetworkSettings;
  pipeSections: PipeSection[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface FluidProperties {
  density: number; // kg/m³
  viscosity: number; // Pa·s
  temperature: number; // °C
  phase: 'liquid' | 'gas' | 'multiphase';
  compressibility?: number; // For gas calculations
  vaporPressure?: number; // For cavitation analysis
}

export interface NetworkSettings {
  calculationModel: 'steady_state' | 'transient';
  flowDirection: 'auto' | 'forward' | 'reverse';
  boundaryConditions: BoundaryConditions;
  convergenceCriteria: ConvergenceCriteria;
  numericalMethod: 'newton_raphson' | 'successive_substitution';
  maxIterations: number;
  tolerance: number;
}

export interface PipeSection {
  id: string;
  name: string;
  diameter: number; // m
  length: number; // m
  roughness: number; // m
  elevation: number; // m
  material: PipeMaterial;
  fittings: Fitting[];
  valves: Valve[];
  insulation?: boolean;
  heatTransferCoefficient?: number; // For thermal analysis
}

export interface Fitting {
  type: FittingType;
  quantity: number;
  kFactor?: number; // If custom
  diameter?: number;
}

export interface Valve {
  type: ValveType;
  position: 'open' | 'partially_open' | 'closed';
  cvValue?: number; // Flow coefficient
  pressureDrop?: number; // For specific conditions
}
```

### Calculation Models

```typescript
// types/models/calculation.ts
export interface CalculationJob {
  id: string;
  configurationId: string;
  status: CalculationStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  estimatedCompletion?: Date;
  error?: string;
}

export interface CalculationStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  timestamp: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface CalculationResults {
  id: string;
  jobId: string;
  networkResults: NetworkResults;
  sectionResults: SectionResults[];
  convergenceHistory?: ConvergencePoint[];
  performanceMetrics: PerformanceMetrics;
}

export interface NetworkResults {
  massFlowRate: number; // kg/s
  volumetricFlowRate: number; // m³/s
  totalPressureDrop: number; // Pa
  totalHeadLoss: number; // m
  pumpPowerRequired: number; // W
  velocityProfile: VelocityProfile;
}

export interface SectionResults {
  sectionId: string;
  pressureDrop: number; // Pa
  velocity: number; // m/s
  ReynoldsNumber: number;
  frictionFactor: number;
  headLoss: number; // m
  fittingsLoss: number; // Pa
  valveLoss: number; // Pa
  elevationChange: number; // m
}
```

### Results Models

```typescript
// types/models/results.ts
export interface DetailedResults {
  summary: ResultsSummary;
  network: NetworkResults;
  sections: SectionResults[];
  pressureProfile: PressurePoint[];
  velocityProfile: VelocityPoint[];
  equipmentSizing: EquipmentSizing[];
  recommendations: Recommendation[];
}

export interface ResultsSummary {
  calculationTime: number; // seconds
  convergenceStatus: 'converged' | 'not_converged' | 'partial';
  iterations: number;
  massFlowRate: number;
  volumetricFlowRate: number;
  totalPressureDrop: number;
  pumpPowerRequired: number;
  maxVelocity: number;
  minPressure: number;
}

export interface PressurePoint {
  sectionId: string;
  position: number; // m from start
  pressure: number; // Pa
  pressureDrop: number; // Pa
}

export interface EquipmentSizing {
  type: 'pump' | 'valve' | 'pipe' | 'fittings';
  recommendations: EquipmentRecommendation[];
}

export interface EquipmentRecommendation {
  current: string;
  recommended: string;
  reason: string;
  costImpact?: number;
  performanceImpact: string;
}
```

## WebSocket Integration

### WebSocket Manager

```typescript
// services/websocket/websocketManager.ts
export class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.emit('disconnected', event);
      
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(url);
        }, this.reconnectInterval * this.reconnectAttempts);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
  }

  send(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}
```

### WebSocket Events

```typescript
// services/websocket/calculationEvents.ts
export interface CalculationProgress {
  jobId: string;
  progress: number;
  message: string;
  iteration?: number;
  currentSection?: string;
  estimatedTimeRemaining?: number;
}

export interface CalculationCompleted {
  jobId: string;
  resultsId: string;
  calculationTime: number;
  convergenceStatus: string;
}

export interface CalculationError {
  jobId: string;
  error: string;
  details?: any;
  timestamp: Date;
}

// Event handler example
export const useCalculationProgress = (jobId: string) => {
  const [progress, setProgress] = useState<CalculationProgress | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsManager = WebSocketManager.getInstance();
    
    const handleProgress = (data: CalculationProgress) => {
      if (data.jobId === jobId) {
        setProgress(data);
      }
    };

    const handleCompleted = (data: CalculationCompleted) => {
      if (data.jobId === jobId) {
        setIsCompleted(true);
        // Fetch final results
        fetchCalculationResults(jobId);
      }
    };

    const handleError = (data: CalculationError) => {
      if (data.jobId === jobId) {
        setError(data.error);
      }
    };

    wsManager.on('calculation_progress', handleProgress);
    wsManager.on('calculation_completed', handleCompleted);
    wsManager.on('calculation_error', handleError);

    return () => {
      wsManager.off('calculation_progress', handleProgress);
      wsManager.off('calculation_completed', handleCompleted);
      wsManager.off('calculation_error', handleError);
    };
  }, [jobId]);

  return { progress, isCompleted, error };
};
```

## Service Layer

### Service Pattern Implementation

```typescript
// services/baseService.ts
export abstract class BaseService {
  protected baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  protected async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(endpoint, { params });
    return response.data.data;
  }

  protected async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  protected async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(endpoint);
    return response.data.data;
  }

  protected buildURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }
}

// Example service extending base service
export class NetworkService extends BaseService {
  constructor() {
    super('/networks');
  }

  async analyze(network: NetworkConfiguration): Promise<AnalysisResult> {
    return this.post('/analyze', network);
  }

  async optimize(network: NetworkConfiguration): Promise<OptimizationResult> {
    return this.post('/optimize', network);
  }

  async simulate(network: NetworkConfiguration, conditions: SimulationConditions): Promise<SimulationResult> {
    return this.post('/simulate', { network, conditions });
  }
}
```

## Examples

### Basic API Usage

```typescript
// Basic configuration creation and calculation
const createAndCalculate = async () => {
  try {
    // 1. Create configuration
    const config: NetworkConfiguration = {
      name: 'Test Network',
      fluidProperties: {
        density: 1000,
        viscosity: 0.001,
        temperature: 20,
        phase: 'liquid',
      },
      networkSettings: {
        calculationModel: 'steady_state',
        flowDirection: 'auto',
        boundaryConditions: {
          inletPressure: 100000,
          outletPressure: 80000,
        },
        convergenceCriteria: {
          maxIterations: 100,
          tolerance: 1e-6,
        },
        numericalMethod: 'newton_raphson',
        maxIterations: 100,
        tolerance: 1e-6,
      },
      pipeSections: [
        {
          id: '1',
          name: 'Pipe 1',
          diameter: 0.1,
          length: 100,
          roughness: 0.0001,
          elevation: 0,
          material: 'steel',
          fittings: [
            { type: 'elbow_90', quantity: 2 },
          ],
          valves: [],
        },
      ],
    };

    const createdConfig = await ConfigurationService.create(config);
    
    // 2. Start calculation
    const job = await CalculationService.start(createdConfig);
    
    // 3. Connect to WebSocket for progress updates
    const wsManager = WebSocketManager.getInstance();
    wsManager.connect(import.meta.env.VITE_WEBSOCKET_URL);
    
    // 4. Handle progress updates
    wsManager.on('calculation_progress', (data) => {
      console.log(`Progress: ${data.progress}% - ${data.message}`);
    });
    
    // 5. Handle completion
    wsManager.on('calculation_completed', async (data) => {
      if (data.jobId === job.id) {
        const results = await CalculationService.getResults(job.id);
        console.log('Calculation completed:', results);
      }
    });
    
    // 6. Handle errors
    wsManager.on('calculation_error', (data) => {
      if (data.jobId === job.id) {
        console.error('Calculation failed:', data.error);
      }
    });
    
    return job;
  } catch (error) {
    console.error('Error creating calculation:', error);
    throw error;
  }
};
```

### Error Handling Example

```typescript
// Comprehensive error handling
const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: AppError }> => {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    console.error('API call failed:', error);
    
    if (error.type === ErrorType.AUTHENTICATION_ERROR) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.type === ErrorType.NETWORK_ERROR) {
      // Show network error message
      showNetworkErrorMessage();
    } else {
      // Show generic error message
      showErrorMessage(error.message);
    }
    
    return { success: false, error };
  }
};

// Usage
const saveConfiguration = async (config: NetworkConfiguration) => {
  const result = await handleApiCall(() => ConfigurationService.create(config));
  
  if (result.success) {
    showSuccessMessage('Configuration saved successfully');
    return result.data;
  } else {
    // Error already handled, just return
    return null;
  }
};
```

### File Upload Example

```typescript
// File upload with progress tracking
const uploadConfigurationFile = async (file: File): Promise<Configuration> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post<ApiResponse<Configuration>>(
      '/configurations/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
          // Update UI with progress
          updateUploadProgress(progress);
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
```

---

For more specific implementation details and examples, refer to the individual service files in the `src/services/` directory and the component examples in the codebase.