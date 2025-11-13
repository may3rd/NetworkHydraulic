import axios from 'axios';

// Base API configuration
const API_BASE_URL = (typeof process !== 'undefined' && process.env.VITE_API_URL) || (typeof window !== 'undefined' && (window as any).VITE_API_URL) || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login or dispatch logout action
    }
    
    // Handle network errors
    if (!error.response) {
      throw new Error('Network error: Unable to connect to server');
    }
    
    // Handle specific error codes
    const message = error.response.data?.message || 
                   error.response.statusText || 
                   'An unexpected error occurred';
    
    throw new Error(message);
  }
);

// API endpoints
export const apiEndpoints = {
  // Configuration endpoints
  validateConfiguration: '/calculate/validate',
  uploadConfiguration: '/upload-config',
  getTemplates: '/templates',
  getFittingProperties: '/fittings',
  
  // Calculation endpoints
  calculate: '/calculate',
  calculateAsync: '/calculate/async',
  getCalculationStatus: '/calculate/status',
  cancelCalculation: '/calculate/cancel',
  getCalculationResult: '/calculate/result',
  
  // Results endpoints
  getResults: '/results',
  getResult: '/results/',
  exportResult: '/results/export',
  deleteResult: '/results/',
  
  // History endpoints
  getHistory: '/history',
  clearHistory: '/history/clear',
  deleteHistoryItem: '/history/',
  
  // System endpoints
  getSystemStatus: '/system/status',
  getSystemInfo: '/system/info',
} as const;

// Configuration API
export const configApi = {
  validate: async (config: any) => {
    const response = await apiClient.post(apiEndpoints.validateConfiguration, { config });
    return response.data;
  },
  
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(apiEndpoints.uploadConfiguration, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getTemplates: async () => {
    const response = await apiClient.get(apiEndpoints.getTemplates);
    return response.data;
  },
  
  getFittingProperties: async (type: string) => {
    const response = await apiClient.get(`${apiEndpoints.getFittingProperties}/${type}`);
    return response.data;
  },
};

// Calculation API
export const calculationApi = {
  execute: async (request: any) => {
    const response = await apiClient.post(apiEndpoints.calculate, request);
    return response.data;
  },
  
  executeAsync: async (request: any) => {
    const response = await apiClient.post(apiEndpoints.calculateAsync, request);
    return response.data;
  },
  
  getStatus: async (taskId: string) => {
    const response = await apiClient.get(`${apiEndpoints.getCalculationStatus}/${taskId}`);
    return response.data;
  },
  
  cancel: async (taskId: string) => {
    const response = await apiClient.post(apiEndpoints.cancelCalculation, { taskId });
    return response.data;
  },
  
  getResult: async (taskId: string) => {
    const response = await apiClient.get(`${apiEndpoints.getCalculationResult}/${taskId}`);
    return response.data;
  },
};

// Results API
export const resultsApi = {
  getAll: async () => {
    const response = await apiClient.get(apiEndpoints.getResults);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`${apiEndpoints.getResult}${id}`);
    return response.data;
  },
  
  export: async (id: string, format: string, options: any = {}) => {
    const response = await apiClient.post(`${apiEndpoints.exportResult}/${id}`, {
      format,
      ...options,
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`${apiEndpoints.deleteResult}${id}`);
    return response.data;
  },
};

// History API
export const historyApi = {
  getAll: async () => {
    const response = await apiClient.get(apiEndpoints.getHistory);
    return response.data;
  },
  
  clear: async () => {
    const response = await apiClient.post(apiEndpoints.clearHistory);
    return response.data;
  },
  
  deleteItem: async (id: string) => {
    const response = await apiClient.delete(`${apiEndpoints.deleteHistoryItem}${id}`);
    return response.data;
  },
};

// System API
export const systemApi = {
  getStatus: async () => {
    const response = await apiClient.get(apiEndpoints.getSystemStatus);
    return response.data;
  },
  
  getInfo: async () => {
    const response = await apiClient.get(apiEndpoints.getSystemInfo);
    return response.data;
  },
};