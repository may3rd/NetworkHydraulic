import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalculationState, CalculationActions, CalculationStore } from './types';
import type { CalculationRequest } from '../../types/models';

const initialState: Omit<CalculationState, 'actions'> = {
  status: 'idle',
  progress: 0,
  result: null,
  error: null,
  configuration: null,
  taskId: null,
  startTime: null,
  endTime: null,
  executionTime: 0,
  history: [],
};

export const useCalculationStore = create<CalculationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setStatus: (status) => set({ status }),
      
      setProgress: (progress) => set({ progress }),
      
      setResult: (result) => {
        const startTime = get().startTime;
        set({
          result,
          status: 'completed',
          endTime: new Date(),
          executionTime: startTime ? Date.now() - startTime.getTime() : 0
        });
      },
      
      setError: (error) => {
        const startTime = get().startTime;
        set({
          error,
          status: 'error',
          endTime: new Date(),
          executionTime: startTime ? Date.now() - startTime.getTime() : 0
        });
      },
      
      setConfiguration: (config) => set({ 
        configuration: JSON.stringify(config),
        startTime: new Date()
      }),
      
      setTaskId: (taskId) => set({ taskId }),
      
      setStartTime: (startTime) => set({ startTime }),
      
      setEndTime: (endTime) => set({ endTime }),
      
      clearResult: () => set({ 
        result: null, 
        status: 'idle',
        progress: 0,
        error: null,
        endTime: null,
        executionTime: 0
      }),
      
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
      
      startCalculation: (request: CalculationRequest) => {
        const newTaskId = `calc_${Date.now()}`;
        set((state) => ({
          status: 'running',
          progress: 0,
          result: null,
          error: null,
          configuration: JSON.stringify(request),
          taskId: newTaskId,
          startTime: new Date(),
          endTime: null,
          executionTime: 0,
          history: [
            {
              id: newTaskId,
              timestamp: new Date().toISOString(),
              status: 'running',
              sectionsCount: request.sections.length,
              description: request.network.name,
            },
            ...state.history,
          ],
        }));
      },
      
      completeCalculation: (result) => {
        const startTime = get().startTime;
        const taskId = get().taskId;
        set((state) => ({
          result,
          status: 'completed',
          endTime: new Date(),
          executionTime: startTime ? Date.now() - startTime.getTime() : 0,
          history: state.history.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  status: 'completed',
                  duration: startTime ? (Date.now() - startTime.getTime()) / 1000 : undefined,
                  result: result,
                }
              : item
          ),
        }));
      },
      
      failCalculation: (error: string) => {
        const startTime = get().startTime;
        const taskId = get().taskId;
        set((state) => ({
          error,
          status: 'error',
          endTime: new Date(),
          executionTime: startTime ? Date.now() - startTime.getTime() : 0,
          history: state.history.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  status: 'error',
                  duration: startTime ? (Date.now() - startTime.getTime()) / 1000 : undefined,
                  error: error,
                }
              : item
          ),
        }));
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'calculation-storage',
      partialize: (state) => ({
        // Only persist certain fields
        result: state.result,
        configuration: state.configuration,
        executionTime: state.executionTime,
        history: state.history,
      }),
    }
  )
);