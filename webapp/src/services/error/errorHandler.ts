/**
 * Error Handler Service for Hydraulic Network Web Application
 * 
 * This service provides comprehensive error handling capabilities including
 * error categorization, severity assessment, user-friendly messaging,
 * and recovery suggestions.
 */

import { BaseError, ErrorSeverity, ErrorCategory, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
// import { ErrorSeverity as SeverityLevel } from '../../types/error/severityLevels';
import { VALIDATION_ERRORS, CALCULATION_ERRORS, NETWORK_ERRORS, SYSTEM_ERRORS, FILE_ERRORS } from '../../types/error/errorCodes';

export interface ErrorHandlerConfig {
  enableReporting: boolean;
  enableRecovery: boolean;
  enableTracking: boolean;
  maxErrorHistory: number;
  autoHideDelay: number;
  enableAutoRetry: boolean;
  retryAttempts: number;
  retryDelay: number;
  enableNotifications: boolean;
  notificationTypes: string[];
}

export interface ErrorRecoveryOptions {
  canRetry: boolean;
  canContinue: boolean;
  suggestedActions: string[];
  rollbackData?: any;
  alternativeMethods?: string[];
}

class ErrorHandlerService {
  private errorHistory: BaseError[] = [];
  private config: ErrorHandlerConfig;
  private errorCallbacks: Map<string, (error: BaseError) => void> = new Map();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      enableReporting: true,
      enableRecovery: true,
      enableTracking: true,
      maxErrorHistory: 100,
      autoHideDelay: 5000,
      enableAutoRetry: false,
      retryAttempts: 3,
      retryDelay: 1000,
      enableNotifications: true,
      notificationTypes: ['toast', 'banner', 'inline'],
      ...config
    };
  }

  /**
   * Main error handling method
   */
  handleError(
    error: Error | string,
    context?: Partial<ErrorContext>,
    tracking?: Partial<ErrorTracking>
  ): BaseError {
    const baseError = this.createErrorFromException(error, context, tracking);
    this.processError(baseError);
    return baseError;
  }

  /**
   * Create error from exception
   */
  private createErrorFromException(
    error: Error | string,
    context?: Partial<ErrorContext>,
    tracking?: Partial<ErrorTracking>
  ): BaseError {
    const errorString = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    // Categorize error based on message and context
    const category = this.categorizeError(errorString, context);
    const severity = this.assessSeverity(errorString, category);
    const code = this.generateErrorCode(category, severity);

    // Create user-friendly message
    const userMessage = this.createUserMessage(errorString, category, severity);
    const suggestion = this.generateSuggestion(errorString, category, severity);

    // Assess recoverability
    const recoverable = this.isErrorRecoverable(category, severity, errorString);

    const baseError: BaseError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: errorString,
      severity,
      category,
      code,
      details: {
        originalError: error instanceof Error ? error : undefined,
        stack,
        context,
        tracking
      },
      recoverable,
      userMessage,
      suggestion
    };

    return baseError;
  }

  /**
   * Categorize error based on message and context
   */
  private categorizeError(error: string, context?: Partial<ErrorContext>): ErrorCategory {
    const errorLower = error.toLowerCase();
    
    // Check for validation errors
    if (errorLower.includes('validation') || 
        errorLower.includes('invalid') || 
        errorLower.includes('required') ||
        context?.action?.includes('validate')) {
      return ErrorCategory.VALIDATION;
    }

    // Check for calculation errors
    if (errorLower.includes('calculation') || 
        errorLower.includes('solver') || 
        errorLower.includes('convergence') ||
        context?.action?.includes('calculate')) {
      return ErrorCategory.CALCULATION;
    }

    // Check for network errors
    if (errorLower.includes('network') || 
        errorLower.includes('connection') || 
        errorLower.includes('timeout') ||
        context?.action?.includes('network')) {
      return ErrorCategory.NETWORK;
    }

    // Check for file errors
    if (errorLower.includes('file') || 
        errorLower.includes('upload') || 
        errorLower.includes('parse') ||
        context?.action?.includes('file')) {
      return ErrorCategory.FILE;
    }

    // Check for configuration errors
    if (errorLower.includes('config') || 
        errorLower.includes('configuration') ||
        context?.action?.includes('config')) {
      return ErrorCategory.CONFIGURATION;
    }

    // Default to system error
    return ErrorCategory.SYSTEM;
  }

  /**
   * Assess error severity
   */
  private assessSeverity(error: string, category: ErrorCategory): ErrorSeverity {
    const errorLower = error.toLowerCase();
    
    // Critical errors
    if (errorLower.includes('critical') || 
        errorLower.includes('fatal') ||
        errorLower.includes('crash')) {
      return ErrorSeverity.CRITICAL;
    }

    // System errors are usually critical
    if (category === ErrorCategory.SYSTEM) {
      return ErrorSeverity.ERROR;
    }

    // Validation and configuration errors are usually warnings
    if (category === ErrorCategory.VALIDATION || 
        category === ErrorCategory.CONFIGURATION) {
      return ErrorSeverity.WARNING;
    }

    // Network and file errors depend on context
    if (category === ErrorCategory.NETWORK || 
        category === ErrorCategory.FILE) {
      if (errorLower.includes('not found') || 
          errorLower.includes('404')) {
        return ErrorSeverity.WARNING;
      }
      return ErrorSeverity.ERROR;
    }

    // Calculation errors are serious but may be recoverable
    if (category === ErrorCategory.CALCULATION) {
      return ErrorSeverity.ERROR;
    }

    return ErrorSeverity.INFO;
  }

  /**
   * Generate error code based on category and severity
   */
  private generateErrorCode(category: ErrorCategory, severity: ErrorSeverity): string {
    const categoryPrefix = this.getCategoryPrefix(category);
    const severitySuffix = this.getSeveritySuffix(severity);
    
    // Get next sequential number
    const sequence = this.errorHistory.filter(e => 
      e.category === category && e.severity === severity
    ).length + 1;

    return `${categoryPrefix}_${severitySuffix}_${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Get category prefix for error code
   */
  private getCategoryPrefix(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.VALIDATION: return 'VAL';
      case ErrorCategory.CALCULATION: return 'CALC';
      case ErrorCategory.NETWORK: return 'NET';
      case ErrorCategory.SYSTEM: return 'SYS';
      case ErrorCategory.FILE: return 'FILE';
      case ErrorCategory.CONFIGURATION: return 'CONFIG';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Get severity suffix for error code
   */
  private getSeveritySuffix(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'CRIT';
      case ErrorSeverity.ERROR: return 'ERR';
      case ErrorSeverity.WARNING: return 'WARN';
      case ErrorSeverity.INFO: return 'INFO';
      default: return 'UNK';
    }
  }

  /**
   * Create user-friendly error message
   */
  private createUserMessage(error: string, category: ErrorCategory, severity: ErrorSeverity): string {
    const errorLower = error.toLowerCase();
    
    switch (category) {
      case ErrorCategory.VALIDATION:
        if (errorLower.includes('required')) {
          return 'Please fill in all required fields.';
        }
        if (errorLower.includes('format')) {
          return 'Please check the format of your input.';
        }
        return 'Please review and correct the validation errors.';
      
      case ErrorCategory.CALCULATION:
        if (errorLower.includes('convergence')) {
          return 'The calculation could not converge. Please check your input parameters.';
        }
        return 'The calculation failed. Please review your configuration.';
      
      case ErrorCategory.NETWORK:
        if (errorLower.includes('timeout')) {
          return 'The request timed out. Please check your connection and try again.';
        }
        return 'Network error occurred. Please check your connection.';
      
      case ErrorCategory.FILE:
        if (errorLower.includes('format')) {
          return 'The file format is not supported. Please upload a valid file.';
        }
        if (errorLower.includes('size')) {
          return 'The file is too large. Please upload a smaller file.';
        }
        return 'File processing failed. Please try again.';
      
      case ErrorCategory.CONFIGURATION:
        return 'Configuration error detected. Please review your settings.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }

  /**
   * Generate recovery suggestion
   */
  private generateSuggestion(error: string, category: ErrorCategory, severity: ErrorSeverity): string {
    const errorLower = error.toLowerCase();
    
    switch (category) {
      case ErrorCategory.VALIDATION:
        if (errorLower.includes('required')) {
          return 'Fill in all required fields marked with an asterisk (*).';
        }
        if (errorLower.includes('format')) {
          return 'Check the input format and ensure it matches the expected pattern.';
        }
        return 'Review the highlighted fields and correct any validation errors.';
      
      case ErrorCategory.CALCULATION:
        if (errorLower.includes('convergence')) {
          return 'Try adjusting your input parameters or reducing the complexity of your network.';
        }
        return 'Check your configuration and ensure all required parameters are provided.';
      
      case ErrorCategory.NETWORK:
        if (errorLower.includes('timeout')) {
          return 'Check your internet connection and try again.';
        }
        return 'Refresh the page and try the operation again.';
      
      case ErrorCategory.FILE:
        if (errorLower.includes('format')) {
          return 'Ensure you are uploading a supported file format (YAML, JSON, CSV).';
        }
        if (errorLower.includes('size')) {
          return 'Reduce the file size or split it into smaller parts.';
        }
        return 'Try uploading the file again or use a different file.';
      
      case ErrorCategory.CONFIGURATION:
        return 'Review your configuration settings and ensure they are consistent.';
      
      default:
        return 'Contact support if the problem persists.';
    }
  }

  /**
   * Assess if error is recoverable
   */
  private isErrorRecoverable(category: ErrorCategory, severity: ErrorSeverity, error: string): boolean {
    // Critical errors are generally not recoverable
    if (severity === ErrorSeverity.CRITICAL) {
      return false;
    }

    // System errors might be recoverable depending on context
    if (category === ErrorCategory.SYSTEM) {
      return !error.toLowerCase().includes('fatal');
    }

    // Most other errors are recoverable
    return true;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process error (store, report, notify)
   */
  private processError(error: BaseError): void {
    // Add to error history
    this.addToHistory(error);

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(error);
    }

    // Track error if enabled
    if (this.config.enableTracking) {
      this.trackError(error);
    }

    // Notify error callbacks
    this.notifyErrorCallbacks(error);
  }

  /**
   * Add error to history
   */
  private addToHistory(error: BaseError): void {
    this.errorHistory.push(error);
    
    // Limit history size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  /**
   * Report error (placeholder for actual reporting implementation)
   */
  private reportError(error: BaseError): void {
    // In a real implementation, this would send the error to a monitoring service
    console.error('Error reported:', error);
    
    // Could integrate with services like:
    // - Sentry
    // - LogRocket
    // - Custom error reporting service
  }

  /**
   * Track error (placeholder for actual tracking implementation)
   */
  private trackError(error: BaseError): void {
    // In a real implementation, this would track errors for analytics
    console.log('Error tracked:', error.id, error.category, error.severity);
    
    // Could integrate with services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics service
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(error: BaseError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Get error recovery options
   */
  getRecoveryOptions(error: BaseError): ErrorRecoveryOptions {
    const options: ErrorRecoveryOptions = {
      canRetry: error.recoverable && error.severity !== ErrorSeverity.CRITICAL,
      canContinue: error.severity === ErrorSeverity.WARNING || error.severity === ErrorSeverity.INFO,
      suggestedActions: []
    };

    // Add specific recovery actions based on error type
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        options.suggestedActions.push('Review and correct validation errors');
        options.suggestedActions.push('Check required fields');
        options.suggestedActions.push('Verify input formats');
        break;

      case ErrorCategory.CALCULATION:
        options.suggestedActions.push('Review calculation parameters');
        options.suggestedActions.push('Reduce network complexity');
        options.suggestedActions.push('Check boundary conditions');
        break;

      case ErrorCategory.NETWORK:
        options.suggestedActions.push('Check internet connection');
        options.suggestedActions.push('Refresh the page');
        options.suggestedActions.push('Try again in a few moments');
        break;

      case ErrorCategory.FILE:
        options.suggestedActions.push('Check file format');
        options.suggestedActions.push('Verify file size limits');
        options.suggestedActions.push('Try uploading a different file');
        break;

      default:
        options.suggestedActions.push('Contact support');
        options.suggestedActions.push('Try refreshing the application');
    }

    return options;
  }

  /**
   * Subscribe to error events
   */
  subscribeToErrors(callback: (error: BaseError) => void): () => void {
    const id = this.generateErrorId();
    this.errorCallbacks.set(id, callback);
    
    return () => {
      this.errorCallbacks.delete(id);
    };
  }

  /**
   * Get error history
   */
  getErrorHistory(): BaseError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }
}

// Create default instance
export const errorHandlerService = new ErrorHandlerService();

// Export default instance methods for convenience
export const handleError = errorHandlerService.handleError.bind(errorHandlerService);
export const getRecoveryOptions = errorHandlerService.getRecoveryOptions.bind(errorHandlerService);
export const subscribeToErrors = errorHandlerService.subscribeToErrors.bind(errorHandlerService);
export const getErrorHistory = errorHandlerService.getErrorHistory.bind(errorHandlerService);
export const clearErrorHistory = errorHandlerService.clearErrorHistory.bind(errorHandlerService);
export const updateConfig = errorHandlerService.updateConfig.bind(errorHandlerService);

export default ErrorHandlerService;