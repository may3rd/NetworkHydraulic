/**
 * Error State Management Hook for Hydraulic Network Web Application
 * 
 * This hook provides comprehensive error state management including
 * error tracking, recovery state, and error notification management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BaseError, 
  ErrorSeverity, 
  ErrorCategory, 
  GlobalErrorState,
  ErrorNotification
} from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';

export interface UseErrorOptions {
  maxErrorHistory: number;
  enableAutoCleanup: boolean;
  autoCleanupInterval: number;
  enableNotifications: boolean;
  notificationTypes: string[];
}

export interface UseErrorReturn {
  // State
  errorState: GlobalErrorState;
  activeErrors: ErrorNotification[];
  errorHistory: ErrorNotification[];
  isGlobalError: boolean;
  globalError: BaseError | undefined;
  
  // Actions
  addError: (error: BaseError) => void;
  addErrorWithNotification: (error: BaseError, options?: Partial<ErrorNotification>) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  clearErrorHistory: () => void;
  dismissError: (notificationId: string) => void;
  dismissAllErrors: () => void;
  retryError: (errorId: string) => void;
  
  // Getters
  getErrorCount: (severity?: ErrorSeverity) => number;
  getActiveErrorCount: (severity?: ErrorSeverity) => number;
  hasErrors: boolean;
  hasWarnings: boolean;
  getErrorsByCategory: (category: ErrorCategory) => ErrorNotification[];
  getErrorsBySeverity: (severity: ErrorSeverity) => ErrorNotification[];
}

const DEFAULT_OPTIONS: UseErrorOptions = {
  maxErrorHistory: 100,
  enableAutoCleanup: true,
  autoCleanupInterval: 300000, // 5 minutes
  enableNotifications: true,
  notificationTypes: ['toast', 'banner', 'inline']
};

function useError(options: Partial<UseErrorOptions> = {}): UseErrorReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [errorState, setErrorState] = useState<GlobalErrorState>({
    activeErrors: [],
    errorHistory: [],
    isGlobalError: false,
    globalError: undefined as any,
    errorCount: 0,
    warningCount: 0,
    lastError: undefined as any,
    lastWarning: undefined as any
  });

  const cleanupTimerRef = useRef<NodeJS.Timeout>();
  const notificationIdCounterRef = useRef(0);

  // Auto-cleanup function
  const cleanupOldNotifications = useCallback(() => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes

    setErrorState(prevState => {
      const filteredActiveErrors = prevState.activeErrors.filter(notification => 
        !notification.expiresAt || notification.expiresAt > now
      );
      
      const filteredHistory = prevState.errorHistory.filter(notification => 
        notification.createdAt > thirtyMinutesAgo
      );

      return {
        ...prevState,
        activeErrors: filteredActiveErrors,
        errorHistory: filteredHistory
      };
    });
  }, []);

  // Setup auto-cleanup timer
  useEffect(() => {
    if (config.enableAutoCleanup) {
      cleanupTimerRef.current = setInterval(cleanupOldNotifications, config.autoCleanupInterval);
    }

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [config.enableAutoCleanup, config.autoCleanupInterval, cleanupOldNotifications]);

  // Helper function to create notification
  const createNotification = useCallback((
    error: BaseError, 
    options: Partial<ErrorNotification> = {}
  ): ErrorNotification => {
    const id = `notification_${++notificationIdCounterRef.current}`;
    
    const notification: ErrorNotification = {
      id,
      type: 'toast',
      error,
      actions: [],
      displayOptions: {
        showDetails: false,
        showSuggestion: true,
        showTimestamp: true,
        autoHide: error.severity !== ErrorSeverity.CRITICAL,
        autoHideDelay: SEVERITY_LEVELS[error.severity].notificationDuration || 5000,
        persistent: error.severity === ErrorSeverity.CRITICAL
      },
      createdAt: new Date(),
      expiresAt: options.displayOptions?.autoHide && options.displayOptions.autoHideDelay
        ? new Date(Date.now() + options.displayOptions.autoHideDelay)
        : undefined,
      ...options
    } as any;
    return notification;
  }, []);

  // Add error function
  const addError = useCallback((error: BaseError) => {
    setErrorState(prevState => {
      const notification = createNotification(error);
      
      // Check if this should become a global error
      const shouldBecomeGlobal = error.severity === ErrorSeverity.CRITICAL || 
                               (error.severity === ErrorSeverity.ERROR && !prevState.isGlobalError);
      
      const newGlobalError = shouldBecomeGlobal ? error : prevState.globalError;
      const newLastError = error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
        ? error : prevState.lastError;
      const newLastWarning = error.severity === ErrorSeverity.WARNING
        ? error : prevState.lastWarning;
        
      const newErrorState: GlobalErrorState = {
        activeErrors: [...prevState.activeErrors, notification],
        errorHistory: [...prevState.errorHistory, notification].slice(-config.maxErrorHistory),
        isGlobalError: shouldBecomeGlobal,
        globalError: newGlobalError as any,
        errorCount: error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
          ? prevState.errorCount + 1 : prevState.errorCount,
        warningCount: error.severity === ErrorSeverity.WARNING
          ? prevState.warningCount + 1 : prevState.warningCount,
        lastError: newLastError as any,
        lastWarning: newLastWarning as any
      };

      return newErrorState;
    });
  }, [createNotification, config.maxErrorHistory]);

  // Add error with notification options
  const addErrorWithNotification = useCallback((error: BaseError, options?: Partial<ErrorNotification>) => {
    const notification = createNotification(error, options);
    
    setErrorState(prevState => {
      const newLastError = error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
        ? error : prevState.lastError;
      const newLastWarning = error.severity === ErrorSeverity.WARNING
        ? error : prevState.lastWarning;
        
      const newErrorState: GlobalErrorState = {
        activeErrors: [...prevState.activeErrors, notification],
        errorHistory: [...prevState.errorHistory, notification].slice(-config.maxErrorHistory),
        isGlobalError: prevState.isGlobalError,
        globalError: prevState.globalError as any,
        errorCount: error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL
          ? prevState.errorCount + 1 : prevState.errorCount,
        warningCount: error.severity === ErrorSeverity.WARNING
          ? prevState.warningCount + 1 : prevState.warningCount,
        lastError: newLastError as any,
        lastWarning: newLastWarning as any
      };

      return newErrorState;
    });
  }, [createNotification, config.maxErrorHistory]);

  // Remove error function
  const removeError = useCallback((errorId: string) => {
    setErrorState(prevState => {
      const errorToRemove = prevState.activeErrors.find(notification => notification.id === errorId);
      if (!errorToRemove) return prevState;

      const newActiveErrors = prevState.activeErrors.filter(notification => notification.id !== errorId);
      
      // Recalculate counts
      const errorCount = newActiveErrors.filter(notification => 
        notification.error.severity === ErrorSeverity.ERROR || 
        notification.error.severity === ErrorSeverity.CRITICAL
      ).length;
      
      const warningCount = newActiveErrors.filter(notification => 
        notification.error.severity === ErrorSeverity.WARNING
      ).length;

      // Update global error if needed
      const remainingErrors = newActiveErrors.filter(notification =>
        notification.error.severity === ErrorSeverity.ERROR ||
        notification.error.severity === ErrorSeverity.CRITICAL
      );
      
      const newGlobalError = remainingErrors.length > 0 ? remainingErrors[0].error : undefined;
      const newIsGlobalError = !!newGlobalError;

      return {
        ...prevState,
        activeErrors: newActiveErrors,
        errorCount,
        warningCount,
        isGlobalError: newIsGlobalError,
        globalError: newGlobalError as any
      };
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrorState(prevState => ({
      ...prevState,
      activeErrors: [],
      isGlobalError: false,
      globalError: undefined as any,
      errorCount: 0,
      warningCount: 0,
      lastError: undefined as any,
      lastWarning: undefined as any
    }));
  }, []);

  // Clear error history
  const clearErrorHistory = useCallback(() => {
    setErrorState(prevState => ({
      ...prevState,
      errorHistory: []
    }));
  }, []);

  // Dismiss error notification
  const dismissError = useCallback((notificationId: string) => {
    setErrorState(prevState => ({
      ...prevState,
      activeErrors: prevState.activeErrors.filter(notification => notification.id !== notificationId)
    }));
  }, []);

  // Dismiss all errors
  const dismissAllErrors = useCallback(() => {
    setErrorState(prevState => ({
      ...prevState,
      activeErrors: []
    }));
  }, []);

  // Retry error
  const retryError = useCallback((errorId: string) => {
    // This would trigger a retry mechanism
    // Implementation depends on the specific error type and recovery strategy
    console.log(`Retrying error: ${errorId}`);
  }, []);

  // Get error count by severity
  const getErrorCount = useCallback((severity?: ErrorSeverity) => {
    if (severity) {
      return errorState.errorHistory.filter(notification => notification.error.severity === severity).length;
    }
    return errorState.errorCount + errorState.warningCount;
  }, [errorState.errorCount, errorState.warningCount, errorState.errorHistory]);

  // Get active error count by severity
  const getActiveErrorCount = useCallback((severity?: ErrorSeverity) => {
    if (severity) {
      return errorState.activeErrors.filter(notification => notification.error.severity === severity).length;
    }
    return errorState.activeErrors.length;
  }, [errorState.activeErrors]);

  // Check if there are any errors
  const hasErrors = errorState.errorCount > 0;
  const hasWarnings = errorState.warningCount > 0;

  // Get errors by category
  const getErrorsByCategory = useCallback((category: ErrorCategory) => {
    return errorState.activeErrors.filter(notification => notification.error.category === category);
  }, [errorState.activeErrors]);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return errorState.activeErrors.filter(notification => notification.error.severity === severity);
  }, [errorState.activeErrors]);

  return {
    // State
    errorState,
    activeErrors: errorState.activeErrors,
    errorHistory: errorState.errorHistory,
    isGlobalError: errorState.isGlobalError,
    globalError: errorState.globalError,
    
    // Actions
    addError,
    addErrorWithNotification,
    removeError,
    clearErrors,
    clearErrorHistory,
    dismissError,
    dismissAllErrors,
    retryError,
    
    // Getters
    getErrorCount,
    getActiveErrorCount,
    hasErrors,
    hasWarnings,
    getErrorsByCategory,
    getErrorsBySeverity
  };
}

export default useError;