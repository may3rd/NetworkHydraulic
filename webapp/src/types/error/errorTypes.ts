/**
 * Error Types and Interfaces for Hydraulic Network Web Application
 * 
 * This module defines comprehensive error types for handling various error scenarios
 * including validation errors, calculation errors, network errors, and system errors.
 */

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning', 
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  CALCULATION = 'calculation',
  NETWORK = 'network',
  SYSTEM = 'system',
  FILE = 'file',
  CONFIGURATION = 'configuration'
}

// Base error interface
export interface BaseError {
  id: string;
  timestamp: Date;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code?: string;
  details?: any;
  suggestion?: string;
  recoverable: boolean;
  userMessage?: string;
}

// Validation error interface
export interface ValidationError extends BaseError {
  field?: string;
  value?: any;
  constraint?: string;
  path?: string[];
}

// Calculation error interface
export interface CalculationError extends BaseError {
  calculationId?: string;
  sectionId?: string;
  solverError?: boolean;
  timeout?: boolean;
}

// Network error interface
export interface NetworkError extends BaseError {
  endpoint?: string;
  status?: number;
  statusText?: string;
  request?: any;
  response?: any;
}

// File error interface
export interface FileError extends BaseError {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  lineNumber?: number;
  columnNumber?: number;
}

// Configuration error interface
export interface ConfigurationError extends BaseError {
  configSection?: string;
  configField?: string;
  expectedValue?: any;
  actualValue?: any;
}

// Error collection interface
export interface ErrorCollection {
  errors: BaseError[];
  warnings: BaseError[];
  infoMessages: BaseError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  criticalError?: BaseError;
}

// Error context interface
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
}

// Error recovery interface
export interface ErrorRecovery {
  canRetry: boolean;
  canContinue: boolean;
  suggestedActions: string[];
  rollbackData?: any;
  alternativeMethods?: string[];
}

// Error display options
export interface ErrorDisplayOptions {
  showDetails: boolean;
  showSuggestion: boolean;
  showTimestamp: boolean;
  autoHide: boolean;
  autoHideDelay: number;
  persistent: boolean;
}

// Error tracking interface
export interface ErrorTracking {
  errorId: string;
  sessionId: string;
  componentStack?: string;
  errorBoundary?: string;
  userAction?: string;
  breadcrumbs?: string[];
  environment?: {
    userAgent: string;
    url: string;
    timestamp: Date;
  };
}

// API error response interface
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    suggestion?: string;
  };
  timestamp: string;
  requestId: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infoMessages: ValidationError[];
  criticalError?: ValidationError;
}

// Field validation result interface
export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
}

// Batch validation result interface
export interface BatchValidationResult {
  isValid: boolean;
  totalFields: number;
  validFields: number;
  invalidFields: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  results: Record<string, FieldValidationResult>;
}

// Error action interface
export interface ErrorAction {
  type: 'retry' | 'rollback' | 'continue' | 'dismiss' | 'report';
  label: string;
  callback?: () => void;
  priority: number;
}

// Error notification interface
export interface ErrorNotification {
  id: string;
  type: 'toast' | 'modal' | 'banner' | 'inline';
  error: BaseError;
  actions?: ErrorAction[];
  displayOptions: ErrorDisplayOptions;
  createdAt: Date;
  expiresAt?: Date;
}

// Global error state interface
export interface GlobalErrorState {
  activeErrors: ErrorNotification[];
  errorHistory: ErrorNotification[];
  isGlobalError: boolean;
  globalError?: BaseError;
  errorCount: number;
  warningCount: number;
  lastError?: BaseError;
  lastWarning?: BaseError;
}

// Error reporting interface
export interface ErrorReport {
  error: BaseError;
  context: ErrorContext;
  tracking: ErrorTracking;
  stackTrace?: string;
  userComments?: string;
  reproductionSteps?: string[];
}

// Error configuration interface
export interface ErrorConfiguration {
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

// Create error helper function
export function createError(
  category: ErrorCategory,
  severity: ErrorSeverity,
  message: string,
  options: Partial<BaseError> = {}
): BaseError {
  return {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    message,
    severity,
    category,
    recoverable: options.recoverable ?? true,
    ...options
  };
}

// Create validation error helper function
export function createValidationError(
  field: string,
  message: string,
  options: Partial<ValidationError> = {}
): ValidationError {
  return {
    ...createError(ErrorCategory.VALIDATION, ErrorSeverity.ERROR, message, options),
    field,
    ...options
  } as ValidationError;
}

// Create calculation error helper function
export function createCalculationError(
  message: string,
  options: Partial<CalculationError> = {}
): CalculationError {
  return {
    ...createError(ErrorCategory.CALCULATION, ErrorSeverity.ERROR, message, options),
    ...options
  } as CalculationError;
}

// Create network error helper function
export function createNetworkError(
  message: string,
  options: Partial<NetworkError> = {}
): NetworkError {
  return {
    ...createError(ErrorCategory.NETWORK, ErrorSeverity.ERROR, message, options),
    ...options
  } as NetworkError;
}