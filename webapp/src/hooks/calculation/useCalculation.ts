import { useCallback, useEffect, useRef } from 'react';
import { useCalculationStore } from '../../stores/calculation';
import type { CalculationRequest, CalculationResult } from '../../types/models';

export interface UseCalculationOptions {
  autoConnectWebSocket?: boolean;
  enableProgressTracking?: boolean;
  enableErrorHandling?: boolean;
  enableResultProcessing?: boolean;
}

export interface UseCalculationReturn {
  // State
  status: 'idle' | 'validating' | 'running' | 'completed' | 'error';
  progress: number;
  result: CalculationResult | null;
  error: string | null;
  isCalculating: boolean;
  isValidating: boolean;

  // Actions
  startCalculation: (request: CalculationRequest) => Promise<void>;
  cancelCalculation: () => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
  reset: () => void;
  retryCalculation: () => Promise<void>;
}

export function useCalculation(options: UseCalculationOptions = {}): UseCalculationReturn {
  // Store state
  const status = useCalculationStore((state) => state.status);
  const progress = useCalculationStore((state) => state.progress);
  const result = useCalculationStore((state) => state.result);
  const error = useCalculationStore((state) => state.error);

  // Store actions
  const setStatus = useCalculationStore((state) => state.setStatus);
  const setProgress = useCalculationStore((state) => state.setProgress);
  const setResult = useCalculationStore((state) => state.setResult);
  const setError = useCalculationStore((state) => state.setError);
  const setConfiguration = useCalculationStore((state) => state.setConfiguration);
  const clearResultFromStore = useCalculationStore((state) => state.clearResult);

  // Refs
  const currentTaskId = useRef<string | null>(null);
  const isInitialized = useRef(false);

  // Computed state
  const isCalculating = status === 'running';
  const isValidating = status === 'validating';

  // Setup (simplified)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Simplified initialization - no WebSocket for now
    }
  }, []);

  // Start calculation (simplified)
  const startCalculation = useCallback(async (request: CalculationRequest) => {
    try {
      setStatus('running');
      setProgress(0);
      setError('');
      setConfiguration(request);

      // For now, just set a mock result after a delay
      // In a real implementation, this would call the API
      setTimeout(() => {
        setStatus('completed');
        setProgress(100);
        // Mock result would be set here
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Calculation failed');
      setStatus('error');
    }
  }, [setStatus, setProgress, setError, setConfiguration]);

  // Cancel calculation (simplified)
  const cancelCalculation = useCallback(async () => {
    setStatus('idle');
    setProgress(0);
    setError('');
    currentTaskId.current = null;
  }, [setStatus, setProgress, setError]);

  // Clear result
  const clearResult = useCallback(() => {
    clearResultFromStore();
  }, [clearResultFromStore]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, [setError]);

  // Reset
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    clearResult();
    setError('');
    currentTaskId.current = null;
  }, [setStatus, setProgress, clearResult, setError]);

  // Retry calculation
  const retryCalculation = useCallback(async () => {
    const lastConfiguration = useCalculationStore.getState().configuration;
    if (lastConfiguration) {
      try {
        const request: CalculationRequest = JSON.parse(lastConfiguration);
        await startCalculation(request);
      } catch (error) {
        setError('Failed to retry calculation');
      }
    }
  }, [startCalculation, setError]);

  return {
    // State
    status,
    progress,
    result,
    error,
    isCalculating,
    isValidating,

    // Actions
    startCalculation,
    cancelCalculation,
    clearResult,
    clearError,
    reset,
    retryCalculation,
  };
}