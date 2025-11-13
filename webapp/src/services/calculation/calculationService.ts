import type { CalculationRequest, CalculationResult, ValidationResult, ValidationError, ValidationWarning } from '../../types/models';

interface CalculationServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export class CalculationService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: CalculationServiceConfig = {}) {
    this.baseUrl = config.baseUrl || (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) || 'http://localhost:8000/api';
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Set timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute hydraulic calculation
   */
  async executeCalculation(
    request: CalculationRequest,
    options: {
      async?: boolean;
      background?: boolean;
      validateOnly?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    result?: CalculationResult;
    taskId?: string;
    message?: string;
  }> {
    const { async: asyncCalc = false, background = false, validateOnly = false } = options;

    try {
      if (validateOnly) {
        const validation = await this.validateConfiguration(request.configuration);
        return {
          success: validation.isValid,
          message: validation.isValid ? 'Configuration is valid' : 'Configuration validation failed',
        };
      }

      const requestData = {
        ...request,
        options: {
          ...request.options,
          async_calculation: asyncCalc || background,
        },
      };

      const response = await this.request<CalculationResult>('/calculate', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (asyncCalc || background) {
        return {
          success: true,
          taskId: (response.data as any)?.task_id,
          message: (response.data as any)?.message || 'Calculation started in background',
        };
      }

      return {
        success: true,
        result: response.data as CalculationResult,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate configuration without running calculation
   */
  async validateConfiguration(configuration: CalculationRequest['configuration']): Promise<ValidationResult> {
    try {
      const response = await this.request('/calculate/validate', {
        method: 'POST',
        body: JSON.stringify({ configuration }),
      });

      const error = response.error?.message || '';
      const validationError: ValidationError = {
        field: '',
        message: error,
        severity: 'error',
      };

      return {
        isValid: response.success,
        errors: response.error ? [validationError] : [],
        warnings: [],
      };
    } catch (error) {
      const validationError: ValidationError = {
        field: '',
        message: error instanceof Error ? error.message : 'Validation failed',
        severity: 'error',
      };
      
      return {
        isValid: false,
        errors: [validationError],
        warnings: [],
      };
    }
  }

  /**
   * Get calculation status by task ID
   */
  async getCalculationStatus(taskId: string): Promise<{
    success: boolean;
    status: string;
    progress: number;
    message: string;
    result?: CalculationResult;
    error?: string;
  }> {
    try {
      const response = await this.request(`/calculate/status/${taskId}`);
      
      const data = response.data as any;
      
      return {
        success: true,
        status: data?.status || 'unknown',
        progress: data?.progress || 0,
        message: data?.message || 'Processing',
        result: data?.result,
        error: data?.error,
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to get status',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel calculation by task ID
   */
  async cancelCalculation(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request(`/calculate/cancel/${taskId}`, {
        method: 'POST',
      });

      return {
        success: true,
        message: (response.data as any)?.message || 'Calculation cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel calculation',
      };
    }
  }

  /**
   * Get calculation history
   */
  async getCalculationHistory(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    success: boolean;
    history: Array<{
      id: string;
      timestamp: string;
      status: string;
      description?: string;
    }>;
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    try {
      const { limit = 100, offset = 0 } = options;
      const response = await this.request(`/calculate/history?limit=${limit}&offset=${offset}`);
      
      const data = response.data as any;
      const pagination = response.data as any;
      
      return {
        success: true,
        history: data || [],
        pagination: pagination?.pagination || { limit, offset, total: 0 },
      };
    } catch (error) {
      return {
        success: false,
        history: [],
        pagination: { limit: 0, offset: 0, total: 0 },
      };
    }
  }

  /**
   * Delete calculation history
   */
  async deleteCalculationHistory(calculationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request(`/calculate/history/${calculationId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: (response.data as any)?.message || 'Calculation deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete calculation',
      };
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    success: boolean;
    status: {
      healthy: boolean;
      activeTasks: number;
      queueLength: number;
      version: string;
      uptime: number;
    };
  }> {
    try {
      const response = await this.request('/system/status');
      
      const data = response.data as any;
      
      return {
        success: true,
        status: data || {
          healthy: false,
          activeTasks: 0,
          queueLength: 0,
          version: 'unknown',
          uptime: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: {
          healthy: false,
          activeTasks: 0,
          queueLength: 0,
          version: 'unknown',
          uptime: 0,
        },
      };
    }
  }

  /**
   * Upload configuration file
   */
  async uploadConfiguration(file: File): Promise<{
    success: boolean;
    fileId?: string;
    filename?: string;
    content?: any;
    errors?: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.request('/calculate/upload', {
        method: 'POST',
        body: formData,
        // Remove Content-Type header to let browser set it with boundary
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = response.data as any;
      
      return {
        success: true,
        fileId: data?.file_id,
        filename: data?.filename,
        content: data?.content,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'File upload failed'],
      };
    }
  }

  /**
   * Get WebSocket URL for real-time updates
   */
  async getWebSocketUrl(): Promise<{
    success: boolean;
    websocketUrl?: string;
    connectionInfo?: any;
    errors?: string[];
  }> {
    try {
      const response = await this.request('/calculate/progress/ws-url');
      
      const data = response.data as any;
      
      return {
        success: true,
        websocketUrl: data?.websocket_url,
        connectionInfo: data?.connection_info,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to get WebSocket URL'],
      };
    }
  }

  /**
   * Export calculation results
   */
  async exportResults(
    calculationId: string,
    format: 'json' | 'pdf' | 'excel'
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
  }> {
    try {
      const response = await this.request(`/results/${calculationId}/export/${format}`);
      
      const data = response.data as any;
      
      return {
        success: true,
        downloadUrl: data?.download_url,
        fileName: data?.filename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }
}

// Export singleton instance
export const calculationService = new CalculationService();