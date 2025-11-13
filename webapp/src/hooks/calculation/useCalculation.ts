import { useCallback, useEffect, useRef } from 'react';
import { useCalculationStore } from '../../stores/calculation';
import { calculationService } from '../../services/calculation/calculationService';
import { progressTracker } from '../../services/calculation/progressTracker';
import { calculationErrorHandler } from '../../services/calculation/errorHandler';
import { progressWebSocket } from '../../services/websocket/progressWebSocket';
import { calculationEventDispatcher } from '../../services/websocket/calculationEvents';
import type { CalculationRequest, CalculationResult, ValidationError } from '../../types/models';

export interface UseCalculationOptions {
  autoConnectWebSocket?: boolean;
  enableProgressTracking?: boolean;
  enableErrorHandling?: boolean;
  enableResultProcessing?: boolean;
  validationMode?: 'immediate' | 'onSubmit' | 'manual';
}

export interface UseCalculationReturn {
  // State
  status: 'idle' | 'validating' | 'running' | 'completed' | 'error';
  progress: number;
  result: CalculationResult | null;
  error: string | null;
  validationErrors: ValidationError[];
  isCalculating: boolean;
  isValidating: boolean;

  // Actions
  startCalculation: (request: CalculationRequest) => Promise<void>;
  cancelCalculation: () => Promise<void>;
  validateConfiguration: (request: CalculationRequest) => Promise<boolean>;
  clearResult: () => void;
  clearError: () => void;
  clearValidationErrors: () => void;

  // WebSocket and Progress
  connectWebSocket: () => Promise<boolean>;
  disconnectWebSocket: () => void;
  isConnected: boolean;
  subscribeToTask: (taskId: string) => boolean;
  unsubscribeFromTask: (taskId: string) => void;

  // Utilities
  reset: () => void;
  retryCalculation: () => Promise<void>;
}

export function useCalculation(options: UseCalculationOptions = {}): UseCalculationReturn {
  const {
    autoConnectWebSocket = true,
    enableProgressTracking = true,
    enableErrorHandling = true,
    enableResultProcessing = true,
    validationMode = 'onSubmit',
  } = options;

  // Store state
  const status = useCalculationStore((state) => state.status);
  const progress = useCalculationStore((state) => state.progress);
  const result = useCalculationStore((state) => state.result);
  const error = useCalculationStore((state) => state.error);
  const actions = useCalculationStore((state) => state.actions);

  // Refs
  const currentTaskId = useRef<string | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Computed state
  const isCalculating = status === 'running';
  const isValidating = status === 'validating';
  const isConnected = progressWebSocket.isConnected();

  // Setup WebSocket and event handlers
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      if (autoConnectWebSocket) {
        connectWebSocket();
      }

      // Setup event handlers
      if (enableProgressTracking) {
        setupProgressTracking();
      }

      if (enableErrorHandling) {
        setupErrorHandling();
      }
    }

    return () => {
      if (autoConnectWebSocket) {
        disconnectWebSocket();
      }
    };
  }, []);

  // Setup progress tracking
  const setupProgressTracking = useCallback(() => {
    calculationEventDispatcher.updateHandlers({
      onProgressUpdate: (progressUpdate) => {
        if (progressUpdate.taskId === currentTaskId.current) {
          actions.setProgress(progressUpdate.progress);
        }
      },
      onCalculationComplete: (taskId, calculationResult) => {
        if (taskId === currentTaskId.current) {
          actions.setResult(calculationResult);
          progressTracker.completeTracking(taskId, true, calculationResult);
        }
      },
      onCalculationError: (taskId, calculationError) => {
        if (taskId === currentTaskId.current) {
          const errorMessage = calculationError.message || 'Calculation failed';
          actions.setError(errorMessage);
          progressTracker.completeTracking(taskId, false, null, errorMessage);
        }
      },
    });

    // Connect WebSocket to event dispatcher
    progressWebSocket.updateEventHandlers({
      onProgressUpdate: (progressUpdate) => {
        calculationEventDispatcher.dispatch(
          calculationEventDispatcher.constructor.createProgressEvent(
            'progress_update',
            progressUpdate.progress > 0 ? currentTaskId.current || '' : '',
            progressUpdate.progress,
            progressUpdate.stage,
            progressUpdate.message,
            progressUpdate.estimatedTime,
            progressUpdate.elapsedTime
          )
        );
      },
      onCalculationComplete: (taskId, result) => {
        calculationEventDispatcher.dispatch(
          calculationEventDispatcher.constructor.createCalculationCompleteEvent(taskId, result, 0)
        );
      },
      onCalculationError: (taskId, error) => {
        calculationEventDispatcher.dispatch(
          calculationEventDispatcher.constructor.createCalculationErrorEvent(taskId, error)
        );
      },
    });
  }, [actions]);

  // Setup error handling
  const setupErrorHandling = useCallback(() => {
    calculationEventDispatcher.updateHandlers({
      onConnectionStateChange: (connected) => {
        if (!connected && status === 'running') {
          actions.setError('Connection lost. Calculation may have been interrupted.');
        }
      },
    });
  }, [actions, status]);

  // Start calculation
  const startCalculation = useCallback(async (request: CalculationRequest) => {
    try {
      actions.startCalculation(request);
      actions.setProgress(0);
      actions.setError(null);

      // Validate configuration first
      if (validationMode === 'onSubmit' || validationMode === 'immediate') {
        const isValid = await validateConfiguration(request);
        if (!isValid) {
          return;
        }
      }

      // Start progress tracking
      if (enableProgressTracking) {
        const taskId = `calc_${Date.now()}`;
        currentTaskId.current = taskId;
        progressTracker.startTracking(taskId, request);
        progressWebSocket.subscribeToTask(taskId);
      }

      // Execute calculation
      const calculationResult = await calculationService.executeCalculation(request, {
        async: true,
        validateOnly: false,
      });

      if (!calculationResult.success) {
        throw new Error(calculationResult.message || 'Calculation failed');
      }

      if (calculationResult.taskId) {
        currentTaskId.current = calculationResult.taskId;
        // Progress tracking will handle the rest via WebSocket
      } else if (calculationResult.result) {
        // Synchronous result
        actions.setResult(calculationResult.result);
        if (currentTaskId.current) {
          progressTracker.completeTracking(currentTaskId.current, true, calculationResult.result);
        }
      }

    } catch (error) {
      const handledError = calculationErrorHandler.handleCalculationError(error, {
        operation: 'startCalculation',
        configuration: request,
      });
      actions.setError(handledError.message);
      
      if (currentTaskId.current) {
        progressTracker.completeTracking(currentTaskId.current, false, null, handledError.message);
      }
    }
  }, [actions, validationMode, enableProgressTracking]);

  // Cancel calculation
  const cancelCalculation = useCallback(async () => {
    if (!currentTaskId.current) {
      return;
    }

    try {
      await calculationService.cancelCalculation(currentTaskId.current);
      actions.setProgress(0);
      actions.setStatus('idle');
      
      progressTracker.removeProgress(currentTaskId.current);
      progressWebSocket.unsubscribeFromTask(currentTaskId.current);
      currentTaskId.current = null;
    } catch (error) {
      const handledError = calculationErrorHandler.handleCalculationError(error, {
        operation: 'cancelCalculation',
        taskId: currentTaskId.current,
      });
      actions.setError(handledError.message);
    }
  }, [actions]);

  // Validate configuration
  const validateConfiguration = useCallback(async (request: CalculationRequest): Promise<boolean> => {
    if (validationMode === 'manual' && !enableErrorHandling) {
      return true;
    }

    try {
      actions.setStatus('validating');
      
      // Clear previous validation errors
      clearValidationErrors();

      const validationResult = await calculationService.validateConfiguration(request.configuration);
      
      if (!validationResult.isValid) {
        // Handle validation errors
        if (enableErrorHandling) {
          const { errors } = calculationErrorHandler.handleValidationError(
            validationResult.errors,
            validationResult.warnings || [],
            {
              operation: 'validateConfiguration',
              configuration: request.configuration,
            }
          );
          // Store validation errors in component state or store
          console.log('Validation errors:', errors);
        }
        return false;
      }

      return true;
    } catch (error) {
      const handledError = calculationErrorHandler.handleCalculationError(error, {
        operation: 'validateConfiguration',
        configuration: request.configuration,
      });
      actions.setError(handledError.message);
      return false;
    } finally {
      if (status === 'validating') {
        actions.setStatus('idle');
      }
    }
  }, [actions, validationMode, enableErrorHandling, status]);

  // WebSocket management
  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    return await progressWebSocket.connect();
  }, []);

  const disconnectWebSocket = useCallback(() => {
    progressWebSocket.disconnect();
  }, []);

  const subscribeToTask = useCallback((taskId: string): boolean => {
    return progressWebSocket.subscribeToTask(taskId);
  }, []);

  const unsubscribeFromTask = useCallback((taskId: string): void => {
    progressWebSocket.unsubscribeFromTask(taskId);
  }, []);

  // Utility functions
  const clearResult = useCallback(() => {
    actions.clearResult();
  }, [actions]);

  const clearError = useCallback(() => {
    actions.setError(null);
  }, [actions]);

  const clearValidationErrors = useCallback(() => {
    // Clear validation errors from store or component state
  }, []);

  const reset = useCallback(() => {
    actions.clearResult();
    actions.setProgress(0);
    actions.setStatus('idle');
    actions.setError(null);
    
    if (currentTaskId.current) {
      progressTracker.removeProgress(currentTaskId.current);
      progressWebSocket.unsubscribeFromTask(currentTaskId.current);
      currentTaskId.current = null;
    }
  }, [actions]);

  const retryCalculation = useCallback(async () => {
    // Get the last configuration from store
    const lastConfiguration = useCalculationStore.getState().configuration;
    if (lastConfiguration) {
      const request: CalculationRequest = JSON.parse(lastConfiguration);
      await startCalculation(request);
    }
  }, [startCalculation]);

  return {
    // State
    status,
    progress,
    result,
    error,
    validationErrors: [], // Would need to be managed in store or state
    isCalculating,
    isValidating,

    // Actions
    startCalculation,
    cancelCalculation,
    validateConfiguration,
    clearResult,
    clearError,
    clearValidationErrors,

    // WebSocket and Progress
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
    subscribeToTask,
    unsubscribeFromTask,

    // Utilities
    reset,
    retryCalculation,
  };
}