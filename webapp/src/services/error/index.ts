/**
 * Error Services Index for Hydraulic Network Web Application
 * 
 * This module exports all error handling services for easy import and usage.
 */

export { default as ErrorHandlerService } from './errorHandler';
export { default as ErrorReporterService } from './errorReporter';
export { default as ErrorRecoveryService } from './errorRecovery';

// Export service instances
export { errorHandlerService, handleError, getRecoveryOptions, subscribeToErrors, getErrorHistory, clearErrorHistory, updateConfig as updateErrorHandlerConfig } from './errorHandler';
export { errorReporterService, reportError, getErrorStatistics, exportReports, clearQueue, updateConfig as updateReporterConfig } from './errorReporter';
export { errorRecoveryService, attemptRecovery, getRecoveryStatus, getActiveRecoveries, cancelRecovery, updateConfig as updateRecoveryConfig } from './errorRecovery';

// Re-export types for convenience
export type { ErrorHandlerConfig, ErrorRecoveryOptions } from './errorHandler';
export type { ErrorReport, ReportingConfig } from './errorReporter';
export type { RecoveryAction, RecoveryStrategy, RecoveryState, RecoveryConfig } from './errorRecovery';