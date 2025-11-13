# Application Architecture

This document provides a comprehensive overview of the Hydraulic Network Web Application's architecture, design patterns, and technical decisions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Design Principles](#design-principles)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [API Architecture](#api-architecture)
- [Data Flow](#data-flow)
- [Performance Considerations](#performance-considerations)
- [Security Architecture](#security-architecture)
- [Testing Strategy](#testing-strategy)

## Architecture Overview

The Hydraulic Network Web Application follows a modern, modular architecture designed for scalability, maintainability, and performance. It implements a component-based frontend with clear separation of concerns and follows established design patterns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  Pages  │  Layouts  │  Components  │  Hooks  │  Validation     │
├─────────────────────────────────────────────────────────────────┤
│                        Business Logic Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  Services  │  Stores  │  Utils  │  Types  │  API Client       │
├─────────────────────────────────────────────────────────────────┤
│                        Data Access Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                    REST API  │  WebSocket                      │
└─────────────────────────────────────────────────────────────────┘
```

### Architectural Patterns

- **Component-Based Architecture**: Modular, reusable components
- **State Management**: Zustand for global state management
- **Service Layer**: Separated business logic from UI components
- **Dependency Injection**: Minimal DI through props and context
- **Event-Driven**: WebSocket integration for real-time updates

## Design Principles

### 1. Separation of Concerns

Each layer has a specific responsibility:

- **Presentation Layer**: User interface and interaction
- **Business Logic Layer**: Application logic and state management
- **Data Access Layer**: API communication and data persistence

### 2. Single Responsibility Principle

Each component, service, and hook has one clearly defined purpose:

```typescript
// ✅ Good: Single responsibility
export const useCalculationStatus = () => {
  // Only handles calculation status logic
};

// ❌ Avoid: Multiple responsibilities
export const useCalculationAndUI = () => {
  // Handles both calculation and UI logic
};
```

### 3. Don't Repeat Yourself (DRY)

Common functionality is extracted into reusable components, hooks, and utilities:

```typescript
// ✅ Good: Reusable validation hook
export const useValidation = (schema: Yup.Schema) => {
  // Validation logic
};

// ✅ Good: Reusable form component
export const FormField = ({ label, error, ...props }) => {
  // Form field component
};
```

### 4. Composition Over Inheritance

Components are composed together rather than inheriting from base classes:

```typescript
// ✅ Good: Composition
const NetworkEditor = () => (
  <FormLayout>
    <FluidProperties />
    <PipeSections />
    <BoundaryConditions />
  </FormLayout>
);

// ❌ Avoid: Inheritance-based approach
class NetworkEditor extends BaseFormComponent {
  // Complex inheritance hierarchy
}
```

## Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18+ | UI framework |
| Language | TypeScript | Type-safe development |
| Build Tool | Vite | Fast development and build |
| State Management | Zustand | Global state management |
| UI Library | Material-UI (MUI) | Component library |
| Forms | React Hook Form | Form management |
| Validation | Yup | Schema validation |
| HTTP Client | Axios | API communication |
| Charts | Chart.js/Recharts | Data visualization |
| Diagrams | React Flow | Network visualization |
| Testing | Jest/RTL/Cypress | Comprehensive testing |
| Styling | Styled-components | Component styling |

### Development Tools

- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates
- **Lint-staged**: Pre-commit linting
- **Conventional Commits**: Semantic commit messages

## Component Architecture

### Atomic Design Principles

Components follow the atomic design methodology:

```
Atoms (Basic Elements)
├── Button, Input, Icon, Typography

Molecules (Simple Components)
├── FormField, Card, Alert

Organisms (Complex Components)
├── Form, Table, Navigation

Templates (Page Structures)
├── ConfigurationTemplate, ResultsTemplate

Pages (Complete Screens)
├── ConfigurationPage, ResultsPage, HistoryPage
```

### Component Hierarchy

```
App
├── Layout
│   ├── Navigation
│   ├── Main Content Area
│   └── Footer
└── Pages
    ├── ConfigurationPage
    │   ├── FluidProperties
    │   ├── PipeSections
    │   └── BoundaryConditions
    ├── ResultsPage
    │   ├── ResultsDashboard
    │   ├── Charts
    │   └── Tables
    └── HistoryPage
        ├── CalculationHistory
        └── SavedConfigurations
```

### Component Structure

Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories (future)
├── index.ts                   # Export
├── types.ts                   # Component-specific types
├── styles.ts                  # Component styles
└── README.md                  # Component documentation
```

### Component Guidelines

#### Props Interface

```typescript
interface ComponentNameProps {
  /** Component description */
  prop: Type;
  /** Optional callback */
  onChange?: (value: Type) => void;
  /** Additional HTML attributes */
  [key: string]: any;
}
```

#### Component Implementation

```typescript
export const ComponentName: React.FC<ComponentNameProps> = ({
  prop,
  onChange,
  className,
  ...rest
}) => {
  // Hooks
  const { t } = useTranslation();
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Handler logic
  }, [dependencies]);

  // Render
  return (
    <div className={cn(styles.container, className)} {...rest}>
      {/* Component JSX */}
    </div>
  );
};
```

## State Management

### State Management Strategy

The application uses Zustand for global state management with the following principles:

1. **Minimal Global State**: Only share state that needs to be accessed across components
2. **Local State**: Use component state for component-specific data
3. **Persistence**: Automatically persist critical state to localStorage
4. **Selectors**: Use selectors to optimize re-renders

### State Structure

```
Global State
├── Configuration Store
│   ├── Fluid Properties
│   ├── Network Settings
│   ├── Pipe Sections
│   └── Validation State
├── Calculation Store
│   ├── Calculation Status
│   ├── Results Data
│   ├── Progress Tracking
│   └── Error State
└── UI Store
    ├── Theme Settings
    ├── Navigation State
    ├── Modal States
    └── Notification Queue
```

### Store Implementation

```typescript
// stores/configurationStore.ts
interface ConfigurationState {
  // State
  fluidProperties: FluidProperties;
  networkSettings: NetworkSettings;
  pipeSections: PipeSection[];
  validation: ValidationResult;
  
  // Actions
  setFluidProperties: (properties: FluidProperties) => void;
  addPipeSection: (section: PipeSection) => void;
  updatePipeSection: (id: string, updates: Partial<PipeSection>) => void;
  removePipeSection: (id: string) => void;
  validateConfiguration: () => ValidationResult;
  reset: () => void;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      fluidProperties: initialFluidProperties,
      networkSettings: initialNetworkSettings,
      pipeSections: [],
      validation: { isValid: false, errors: [] },
      
      setFluidProperties: (properties) => 
        set({ fluidProperties: properties }),
      
      addPipeSection: (section) => 
        set((state) => ({
          pipeSections: [...state.pipeSections, section]
        })),
      
      updatePipeSection: (id, updates) => 
        set((state) => ({
          pipeSections: state.pipeSections.map(section =>
            section.id === id 
              ? { ...section, ...updates }
              : section
          )
        })),
      
      removePipeSection: (id) => 
        set((state) => ({
          pipeSections: state.pipeSections.filter(s => s.id !== id)
        })),
      
      validateConfiguration: () => {
        const state = get();
        const errors = [];
        
        // Validation logic
        if (!state.fluidProperties.density) {
          errors.push('Density is required');
        }
        
        return { isValid: errors.length === 0, errors };
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'configuration-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### State Selectors

```typescript
// Optimized selectors for performance
export const useConfigurationData = () => 
  useConfigurationStore((state) => state.fluidProperties);

export const usePipeSections = () => 
  useConfigurationStore((state) => state.pipeSections);

export const useValidationErrors = () => 
  useConfigurationStore((state) => state.validation.errors);
```

## API Architecture

### API Client Structure

```typescript
// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);
```

### Service Layer

```typescript
// services/calculationService.ts
export class CalculationService {
  private static BASE_URL = '/calculations';

  static async startCalculation(config: NetworkConfiguration): Promise<CalculationJob> {
    const response = await apiClient.post(`${this.BASE_URL}/start`, config);
    return response.data;
  }

  static async getCalculationStatus(jobId: string): Promise<CalculationStatus> {
    const response = await apiClient.get(`${this.BASE_URL}/status/${jobId}`);
    return response.data;
  }

  static async getCalculationResults(jobId: string): Promise<CalculationResults> {
    const response = await apiClient.get(`${this.BASE_URL}/results/${jobId}`);
    return response.data;
  }

  static async cancelCalculation(jobId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/cancel/${jobId}`);
  }
}
```

### Error Handling Strategy

```typescript
// api/errorHandler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    throw new ApiError(status, data.message || 'Server error', data);
  } else if (error.request) {
    // Network error
    throw new ApiError(0, 'Network error - please check your connection');
  } else {
    // Other error
    throw new ApiError(0, error.message || 'An error occurred');
  }
};
```

## Data Flow

### Unidirectional Data Flow

The application follows a unidirectional data flow pattern:

```
User Interaction
    ↓
Event Handler
    ↓
State Update (Zustand)
    ↓
Component Re-render
    ↓
UI Update
    ↓
API Call (if needed)
    ↓
State Update (Results)
    ↓
Component Re-render
```

### Real-time Data Flow

For real-time updates via WebSocket:

```
WebSocket Message
    ↓
WebSocket Manager
    ↓
Event Dispatcher
    ↓
State Update
    ↓
Component Re-render
```

### Data Flow Example

```typescript
// Example: Starting a calculation
const handleStartCalculation = async () => {
  // 1. Get configuration from state
  const config = useConfigurationStore.getState().getConfig();
  
  // 2. Validate configuration
  const validation = validateConfiguration(config);
  if (!validation.isValid) {
    setError(validation.errors);
    return;
  }
  
  // 3. Update state to show loading
  useCalculationStore.getState().startCalculation();
  
  // 4. Call API
  try {
    const job = await CalculationService.startCalculation(config);
    
    // 5. Update state with job ID
    useCalculationStore.getState().setJobId(job.id);
    
    // 6. Connect to WebSocket for progress updates
    WebSocketManager.connect(job.id);
    
  } catch (error) {
    // 7. Handle error
    useCalculationStore.getState().setError(error.message);
  }
};
```

## Performance Considerations

### Code Splitting

```typescript
// Lazy loading for routes
const LazyComponent = lazy(() => import('./LazyComponent'));

// Lazy loading for heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

// Suspense boundaries
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Memoization

```typescript
// React.memo for component memoization
const ExpensiveComponent = React.memo(({ data, config }) => {
  // Component logic
});

// useMemo for expensive calculations
const processedData = useMemo(() => {
  return performExpensiveCalculation(data, config);
}, [data, config]);

// useCallback for function memoization
const handleClick = useCallback((id: string) => {
  // Handler logic
}, [dependency]);
```

### Virtualization

```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {Row}
  </List>
);
```

### Bundle Optimization

```typescript
// Dynamic imports for code splitting
const loadHeavyLibrary = async () => {
  const { heavyFunction } = await import('./heavyLibrary');
  return heavyFunction();
};

// Tree shaking - only import what you use
import { Button, TextField } from '@mui/material'; // ✅ Good
import MaterialUI from '@mui/material'; // ❌ Avoid
```

## Security Architecture

### Input Validation

```typescript
// Schema validation with Yup
const networkSchema = yup.object({
  fluidProperties: yup.object({
    density: yup.number().required().positive(),
    viscosity: yup.number().required().positive(),
    temperature: yup.number().required(),
  }),
  pipeSections: yup.array().of(
    yup.object({
      diameter: yup.number().required().positive(),
      length: yup.number().required().positive(),
      roughness: yup.number().required().positive(),
    })
  ),
});
```

### XSS Prevention

```typescript
// Safe rendering with React
const SafeContent = ({ content }) => (
  <div>{content}</div> // React automatically escapes content
);

// For HTML content, use a sanitizer
import DOMPurify from 'dompurify';

const HtmlContent = ({ html }) => (
  <div 
    dangerouslySetInnerHTML={{ 
      __html: DOMPurify.sanitize(html) 
    }} 
  />
);
```

### CSRF Protection

```typescript
// Include CSRF tokens in requests
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});
```

## Testing Strategy

### Testing Pyramid

```
    E2E Tests (Cypress)
   /                    \
  /    Integration      \
 /     Tests (Jest)     \
/________________________\
     Unit Tests (Jest/RTL)
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/      # Component tests
│   ├── integration/     # Integration tests
│   ├── services/        # Service tests
│   └── stores/          # State management tests
├── __mocks__/           # Mock files
└── __fixtures__/        # Test data
```

### Testing Guidelines

```typescript
// Component test example
describe('NetworkConfiguration', () => {
  it('should render with default values', () => {
    render(<NetworkConfiguration />);
    expect(screen.getByLabelText(/fluid density/i)).toHaveValue(1000);
  });

  it('should validate required fields', async () => {
    render(<NetworkConfiguration />);
    fireEvent.click(screen.getByText(/save/i));
    expect(await screen.findByText(/density is required/i)).toBeInTheDocument();
  });
});

// Service test example
describe('CalculationService', () => {
  it('should start calculation successfully', async () => {
    const mockConfig = { /* test config */ };
    const mockJob = { id: '123', status: 'running' };
    
    (apiClient.post as jest.Mock).mockResolvedValue({ data: mockJob });
    
    const result = await CalculationService.startCalculation(mockConfig);
    expect(result).toEqual(mockJob);
  });
});
```

### Mock Strategy

```typescript
// API mocks
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// WebSocket mocks
jest.mock('@/services/websocket', () => ({
  WebSocketManager: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));
```

---

This architecture provides a solid foundation for building and maintaining the Hydraulic Network Web Application. For more detailed information about specific aspects, refer to the related documentation files.