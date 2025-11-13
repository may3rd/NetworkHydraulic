/**
 * Error Dialog Component for Hydraulic Network Web Application
 * 
 * This component provides a modal dialog for displaying critical errors
 * with detailed information and user actions.
 */

import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button, 
  Box,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  Collapse
} from '@mui/material';
import {
  Error as ErrorIcon,
  ReportProblem as CriticalIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorAction } from '../../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../../types/error/severityLevels';

interface ErrorDialogProps {
  open: boolean;
  error: BaseError;
  actions?: ErrorAction[];
  showDetails?: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onHelp?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  error,
  actions = [],
  showDetails = false,
  onClose,
  onRetry,
  onHelp
}) => {
  const severity = error.severity;
  const levelConfig = SEVERITY_LEVELS[severity];
  
  // Get appropriate icon for severity
  const getSeverityIcon = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <CriticalIcon color="error" />;
      case ErrorSeverity.ERROR:
        return <ErrorIcon color="error" />;
      case ErrorSeverity.WARNING:
        return <WarningIcon color="warning" />;
      case ErrorSeverity.INFO:
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get suggested actions
  const getSuggestedActions = () => {
    const suggestedActions = [];
    
    if (onRetry && error.recoverable) {
      suggestedActions.push({
        label: 'Retry Action',
        action: onRetry,
        icon: <RefreshIcon />,
        color: 'primary' as const
      });
    }
    
    if (onHelp) {
      suggestedActions.push({
        label: 'Get Help',
        action: onHelp,
        icon: <HelpIcon />,
        color: 'secondary' as const
      });
    }

    // Add custom actions
    const customActions = actions.map((action, index) => ({
      label: action.label,
      action: action.callback || (() => {}),
      icon: action.label.includes('Help') ? <HelpIcon /> : undefined,
      color: action.label.includes('Retry') ? 'primary' as const : 'inherit' as const
    }));

    return [...suggestedActions, ...customActions];
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      onClose={onClose}
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
          {getSeverityIcon()}
          <Typography variant="h6">
            {severity === ErrorSeverity.CRITICAL ? 'Critical Error' : 
             severity === ErrorSeverity.ERROR ? 'Error' :
             severity === ErrorSeverity.WARNING ? 'Warning' : 'Information'}
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
      </DialogTitle>
      
      <DialogContent>
        <Alert
          severity={severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR ? 'error' : 
                   severity === ErrorSeverity.WARNING ? 'warning' : 'info'}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            {error.code ? `${error.code}: ` : ''}
            {error.message.split(':')[0]}
          </AlertTitle>
          <Typography>
            {error.message.split(':')[1] ? error.message.split(':')[1].trim() : error.message}
          </Typography>
        </Alert>

        {error.suggestion && (
          <Box mb={3} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>
              Suggested Solution:
            </Typography>
            <Typography variant="body1">
              {error.suggestion}
            </Typography>
          </Box>
        )}

        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            What you can do:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            {severity === ErrorSeverity.CRITICAL && (
              <>
                <li>Check your network configuration for critical issues</li>
                <li>Verify all required parameters are provided</li>
                <li>Review system resources and try again</li>
                <li>Contact support if the problem persists</li>
              </>
            )}
            {severity === ErrorSeverity.ERROR && (
              <>
                <li>Review the error details and correct any issues</li>
                <li>Check input parameters for validity</li>
                <li>Try the suggested actions below</li>
              </>
            )}
            {severity === ErrorSeverity.WARNING && (
              <>
                <li>Consider the warning when proceeding</li>
                <li>Review configuration for potential improvements</li>
                <li>This may not prevent successful completion</li>
              </>
            )}
            {severity === ErrorSeverity.INFO && (
              <>
                <li>This is informational only</li>
                <li>No action required</li>
                <li>Continue with your workflow</li>
              </>
            )}
          </Box>
        </Box>

        <Collapse in={showDetails} timeout="auto">
          <Box mb={3} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom>
              Technical Details:
            </Typography>
            <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" component="div">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {error.details ? JSON.stringify(error.details, null, 2) : 'No additional details available'}
              </pre>
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
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => onClose()} color="inherit">
          Close
        </Button>
        
        {getSuggestedActions().map((action, index) => (
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
};

export default ErrorDialog;