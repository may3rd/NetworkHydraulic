# State Management Guide

This guide provides comprehensive information on state management patterns and best practices in the Hydraulic Network Web Application using Zustand.

## Table of Contents

- [State Management Overview](#state-management-overview)
- [Zustand Fundamentals](#zustand-fundamentals)
- [Store Structure](#store-structure)
- [Store Patterns](#store-patterns)
- [State Persistence](#state-persistence)
- [Performance Optimization](#performance-optimization)
- [Testing State](#testing-state)
- [Migration from Redux](#migration-from-redux)
- [Best Practices](#best-practices)
- [Examples](#examples)

## State Management Overview

The application uses Zustand for state management, providing a lightweight, scalable solution that emphasizes simplicity and performance. Zustand offers a middle ground between React's built-in state management and more complex solutions like Redux.

### Why Zustand?

1. **Simplicity**: Minimal boilerplate and straightforward API
2. **TypeScript Support**: Excellent TypeScript integration
3. **Performance**: Built-in optimizations and selector patterns
4. **Middleware Support**: Extensible with middleware for persistence, logging, etc.
5. **No Provider Wrapper**: No need for context providers
6. **Small Bundle Size**: ~4kb gzipped

### State Management Principles

1. **Single Source of Truth**: Each piece of state has a single, well-defined location
2. **Immutability**: State updates create new state objects
3. **Predictable Updates**: State changes follow predictable patterns
4. **Separation of Concerns**: UI state, business state, and server state are separated
5. **Optimistic Updates**: UI updates immediately with rollback on failure

## Zustand Fundamentals

### Basic Store Creation

```typescript
// stores/basicStore.ts
import { create } from 'zustand';

interface BasicState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useBasicStore = create<BasicState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Advanced Store with Middleware

```typescript
// stores/advancedStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface AdvancedState {
  user: User | null;
  settings: UserSettings;
  theme: 'light' | 'dark';
  
  setUser: (user: User) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAdvancedStore = create<AdvancedState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        settings: {
          notifications: true,
          autoSave: true,
          language: 'en',
        },
        theme: 'light',
        
        setUser: (user) => set({ user }, false, 'user/set'),
        
        updateSettings: (newSettings) => 
          set((state) => ({
            settings: { ...state.settings, ...newSettings }
          }), false, 'settings/update'),
        
        setTheme: (theme) => set({ theme }, false, 'theme/set'),
        
        logout: () => set({ user: null, settings: initialState.settings }, false, 'auth/logout'),
      }),
      {
        name: 'advanced-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          settings: state.settings,
          theme: state.theme,
        }),
        onRehydrateStorage: () => (state) => {
          console.log('State rehydrated:', state);
        },
      }
    ),
    { name: 'advanced-store' }
  )
);
```

## Store Structure

### Store Organization

```
stores/
├── index.ts                    # Store exports
├── configuration/              # Configuration-related state
│   ├── index.ts
│   ├── fluidProperties.ts
│   ├── networkSettings.ts
│   └── pipeSections.ts
├── calculation/                # Calculation state
│   ├── index.ts
│   ├── status.ts
│   ├── results.ts
│   └── progress.ts
├── ui/                         # UI state
│   ├── index.ts
│   ├── theme.ts
│   ├── layout.ts
│   └── notifications.ts
└── auth/                       # Authentication state
    ├── index.ts
    └── user.ts
```

### Configuration Store

```typescript
// stores/configuration/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ConfigurationState {
  // State
  fluidProperties: FluidProperties;
  networkSettings: NetworkSettings;
  pipeSections: PipeSection[];
  validation: ValidationResult;
  
  // Actions
  setFluidProperties: (properties: FluidProperties) => void;
  updateNetworkSettings: (settings: Partial<NetworkSettings>) => void;
  addPipeSection: (section: Omit<PipeSection, 'id'>) => void;
  updatePipeSection: (id: string, updates: Partial<PipeSection>) => void;
  removePipeSection: (id: string) => void;
  validateConfiguration: () => ValidationResult;
  reset: () => void;
  loadConfiguration: (config: NetworkConfiguration) => void;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    immer((set, get) => ({
      fluidProperties: {
        density: 1000,
        viscosity: 0.001,
        temperature: 20,
        phase: 'liquid',
      },
      networkSettings: {
        calculationModel: 'steady_state',
        flowDirection: 'auto',
        boundaryConditions: {
          inletPressure: 100000,
          outletPressure: 80000,
        },
        convergenceCriteria: {
          maxIterations: 100,
          tolerance: 1e-6,
        },
        numericalMethod: 'newton_raphson',
        maxIterations: 100,
        tolerance: 1e-6,
      },
      pipeSections: [],
      validation: { isValid: false, errors: [] },
      
      setFluidProperties: (properties) => 
        set((state) => {
          state.fluidProperties = properties;
        }),
      
      updateNetworkSettings: (settings) => 
        set((state) => {
          Object.assign(state.networkSettings, settings);
        }),
      
      addPipeSection: (section) => 
        set((state) => {
          state.pipeSections.push({
            ...section,
            id: generateId(),
          });
        }),
      
      updatePipeSection: (id, updates) => 
        set((state) => {
          const section = state.pipeSections.find(s => s.id === id);
          if (section) {
            Object.assign(section, updates);
          }
        }),
      
      removePipeSection: (id) => 
        set((state) => {
          state.pipeSections = state.pipeSections.filter(s => s.id !== id);
        }),
      
      validateConfiguration: () => {
        const state = get();
        const errors: string[] = [];
        
        // Validate fluid properties
        if (!state.fluidProperties.density || state.fluidProperties.density <= 0) {
          errors.push('Valid fluid density is required');
        }
        
        if (!state.fluidProperties.viscosity || state.fluidProperties.viscosity <= 0) {
          errors.push('Valid fluid viscosity is required');
        }
        
        // Validate pipe sections
        if (state.pipeSections.length === 0) {
          errors.push('At least one pipe section is required');
        }
        
        state.pipeSections.forEach((section, index) => {
          if (!section.diameter || section.diameter <= 0) {
            errors.push(`Pipe section ${index + 1}: valid diameter is required`);
          }
          
          if (!section.length || section.length <= 0) {
            errors.push(`Pipe section ${index + 1}: valid length is required`);
          }
        });
        
        const isValid = errors.length === 0;
        set((state) => {
          state.validation = { isValid, errors };
        });
        
        return { isValid, errors };
      },
      
      reset: () => 
        set((state) => {
          state.fluidProperties = {
            density: 1000,
            viscosity: 0.001,
            temperature: 20,
            phase: 'liquid',
          };
          state.networkSettings = {
            calculationModel: 'steady_state',
            flowDirection: 'auto',
            boundaryConditions: {
              inletPressure: 100000,
              outletPressure: 80000,
            },
            convergenceCriteria: {
              maxIterations: 100,
              tolerance: 1e-6,
            },
            numericalMethod: 'newton_raphson',
            maxIterations: 100,
            tolerance: 1e-6,
          };
          state.pipeSections = [];
          state.validation = { isValid: false, errors: [] };
        }),
      
      loadConfiguration: (config) => 
        set((state) => {
          state.fluidProperties = config.fluidProperties;
          state.networkSettings = config.networkSettings;
          state.pipeSections = config.pipeSections;
        }),
    })),
    {
      name: 'configuration-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fluidProperties: state.fluidProperties,
        networkSettings: state.networkSettings,
        pipeSections: state.pipeSections,
      }),
    }
  )
);
```

### Calculation Store

```typescript
// stores/calculation/index.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CalculationState {
  // State
  job: CalculationJob | null;
  results: CalculationResults | null;
  isCalculating: boolean;
  error: string | null;
  progress: CalculationProgress | null;
  
  // Actions
  startCalculation: (config: NetworkConfiguration) => void;
  updateProgress: (progress: CalculationProgress) => void;
  finishCalculation: (results: CalculationResults) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useCalculationStore = create<CalculationState>()(
  subscribeWithSelector((set, get) => ({
    job: null,
    results: null,
    isCalculating: false,
    error: null,
    progress: null,
    
    startCalculation: (config) => {
      set({
        isCalculating: true,
        error: null,
        progress: { percentage: 0, message: 'Starting calculation...' },
        job: {
          id: generateId(),
          configuration: config,
          status: 'running',
          startTime: new Date(),
        },
      });
    },
    
    updateProgress: (progress) => {
      set({ progress });
    },
    
    finishCalculation: (results) => {
      set({
        isCalculating: false,
        results,
        progress: { percentage: 100, message: 'Calculation completed' },
      });
    },
    
    setError: (error) => {
      set{
        isCalculating: false,
        error,
        progress: null,
      });
    },
    
    clearError: () => {
      set({ error: null });
    },
    
    reset: () => {
      set({
        job: null,
        results: null,
        isCalculating: false,
        error: null,
        progress: null,
      });
    },
  }))
);
```

## Store Patterns

### 1. Selector Pattern

```typescript
// Optimized state access with selectors
export const useConfigurationData = () => 
  useConfigurationStore((state) => state.fluidProperties);

export const usePipeSections = () => 
  useConfigurationStore((state) => state.pipeSections);

export const useValidationErrors = () => 
  useConfigurationStore((state) => state.validation.errors);

export const useIsConfigurationValid = () => 
  useConfigurationStore((state) => state.validation.isValid);

// Complex selectors
export const useTotalPipeLength = () => 
  useConfigurationStore((state) => 
    state.pipeSections.reduce((total, section) => total + section.length, 0)
  );

export const useCalculationStatus = () => 
  useCalculationStore((state) => ({
    isCalculating: state.isCalculating,
    progress: state.progress,
    hasError: !!state.error,
    canCalculate: useConfigurationStore.getState().validation.isValid,
  }));
```

### 2. Async Actions Pattern

```typescript
// stores/asyncStore.ts
export const useAsyncStore = create<AsyncState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchData: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const data = await ApiService.getData(id);
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  createData: async (newData: CreateData) => {
    set({ loading: true, error: null });
    
    try {
      const createdData = await ApiService.createData(newData);
      set((state) => ({
        data: createdData,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### 3. Derived State Pattern

```typescript
// stores/derivedStore.ts
export const useDerivedStore = create<DerivedState>((set, get) => ({
  items: [],
  filters: { category: 'all', searchTerm: '' },
  
  // Computed values
  get filteredItems() {
    const state = get();
    return state.items.filter(item => {
      const matchesCategory = state.filters.category === 'all' || 
        item.category === state.filters.category;
      const matchesSearch = item.name.toLowerCase().includes(
        state.filters.searchTerm.toLowerCase()
      );
      return matchesCategory && matchesSearch;
    });
  },
  
  get itemCount() {
    return get().filteredItems.length;
  },
  
  // Actions
  setFilters: (filters) => set({ filters }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));
```

### 4. Middleware Pattern

```typescript
// Custom middleware example
const logger = (f) => (set, get, store) => {
  store.setState = (state, replace, name) => {
    console.log('-prev state', get());
    console.log('action', name);
    console.log('next state', state);
    return set(state, replace);
  };
  return f(set, get, store);
};

const useCustomStore = create()(
  logger((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
);
```

## State Persistence

### Basic Persistence

```typescript
// Simple persistence
export const useSimpleStore = create()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'user-preferences',
    }
  )
);
```

### Selective Persistence

```typescript
// Persist only specific state
export const useSelectiveStore = create()(
  persist(
    (set) => ({
      // This will be persisted
      userSettings: { theme: 'light', notifications: true },
      
      // This will not be persisted
      tempData: null,
      loading: false,
      error: null,
      
      updateSettings: (settings) => set((state) => ({
        userSettings: { ...state.userSettings, ...settings },
      })),
      
      setTempData: (data) => set({ tempData: data }),
    }),
    {
      name: 'user-settings',
      partialize: (state) => ({
        userSettings: state.userSettings,
      }),
    }
  )
);
```

### Custom Storage

```typescript
// Custom storage implementation
const customStorage = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useCustomStorageStore = create()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: 'custom-storage',
      storage: customStorage,
    }
  )
);
```

## Performance Optimization

### 1. State Selectors

```typescript
// ✅ Good: Use selectors to avoid unnecessary re-renders
const userName = useUserStore((state) => state.user.name);
const userEmail = useUserStore((state) => state.user.email);

// ❌ Avoid: Accessing entire state object
const user = useUserStore((state) => state.user);
```

### 2. Shallow Equality

```typescript
// Zustand uses shallow equality by default
// For complex objects, use custom equality

import { shallow } from 'zustand/shallow';

const Component = () => {
  const { name, email } = useUserStore(
    (state) => ({ name: state.user.name, email: state.user.email }),
    shallow
  );
  
  // Component will only re-render if name or email changes
};
```

### 3. Immer for Complex Updates

```typescript
// For complex nested state updates
import { immer } from 'zustand/middleware/immer';

export const useComplexStore = create()(
  immer((set) => ({
    nested: {
      items: [
        { id: 1, data: { value: 1 } },
        { id: 2, data: { value: 2 } },
      ],
    },
    
    updateItem: (id, updates) => 
      set((state) => {
        const item = state.nested.items.find(i => i.id === id);
        if (item) {
          Object.assign(item.data, updates);
        }
      }),
  }))
);
```

### 4. State Slicing

```typescript
// Split large stores into smaller, focused stores

// Instead of one large store
export const useLargeStore = create()({
  // Many different concerns mixed together
});

// Use multiple focused stores
export const useUserStore = create()({ /* user-related state */ });
export const useNetworkStore = create()({ /* network-related state */ });
export const useCalculationStore = create()({ /* calculation-related state */ });
```

## Testing State

### Unit Testing Stores

```typescript
// stores/__tests__/configurationStore.test.ts
import { create } from 'zustand';
import { useConfigurationStore } from '../configuration';

// Create a test store instance
const createTestStore = () => {
  const store = create(useConfigurationStore());
  return store;
};

describe('ConfigurationStore', () => {
  let store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should initialize with default values', () => {
    const state = store.getState();
    
    expect(state.fluidProperties.density).toBe(1000);
    expect(state.fluidProperties.viscosity).toBe(0.001);
    expect(state.pipeSections).toEqual([]);
    expect(state.validation.isValid).toBe(false);
  });

  it('should update fluid properties', () => {
    store.getState().setFluidProperties({
      density: 800,
      viscosity: 0.002,
      temperature: 25,
      phase: 'gas',
    });

    const state = store.getState();
    expect(state.fluidProperties.density).toBe(800);
    expect(state.fluidProperties.viscosity).toBe(0.002);
    expect(state.fluidProperties.temperature).toBe(25);
    expect(state.fluidProperties.phase).toBe('gas');
  });

  it('should add pipe sections', () => {
    const section = {
      name: 'Test Section',
      diameter: 0.1,
      length: 100,
      roughness: 0.0001,
      elevation: 0,
      material: 'steel',
      fittings: [],
      valves: [],
    };

    store.getState().addPipeSection(section);

    const state = store.getState();
    expect(state.pipeSections).toHaveLength(1);
    expect(state.pipeSections[0].name).toBe('Test Section');
    expect(state.pipeSections[0].diameter).toBe(0.1);
  });

  it('should validate configuration', () => {
    // Add a valid pipe section
    store.getState().addPipeSection({
      name: 'Test Section',
      diameter: 0.1,
      length: 100,
      roughness: 0.0001,
      elevation: 0,
      material: 'steel',
      fittings: [],
      valves: [],
    });

    const result = store.getState().validateConfiguration();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should validate required fields', () => {
    const result = store.getState().validateConfiguration();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one pipe section is required');
  });
});
```

### Integration Testing with Components

```typescript
// components/__tests__/ConfigurationForm.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { create } from 'zustand';
import ConfigurationForm from '../ConfigurationForm';
import { useConfigurationStore } from '@/stores/configuration';

// Mock the store
const mockStore = {
  fluidProperties: {
    density: 1000,
    viscosity: 0.001,
    temperature: 20,
    phase: 'liquid',
  },
  pipeSections: [],
  validation: { isValid: false, errors: [] },
  setFluidProperties: jest.fn(),
  addPipeSection: jest.fn(),
  validateConfiguration: jest.fn(() => ({ isValid: true, errors: [] })),
};

jest.mock('@/stores/configuration', () => ({
  useConfigurationStore: () => mockStore,
}));

describe('ConfigurationForm Integration', () => {
  it('should display current fluid properties', () => {
    render(<ConfigurationForm />);
    
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('should call store actions on form submission', () => {
    render(<ConfigurationForm />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    expect(mockStore.validateConfiguration).toHaveBeenCalled();
  });
});
```

## Migration from Redux

### Redux to Zustand Migration

```typescript
// Before: Redux approach
// actions/userActions.js
export const SET_USER = 'user/SET_USER';
export const setUser = (user) => ({ type: SET_USER, payload: user });

// reducers/userReducer.js
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// After: Zustand approach
// stores/userStore.js
export const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Migration Strategy

1. **Identify Redux slices** and create equivalent Zustand stores
2. **Convert action creators** to store actions
3. **Update selectors** to Zustand state access
4. **Remove Redux boilerplate** (providers, combineReducers, etc.)
5. **Update tests** to work with new store structure

## Best Practices

### 1. Store Design

```typescript
// ✅ Good: Focused, single-responsibility stores
export const useUserStore = create()({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
});

// ❌ Avoid: Large, unfocused stores
export const useEverythingStore = create()({
  user: null,
  theme: 'light',
  cart: [],
  notifications: [],
  // ... many more unrelated state
});
```

### 2. State Updates

```typescript
// ✅ Good: Explicit state updates
export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ❌ Avoid: Direct state mutation
export const useBadCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => {
    state.count++; // Direct mutation
    return state;
  }),
}));
```

### 3. Error Handling

```typescript
// ✅ Good: Proper error handling in async actions
export const useAsyncStore = create((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await api.getData(id);
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### 4. State Initialization

```typescript
// ✅ Good: Explicit initial state
const initialState = {
  user: null,
  settings: {
    theme: 'light',
    language: 'en',
  },
};

export const useAppStore = create(() => initialState);
```

### 5. Testing

```typescript
// ✅ Good: Test store logic independently
describe('UserStore', () => {
  it('should set user correctly', () => {
    const store = createTestStore();
    store.getState().setUser(mockUser);
    expect(store.getState().user).toEqual(mockUser);
  });
});
```

## Examples

### Complete Store Example

```typescript
// stores/networkStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface NetworkState {
  // State
  networks: Network[];
  selectedNetwork: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadNetworks: () => Promise<void>;
  selectNetwork: (id: string) => void;
  createNetwork: (network: CreateNetwork) => Promise<Network>;
  updateNetwork: (id: string, updates: Partial<Network>) => Promise<void>;
  deleteNetwork: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    immer((set, get) => ({
      networks: [],
      selectedNetwork: null,
      loading: false,
      error: null,
      
      loadNetworks: async () => {
        set((state) => { state.loading = true; state.error = null; });
        
        try {
          const networks = await NetworkService.list();
          set((state) => {
            state.networks = networks;
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.loading = false;
          });
        }
      },
      
      selectNetwork: (id) => {
        set((state) => {
          state.selectedNetwork = id;
        });
      },
      
      createNetwork: async (networkData) => {
        set((state) => { state.loading = true; state.error = null; });
        
        try {
          const newNetwork = await NetworkService.create(networkData);
          set((state) => {
            state.networks.push(newNetwork);
            state.selectedNetwork = newNetwork.id;
            state.loading = false;
          });
          return newNetwork;
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.loading = false;
          });
          throw error;
        }
      },
      
      updateNetwork: async (id, updates) => {
        set((state) => { state.loading = true; state.error = null; });
        
        try {
          await NetworkService.update(id, updates);
          set((state) => {
            const network = state.networks.find(n => n.id === id);
            if (network) {
              Object.assign(network, updates);
            }
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.loading = false;
          });
          throw error;
        }
      },
      
      deleteNetwork: async (id) => {
        set((state) => { state.loading = true; state.error = null; });
        
        try {
          await NetworkService.delete(id);
          set((state) => {
            state.networks = state.networks.filter(n => n.id !== id);
            if (state.selectedNetwork === id) {
              state.selectedNetwork = state.networks.length > 0 ? state.networks[0].id : null;
            }
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error.message;
            state.loading = false;
          });
          throw error;
        }
      },
      
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
      
      reset: () => {
        set((state) => {
          state.networks = [];
          state.selectedNetwork = null;
          state.loading = false;
          state.error = null;
        });
      },
    })),
    {
      name: 'network-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Component Usage Example

```typescript
// components/NetworkList/NetworkList.tsx
import React, { useEffect } from 'react';
import { useNetworkStore } from '@/stores/networkStore';

export const NetworkList: React.FC = () => {
  // Use selectors for performance
  const networks = useNetworkStore((state) => state.networks);
  const loading = useNetworkStore((state) => state.loading);
  const error = useNetworkStore((state) => state.error);
  const selectedNetwork = useNetworkStore((state) => state.selectedNetwork);
  
  const loadNetworks = useNetworkStore((state) => state.loadNetworks);
  const selectNetwork = useNetworkStore((state) => state.selectNetwork);
  const deleteNetwork = useNetworkStore((state) => state.deleteNetwork);

  useEffect(() => {
    loadNetworks();
  }, []);

  const handleDelete = async (networkId: string) => {
    if (window.confirm('Are you sure you want to delete this network?')) {
      await deleteNetwork(networkId);
    }
  };

  if (loading) {
    return <div>Loading networks...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="network-list">
      {networks.map((network) => (
        <div
          key={network.id}
          className={cn('network-item', {
            selected: selectedNetwork === network.id,
          })}
          onClick={() => selectNetwork(network.id)}
        >
          <h3>{network.name}</h3>
          <p>{network.description}</p>
          <button onClick={(e) => {
            e.stopPropagation();
            handleDelete(network.id);
          }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

This guide provides comprehensive patterns and best practices for state management with Zustand. For specific implementation details, refer to the individual store files in the `src/stores/` directory.