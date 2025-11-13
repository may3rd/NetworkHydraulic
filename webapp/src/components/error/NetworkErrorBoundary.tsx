/**
 * Network Error Boundary Component for Hydraulic Network Web Application
 * 
 * This component provides specialized error boundary functionality for network
 * visualization components with topology-specific error handling.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  SettingsEthernet as SettingsEthernetIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';
import { NETWORK_ERRORS } from '../../types/error/errorCodes';

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReload?: boolean;
  enableLayoutReset?: boolean;
  networkType?: 'pipe' | 'flow' | 'topology';
}

class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<NetworkErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `network_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    this.setState({ errorInfo });

    if (onError) {
      onError(error, errorInfo);
    }

    this.reportNetworkError(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('NetworkErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  reportNetworkError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData: BaseError = {
      id: this.state.errorId,
      timestamp: new Date(),
      message: error.message,
      severity: ErrorSeverity.ERROR,
      category: 'NETWORK' as any,
      code: NETWORK_ERRORS.API_VERSION_UNSUPPORTED,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        networkType: this.props.networkType || 'unknown',
        errorBoundary: 'NetworkErrorBoundary'
      },
      recoverable: true
    };

    const { reportError } = require('../../hooks/error/useErrorReporting').useErrorReporting();
    const context: ErrorContext = {
      component: 'NetworkErrorBoundary',
      action: 'network_render',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const tracking: ErrorTracking = {
      errorId: this.state.errorId,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      componentStack: (errorInfo.componentStack || '') as string,
      errorBoundary: 'NetworkErrorBoundary',
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date()
      }
    };

    reportError(errorData, context, tracking);
  };

  handleReload = () => {
    // Reload network data
    window.location.reload();
  };

  handleLayoutReset = () => {
    // Reset network layout
    localStorage.removeItem('network_layout');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    });
  };

  handleShowDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  handleClose = () => {
    this.setState({ hasError: false });
  };

  renderErrorAlert() {
    const { error } = this.state;
    const { networkType = 'network' } = this.props;
    const severity = ErrorSeverity.ERROR;
    const levelConfig = SEVERITY_LEVELS[severity];

    return (
      <Alert
        severity="error"
        variant="filled"
        sx={{
          mt: 2,
          mb: 2,
          backgroundColor: levelConfig.backgroundColor,
          borderColor: levelConfig.borderColor,
          color: levelConfig.textColor
        }}
        action={
          <Box>
            <Button
              color="inherit"
              size="small"
              onClick={this.handleShowDetails}
              sx={{ mr: 1 }}
            >
              {this.state.showDetails ? 'Hide' : 'Details'}
            </Button>
            <IconButton
              color="inherit"
              size="small"
              onClick={this.handleClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
        icon={<ErrorIcon />}
      >
        <AlertTitle>
          Network Visualization Error
        </AlertTitle>
        <Typography>
          {error?.message || `Failed to render the ${networkType} network visualization.`}
        </Typography>
        
        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleReload}
            startIcon={<RefreshIcon />}
            variant="outlined"
          >
            Reload Network
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleLayoutReset}
            startIcon={<SettingsEthernetIcon />}
            variant="outlined"
          >
            Reset Layout
          </Button>
        </Box>
        
        <Collapse in={this.state.showDetails} timeout="auto">
          <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>
              Error Details:
            </Typography>
            <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
              {error?.stack || 'No stack trace available'}
            </Typography>
          </Box>
        </Collapse>
      </Alert>
    );
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorAlert();
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;