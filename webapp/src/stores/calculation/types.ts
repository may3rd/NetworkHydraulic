import type { CalculationResult, CalculationRequest } from '../../types/models';

export interface CalculationHistoryItem {
  id: string;
  timestamp: string;
  status: 'completed' | 'error' | 'cancelled';
  duration?: number;
  sectionsCount: number;
  description?: string;
  result?: any;
  error?: string;
}

export interface CalculationState {
  status: 'idle' | 'validating' | 'running' | 'completed' | 'error';
  progress: number;
  result: CalculationResult | null;
  error: string | null;
  configuration: string | null; // JSON string of last configuration
  taskId: string | null;
  startTime: Date | null;
  endTime: Date | null;
  executionTime: number; // in milliseconds
  history: CalculationHistoryItem[];
}

export interface CalculationActions {
  setStatus: (status: CalculationState['status']) => void;
  setProgress: (progress: number) => void;
  setResult: (result: CalculationResult) => void;
  setError: (error: string) => void;
  setConfiguration: (config: CalculationRequest) => void;
  setTaskId: (taskId: string | null) => void;
  setStartTime: (time: Date | null) => void;
  setEndTime: (time: Date | null) => void;
  clearResult: () => void;
  clearError: () => void;
  reset: () => void;
  startCalculation: (request: CalculationRequest) => void;
  completeCalculation: (result: CalculationResult) => void;
  failCalculation: (error: string) => void;
  clearHistory: () => void;
}

export interface CalculationStore extends CalculationState, CalculationActions {}