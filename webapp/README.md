# Hydraulic Network Web Application

A comprehensive React TypeScript web application for hydraulic network analysis, built according to the design specifications outlined in the project documentation.

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Project Overview

The Hydraulic Network Web Application provides a professional, modular interface for configuring, calculating, and analyzing hydraulic networks. Built as a React TypeScript application, it serves as the frontend for the Python network-hydraulic library, offering an intuitive web-based interface for engineers and analysts.

### Key Features

- **🏗️ Professional UI**: Modern Material-UI (MUI) v5 components with responsive design
- **📊 State Management**: Zustand for lightweight, scalable state management
- **📝 Form Handling**: React Hook Form with Yup validation for robust data entry
- **📈 Data Visualization**: Chart.js/Recharts for charts and React Flow for interactive network diagrams
- **📁 File Management**: React Dropzone for configuration file upload and validation
- **🛡️ Type Safety**: Full TypeScript implementation throughout the application
- **🧪 Testing**: Jest and React Testing Library for comprehensive test coverage
- **🔄 Real-time Updates**: WebSocket integration for calculation progress monitoring
- **📤 Export Capabilities**: PDF and CSV export for results and reports
- **🎨 Customizable Themes**: Dark and light theme support with MUI theming

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
webapp/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── calculation/     # Calculation controls and status
│   │   ├── config/         # Configuration interface components
│   │   ├── error/          # Error boundaries and displays
│   │   ├── export/         # Export functionality
│   │   ├── file/           # File management
│   │   ├── layout/         # Layout components
│   │   ├── results/        # Results display components
│   │   ├── validation/     # Validation components
│   │   └── visualization/  # Chart and diagram components
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout components
│   ├── pages/              # Page-level components
│   ├── services/           # API services and business logic
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── validation/         # Form validation schemas
├── docs/                   # Documentation
├── cypress/                # End-to-end tests
└── public/                 # Static assets
```

### Design Patterns

- **Component Composition**: Modular, reusable components
- **State Management**: Zustand stores with selectors for performance
- **Error Boundaries**: Comprehensive error handling with user-friendly displays
- **Service Layer**: Separated business logic from UI components
- **Custom Hooks**: Encapsulated logic for reusability

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Zustand
- **UI Library**: Material-UI (MUI) v5
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Charts**: Chart.js/Recharts
- **Network Visualization**: React Flow
- **Styling**: Styled-components
- **Testing**: Jest, React Testing Library, Cypress

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality
- **Lint-staged**: Pre-commit hooks

### Backend Integration
- **API**: RESTful API with FastAPI backend
- **WebSocket**: Real-time progress updates
- **File Upload**: Multipart form data handling
- **Authentication**: JWT-based authentication (planned)

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm 8+ or yarn
- Python 3.10+ (for backend)
- Docker (optional, for containerized deployment)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd NetworkHydraulic/webapp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:3000`

### Backend Setup

The frontend requires a backend API server. Set up the Python backend:

```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .[dev]
python main.py
```

### Environment Variables

Create a `.env` file in the root of the webapp directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WEBSOCKET_URL=ws://localhost:8000/ws

# Application Settings
VITE_APP_NAME=Hydraulic Network Analyzer
VITE_APP_VERSION=1.0.0
VITE_ENABLE_LOGGING=true

# Feature Flags
VITE_ENABLE_AUTH=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_REAL_TIME=true

# External Services (optional)
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:https    # Start with HTTPS (if configured)

# Build & Deploy
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run end-to-end tests

# Utilities
npm run clean        # Clean build artifacts
npm run analyze      # Analyze bundle size
```

### Development Workflow

1. **Code Generation**: Use the provided templates for new components
2. **Testing**: Write tests for all new features
3. **Type Checking**: Ensure TypeScript compilation passes
4. **Linting**: Follow ESLint and Prettier configurations
5. **Commit**: Use conventional commit messages
6. **Pull Request**: Create PRs for code review

### Component Development

#### Creating New Components

1. **Use the component template**:
   ```tsx
   import React from 'react';
   import { useTranslation } from 'react-i18next';

   interface ComponentNameProps {
     /** Component description */
     prop: Type;
     /** Optional callback */
     onChange?: (value: Type) => void;
   }

   export const ComponentName: React.FC<ComponentNameProps> = ({
     prop,
     onChange,
     ...rest
   }) => {
     const { t } = useTranslation();

     return (
       <div {...rest}>
         {/* Component JSX */}
       </div>
     );
   };
   ```

2. **Add TypeScript types** for all props and interfaces
3. **Write unit tests** using React Testing Library
4. **Add Storybook stories** (when implemented)
5. **Update documentation**

### State Management Guidelines

#### Zustand Store Structure

```typescript
interface StoreState {
  // State
  data: DataType[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setData: (data: DataType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await api.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### API Integration

#### Service Layer Pattern

```typescript
// services/exampleService.ts
import { apiClient } from '@/api/client';
import { DataType, ApiResponse } from '@/types';

export class ExampleService {
  static async getData(): Promise<DataType[]> {
    const response = await apiClient.get<ApiResponse<DataType[]>>('/endpoint');
    return response.data.data;
  }

  static async createData(data: Omit<DataType, 'id'>): Promise<DataType> {
    const response = await apiClient.post<ApiResponse<DataType>>('/endpoint', data);
    return response.data.data;
  }
}
```

## Deployment

### Docker Deployment

#### Build Docker Image

```bash
# Build the image
docker build -t hydraulic-network-webapp:latest .

# Run the container
docker run -p 3000:80 hydraulic-network-webapp:latest
```

#### Docker Compose (with backend)

```bash
# Start the full stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Netlify Deployment

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Set API URLs

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Configure environment variables in Vercel dashboard

### Production Configuration

#### Environment Variables

```env
# Production API URLs
VITE_API_BASE_URL=https://api.yourservice.com/api
VITE_WEBSOCKET_URL=wss://api.yourservice.com/ws

# Production Settings
VITE_ENABLE_LOGGING=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

## Documentation

### Developer Documentation

- [Development Guide](./docs/DEVELOPMENT.md) - Setup and development workflow
- [Architecture](./docs/ARCHITECTURE.md) - Application architecture details
- [API Reference](./docs/API_REFERENCE.md) - API integration guide
- [Component Guide](./docs/COMPONENT_GUIDE.md) - Component development guidelines
- [State Management](./docs/STATE_MANAGEMENT.md) - Zustand usage patterns
- [Testing Guide](./docs/TESTING.md) - Testing strategies and examples

### User Documentation

- [User Guide](./docs/user/USER_GUIDE.md) - Getting started for users
- [Configuration Guide](./docs/user/CONFIGURATION_GUIDE.md) - Creating configurations
- [Calculation Guide](./docs/user/CALCULATION_GUIDE.md) - Running calculations
- [Results Guide](./docs/user/RESULTS_GUIDE.md) - Interpreting results
- [Export Guide](./docs/user/EXPORT_GUIDE.md) - Exporting and reporting

### Operational Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Monitoring Guide](./docs/MONITORING.md) - Application monitoring
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Security Guide](./docs/SECURITY.md) - Security best practices

## Contributing

We welcome contributions to the Hydraulic Network Web Application! Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) for detailed information.

### Quick Contribution Guide

1. **Fork the repository** and create a feature branch
2. **Set up development environment** following the setup guide
3. **Write code** following our coding standards
4. **Add tests** for new features and ensure existing tests pass
5. **Update documentation** for any new features or changes
6. **Submit a pull request** with a clear description

### Development Standards

- **Code Quality**: All code must pass ESLint and TypeScript checks
- **Testing**: Minimum 80% test coverage required
- **Documentation**: All public APIs must be documented
- **Performance**: Consider performance implications of changes
- **Accessibility**: Follow WCAG 2.1 AA guidelines

### Code Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Peer Review**: At least one maintainer approval required
3. **Testing**: Manual testing of new features
4. **Documentation**: Ensure docs are up to date

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Hydraulic Network Web Application is part of the NetworkHydraulic suite, which aims to provide open-source tools for hydraulic network analysis.

## Support

### Getting Help

- **Documentation**: Check our comprehensive documentation first
- **Issues**: Search existing [GitHub Issues](../../issues) or create a new one
- **Discussions**: Join our [GitHub Discussions](../../discussions) for questions and feedback
- **Email**: Contact the development team at [email address]

### Community

- **GitHub**: Star us on GitHub to show your support
- **Contributing**: We welcome contributors of all skill levels
- **Feedback**: Your feedback helps us improve the application

### Professional Support

For enterprise support, custom development, or consulting services, please contact us for more information.

## Project Status

### Current Features ✅

- ✅ Complete configuration interface
- ✅ Real-time calculation monitoring
- ✅ Results visualization and analysis
- ✅ File import/export functionality
- ✅ Comprehensive testing suite
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ✅ Production deployment configuration

### Planned Features 🚧

- 🚧 Advanced network visualization tools
- 🚧 Multi-user collaboration features
- 🚧 Advanced reporting and analytics
- 🚧 Mobile-responsive design improvements
- 🚧 Performance optimizations for large networks
- 🚧 Integration with additional hydraulic calculation engines

### Bug Reports & Feature Requests

We use GitHub Issues for tracking bugs and feature requests. When reporting issues, please include:

- **Environment details** (OS, browser, version)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots or videos** if applicable
- **Console errors** or logs

## Changelog

See [CHANGELOG.md](./docs/CHANGELOG.md) for a list of changes and version history.

---

**🔗 Links**: [Documentation](./docs/) | [Issues](../../issues) | [Discussions](../../discussions) | [Contributing](./docs/CONTRIBUTING.md)

**⭐ If you find this project useful, please consider giving it a star on GitHub!**
