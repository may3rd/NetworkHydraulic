import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { FluidConfiguration, NetworkConfiguration, PipeSection } from '../../types/models';

interface ConfigurationState {
  // State
  network: NetworkConfiguration | null;
  fluid: FluidConfiguration | null;
  sections: PipeSection[];
  validation: {
    isValid: boolean;
    errors: any[];
    warnings: any[];
  };

  // Actions
  actions: {
    updateNetwork: (network: Partial<NetworkConfiguration>) => void;
    updateFluid: (fluid: Partial<FluidConfiguration>) => void;
    addSection: (section: PipeSection) => void;
    updateSection: (id: string, updates: Partial<PipeSection>) => void;
    removeSection: (id: string) => void;
    validateConfiguration: () => void;
    resetConfiguration: () => void;
    loadConfiguration: (config: any) => void;
    clearValidation: () => void;
  };
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    immer((set, get) => ({
      network: null,
      fluid: null,
      sections: [],
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      actions: {
        updateNetwork: (network) =>
          set((state) => {
            if (state.network) {
              Object.assign(state.network, network);
            } else {
              state.network = network as NetworkConfiguration;
            }
          }),
        updateFluid: (fluid) =>
          set((state) => {
            if (state.fluid) {
              Object.assign(state.fluid, fluid);
            } else {
              state.fluid = fluid as FluidConfiguration;
            }
          }),
        addSection: (section) =>
          set((state) => {
            state.sections.push(section);
          }),
        updateSection: (id, updates) =>
          set((state) => {
            const index = state.sections.findIndex((s: PipeSection) => s.id === id);
            if (index !== -1) {
              Object.assign(state.sections[index], updates);
            }
          }),
        removeSection: (id) =>
          set((state) => {
            state.sections = state.sections.filter((s: PipeSection) => s.id !== id);
          }),
        validateConfiguration: () => {
          // TODO: Implement validation logic
          set((state) => {
            state.validation = {
              isValid: true,
              errors: [],
              warnings: [],
            };
          });
        },
        resetConfiguration: () =>
          set(() => ({
            network: null,
            fluid: null,
            sections: [],
            validation: {
              isValid: true,
              errors: [],
              warnings: [],
            },
          })),
        loadConfiguration: (config) =>
          set(() => ({
            network: config.network || null,
            fluid: config.fluid || null,
            sections: config.sections || [],
            validation: {
              isValid: true,
              errors: [],
              warnings: [],
            },
          })),
        clearValidation: () =>
          set((state) => {
            state.validation = {
              isValid: true,
              errors: [],
              warnings: [],
            };
          }),
      },
    })),
    {
      name: 'hydraulic-configuration',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        network: state.network,
        fluid: state.fluid,
        sections: state.sections,
      }),
      version: 1,
    }
  )
);

// Selector hooks for better performance
export const useNetwork = () => useConfigurationStore((state) => state.network);
export const useFluid = () => useConfigurationStore((state) => state.fluid);
export const useSections = () => useConfigurationStore((state) => state.sections);
export const useConfigurationValidation = () => useConfigurationStore((state) => state.validation);
export const useConfigurationActions = () => useConfigurationStore((state) => state.actions);