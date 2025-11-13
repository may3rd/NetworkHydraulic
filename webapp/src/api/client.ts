import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { CalculationRequest, CalculationResult } from '../types/models';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
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
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Configuration endpoints
  async validateConfiguration(config: CalculationRequest['configuration']): Promise<any> {
    return this.client.post('/validate', config);
  }

  async uploadConfiguration(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post('/upload-config', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getConfigurationTemplates(): Promise<any> {
    return this.client.get('/templates');
  }

  async getFittingProperties(fittingType: string): Promise<any> {
    return this.client.get(`/fittings/${fittingType}`);
  }

  // Calculation endpoints
  async calculateHydraulics(request: CalculationRequest): Promise<AxiosResponse<CalculationResult>> {
    return this.client.post('/calculate', request);
  }

  async getCalculationStatus(calculationId: string): Promise<any> {
    return this.client.get(`/calculate/${calculationId}/status`);
  }

  async cancelCalculation(calculationId: string): Promise<any> {
    return this.client.post(`/calculate/${calculationId}/cancel`);
  }

  async streamCalculation(calculationId: string): Promise<any> {
    return this.client.get(`/calculate/${calculationId}/stream`, {
      responseType: 'stream',
    });
  }

  // Results endpoints
  async getResult(calculationId: string): Promise<CalculationResult> {
    const response = this.client.get(`/results/${calculationId}`);
    return response.then(r => r.data);
  }

  async exportResult(calculationId: string, format: 'pdf' | 'excel' | 'json'): Promise<Blob> {
    const response = this.client.get(`/results/${calculationId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.then(r => r.data);
  }

  async getCalculationHistory(): Promise<any> {
    return this.client.get('/history');
  }

  async deleteResult(calculationId: string): Promise<any> {
    return this.client.delete(`/results/${calculationId}`);
  }

  // System endpoints
  async getSystemStatus(): Promise<any> {
    return this.client.get('/system/status');
  }

  async getSystemInfo(): Promise<any> {
    return this.client.get('/system/info');
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;