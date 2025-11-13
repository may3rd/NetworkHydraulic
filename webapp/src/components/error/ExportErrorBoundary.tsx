/**
 * Export Error Boundary Component for Hydraulic Network Web Application
 * 
 * This component provides specialized error boundary functionality for export
 * components with file generation and format-specific error handling.
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
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';
import { FILE_ERRORS } from '../../types/error/errorCodes';

interface ExportErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface ExportErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  exportFormat?: 'pdf' | 'excel' | 'csv' | 'json' | 'yaml';
  enableRetry?: boolean;
  enableAlternativeFormat?: boolean;
}

class ExportErrorBoundary extends Component<ExportErrorBoundaryProps, ExportErrorBoundaryState> {
  constructor(props: ExportErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ExportErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `export_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    this.setState({ errorInfo });

    if (onError) {
      onError(error, errorInfo);
    }

    this.reportExportError(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('ExportErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  reportExportError = (error: Error, errorInfo: ErrorInfo) => {
    const { exportFormat = 'unknown' } = this.props;
    
    const errorData: BaseError = {
      id: this.state.errorId,
      timestamp: new Date(),
      message: error.message,
      severity: ErrorSeverity.ERROR,
      category: 'FILE' as any,
      code: FILE_ERRORS.FILE_CORRUPTED,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        exportFormat,
        errorBoundary: 'ExportErrorBoundary'
      },
      recoverable: true
    };

    const { reportError } = require('../../hooks/error/useErrorReporting').useErrorReporting();
    
    const context: ErrorContext = {
      component: 'ExportErrorBoundary',
      action: 'export_generation',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const tracking: ErrorTracking = {
      errorId: this.state.errorId,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      componentStack: (errorInfo.componentStack || '') as string,
      errorBoundary: 'ExportErrorBoundary',
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date()
      }
    };

    reportError(errorData, context, tracking);
  };

  handleRetry = () => {
    // Retry export with same format
    window.location.reload();
  };

  handleAlternativeFormat = () => {
    // Try alternative export format
    const { exportFormat } = this.props;
    let alternativeFormat: string;
    
    switch (exportFormat) {
      case 'pdf':
        alternativeFormat = 'excel';
        break;
      case 'excel':
      case 'csv':
        alternativeFormat = 'json';
        break;
      case 'json':
      case 'yaml':
        alternativeFormat = 'csv';
        break;
      default:
        alternativeFormat = 'json';
    }
    
    console.log(`Trying alternative format: ${alternativeFormat}`);
    
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
    const { exportFormat = 'export' } = this.props;
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
          Export Error
        </AlertTitle>
        <Typography>
          {error?.message || `Failed to export ${exportFormat} file.`}
        </Typography>
        
        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleRetry}
            startIcon={<RefreshIcon />}
            variant="outlined"
          >
            Retry Export
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={this.handleAlternativeFormat}
            startIcon={<FileDownloadIcon />}
            variant="outlined"
          >
            Try Alternative Format
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

export default ExportErrorBoundary;