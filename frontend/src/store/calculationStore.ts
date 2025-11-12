import { create } from 'zustand'

export type CalculationStatus = 'idle' | 'pending' | 'completed' | 'failed'

export interface CalculationConfig {
  projectName: string
  networkDirection: 'auto' | 'upstream-to-downstream' | 'downstream-to-upstream'
  designMargin: number
  fileName?: string
}

export interface SectionSummary {
  id: string
  diameterMm: number
  lengthM: number
  flowRate: number
  pressureDrop: number
}

export interface PressurePoint {
  label: string
  pressure: number
}

export interface CalculationResult {
  id: string
  summary: {
    totalSections: number
    totalLength: number
    totalPressureDrop: number
    peakFlow: number
  }
  sections: SectionSummary[]
  pressureProfile: PressurePoint[]
  generatedAt: string
}

export interface CalculationHistoryEntry {
  id: string
  projectName: string
  status: CalculationStatus
  timestamp: string
}

interface CalculationStore {
  config: CalculationConfig | null
  result: CalculationResult | null
  status: CalculationStatus
  history: CalculationHistoryEntry[]
  setConfig: (config: CalculationConfig) => void
  setResult: (result: CalculationResult) => void
  setStatus: (status: CalculationStatus) => void
  addHistory: (entry: CalculationHistoryEntry) => void
  reset: () => void
}

const initialState: CalculationStore = {
  config: null,
  result: null,
  status: 'idle',
  history: [],
  setConfig: () => undefined,
  setResult: () => undefined,
  setStatus: () => undefined,
  addHistory: () => undefined,
  reset: () => undefined,
}

export const useCalculationStore = create<CalculationStore>((set) => ({
  ...initialState,
  setConfig: (config) => set(() => ({ config })),
  setResult: (result) => set(() => ({ result })),
  setStatus: (status) => set(() => ({ status })),
  addHistory: (entry) =>
    set((state) => ({
      history: [entry, ...state.history].slice(0, 5),
    })),
  reset: () =>
    set(() => ({
      ...initialState,
      history: [],
    })),
}))
