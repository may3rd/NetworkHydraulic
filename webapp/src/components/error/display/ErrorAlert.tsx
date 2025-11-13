/**
 * Error Alert Component for Hydraulic Network Web Application
 * 
 * This component provides a flexible error alert display with severity-based
 * styling, action buttons, and configurable display options.
 */

import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Button, 
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ReportProblem as CriticalIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorAction } from '../../../types/error/errorTypes';
import { SEVERITY_LEVELS, getSeverityIcon, getSeverityStyles } from '../../../types/error/severityLevels';

interface ErrorAlertProps {
  error: BaseError;
  actions?: ErrorAction[];
  showDetails?: boolean;
  showTimestamp?: boolean;
  showSuggestion?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onDismiss?: () => void;
  onRetry?: () => void;
  onShowDetails?: () => void;
  fullWidth?: boolean;
  variant?: 'standard' | 'filled' | 'outlined';
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  actions = [],
  showDetails = false,
  showTimestamp = true,
  showSuggestion = true,
  autoHide = false,
  autoHideDelay = 5000,
  onDismiss,
  onRetry,
  onShowDetails,
  fullWidth = true,
  variant = 'standard'
}) => {
  const severity = error.severity;
  const levelConfig = SEVERITY_LEVELS[severity];
  
  // Get appropriate icon for severity
  const getSeverityIcon = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <CriticalIcon />;
      case ErrorSeverity.ERROR:
        return <ErrorIcon />;
      case ErrorSeverity.WARNING:
        return <WarningIcon />;
      case ErrorSeverity.INFO:
      default:
        return <InfoIcon />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  // Get MUI severity for Alert component
  const getMuiSeverity = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'error';
      case ErrorSeverity.ERROR:
        return 'error';
      case ErrorSeverity.WARNING:
        return 'warning';
      case ErrorSeverity.INFO:
      default:
        return 'info';
    }
  };

  // Handle auto-hide
  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  // Build action buttons
  const renderActions = () => {
    const defaultActions = [];
    
    if (onRetry) {
      defaultActions.push(
        <Button
          key="retry"
          size="small"
          color="inherit"
          onClick={onRetry}
          startIcon={<RefreshIcon />}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Retry
        </Button>
      );
    }
    
    if (onShowDetails) {
      defaultActions.push(
        <Button
          key="details"
          size="small"
          color="inherit"
          onClick={onShowDetails}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      );
    }

    // Add custom actions
    const customActions = actions.map((action, index) => (
      <Button
        key={index}
        size="small"
        color="inherit"
        onClick={action.callback || (() => {})}
        startIcon={action.label.includes('Help') ? <HelpIcon /> : undefined}
        variant="outlined"
        sx={{ mr: 1 }}
      >
        {action.label}
      </Button>
    ));

    if (onDismiss) {
      defaultActions.push(
        <IconButton
          key="dismiss"
          color="inherit"
          size="small"
          onClick={onDismiss}
        >
          <CloseIcon />
        </IconButton>
      );
    }

    return [...defaultActions, ...customActions];
  };

  return (
    <Alert
      severity={getMuiSeverity()}
      variant={variant}
      icon={getSeverityIcon()}
      sx={{
        mb: fullWidth ? 2 : 0,
        mt: fullWidth ? 2 : 0,
        backgroundColor: levelConfig.backgroundColor,
        borderColor: levelConfig.borderColor,
        color: levelConfig.textColor,
        ...(!fullWidth && { maxWidth: 600 })
      }}
      action={renderActions()}
    >
      <AlertTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" component="span">
            {error.code ? `${error.code}: ` : ''}
            {error.message.split(':')[0]}
          </Typography>
          <Chip
            size="small"
            label={severity.toUpperCase()}
            color={severity === ErrorSeverity.CRITICAL ? 'error' : 
                   severity === ErrorSeverity.ERROR ? 'error' : 
                   severity === ErrorSeverity.WARNING ? 'warning' : 'info'}
            variant="outlined"
          />
        </Box>
      </AlertTitle>
      
      <Typography variant="body1">
        {error.message.split(':')[1] ? error.message.split(':')[1].trim() : error.message}
      </Typography>

      {showTimestamp && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            Occurred: {formatTimestamp(error.timestamp)}
          </Typography>
        </Box>
      )}

      {showSuggestion && error.suggestion && (
        <Box mt={1} p={1} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Suggestion:
          </Typography>
          <Typography variant="body2">
            {error.suggestion}
          </Typography>
        </Box>
      )}

      <Collapse in={showDetails} timeout="auto">
        <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Error Details:
          </Typography>
          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
            {error.details ? JSON.stringify(error.details, null, 2) : 'No additional details available'}
          </Typography>
          
          {error.userMessage && (
            <>
              <Typography variant="subtitle2" gutterBottom mt={2}>
                User Message:
              </Typography>
              <Typography variant="body2">
                {error.userMessage}
              </Typography>
            </>
          )}
        </Box>
      </Collapse>

      {error.recoverable && (
        <Box mt={1}>
          <Typography variant="caption" color="success.main">
            This error may be recoverable. Try the suggested actions above.
          </Typography>
        </Box>
      )}
    </Alert>
  );
};

export default ErrorAlert;