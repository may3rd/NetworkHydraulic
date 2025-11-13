/**
 * Main Error Boundary Component for Hydraulic Network Web Application
 * 
 * This component provides comprehensive error boundary functionality with
 * fallback UI, error reporting, and recovery mechanisms.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Typography,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  ReportProblem as CriticalIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS, getSeverityIcon, getSeverityStyles } from '../../types/error/severityLevels';
// import { useError } from '../../hooks/error/useError';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  isolate?: boolean;
  enableReporting?: boolean;
  enableRecovery?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component', enableReporting = true } = this.props;
    
    this.setState({ errorInfo });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report error to error management system
    if (enableReporting) {
      this.reportError(error, errorInfo, level);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  reportError = (error: Error, errorInfo: ErrorInfo, level: string) => {
    const { useErrorReporting } = require('../../hooks/error/useErrorReporting');
    
    const errorData: BaseError = {
      id: this.state.errorId,
      timestamp: new Date(),
      message: error.message,
      severity: ErrorSeverity.ERROR,
      category: 'SYSTEM' as any,
      code: 'ERROR_BOUNDARY',
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        errorBoundary: this.constructor.name,
        level
      },
      recoverable: true
    };

    const context: ErrorContext = {
      component: this.constructor.name,
      action: 'component_render',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const tracking: ErrorTracking = {
      errorId: this.state.errorId,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      componentStack: (errorInfo.componentStack || '') as string,
      errorBoundary: this.constructor.name,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date()
      }
    };

    // Use error reporting hook to handle the error
    const { reportError } = useErrorReporting();
    reportError(errorData, context, tracking);
  };

  handleRetry = () => {
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
    const { level = 'component' } = this.props;
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
          {level === 'page' ? 'Page Error' : 'Component Error'}
        </AlertTitle>
        <Typography>
          {error?.message || 'An unexpected error occurred'}
        </Typography>
        
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

  renderErrorModal() {
    const { error } = this.state;
    const severity = ErrorSeverity.CRITICAL;
    const levelConfig = SEVERITY_LEVELS[severity];

    return (
      <Dialog
        open={true}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: levelConfig.backgroundColor,
            borderColor: levelConfig.borderColor,
            color: levelConfig.textColor,
            m: 2
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CriticalIcon />
            <Typography variant="h6" color="error.main">
              Critical Error
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="body1" paragraph>
                {error?.message || 'A critical error has occurred that prevents the application from functioning properly.'}
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  What you can do:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the problem persists</li>
                </Box>
              </Box>
              
              <Collapse in={this.state.showDetails} timeout="auto">
                <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Technical Details:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                    {error?.stack || 'No stack trace available'}
                  </Typography>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={this.handleShowDetails} color="inherit">
            {this.state.showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button onClick={this.handleClose} color="inherit">
            Close
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="contained" 
            color="error"
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  renderCustomFallback() {
    const { fallback } = this.props;
    return fallback || this.renderErrorAlert();
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const { level = 'component' } = this.props;
      
      // For page-level errors, show modal
      if (level === 'page') {
        return this.renderErrorModal();
      }
      
      // For section/component errors, show alert or custom fallback
      return this.renderCustomFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;