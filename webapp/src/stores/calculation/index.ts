import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CalculationRequest, CalculationResult } from '../../types/models';

interface CalculationState {
  // State
  status: 'idle' | 'validating' | 'running' | 'completed' | 'error';
  progress: number;
  result: CalculationResult | null;
  error: string | null;
  configuration: string;
  history: Array<{
    id: string;
    timestamp: string;
    request: CalculationRequest;
    result: CalculationResult | null;
    error: string | null;
  }>;

  // Actions
  actions: {
    startCalculation: (request: CalculationRequest) => Promise<void>;
    cancelCalculation: () => void;
    setProgress: (progress: number) => void;
    setStatus: (status: CalculationState['status']) => void;
    setResult: (result: CalculationResult) => void;
    setError: (error: string | null) => void;
    clearResult: () => void;
    saveToHistory: (request: CalculationRequest, result: CalculationResult | null, error: string | null) => void;
    loadFromHistory: (id: string) => CalculationResult | null;
    clearHistory: () => void;
    removeHistoryItem: (id: string) => void;
  };
}

export const useCalculationStore = create<CalculationState>()(
  persist(
    immer((set, get) => ({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
      configuration: '',
      history: [],
      actions: {
        startCalculation: async (request) => {
          set((state) => {
            state.status = 'running';
            state.progress = 0;
            state.result = null;
            state.error = null;
            state.configuration = JSON.stringify(request, null, 2);
          });
        },
        cancelCalculation: () =>
          set((state) => {
            state.status = 'idle';
            state.progress = 0;
          }),
        setProgress: (progress) =>
          set((state) => {
            state.progress = Math.min(100, Math.max(0, progress));
          }),
        setStatus: (status) =>
          set((state) => {
            state.status = status;
          }),
        setResult: (result) =>
          set((state) => {
            state.status = 'completed';
            state.result = result;
            state.error = null;
          }),
        setError: (error) =>
          set((state) => {
            state.status = 'error';
            state.error = error;
            state.progress = 0;
          }),
        clearResult: () =>
          set((state) => {
            state.status = 'idle';
            state.progress = 0;
            state.result = null;
            state.error = null;
            state.configuration = '';
          }),
        saveToHistory: (request, result, error) =>
          set((state) => {
            const id = Date.now().toString();
            state.history.unshift({
              id,
              timestamp: new Date().toISOString(),
              request,
              result,
              error,
            });
            // Keep only last 50 calculations
            if (state.history.length > 50) {
              state.history = state.history.slice(0, 50);
            }
          }),
        loadFromHistory: (id) => {
          const state = get();
          const item = state.history.find((h) => h.id === id);
          return item?.result || null;
        },
        clearHistory: () =>
          set((state) => {
            state.history = [];
          }),
        removeHistoryItem: (id) =>
          set((state) => {
            state.history = state.history.filter((h: typeof state.history[0]) => h.id !== id);
          }),
      },
    })),
    {
      name: 'hydraulic-calculation',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
      }),
      version: 1,
    }
  )
);

// Selector hooks for better performance
export const useCalculationStatus = () => useCalculationStore((state) => state.status);
export const useCalculationProgress = () => useCalculationStore((state) => state.progress);
export const useCalculationResult = () => useCalculationStore((state) => state.result);
export const useCalculationError = () => useCalculationStore((state) => state.error);
export const useCalculationHistory = () => useCalculationStore((state) => state.history);
export const useCalculationActions = () => useCalculationStore((state) => state.actions);