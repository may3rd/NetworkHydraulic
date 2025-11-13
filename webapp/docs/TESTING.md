# Testing Documentation

This document provides comprehensive information about the testing setup, strategies, and best practices for the Hydraulic Network Web Application.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Types](#test-types)
5. [Writing Tests](#writing-tests)
6. [Mocking and Fixtures](#mocking-and-fixtures)
7. [CI/CD Integration](#cicd-integration)
8. [Performance Testing](#performance-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

The testing strategy for the Hydraulic Network Web Application follows a comprehensive approach that includes:

- **Unit Tests**: Testing individual components and functions in isolation
- **Integration Tests**: Testing the interaction between components and services
- **End-to-End (E2E) Tests**: Testing complete user workflows
- **Performance Tests**: Ensuring the application meets performance requirements
- **Accessibility Tests**: Verifying WCAG compliance
- **Security Tests**: Identifying potential security vulnerabilities

## Test Structure

```
webapp/
├── src/
│   ├── test/                          # Test configuration and utilities
│   │   ├── setup.ts                   # Jest setup and global mocks
│   │   ├── mocks.ts                   # Mock implementations
│   │   ├── testUtils.ts               # Custom testing utilities
│   │   ├── constants.ts               # Test constants and sample data
│   │   ├── __mocks__/                 # Module mocks
│   │   ├── fixtures/                  # Test data fixtures
│   │   │   ├── sampleConfigurations.ts
│   │   │   ├── calculationResults.ts
│   │   │   ├── networkData.ts
│   │   │   ├── errorScenarios.ts
│   │   │   └── userInteractions.ts
│   │   └── testResultsProcessor.js    # Custom test results processor
│   ├── components/
│   │   └── __tests__/                 # Component unit tests
│   │       ├── FluidProperties.test.tsx
│   │       ├── NetworkSettings.test.tsx
│   │       ├── PipeSections.test.tsx
│   │       ├── ResultsDashboard.test.tsx
│   │       └── NetworkDiagram.test.tsx
│   ├── services/
│   │   └── __tests__/                 # Service integration tests
│   │       ├── calculationService.test.ts
│   │       ├── exportService.test.ts
│   │       ├── validationService.test.ts
│   │       └── errorHandler.test.ts
│   ├── stores/
│   │   └── __tests__/                 # State management tests
│   │       ├── configurationStore.test.ts
│   │       ├── calculationStore.test.ts
│   │       └── uiStore.test.ts
│   ├── hooks/
│   │   └── __tests__/                 # Custom hook tests
│   │       ├── useCalculation.test.ts
│   │       ├── useValidation.test.ts
│   │       └── useNetworkDiagram.test.ts
│   └── utils/
│       └── __tests__/                 # Utility function tests
│           ├── formatters.test.ts
│           ├── validators.test.ts
│           └── calculations.test.ts
├── cypress/                            # E2E tests
│   ├── e2e/
│   │   ├── smoke.cy.ts                # Smoke tests
│   │   ├── configuration.cy.ts        # Configuration workflow tests
│   │   ├── calculation.cy.ts          # Calculation execution tests
│   │   ├── results.cy.ts              # Results display tests
│   │   └── export.cy.ts               # Export functionality tests
│   ├── fixtures/                       # E2E test data
│   │   ├── sample-network.yaml
│   │   ├── calculation-results.json
│   │   └── user-configurations.json
│   └── support/                        # E2E test utilities
│       ├── e2e.js                     # Global E2E configuration
│       ├── customCommands.js          # Custom Cypress commands
│       └── commands.js                # Base Cypress commands
└── coverage/                           # Test coverage reports
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- ComponentName.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"

# Run tests for a specific directory
npm test -- src/components/
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Open Cypress Test Runner
npm run test:e2e:open

# Run E2E tests in specific browser
npx cypress run --browser chrome

# Run specific E2E test
npx cypress run --spec "cypress/e2e/smoke.cy.ts"
```

### Performance Tests

```bash
# Run Lighthouse CI
npm run lhci:autorun

# Run bundle analysis
npm run analyze
```

### All Tests

```bash
# Run complete test suite
npm run test:all
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components and functions in isolation.

**File Pattern**: `*.test.tsx` or `*.test.ts`

**Example**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SolverControls } from '../SolverControls';

describe('SolverControls', () => {
  it('renders correctly', () => {
    render(<SolverControls onCalculate={jest.fn()} />);
    expect(screen.getByText('Calculate')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests verify the interaction between components, services, and APIs.

**File Pattern**: `*.test.ts`

**Example**:
```typescript
import { calculationService } from '../services/calculationService';

describe('CalculationService', () => {
  it('should calculate network hydraulics', async () => {
    const config = mockConfigurations.simpleNetwork;
    const result = await calculationService.calculate(config);
    
    expect(result.success).toBe(true);
    expect(result.data.sections).toHaveLength(1);
  });
});
```

### End-to-End Tests

E2E tests simulate real user workflows and verify the complete application functionality.

**File Pattern**: `*.cy.ts`

**Example**:
```typescript
describe('Configuration Workflow', () => {
  it('should complete full configuration workflow', () => {
    cy.visit('/');
    cy.configureFluid({ phase: 'gas', temperature: 293.15 });
    cy.addPipeSection({ length: 100, diameter: 2 });
    cy.validateConfiguration();
    cy.startCalculation();
    cy.waitForCalculation();
    cy.haveValidResults();
  });
});
```

## Writing Tests

### Component Tests

1. **Test Structure**:
   ```typescript
   describe('ComponentName', () => {
     beforeEach(() => {
       // Setup
     });
     
     it('should render correctly', () => {
       // Arrange
       const props = { /* props */ };
       
       // Act
       render(<Component {...props} />);
       
       // Assert
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

2. **Best Practices**:
   - Test one thing at a time
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Use data-testid attributes for querying
   - Mock external dependencies
   - Test both positive and negative cases

### Service Tests

1. **API Service Testing**:
   ```typescript
   describe('APIService', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });
     
     it('should handle successful API calls', async () => {
       // Mock API response
       mockAxios.get.mockResolvedValue({ data: mockData });
       
       const result = await apiService.getData();
       
       expect(mockAxios.get).toHaveBeenCalledWith('/api/data');
       expect(result).toEqual(mockData);
     });
     
     it('should handle API errors', async () => {
       // Mock API error
       mockAxios.get.mockRejectedValue(new Error('Network error'));
       
       await expect(apiService.getData()).rejects.toThrow('Network error');
     });
   });
   ```

### State Management Tests

1. **Zustand Store Testing**:
   ```typescript
   describe('ConfigurationStore', () => {
     let store: any;
     
     beforeEach(() => {
       store = createConfigurationStore();
       jest.clearAllMocks();
     });
     
     it('should update network configuration', () => {
       const networkData = { name: 'Test Network' };
       
       store.getState().updateNetwork(networkData);
       
       expect(store.getState().network).toEqual(networkData);
     });
   });
   ```

## Mocking and Fixtures

### Mocking Strategies

1. **Jest Mocks**:
   ```typescript
   // Mock entire module
   jest.mock('../services/apiService');
   
   // Mock specific functions
   jest.mocked(apiService.calculate).mockResolvedValue(mockResult);
   
   // Mock browser APIs
   Object.defineProperty(window, 'localStorage', {
     value: { getItem: jest.fn(), setItem: jest.fn() }
   });
   ```

2. **Test Fixtures**:
   ```typescript
   // src/test/fixtures/sampleConfigurations.ts
   export const sampleConfigurations = {
     simpleNetwork: {
       network: { name: 'Test Network' },
       fluid: { phase: 'gas', temperature: 293.15 },
       sections: [{ id: '1', length: 100 }]
     }
   };
   ```

### Custom Test Utilities

```typescript
// src/test/testUtils.ts
export const renderWithProviders = (ui, options = {}) => {
  // Custom render function with providers
};

export const createMockFile = (name, content, type) => {
  // Create mock File objects for testing
};

export const mockCalculationResult = {
  success: true,
  sections: [],
  summary: {}
};
```

## CI/CD Integration

### GitHub Actions Workflow

The test suite is automatically executed on every push and pull request through GitHub Actions:

1. **Lint and Type Check**: ESLint and TypeScript validation
2. **Unit Tests**: Jest tests with coverage reporting
3. **E2E Tests**: Cypress tests across multiple browsers
4. **Build Test**: Verify production build
5. **Security Scan**: Dependency vulnerability scanning
6. **Performance Test**: Lighthouse performance audit

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/components/': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  './src/services/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  }
}
```

## Performance Testing

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze
```

### Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run start'
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    }
  }
};
```

## Accessibility Testing

### Automated Testing

```typescript
// Cypress accessibility tests
cy.checkA11y();
cy.checkA11y(null, null, cy.terminalLog, true);

// Jest accessibility tests
import { axe } from 'jest-axe';
const results = await axe(container);
expect(results).toHaveNoViolations();
```

### Manual Testing Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Alt text for images
- [ ] Form labels are associated

## Best Practices

### Test Organization

1. **File Structure**: Mirror the source code structure
2. **Naming**: Use descriptive test names
3. **Grouping**: Use describe blocks to group related tests
4. **Setup**: Use beforeEach/afterEach for common setup/teardown

### Test Quality

1. **Independence**: Tests should not depend on each other
2. **Deterministic**: Tests should produce the same results
3. **Fast**: Tests should run quickly
4. **Isolated**: Mock external dependencies
5. **Comprehensive**: Test happy path and edge cases

### Code Coverage

1. **Focus on Logic**: Prioritize testing business logic
2. **Not a Goal**: 100% coverage is not always necessary
3. **Quality over Quantity**: Well-tested critical paths are more important
4. **Monitor Trends**: Track coverage changes over time

### Mocking Guidelines

1. **Mock External Dependencies**: APIs, databases, file system
2. **Don't Mock What You Own**: Test your own code directly
3. **Verify Interactions**: Use mocks to verify function calls
4. **Keep Mocks Simple**: Avoid complex mock setup

## Troubleshooting

### Common Issues

1. **Tests Timing Out**:
   ```typescript
   // Increase timeout
   jest.setTimeout(10000);
   
   // Use waitFor for async operations
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   });
   ```

2. **Mocking Issues**:
   ```typescript
   // Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   
   // Reset modules
   beforeEach(() => {
     jest.resetModules();
   });
   ```

3. **Async Test Failures**:
   ```typescript
   // Use async/await
   it('should handle async operation', async () => {
     const result = await asyncFunction();
     expect(result).toBeDefined();
   });
   
   // Use done callback
   it('should handle callback', (done) => {
     asyncFunction((result) => {
       expect(result).toBeDefined();
       done();
     });
   });
   ```

### Debugging Tests

1. **Console Logging**:
   ```typescript
   it('should debug test', () => {
     const element = screen.getByTestId('test-element');
     console.log(element.innerHTML);
     expect(element).toBeInTheDocument();
   });
   ```

2. **Cypress Debugging**:
   ```typescript
   cy.get('[data-testid="element"]').debug();
   cy.get('[data-testid="element"]').pause();
   cy.log('Debug message');
   ```

3. **Jest Debugging**:
   ```bash
   # Run single test in debug mode
   npm test -- --testNamePattern="specific test" --no-coverage
   ```

### Performance Issues

1. **Slow Tests**:
   - Reduce test scope
   - Use lighter mocks
   - Parallel execution
   - Skip unnecessary setup

2. **Memory Leaks**:
   ```typescript
   afterEach(() => {
     cleanup();
   });
   ```

### CI/CD Issues

1. **Flaky Tests**:
   - Add proper waiting
   - Use deterministic data
   - Avoid race conditions
   - Implement retry logic

2. **Environment Differences**:
   - Use consistent Node.js versions
   - Match dependency versions
   - Standardize environment variables

## Conclusion

This testing setup provides comprehensive coverage of the Hydraulic Network Web Application, ensuring code quality, functionality, and performance. Regular testing helps catch issues early, reduces bugs in production, and provides confidence in code changes.

For questions or issues related to testing, please refer to this documentation or contact the development team.