# Development Guide

Welcome to the Hydraulic Network Web Application development guide! This document provides comprehensive information for developers working on the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Debugging](#debugging)
- [Build & Deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn)
- **Git**: Version 2.30 or higher
- **Python**: Version 3.10+ (for backend development)

### Recommended Tools

- **IDE**: Visual Studio Code with extensions:
  - TypeScript Importer
  - ESLint
  - Prettier
  - GitLens
  - Thunder Client (for API testing)
- **Browser**: Chrome or Firefox with React Developer Tools
- **Terminal**: Git Bash, iTerm2, or Windows Terminal

### Backend Dependencies

The frontend requires a running backend API. Set up the Python backend first:

```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
python main.py
```

## Development Environment Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd NetworkHydraulic/webapp

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure for your setup:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local configuration:

```env
# Local development
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WEBSOCKET_URL=ws://localhost:8000/ws

# Development features
VITE_ENABLE_LOGGING=true
VITE_ENABLE_REDUX_DEVTOOLS=true
VITE_ENABLE_MOCK_DATA=false
```

### 3. IDE Configuration

#### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.eol": "\n",
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

#### Extensions

Recommended VS Code extensions:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### 4. Git Configuration

Set up Git hooks for code quality:

```bash
npm run prepare  # Sets up Husky hooks
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── calculation/      # Calculation-related components
│   ├── config/          # Configuration interface components
│   ├── error/           # Error boundaries and displays
│   ├── export/          # Export functionality
│   ├── file/            # File management
│   ├── layout/          # Layout components
│   ├── results/         # Results display components
│   ├── validation/      # Validation components
│   └── visualization/   # Chart and diagram components
├── hooks/               # Custom React hooks
├── layouts/             # Layout components
├── pages/               # Page-level components
├── services/            # API services and business logic
├── stores/              # Zustand state management
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── validation/          # Form validation schemas
└── api/                 # API client configuration
```

### Key Directories Explained

#### `components/`
- **Atomic Design**: Components are organized following atomic design principles
- **Reusability**: Each component should be reusable and composable
- **Testing**: Every component should have corresponding tests

#### `stores/`
- **State Management**: Zustand stores for global state
- **Selectors**: Performance-optimized state access
- **Persistence**: Automatic state persistence to localStorage

#### `services/`
- **API Integration**: Service classes for API communication
- **Business Logic**: Centralized business logic
- **Error Handling**: Consistent error handling patterns

#### `types/`
- **Type Safety**: Comprehensive TypeScript types
- **API Types**: Types generated from backend API
- **Component Props**: Strict typing for all component props

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Test your changes
npm run test
npm run lint
npm run type-check

# Commit with conventional commit message
git commit -m "feat: add new calculation feature"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Component Development Process

1. **Define Requirements**: Understand the feature requirements
2. **Create Types**: Define TypeScript interfaces first
3. **Write Tests**: Create test cases before implementation
4. **Implement Component**: Build the component with proper TypeScript
5. **Add Styling**: Implement responsive, accessible styling
6. **Update Documentation**: Add or update component documentation
7. **Test Integration**: Ensure component works with the broader app

### 3. State Management Development

#### Creating a New Store

```typescript
// stores/exampleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExampleState {
  data: DataType[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  setData: (data: DataType[]) => void;
  clearError: () => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => ({
      data: [],
      loading: false,
      error: null,
      
      fetchData: async () => {
        set({ loading: true, error: null });
        try {
          const data = await ExampleService.fetchData();
          set({ data, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
      
      setData: (data) => set({ data }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'example-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 4. API Integration

#### Creating a Service

```typescript
// services/exampleService.ts
import { apiClient } from '@/api/client';
import { ApiResponse, DataType } from '@/types';

export class ExampleService {
  private static BASE_URL = '/examples';

  static async getAll(): Promise<DataType[]> {
    const response = await apiClient.get<ApiResponse<DataType[]>>(
      this.BASE_URL
    );
    return response.data.data;
  }

  static async getById(id: string): Promise<DataType> {
    const response = await apiClient.get<ApiResponse<DataType>>(
      `${this.BASE_URL}/${id}`
    );
    return response.data.data;
  }

  static async create(data: Omit<DataType, 'id'>): Promise<DataType> {
    const response = await apiClient.post<ApiResponse<DataType>>(
      this.BASE_URL,
      data
    );
    return response.data.data;
  }

  static async update(id: string, data: Partial<DataType>): Promise<DataType> {
    const response = await apiClient.put<ApiResponse<DataType>>(
      `${this.BASE_URL}/${id}`,
      data
    );
    return response.data.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }
}
```

## Code Guidelines

### TypeScript Guidelines

#### Strict Typing

```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ Avoid: Any types
const userData: any = await fetchUser();

// ✅ Good: Proper typing
const userData: User = await fetchUser();
```

#### Component Props

```typescript
// ✅ Good: Descriptive prop interfaces
interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  /** Click handler */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Is button disabled */
  disabled?: boolean;
}

// ❌ Avoid: Generic props
interface BadProps {
  data: any;
  config: object;
}
```

### React Guidelines

#### Functional Components

```typescript
// ✅ Good: Functional component with proper typing
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={onEdit}>
        {t('Edit Profile')}
      </button>
    </div>
  );
};
```

#### Hooks Usage

```typescript
// ✅ Good: Custom hook for data fetching
export const useUserData = (userId: string) => {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await UserService.getById(userId);
        setData(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { data, loading, error, refetch: fetchUser };
};
```

### State Management Guidelines

#### Zustand Best Practices

```typescript
// ✅ Good: Well-structured store
interface CalculatorState {
  // State
  network: NetworkConfig | null;
  results: CalculationResults | null;
  isCalculating: boolean;
  error: string | null;
  
  // Actions
  setNetwork: (network: NetworkConfig) => void;
  setResults: (results: CalculationResults) => void;
  startCalculation: () => void;
  finishCalculation: (results: CalculationResults) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  network: null,
  results: null,
  isCalculating: false,
  error: null,
  
  setNetwork: (network) => set({ network }),
  setResults: (results) => set({ results }),
  startCalculation: () => set({ isCalculating: true, error: null }),
  finishCalculation: (results) => set({ 
    results, 
    isCalculating: false 
  }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set({
    network: null,
    results: null,
    isCalculating: false,
    error: null,
  }),
}));
```

### Performance Guidelines

#### React.memo and useMemo

```typescript
// ✅ Good: Memo for expensive components
export const ExpensiveChart = React.memo<{
  data: ChartData[];
  config: ChartConfig;
}>(({ data, config }) => {
  const processedData = useMemo(() => {
    return processChartData(data, config);
  }, [data, config]);

  return <Chart data={processedData} />;
});

// ✅ Good: useMemo for expensive calculations
const ComplexComponent = ({ data }) => {
  const expensiveValue = useMemo(() => {
    return performExpensiveCalculation(data);
  }, [data]);
  
  return <div>{expensiveValue}</div>;
};
```

#### Lazy Loading

```typescript
// ✅ Good: Lazy loading for routes
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

const App = () => (
  <Routes>
    <Route 
      path="/heavy-page" 
      element={
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </Suspense>
      } 
    />
  </Routes>
);
```

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── components/      # Component tests
│   ├── hooks/           # Hook tests
│   ├── services/        # Service tests
│   ├── stores/          # Store tests
│   └── utils/           # Utility tests
└── __mocks__/           # Mock files
```

### Writing Tests

#### Component Test Example

```typescript
// components/UserProfile/UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from './UserProfile';
import { User } from '@/types';

const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

const mockOnEdit = jest.fn();

describe('UserProfile', () => {
  beforeEach(() => {
    render(
      <UserProfile 
        user={mockUser} 
        onEdit={mockOnEdit} 
      />
    );
  });

  it('renders user information correctly', () => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Service Test Example

```typescript
// services/UserService.test.ts
import { UserService } from './UserService';
import { User } from '@/types';

// Mock the API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  it('should fetch user by id', async () => {
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: mockUser },
    });

    const result = await UserService.getById('1');
    expect(result).toEqual(mockUser);
    expect(apiClient.get).toHaveBeenCalledWith('/users/1');
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- UserProfile.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="UserProfile"
```

## Debugging

### Development Tools

#### Browser Developer Tools

1. **React DevTools**: Inspect component hierarchy and props
2. **Network Tab**: Monitor API requests and responses
3. **Console**: Check for JavaScript errors and logs
4. **Performance Tab**: Analyze performance bottlenecks

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### Common Debugging Scenarios

#### TypeScript Errors

```typescript
// ✅ Fix: Add proper type annotation
const fetchData = async (): Promise<User[]> => {
  const response = await fetch('/api/users');
  return response.json();
};

// ✅ Fix: Use type assertion for complex types
const complexData = data as ComplexType;

// ✅ Fix: Handle optional properties
if (user?.profile?.avatar) {
  // Safe access to nested optional properties
}
```

#### State Management Issues

```typescript
// ✅ Fix: Use state selectors to avoid unnecessary re-renders
const userName = useUserStore((state) => state.user?.name);

// ✅ Fix: Use immer for complex state updates
import { produce } from 'immer';

const updateUserData = (userId: string, updates: Partial<User>) => {
  setUserStore(produce((state) => {
    const user = state.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
    }
  }));
};
```

#### Performance Issues

```typescript
// ✅ Fix: Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// ✅ Fix: Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Fix: Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  // Handle click
}, [dependency]);
```

## Build & Deployment

### Development Build

```bash
# Start development server
npm run dev

# Start with HTTPS
npm run dev:https

# Type checking
npm run type-check
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

### Environment-Specific Builds

```bash
# Build with specific environment
npm run build -- --mode production

# Custom build script for different environments
npm run build:staging
npm run build:production
```

## Troubleshooting

### Common Issues

#### Module Resolution Errors

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript types
npm update @types/node @types/react
```

#### Build Failures

```bash
# Check for memory issues
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean build artifacts
npm run clean
npm run build
```

#### Hot Reload Not Working

```bash
# Check Vite configuration
# Ensure HMR is enabled in vite.config.ts

# Clear browser cache
# Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Getting Help

- **Documentation**: Check this guide and other documentation files
- **Issues**: Search existing GitHub issues
- **Team**: Ask team members or create a discussion
- **Debugging**: Use browser dev tools and VS Code debugging

---

For more detailed information, refer to the specific documentation files:
- [Architecture Guide](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Component Guide](COMPONENT_GUIDE.md)
- [State Management](STATE_MANAGEMENT.md)
- [Testing Guide](TESTING.md)