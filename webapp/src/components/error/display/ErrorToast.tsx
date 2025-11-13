/**
 * Error Toast Component for Hydraulic Network Web Application
 * 
 * This component provides toast notifications for errors with auto-dismiss
 * functionality and severity-based styling.
 */

import React from 'react';
import { 
  Snackbar,
  Alert,
  AlertTitle,
  Typography,
  Box
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ReportProblem as CriticalIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError } from '../../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../../types/error/severityLevels';

interface ErrorToastProps {
  open: boolean;
  error: BaseError;
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  open,
  error,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'right' }
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

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        severity={getMuiSeverity()}
        variant="filled"
        icon={getSeverityIcon()}
        sx={{
          backgroundColor: levelConfig.backgroundColor,
          color: levelConfig.textColor,
          minWidth: 300,
          maxWidth: 500
        }}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {error.suggestion && (
              <Typography 
                variant="caption" 
                sx={{ 
                  fontStyle: 'italic',
                  maxWidth: 200,
                  wordWrap: 'break-word'
                }}
              >
                {error.suggestion}
              </Typography>
            )}
          </Box>
        }
      >
        <AlertTitle>
          {error.code ? `${error.code}: ` : ''}
          {error.message.split(':')[0]}
        </AlertTitle>
        <Typography variant="body2">
          {error.message.split(':')[1] ? error.message.split(':')[1].trim() : error.message}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default ErrorToast;