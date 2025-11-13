# Contributing to Hydraulic Network Web Application

Thank you for considering contributing to the Hydraulic Network Web Application! This guide provides information on how to contribute, development guidelines, and project standards.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)
- [Community Guidelines](#community-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful in all interactions and follow these guidelines:

- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

There are many ways to contribute to the project:

### 1. Code Contributions

- **Bug Fixes**: Help us fix existing issues
- **New Features**: Implement new functionality
- **Refactoring**: Improve code quality and performance
- **Testing**: Write or improve tests

### 2. Documentation

- **Improve Documentation**: Fix typos, clarify explanations
- **Add Examples**: Create tutorials and code examples
- **Translate**: Help translate documentation

### 3. Community Support

- **Answer Questions**: Help other users on discussions
- **Report Issues**: Submit detailed bug reports
- **Feature Requests**: Suggest new features

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8+ or yarn
- Git 2.30+

### Setup Instructions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/NetworkHydraulic.git
   cd NetworkHydraulic/webapp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Backend Setup**
   ```bash
   cd ../backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .[dev]
   python main.py
   ```

5. **Start Development**
   ```bash
   cd ../webapp
   npm run dev
   ```

## Development Guidelines

### Code Style

We enforce consistent code style through:

- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting
- **TypeScript**: Type safety and better development experience
- **Husky**: Git hooks for quality gates

**Before committing, ensure:**
```bash
npm run lint
npm run format
npm run type-check
npm run test
```

### Git Guidelines

#### Branch Naming

Use descriptive branch names with the following format:
```
<type>/<description>
```

Examples:
- `feature/user-authentication`
- `bugfix/fix-calculation-error`
- `hotfix/critical-security-issue`
- `docs/update-api-reference`

#### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:
- `feat: add user authentication`
- `fix: resolve calculation timeout issue`
- `docs: update component documentation`
- `refactor: simplify state management`

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `perf`: Performance improvements
- `hotfix`: Critical bug fix

### TypeScript Guidelines

#### Type Definitions

- Always provide explicit type annotations
- Use interfaces for object shapes
- Use type aliases for complex types
- Avoid `any` type - use proper typing

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// ❌ Avoid
const user: any = getUser();
const data: object = {};
```

#### Component Props

```typescript
// ✅ Good: Descriptive props interface
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

Use functional components with hooks:

```typescript
// ✅ Good: Functional component
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [editing, setEditing] = useState(false);
  
  return (
    <div>
      <h3>{user.name}</h3>
      {editing && <EditForm user={user} />}
    </div>
  );
};

// ❌ Avoid: Class component
export class UserProfile extends React.Component<UserProfileProps> {
  state = { editing: false };
  
  render() {
    return (
      <div>
        <h3>{this.props.user.name}</h3>
        {this.state.editing && <EditForm user={this.props.user} />}
      </div>
    );
  }
}
```

#### Custom Hooks

Extract reusable logic into custom hooks:

```typescript
// ✅ Good: Custom hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

// Usage
const [userSettings, setUserSettings] = useLocalStorage('user-settings', {});
```

### State Management

#### Zustand Best Practices

```typescript
// ✅ Good: Well-structured store
interface CalculatorState {
  network: NetworkConfig | null;
  results: CalculationResults | null;
  isCalculating: boolean;
  error: string | null;
  
  setNetwork: (network: NetworkConfig) => void;
  setResults: (results: CalculationResults) => void;
  startCalculation: () => void;
  finishCalculation: (results: CalculationResults) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
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
export const ExpensiveChart = React.memo<ChartProps>(({ data, config }) => {
  const processedData = useMemo(() => {
    return processChartData(data, config);
  }, [data, config]);

  return <Chart data={processedData} />;
});

// ✅ Good: useCallback for event handlers
const handleClick = useCallback((id: string) => {
  // Handler logic
}, [dependency]);
```

#### Lazy Loading

```typescript
// ✅ Good: Lazy loading for routes and heavy components
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

### Testing Guidelines

#### Test Structure

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

#### Writing Tests

```typescript
// ✅ Good: Comprehensive component test
describe('UserProfile Component', () => {
  const defaultProps = {
    user: { id: '1', name: 'John Doe', email: 'john@example.com' },
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(<UserProfile {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<UserProfile {...defaultProps} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.user);
  });

  it('handles loading state', () => {
    render(<UserProfile {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });
});
```

### Accessibility Guidelines

#### ARIA Labels

```typescript
// ✅ Good: Accessible button
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

#### Keyboard Navigation

```typescript
// ✅ Good: Keyboard navigation support
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onClick();
      break;
    case 'Escape':
      onClose();
      break;
  }
};
```

## Pull Request Process

### Before Submitting

1. **Ensure Tests Pass**
   ```bash
   npm run test
   npm run test:coverage
   ```

2. **Check Code Quality**
   ```bash
   npm run lint
   npm run type-check
   ```

3. **Update Documentation**
   - Update relevant documentation files
   - Add code comments for complex logic
   - Update README if needed

4. **Squash Commits**
   ```bash
   git rebase -i HEAD~n  # where n is the number of commits
   ```

### PR Guidelines

1. **Descriptive Title**: Use clear, concise titles
2. **Detailed Description**: Explain what the PR does and why
3. **Screenshots**: Include screenshots for UI changes
4. **Related Issues**: Link to related issues or discussions
5. **Testing Instructions**: Provide steps to test the changes

### Example PR Template

```markdown
## Description
Brief description of changes and motivation.

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

## Testing

### Test Categories

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test application performance

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- ComponentName.test.tsx

# Run E2E tests
npm run test:e2e
```

### Test Coverage

We aim for minimum 80% test coverage. Check coverage with:

```bash
npm run test:coverage
```

## Documentation

### Documentation Types

1. **API Documentation**: Auto-generated from TypeScript
2. **Component Documentation**: Component props and usage
3. **Developer Documentation**: Setup and development guides
4. **User Documentation**: User guides and tutorials

### Documentation Standards

1. **Keep Documentation Updated**: Update docs when code changes
2. **Use Examples**: Include code examples in documentation
3. **Clear Language**: Use simple, clear language
4. **Version Specific**: Ensure docs match the current version

### Generating Documentation

```bash
# Generate API documentation
npm run docs:generate

# Start documentation server
npm run docs:serve
```

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**
   ```bash
   npm version [major|minor|patch]
   ```

2. **Update Changelog**
   - Add new version to CHANGELOG.md
   - Document all changes

3. **Create Release**
   ```bash
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push --tags
   ```

4. **Deploy**
   - Deploy to staging environment
   - Run integration tests
   - Deploy to production

### Changelog Format

```markdown
## [1.2.3] - 2023-01-01

### Added
- New feature description
- Another new feature

### Changed
- Modified feature description

### Fixed
- Bug fix description

### Removed
- Deprecated feature removal
```

## Community Guidelines

### Getting Help

1. **Documentation**: Check existing documentation first
2. **Search Issues**: Look for similar issues
3. **Ask Questions**: Use GitHub Discussions
4. **Report Bugs**: Create detailed issue reports

### Communication

1. **Be Respectful**: Treat others with respect
2. **Be Patient**: Allow time for responses
3. **Be Constructive**: Provide helpful feedback
4. **Be Inclusive**: Welcome diverse perspectives

### Recognition

Contributors will be recognized through:
- **GitHub Contributors List**
- **Release Notes**
- **Special Recognition** for significant contributions

---

Thank you for contributing to the Hydraulic Network Web Application! Your efforts help make this project better for everyone.