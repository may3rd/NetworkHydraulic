/**
 * Calculation Error Boundary Component for Hydraulic Network Web Application
 * 
 * This component provides specialized error boundary functionality for calculation
 * components with hydraulic-specific error handling and recovery mechanisms.
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
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';
import { CALCULATION_ERRORS } from '../../types/error/errorCodes';

interface CalculationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
  isRetrying: boolean;
}

interface CalculationErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  enableConfigurationReset?: boolean;
  enableProgressTracking?: boolean;
  calculationType?: 'solve' | 'validate' | 'export';
}

class CalculationErrorBoundary extends Component<CalculationErrorBoundaryProps, CalculationErrorBoundaryState> {
  constructor(props: CalculationErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CalculationErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `calc_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    this.setState({ errorInfo });

    if (onError) {
      onError(error, errorInfo);
    }

    // Report error to error management system
    this.reportCalculationError(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('CalculationErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  reportCalculationError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData: BaseError = {
      id: this.state.errorId,
      timestamp: new Date(),
      message: error.message,
      severity: ErrorSeverity.ERROR,
      category: 'CALCULATION' as any,
      code: CALCULATION_ERRORS.SOLVER_FAILED,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        calculationType: this.props.calculationType || 'unknown',
        errorBoundary: 'CalculationErrorBoundary'
      },
      recoverable: true
    };

    const context: ErrorContext = {
      component: 'CalculationErrorBoundary',
      action: 'calculation_execution',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const tracking: ErrorTracking = {
      errorId: this.state.errorId,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      componentStack: (errorInfo.componentStack || '') as string,
      errorBoundary: 'CalculationErrorBoundary',
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date()
      }
    };

    // Use error reporting hook to handle the error
    const { reportError } = require('../../hooks/error/useErrorReporting').useErrorReporting();
    reportError(errorData, context, tracking);
  };

  handleRetry = async () => {
    const { enableRetry = true } = this.props;
    
    if (!enableRetry) return;

    this.setState({ isRetrying: true });

    try {
      // Simulate retry logic - in a real application, this would restart the calculation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        showDetails: false,
        isRetrying: false
      });
    } catch (retryError) {
      this.setState({ isRetrying: false });
      console.error('Retry failed:', retryError);
    }
  };

  handleConfigurationReset = () => {
    // Reset configuration to default values
    // This would trigger a reset in the parent component
    console.log('Resetting configuration...');
    
    // Clear any cached data
    localStorage.removeItem('hydraulic_config');
    
    // Reload the calculation component
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

  getSuggestedActions = () => {
    const actions = [];
    const { enableRetry = true, enableConfigurationReset = true } = this.props;
    
    if (enableRetry) {
      actions.push({
        label: 'Retry Calculation',
        action: this.handleRetry,
        icon: <RefreshIcon />,
        color: 'primary' as const
      });
    }
    
    if (enableConfigurationReset) {
      actions.push({
        label: 'Reset Configuration',
        action: this.handleConfigurationReset,
        icon: <SettingsIcon />,
        color: 'secondary' as const
      });
    }
    
    actions.push({
      label: 'Close Error',
      action: this.handleClose,
      icon: <CloseIcon />,
      color: 'inherit' as const
    });

    return actions;
  };

  renderErrorAlert() {
    const { error } = this.state;
    const { calculationType = 'solve' } = this.props;
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
            {this.state.isRetrying && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Box sx={{ width: 20, height: 20, mr: 1 }}>
                  <LinearProgress />
                </Box>
                <Typography variant="caption">Retrying...</Typography>
              </Box>
            )}
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
          {calculationType === 'solve' && 'Calculation Failed'}
          {calculationType === 'validate' && 'Validation Failed'}
          {calculationType === 'export' && 'Export Failed'}
        </AlertTitle>
        <Typography>
          {error?.message || 'The hydraulic calculation could not be completed successfully.'}
        </Typography>
        
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            Try one of these actions:
          </Typography>
          <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
            {this.getSuggestedActions().map((action, index) => (
              <Button
                key={index}
                size="small"
                color={action.color}
                onClick={action.action}
                startIcon={action.icon}
                variant="outlined"
              >
                {action.label}
              </Button>
            ))}
          </Box>
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
          <Box display="flex" alignItems="center" gap={2}>
            <ErrorIcon />
            <Typography variant="h6">
              Critical Calculation Error
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box mb={3}>
            <Typography variant="body1" paragraph>
              {error?.message || 'A critical error has occurred during the hydraulic calculation that prevents completion.'}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Possible causes:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Invalid configuration parameters</li>
              <li>Numerical instability in solver</li>
              <li>Network topology issues</li>
              <li>Insufficient system resources</li>
            </Box>
          </Box>
          
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Recommended actions:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Review and validate your input parameters</li>
              <li>Check network configuration for consistency</li>
              <li>Reduce calculation complexity if possible</li>
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
        </DialogContent>
        
        <DialogActions>
          <Button onClick={this.handleShowDetails} color="inherit">
            {this.state.showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button onClick={this.handleClose} color="inherit">
            Close
          </Button>
          {this.getSuggestedActions().map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              variant="contained"
              startIcon={action.icon}
              color={action.color === 'inherit' ? 'primary' : action.color}
            >
              {action.label}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    );
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorAlert();
    }

    return this.props.children;
  }
}

export default CalculationErrorBoundary;