import axios from 'axios'
import type { CalculationResult } from '../store/calculationStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

export interface CalculationSubmissionPayload {
  projectName: string
  config: string
  defaultDiameter?: number
  flowRate?: number
}

export const submitCalculation = async (
  payload: CalculationSubmissionPayload,
): Promise<CalculationResult> => {
  const response = await apiClient.post('/api/calculate', {
    projectName: payload.projectName,
    config: payload.config,
    defaultDiameter: payload.defaultDiameter,
    flowRate: payload.flowRate,
  })
  return response.data
}
