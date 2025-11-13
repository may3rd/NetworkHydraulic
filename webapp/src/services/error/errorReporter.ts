/**
 * Error Reporter Service for Hydraulic Network Web Application
 * 
 * This service handles error reporting, logging, and analytics integration
 * for comprehensive error tracking and monitoring.
 */

import { BaseError, ErrorSeverity, ErrorCategory, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';

export interface ErrorReport {
  error: BaseError;
  context: ErrorContext;
  tracking: ErrorTracking;
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  url: string;
}

export interface ReportingConfig {
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  enableAnalytics: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  endpoints: {
    errorReporting?: string;
    analytics?: string;
  };
}

class ErrorReporterService {
  private config: ReportingConfig;
  private reportQueue: ErrorReport[] = [];
  private flushTimer?: NodeJS.Timeout;
  private retryQueue: ErrorReport[] = [];

  constructor(config?: Partial<ReportingConfig>) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      enableAnalytics: true,
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      maxRetries: 3,
      endpoints: {
        errorReporting: process.env.REACT_APP_ERROR_REPORTING_ENDPOINT || undefined,
        analytics: process.env.REACT_APP_ANALYTICS_ENDPOINT || undefined,
        ...config?.endpoints
      },
      ...config
    };

    this.startFlushTimer();
  }

  /**
   * Report an error
   */
  reportError(
    error: BaseError,
    context: ErrorContext,
    tracking: ErrorTracking
  ): void {
    const report: ErrorReport = {
      error,
      context,
      tracking,
      timestamp: new Date(),
      sessionId: context.sessionId || this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Console logging for development
    if (this.config.enableConsoleLogging) {
      this.logToConsole(report);
    }

    // Add to reporting queue
    this.addToQueue(report);

    // Immediate flush for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.flushQueue();
    }
  }

  /**
   * Log error to console
   */
  private logToConsole(report: ErrorReport): void {
    const { error, context, tracking } = report;
    const severityConfig = SEVERITY_LEVELS[error.severity];
    
    const logLevel = severityConfig.logLevel;
    const message = `[${error.severity.toUpperCase()}] ${error.message}`;
    
    // Use appropriate console method based on severity
    switch (logLevel) {
      case 'error':
      case 'critical':
        console.error(message, { error, context, tracking });
        break;
      case 'warn':
        console.warn(message, { error, context, tracking });
        break;
      case 'info':
      default:
        console.info(message, { error, context, tracking });
        break;
    }
  }

  /**
   * Add report to queue
   */
  private addToQueue(report: ErrorReport): void {
    this.reportQueue.push(report);
    
    // Flush immediately if queue reaches batch size
    if (this.reportQueue.length >= this.config.batchSize) {
      this.flushQueue();
    }
  }

  /**
   * Flush report queue
   */
  async flushQueue(): Promise<void> {
    if (this.reportQueue.length === 0) return;

    const reports = [...this.reportQueue];
    this.reportQueue = [];

    try {
      await this.sendReports(reports);
    } catch (error) {
      console.error('Failed to send error reports:', error);
      
      // Add failed reports to retry queue
      if (this.retryQueue.length < this.config.batchSize * 2) {
        this.retryQueue.push(...reports);
      }
      
      // Retry failed reports
      this.retryReports();
    }
  }

  /**
   * Send reports to remote endpoints
   */
  private async sendReports(reports: ErrorReport[]): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to error reporting endpoint
    if (this.config.enableRemoteReporting && this.config.endpoints.errorReporting) {
      promises.push(this.sendToErrorEndpoint(reports));
    }

    // Send to analytics endpoint
    if (this.config.enableAnalytics && this.config.endpoints.analytics) {
      promises.push(this.sendToAnalyticsEndpoint(reports));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Send reports to error reporting endpoint
   */
  private async sendToErrorEndpoint(reports: ErrorReport[]): Promise<void> {
    const endpoint = this.config.endpoints.errorReporting;
    if (!endpoint) return;

    const payload = {
      reports,
      timestamp: new Date().toISOString(),
      source: 'hydraulic-network-webapp',
      version: (typeof process !== 'undefined' && process.env.REACT_APP_VERSION) || '1.0.0'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send reports to analytics endpoint
   */
  private async sendToAnalyticsEndpoint(reports: ErrorReport[]): Promise<void> {
    const endpoint = this.config.endpoints.analytics;
    if (!endpoint) return;

    // Transform reports to analytics format
    const analyticsEvents = reports.map(report => ({
      event: 'error_occurred',
      timestamp: report.timestamp.toISOString(),
      error_id: report.error.id,
      error_severity: report.error.severity,
      error_category: report.error.category,
      error_message: report.error.message,
      session_id: report.sessionId,
      user_agent: report.userAgent,
      url: report.url,
      context: report.context,
      tracking: report.tracking
    }));

    const payload = {
      events: analyticsEvents,
      source: 'hydraulic-network-webapp'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Analytics reporting failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Retry failed reports
   */
  private async retryReports(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    // Process retries with exponential backoff
    const reportsToRetry = this.retryQueue.splice(0, this.config.batchSize);
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.sendReports(reportsToRetry);
        return; // Success, exit retry loop
      } catch (error) {
        console.warn(`Retry attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        } else {
          // Max retries reached, log final failure
          console.error('Max retries reached for error reports:', reportsToRetry);
        }
      }
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null as any;
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(reports: ErrorReport[] = []): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCategory: Record<ErrorCategory, number>;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const allReports = reports.length > 0 ? reports : this.reportQueue;
    
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.CALCULATION]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.SYSTEM]: 0,
      [ErrorCategory.FILE]: 0,
      [ErrorCategory.CONFIGURATION]: 0
    };

    const errorMessages: Record<string, number> = {};

    allReports.forEach(report => {
      const { error } = report;
      
      errorsBySeverity[error.severity]++;
      errorsByCategory[error.category as ErrorCategory]++;
      
      if (errorMessages[error.message]) {
        errorMessages[error.message]++;
      } else {
        errorMessages[error.message] = 1;
      }
    });

    const topErrors = Object.entries(errorMessages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors: allReports.length,
      errorsBySeverity,
      errorsByCategory,
      topErrors
    };
  }

  /**
   * Export error reports for debugging
   */
  exportReports(format: 'json' | 'csv' = 'json'): string {
    const allReports = [...this.reportQueue, ...this.retryQueue];
    
    if (format === 'json') {
      return JSON.stringify(allReports, null, 2);
    } else {
      // Simple CSV export
      const headers = ['Timestamp', 'Severity', 'Category', 'Message', 'Session ID'];
      const rows = allReports.map(report => [
        report.timestamp.toISOString(),
        report.error.severity,
        report.error.category,
        `"${report.error.message}"`,
        report.sessionId
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Clear report queue
   */
  clearQueue(): void {
    this.reportQueue = [];
    this.retryQueue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.stopFlushTimer();
    this.clearQueue();
  }
}

// Create default instance
export const errorReporterService = new ErrorReporterService();

// Export default instance methods for convenience
export const reportError = errorReporterService.reportError.bind(errorReporterService);
export const getErrorStatistics = errorReporterService.getErrorStatistics.bind(errorReporterService);
export const exportReports = errorReporterService.exportReports.bind(errorReporterService);
export const clearQueue = errorReporterService.clearQueue.bind(errorReporterService);
export const updateConfig = errorReporterService.updateConfig.bind(errorReporterService);

export default ErrorReporterService;