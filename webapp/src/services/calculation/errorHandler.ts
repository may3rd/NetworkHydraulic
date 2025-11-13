import type { ValidationError, ValidationWarning } from '../../types/models';

export interface CalculationError {
  type: 'validation' | 'network' | 'timeout' | 'server' | 'unknown';
  code: string;
  message: string;
  details: string | undefined;
  field: string | undefined;
  suggestion: string | undefined;
  timestamp: Date;
  recoverable: boolean;
}

export interface ErrorContext {
  operation: string;
  configuration?: any;
  taskId?: string;
  request?: any;
  response?: any;
}

export class CalculationErrorHandler {
  private errorHistory: CalculationError[] = [];
  private maxHistorySize = 100;

  /**
   * Handle calculation errors and return structured error information
   */
  handleCalculationError(
    error: any,
    context: ErrorContext
  ): CalculationError {
    const structuredError = this.normalizeError(error, context);
    
    // Add to error history
    this.addToHistory(structuredError);
    
    // Log error for debugging
    this.logError(structuredError, context);
    
    return structuredError;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    errors: ValidationError[],
    warnings: ValidationWarning[] = [],
    context: ErrorContext
  ): { errors: CalculationError[]; warnings: CalculationError[] } {
    const calculationErrors = errors.map(error =>
      this.createCalculationError('validation', error.code || 'VALIDATION_ERROR', {
        message: error.message,
        field: error.field,
        suggestion: error.suggestion || undefined,
        context,
      })
    );

    const calculationWarnings = warnings.map(warning =>
      this.createCalculationError('validation', 'VALIDATION_WARNING', {
        message: warning.message,
        field: warning.field,
        suggestion: warning.suggestion || undefined,
        context,
      })
    );

    calculationErrors.forEach(error => this.addToHistory(error));
    calculationWarnings.forEach(warning => this.addToHistory(warning));

    return {
      errors: calculationErrors,
      warnings: calculationWarnings,
    };
  }

  /**
   * Handle network errors
   */
  handleNetworkError(
    error: Error,
    context: ErrorContext
  ): CalculationError {
    let type: CalculationError['type'] = 'network';
    let code = 'NETWORK_ERROR';
    let recoverable = true;

    if (error.message.includes('timeout')) {
      type = 'timeout';
      code = 'REQUEST_TIMEOUT';
      recoverable = true;
    } else if (error.message.includes('fetch')) {
      code = 'FETCH_ERROR';
    } else if (error.message.includes('connection')) {
      code = 'CONNECTION_ERROR';
    }

    return this.handleCalculationError(error, {
      ...context,
      operation: `${context.operation} (network)`,
    });
  }

  /**
   * Handle server errors
   */
  handleServerError(
    status: number,
    errorData: any,
    context: ErrorContext
  ): CalculationError {
    let type: CalculationError['type'] = 'server';
    let code = 'SERVER_ERROR';
    let recoverable = false;

    switch (status) {
      case 400:
        type = 'validation';
        code = 'BAD_REQUEST';
        recoverable = true;
        break;
      case 401:
        code = 'UNAUTHORIZED';
        recoverable = false;
        break;
      case 403:
        code = 'FORBIDDEN';
        recoverable = false;
        break;
      case 404:
        code = 'NOT_FOUND';
        recoverable = false;
        break;
      case 422:
        type = 'validation';
        code = 'UNPROCESSABLE_ENTITY';
        recoverable = true;
        break;
      case 500:
        code = 'INTERNAL_SERVER_ERROR';
        recoverable = false;
        break;
      case 502:
      case 503:
      case 504:
        code = 'GATEWAY_ERROR';
        recoverable = true;
        break;
    }

    return this.createCalculationError(type, code, {
      message: errorData?.error?.message || errorData?.message || 'Server error occurred',
      details: errorData?.error?.details || errorData?.details,
      suggestion: errorData?.error?.suggestion || errorData?.suggestion,
      context,
    });
  }

  /**
   * Get error recovery suggestions
   */
  getRecoverySuggestions(error: CalculationError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case 'validation':
        suggestions.push('Review and correct the configuration values');
        suggestions.push('Check the validation messages for specific field issues');
        suggestions.push('Ensure all required fields are provided');
        break;

      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Verify the API server is running and accessible');
        suggestions.push('Try again in a few moments');
        break;

      case 'timeout':
        suggestions.push('The calculation is taking longer than expected');
        suggestions.push('Try reducing the network complexity or running asynchronously');
        suggestions.push('Check server resources and try again');
        break;

      case 'server':
        suggestions.push('Contact support or check server status');
        suggestions.push('Try a simpler configuration');
        break;
    }

    // Add specific suggestions from error
    if (error.suggestion) {
      suggestions.unshift(error.suggestion);
    }

    return suggestions;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: CalculationError): boolean {
    return error.recoverable;
  }

  /**
   * Get error history
   */
  getErrorHistory(limit?: number): CalculationError[] {
    const history = [...this.errorHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    recentErrors: number;
    recoverableErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorHistory.filter(error => error.timestamp > oneHourAgo);
    const errorTypes: Record<string, number> = {};
    const recoverableErrors = this.errorHistory.filter(error => error.recoverable);

    this.errorHistory.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorTypes,
      recentErrors: recentErrors.length,
      recoverableErrors: recoverableErrors.length,
    };
  }

  /**
   * Normalize error to structured format
   */
  private normalizeError(error: any, context: ErrorContext): CalculationError {
    if (this.isCalculationError(error)) {
      return error;
    }

    let type: CalculationError['type'] = 'unknown';
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let recoverable = false;

    if (error instanceof Error) {
      message = error.message;
      
      if (error.message.includes('timeout')) {
        type = 'timeout';
        code = 'TIMEOUT_ERROR';
        recoverable = true;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        type = 'network';
        code = 'NETWORK_ERROR';
        recoverable = true;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = error.message || error.error || 'Error occurred';
      code = error.code || error.status || 'ERROR';
      
      const statusCode = parseInt(code);
      if (statusCode >= 400 && statusCode < 500) {
        type = 'validation';
        code = 'BAD_REQUEST';
        recoverable = true;
      } else if (statusCode >= 500) {
        type = 'server';
        recoverable = false;
      }
    }

    return this.createCalculationError(type, code, {
      message,
      details: error?.details || error?.stack,
      context,
    });
  }

  /**
   * Create structured calculation error
   */
  private createCalculationError(
    type: CalculationError['type'],
    code: string,
    options: {
      message: string;
      field?: string;
      suggestion?: string;
      details?: string;
      context: ErrorContext;
    }
  ): CalculationError {
    return {
      type,
      code,
      message: options.message,
      details: options.details || undefined,
      field: options.field || undefined,
      suggestion: options.suggestion || undefined,
      timestamp: new Date(),
      recoverable: this.isErrorRecoverable(type, code),
    };
  }

  /**
   * Add error to history
   */
  private addToHistory(error: CalculationError): void {
    this.errorHistory.push(error);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Log error for debugging
   */
  private logError(error: CalculationError, context: ErrorContext): void {
    const logLevel = error.recoverable ? 'warn' : 'error';
    
    console[logLevel]('[CalculationErrorHandler]', {
      error: {
        type: error.type,
        code: error.code,
        message: error.message,
        field: error.field,
        recoverable: error.recoverable,
      },
      context,
      timestamp: error.timestamp,
    });
  }

  /**
   * Check if error is already in structured format
   */
  private isCalculationError(error: any): error is CalculationError {
    return (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      'code' in error &&
      'message' in error &&
      'timestamp' in error
    );
  }

  /**
   * Determine if error is recoverable
   */
  private isErrorRecoverable(type: string, code: string): boolean {
    const recoverableTypes = ['validation', 'network', 'timeout'];
    const recoverableCodes = [
      'VALIDATION_ERROR',
      'BAD_REQUEST',
      'UNPROCESSABLE_ENTITY',
      'TIMEOUT_ERROR',
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
      'REQUEST_TIMEOUT',
      'GATEWAY_ERROR',
    ];

    return recoverableTypes.includes(type) || recoverableCodes.includes(code);
  }
}

// Export singleton instance
export const calculationErrorHandler = new CalculationErrorHandler();