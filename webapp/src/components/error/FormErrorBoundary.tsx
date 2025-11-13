/**
 * Form Error Boundary Component for Hydraulic Network Web Application
 * 
 * This component provides specialized error boundary functionality for form
 * components with validation-specific error handling and recovery mechanisms.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Dialog, 
  DialogContent, 
  DialogActions,
  Box,
  Typography,
  IconButton,
  Collapse,
  FormHelperText
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Undo as UndoIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';
import { VALIDATION_ERRORS } from '../../types/error/errorCodes';

interface FormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface FormErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReset?: boolean;
  enableRestore?: boolean;
  formName?: string;
}

class FormErrorBoundary extends Component<FormErrorBoundaryProps, FormErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `form_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    this.setState({ errorInfo });

    if (onError) {
      onError(error, errorInfo);
    }

    this.reportFormError(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('FormErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  reportFormError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData: BaseError = {
      id: this.state.errorId,
      timestamp: new Date(),
      message: error.message,
      severity: ErrorSeverity.ERROR,
      category: 'VALIDATION' as any,
      code: VALIDATION_ERRORS.INVALID_TYPE,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        formName: this.props.formName || 'unknown',
        errorBoundary: 'FormErrorBoundary'
      },
      recoverable: true
    };

    const context: ErrorContext = {
      component: 'FormErrorBoundary',
      action: 'form_validation',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const tracking: ErrorTracking = {
      errorId: this.state.errorId,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      componentStack: (errorInfo.componentStack || '') as string,
      errorBoundary: 'FormErrorBoundary',
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date()
      }
    };

    const { reportError } = require('../../hooks/error/useErrorReporting').useErrorReporting();
    reportError(errorData, context, tracking);
  };

  handleReset = () => {
    // Reset form to initial state
    const forms = document.querySelectorAll('form');
    forms.forEach(form => (form as HTMLFormElement).reset());
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    });
  };

  handleRestore = () => {
    // Restore form from localStorage or sessionStorage
    const { formName } = this.props;
    if (formName) {
      const savedData = localStorage.getItem(`form_${formName}`);
      if (savedData) {
        try {
          const formData = JSON.parse(savedData);
          // Restore form data - this would need to be implemented based on form structure
          console.log('Restoring form data:', formData);
        } catch (e) {
          console.error('Failed to restore form data:', e);
        }
      }
    }
    
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
    const { formName = 'Form' } = this.props;
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
          {formName} Error
        </AlertTitle>
        <Typography>
          {error?.message || 'An error occurred while processing the form.'}
        </Typography>
        
        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleReset}
            startIcon={<UndoIcon />}
            variant="outlined"
          >
            Reset Form
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleRestore}
            startIcon={<RefreshIcon />}
            variant="outlined"
          >
            Restore Data
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

export default FormErrorBoundary;