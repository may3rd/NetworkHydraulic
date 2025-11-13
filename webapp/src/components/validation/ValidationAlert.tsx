/**
 * Validation Alert Component for Hydraulic Network Web Application
 * 
 * This component provides validation status alerts with severity levels,
 * field-specific feedback, and actionable suggestions.
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
  ListItem,
  List,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import { ValidationError, ErrorSeverity } from '../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../types/error/severityLevels';

interface ValidationAlertProps {
  field?: string;
  label?: string;
  status: 'valid' | 'warning' | 'error' | 'info';
  message: string;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  suggestions?: string[];
  showDetails?: boolean;
  showSuggestions?: boolean;
  showCounts?: boolean;
  onFix?: () => void;
  onLearnMore?: () => void;
  fullWidth?: boolean;
  variant?: 'standard' | 'filled' | 'outlined';
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({
  field,
  label,
  status,
  message,
  errors = [],
  warnings = [],
  suggestions = [],
  showDetails = false,
  showSuggestions = true,
  showCounts = true,
  onFix,
  onLearnMore,
  fullWidth = true,
  variant = 'standard'
}) => {
  // Get severity and icon based on status
  const getSeverity = (): ErrorSeverity => {
    switch (status) {
      case 'error':
        return ErrorSeverity.ERROR;
      case 'warning':
        return ErrorSeverity.WARNING;
      case 'info':
        return ErrorSeverity.INFO;
      case 'valid':
      default:
        return ErrorSeverity.INFO;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityConfig = () => {
    const severity = getSeverity();
    return SEVERITY_LEVELS[severity];
  };

  const severityConfig = getSeverityConfig();
  const severity = getSeverity();

  // Get MUI severity for Alert component
  const getMuiSeverity = () => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const [expanded, setExpanded] = React.useState(showDetails);

  const renderActions = () => {
    const actions = [];

    if (onFix && (status === 'error' || status === 'warning')) {
      actions.push(
        <Button
          key="fix"
          size="small"
          color="inherit"
          onClick={onFix}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Fix Issue
        </Button>
      );
    }

    if (onLearnMore) {
      actions.push(
        <Button
          key="learn"
          size="small"
          color="inherit"
          onClick={onLearnMore}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Learn More
        </Button>
      );
    }

    if ((errors.length > 0 || warnings.length > 0) && (suggestions.length > 0)) {
      actions.push(
        <IconButton
          key="expand"
          color="inherit"
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      );
    }

    return actions;
  };

  return (
    <Alert
      severity={getMuiSeverity()}
      variant={variant}
      icon={getIcon()}
      sx={{
        mb: fullWidth ? 2 : 0,
        mt: fullWidth ? 2 : 0,
        backgroundColor: severity === ErrorSeverity.INFO ? 'rgba(25, 118, 210, 0.08)' : 
                       severity === ErrorSeverity.WARNING ? 'rgba(255, 152, 0, 0.08)' :
                       severity === ErrorSeverity.ERROR ? 'rgba(244, 67, 54, 0.08)' :
                       'rgba(76, 175, 80, 0.08)',
        borderColor: severityConfig.borderColor,
        color: severityConfig.textColor,
        ...(!fullWidth && { maxWidth: 600 })
      }}
      action={renderActions()}
    >
      <AlertTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" component="span">
            {label || field || 'Validation'}
          </Typography>
          <Chip
            size="small"
            label={status.toUpperCase()}
            color={status === 'valid' ? 'success' : 
                   status === 'error' ? 'error' : 
                   status === 'warning' ? 'warning' : 'info'}
            variant="outlined"
          />
        </Box>
      </AlertTitle>
      
      <Typography variant="body1">
        {message}
      </Typography>

      {showCounts && (errors.length > 0 || warnings.length > 0) && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            {errors.length > 0 && `${errors.length} error${errors.length > 1 ? 's' : ''}`}
            {errors.length > 0 && warnings.length > 0 && ' • '}
            {warnings.length > 0 && `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`}
          </Typography>
        </Box>
      )}

      {(errors.length > 0 || warnings.length > 0 || suggestions.length > 0) && (
        <Collapse in={expanded} timeout="auto">
          <Box mt={2}>
            {errors.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors:
                </Typography>
                <List dense>
                  {errors.map((error, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <ErrorIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={error.message}
                        secondary={error.field && `Field: ${error.field}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {warnings.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings:
                </Typography>
                <List dense>
                  {warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={warning.message}
                        secondary={warning.field && `Field: ${warning.field}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Suggestions:
                </Typography>
                <List dense>
                  {suggestions.map((suggestion, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <InfoIcon fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

export default ValidationAlert;