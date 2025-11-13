# Component Development Guide

This guide provides comprehensive information for developing components in the Hydraulic Network Web Application, following established patterns and best practices.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Component Types](#component-types)
- [Development Guidelines](#development-guidelines)
- [Atomic Design Implementation](#atomic-design-implementation)
- [Props and Interfaces](#props-and-interfaces)
- [Styling Guidelines](#styling-guidelines)
- [Testing Components](#testing-components)
- [Performance Optimization](#performance-optimization)
- [Accessibility](#accessibility)
- [Examples](#examples)

## Component Architecture

The application follows a structured component architecture based on atomic design principles and React best practices.

### Component Hierarchy

```
Atoms (Basic Elements)
├── Button
├── Input
├── Typography
├── Icon
└── Spinner

Molecules (Simple Components)
├── FormField
├── Alert
├── Card
├── Badge
└── Tag

Organisms (Complex Components)
├── Form
├── Table
├── Navigation
├── Modal
└── Chart

Templates (Page Structures)
├── ConfigurationTemplate
├── ResultsTemplate
└── DashboardTemplate

Pages (Complete Screens)
├── ConfigurationPage
├── ResultsPage
└── HistoryPage
```

### Component Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.tsx          # Main component file
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories (future)
├── index.ts                   # Export file
├── types.ts                   # Component-specific types
├── styles.ts                  # Styled-components styles
├── hooks/                     # Component-specific hooks
├── utils/                     # Component-specific utilities
└── README.md                  # Component documentation
```

## Component Types

### 1. Presentational Components

Focus on how things look, with minimal logic:

```typescript
interface UserProfileProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
  showEmail?: boolean;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  size = 'medium',
  showEmail = false,
  className,
}) => {
  return (
    <div className={cn(styles.container, styles[size], className)}>
      <Avatar src={user.avatar} alt={user.name} size={size} />
      <div className={styles.info}>
        <h3 className={styles.name}>{user.name}</h3>
        {showEmail && (
          <p className={styles.email}>{user.email}</p>
        )}
      </div>
    </div>
  );
};
```

### 2. Container Components

Handle data fetching and business logic:

```typescript
export const UserProfileContainer: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await UserService.getById(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <ErrorMessage message="User not found" />;
  }

  return <UserProfile user={user} showEmail={true} />;
};
```

### 3. Form Components

Handle user input with validation:

```typescript
interface NetworkFormProps {
  onSubmit: (data: NetworkConfiguration) => void;
  initialValues?: Partial<NetworkConfiguration>;
  isEditing?: boolean;
}

export const NetworkForm: React.FC<NetworkFormProps> = ({
  onSubmit,
  initialValues,
  isEditing = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = useForm<NetworkConfiguration>({
    defaultValues: initialValues,
    resolver: yupResolver(networkSchema),
  });

  const onSubmitForm = (data: NetworkConfiguration) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className={styles.form}>
      <FormField
        label="Network Name"
        error={errors.name?.message}
      >
        <TextField
          {...register('name')}
          placeholder="Enter network name"
        />
      </FormField>

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          {...register('description')}
          placeholder="Enter description"
        />
      </FormField>

      <div className={styles.actions}>
        <Button type="submit" disabled={!isValid}>
          {isEditing ? 'Update' : 'Create'} Network
        </Button>
      </div>
    </form>
  );
};
```

### 4. Layout Components

Handle page structure and layout:

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className={styles.layout}>
      <Header>
        {title && <PageTitle title={title} />}
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {actions && <div className={styles.actions}>{actions}</div>}
      </Header>

      <main className={styles.main}>
        {children}
      </main>

      <Footer />
    </div>
  );
};
```

## Development Guidelines

### 1. TypeScript First

Always define interfaces and types before implementation:

```typescript
// ✅ Good: Define types first
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

// ❌ Avoid: Any types
interface BadButtonProps {
  data: any;
  config: object;
}
```

### 2. Props Interface Guidelines

```typescript
// ✅ Good: Well-defined props
interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Field name for accessibility */
  name: string;
  /** Error message to display */
  error?: string;
  /** Help text below the field */
  helpText?: string;
  /** Field is required */
  required?: boolean;
  /** Field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional HTML attributes */
  [key: string]: any;
}

// ✅ Good: Props with defaults
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
  children,
  ...rest
}) => {
  // Component implementation
};
```

### 3. Component Implementation Pattern

```typescript
// ✅ Good: Standard component pattern
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  fullWidth = false,
  loading = false,
  type = 'button',
  className,
  ...rest
}) => {
  // 1. Hooks
  const { t } = useTranslation();
  const [isPressed, setIsPressed] = useState(false);

  // 2. Computed values
  const buttonClasses = cn(
    styles.button,
    styles[variant],
    styles[size],
    {
      [styles.fullWidth]: fullWidth,
      [styles.disabled]: disabled,
      [styles.pressed]: isPressed,
    },
    className
  );

  // 3. Event handlers
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    onClick?.(event);
  }, [disabled, loading, onClick]);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  // 4. Render
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      {...rest}
    >
      {loading && <Spinner className={styles.spinner} />}
      <span className={cn({ [styles.loading]: loading })}>
        {children}
      </span>
    </button>
  );
};
```

### 4. Error Boundaries

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state: { hasError: boolean; error: Error | null } = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
```

## Atomic Design Implementation

### Atoms (Basic Elements)

```typescript
// components/common/atoms/Button/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  return (
    <button
      className={cn(styles.button, styles[variant], styles[size], {
        [styles.disabled]: disabled,
      })}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};
```

### Molecules (Simple Components)

```typescript
// components/common/molecules/FormField/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helpText,
  required,
  children,
}) => {
  const id = useId();
  
  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
      {helpText && <span className={styles.helpText}>{helpText}</span>}
    </div>
  );
};
```

### Organisms (Complex Components)

```typescript
// components/common/organisms/Form/Form.tsx
interface FormProps<T> {
  onSubmit: (data: T) => void;
  validationSchema?: Yup.Schema<T>;
  defaultValues?: Partial<T>;
  children: React.ReactNode;
  submitText?: string;
  loading?: boolean;
}

export const Form = <T extends Record<string, any>>({
  onSubmit,
  validationSchema,
  defaultValues,
  children,
  submitText = 'Submit',
  loading = false,
}: FormProps<T>) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<T>({
    defaultValues,
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
  });

  const onSubmitForm = (data: T) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className={styles.form}>
      <fieldset disabled={loading} className={styles.fieldset}>
        {children}
        <Button
          type="submit"
          disabled={!isValid || loading}
          loading={loading}
        >
          {submitText}
        </Button>
      </fieldset>
    </form>
  );
};
```

## Props and Interfaces

### 1. Props Interface Best Practices

```typescript
// ✅ Good: Descriptive and typed props
interface NetworkDiagramProps {
  /** Network configuration data */
  network: NetworkConfiguration;
  /** Current calculation results */
  results?: CalculationResults;
  /** Selected section ID */
  selectedSection?: string;
  /** Callback for section selection */
  onSectionSelect?: (sectionId: string) => void;
  /** Show/hide legend */
  showLegend?: boolean;
  /** Diagram layout algorithm */
  layout?: 'hierarchical' | 'force-directed' | 'circular';
  /** Enable interactive features */
  interactive?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Additional HTML attributes */
  [key: string]: any;
}

// ❌ Avoid: Generic props
interface BadProps {
  data: any;
  config: object;
  callback: Function;
}
```

### 2. Props with Defaults

```typescript
export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  network,
  results,
  selectedSection,
  onSectionSelect,
  showLegend = true,
  layout = 'hierarchical',
  interactive = true,
  className,
  ...rest
}) => {
  // Component implementation
};
```

### 3. Props Validation

```typescript
// Using TypeScript for runtime validation
const validateProps = <T extends Record<string, any>>(
  props: T,
  schema: Yup.Schema<T>
): void => {
  try {
    schema.validateSync(props, { abortEarly: false });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      console.warn('Props validation failed:', error.errors);
    }
  }
};

// Usage in development
if (process.env.NODE_ENV === 'development') {
  validateProps(props, componentSchema);
}
```

## Styling Guidelines

### 1. Styled Components

```typescript
// components/common/atoms/Button/styles.ts
import styled from 'styled-components';

export const StyledButton = styled.button<{
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  disabled: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${({ size }) => {
    switch (size) {
      case 'small': return '8px 16px';
      case 'medium': return '10px 20px';
      case 'large': return '12px 24px';
      default: return '10px 20px';
    }
  }};
  font-size: ${({ size, theme }) => {
    switch (size) {
      case 'small': return theme.typography.fontSize.small;
      case 'medium': return theme.typography.fontSize.medium;
      case 'large': return theme.typography.fontSize.large;
      default: return theme.typography.fontSize.medium;
    }
  }};
  font-weight: 500;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  width: ${({ fullWidth }) => fullWidth ? '100%' : 'auto'};

  /* Variants */
  background-color: ${({ variant, theme }) => {
    switch (variant) {
      case 'primary': return theme.colors.primary.main;
      case 'secondary': return theme.colors.secondary.main;
      case 'danger': return theme.colors.error.main;
      default: return theme.colors.primary.main;
    }
  }};

  color: ${({ theme }) => theme.colors.common.white};

  /* States */
  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Focus */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.focus};
    outline-offset: 2px;
  }
`;
```

### 2. CSS Modules

```typescript
// components/common/molecules/FormField/styles.module.css
.container {
  margin-bottom: 1rem;
}

.label {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.required {
  color: var(--color-error);
}

.error {
  display: block;
  color: var(--color-error);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.helpText {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
```

### 3. Utility Classes

```typescript
// utils/styles.ts
export const createSpacing = (multiplier: number) => `${multiplier * 0.25}rem`;
export const createTypography = (size: string) => `var(--font-size-${size})`;
export const createColor = (color: string) => `var(--color-${color})`;

// Usage in styled components
export const Container = styled.div`
  padding: ${createSpacing(2)} ${createSpacing(3)};
  font-size: ${createTypography('medium')};
  color: ${createColor('text-primary')};
`;
```

## Testing Components

### 1. Component Test Structure

```typescript
// components/common/atoms/Button/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {
  const defaultProps = {
    children: 'Click me',
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<Button {...defaultProps} />);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Button {...defaultProps} variant="primary" />
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('primary');

    rerender(<Button {...defaultProps} variant="secondary" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('secondary');
  });

  it('calls onClick when clicked', () => {
    render(<Button {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders loading state', () => {
    render(<Button {...defaultProps} loading={true} />);
    
    expect(screen.getByText(/click me/i)).toHaveClass('loading');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards additional props', () => {
    render(<Button {...defaultProps} data-testid="custom-button" />);
    
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
  });
});
```

### 2. Form Component Testing

```typescript
// components/common/organisms/Form/Form.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form from './Form';

describe('Form Component', () => {
  const mockSubmit = jest.fn();
  const testSchema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  const renderForm = () => {
    render(
      <Form
        onSubmit={mockSubmit}
        validationSchema={testSchema}
        defaultValues={{ name: '', email: '' }}
      >
        <FormField label="Name" error={undefined}>
          <input name="name" />
        </FormField>
        <FormField label="Email" error={undefined}>
          <input name="email" type="email" />
        </FormField>
      </Form>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates form fields', async () => {
    renderForm();
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    renderForm();
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });
});
```

### 3. Integration Testing

```typescript
// components/configuration/ConfigurationPage/ConfigurationPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ConfigurationPage from './ConfigurationPage';
import * as ConfigurationService from '@/services/configurationService';

// Mock the service
jest.mock('@/services/configurationService');

const mockService = ConfigurationService as jest.Mocked<typeof ConfigurationService>;

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConfigurationPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ConfigurationPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays configuration form', async () => {
    mockService.getConfiguration.mockResolvedValue(mockConfiguration);
    
    renderWithProviders();
    
    expect(screen.getByText(/fluid properties/i)).toBeInTheDocument();
    expect(screen.getByText(/pipe sections/i)).toBeInTheDocument();
    expect(screen.getByText(/boundary conditions/i)).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    mockService.createConfiguration.mockResolvedValue(mockConfiguration);
    mockService.getConfiguration.mockResolvedValue(mockConfiguration);
    
    renderWithProviders();
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockService.createConfiguration).toHaveBeenCalled();
      expect(screen.getByText(/configuration saved/i)).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### 1. React.memo

```typescript
// Memoize expensive components
interface ChartProps {
  data: ChartData[];
  config: ChartConfig;
  width: number;
  height: number;
}

export const Chart = React.memo<ChartProps>(({ data, config, width, height }) => {
  // Expensive chart rendering
  const processedData = useMemo(() => {
    return processChartData(data, config);
  }, [data, config]);

  return (
    <div style={{ width, height }}>
      <CanvasChart data={processedData} />
    </div>
  );
});
```

### 2. useMemo and useCallback

```typescript
// Optimize expensive calculations and functions
export const NetworkAnalyzer = ({ networkData, settings }) => {
  // Expensive data processing
  const analyzedData = useMemo(() => {
    return analyzeNetworkData(networkData, settings);
  }, [networkData, settings]);

  // Stable callback
  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('Node clicked:', nodeId);
  }, []);

  // Another stable callback
  const handleEdgeHover = useCallback((edgeId: string, hovering: boolean) => {
    console.log('Edge hover:', edgeId, hovering);
  }, []);

  return (
    <NetworkDiagram
      data={analyzedData}
      onNodeClick={handleNodeClick}
      onEdgeHover={handleEdgeHover}
    />
  );
};
```

### 3. Virtualization

```typescript
// Virtualize large lists
import { FixedSizeList as List } from 'react-window';

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: PipeSection[];
}

const Row = ({ index, style, data }: ListItemProps) => (
  <div style={style} className="list-item">
    <PipeSectionCard section={data[index]} />
  </div>
);

export const VirtualizedPipeList = ({ sections }: { sections: PipeSection[] }) => (
  <List
    height={600}
    itemCount={sections.length}
    itemSize={120}
    itemData={sections}
  >
    {Row}
  </List>
);
```

### 4. Lazy Loading

```typescript
// Lazy load heavy components
const LazyChart = lazy(() => import('./Chart'));
const LazyNetworkDiagram = lazy(() => import('./NetworkDiagram'));

export const ResultsPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <LazyChart />
      </Suspense>
      
      <Suspense fallback={<div>Loading diagram...</div>}>
        <LazyNetworkDiagram />
      </Suspense>
    </div>
  );
};
```

## Accessibility

### 1. ARIA Labels and Roles

```typescript
// Accessible button component
export const AccessibleButton = ({
  children,
  onClick,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      className="accessible-button"
    >
      {children}
    </button>
  );
};
```

### 2. Keyboard Navigation

```typescript
// Component with keyboard navigation
export const KeyboardNavigableList = ({ items, onItemSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          onItemSelect(items[focusedIndex]);
        }
        break;
    }
  };

  return (
    <ul onKeyDown={handleKeyDown} tabIndex={0}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={focusedIndex === index}
          className={focusedIndex === index ? 'focused' : ''}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

### 3. Screen Reader Support

```typescript
// Screen reader friendly component
export const StatusIndicator = ({ status, message }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckIcon aria-hidden="true" />;
      case 'error':
        return <ErrorIcon aria-hidden="true" />;
      case 'warning':
        return <WarningIcon aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <div className="status-indicator" role="status" aria-live="polite">
      {getStatusIcon(status)}
      <span className="visually-hidden">
        {status === 'success' && 'Success'}
        {status === 'error' && 'Error'}
        {status === 'warning' && 'Warning'}
      </span>
      <span>{message}</span>
    </div>
  );
};
```

---

This guide provides the foundation for developing consistent, high-quality components. For specific component examples and patterns, refer to the existing components in the `src/components/` directory.