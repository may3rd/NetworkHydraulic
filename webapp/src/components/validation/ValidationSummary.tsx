/**
 * Validation Summary Component for Hydraulic Network Web Application
 * 
 * This component provides a summary view of validation results with
 * overall status, error counts, and quick actions.
 */

import React from 'react';
import { 
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

import { ValidationError, ErrorSeverity } from '../../types/error/errorTypes';

interface ValidationSummaryProps {
  isValid: boolean;
  totalFields: number;
  validFields: number;
  invalidFields: number;
  totalErrors: number;
  totalWarnings: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  onRetry?: () => void;
  onContinue?: () => void;
  showDetails?: boolean;
  collapsible?: boolean;
  title?: string;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  isValid,
  totalFields,
  validFields,
  invalidFields,
  totalErrors,
  totalWarnings,
  errors,
  warnings,
  onRetry,
  onContinue,
  showDetails = true,
  collapsible = false,
  title = 'Validation Summary'
}) => {
  const [expanded, setExpanded] = React.useState(!collapsible);

  // Get overall validation status
  const getValidationStatus = () => {
    if (totalErrors > 0) return 'error';
    if (totalWarnings > 0) return 'warning';
    if (isValid) return 'success';
    return 'info';
  };

  // Get appropriate icon
  const getStatusIcon = () => {
    switch (getValidationStatus()) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Calculate validation percentage
  const getValidationPercentage = () => {
    return totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0;
  };

  const status = getValidationStatus();
  const validationPercentage = getValidationPercentage();

  if (!showDetails && isValid) {
    return null;
  }

  const renderSummaryContent = () => (
    <Box>
      {/* Overall Status */}
      <Alert
        severity={status === 'success' ? 'success' : status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'info'}
        variant="outlined"
        sx={{ mb: 3 }}
        icon={getStatusIcon()}
      >
        <AlertTitle>
          <Typography variant="h6">
            {isValid ? 'Validation Successful' : status === 'error' ? 'Validation Failed' : 'Validation Warnings'}
          </Typography>
        </AlertTitle>
        <Typography variant="body1">
          {isValid 
            ? `All ${validFields} fields validated successfully (${validationPercentage}%)`
            : `${invalidFields} of ${totalFields} fields have issues (${validationPercentage}% valid)`
          }
        </Typography>
        
        {!isValid && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">
              {totalErrors > 0 && `${totalErrors} error${totalErrors > 1 ? 's' : ''}`}
              {totalErrors > 0 && totalWarnings > 0 && ' • '}
              {totalWarnings > 0 && `${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`}
            </Typography>
          </Box>
        )}
      </Alert>

      {/* Field Summary */}
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Field Validation Summary:
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip
            label={`Valid: ${validFields}/${totalFields}`}
            color="success"
            variant="outlined"
            size="small"
          />
          {invalidFields > 0 && (
            <Chip
              label={`Invalid: ${invalidFields}`}
              color="error"
              variant="outlined"
              size="small"
            />
          )}
          {totalWarnings > 0 && (
            <Chip
              label={`Warnings: ${totalWarnings}`}
              color="warning"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Actions */}
      {(onRetry || onContinue) && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Actions:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {onRetry && !isValid && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                color="primary"
              >
                Retry Validation
              </Button>
            )}
            {onContinue && isValid && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onContinue}
                color="success"
              >
                Continue
              </Button>
            )}
            {onContinue && !isValid && (
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={onContinue}
                color="warning"
              >
                Continue Anyway
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderDetailsContent = () => (
    <Box>
      {/* Errors */}
      {errors.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Errors ({errors.length}):
          </Typography>
          <List dense>
            {errors.map((error, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemIcon>
                    <ErrorIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.message}
                    secondary={error.field ? `Field: ${error.field}` : undefined}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Warnings ({warnings.length}):
          </Typography>
          <List dense>
            {warnings.map((warning, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemIcon>
                    <WarningIcon color="warning" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={warning.message}
                    secondary={warning.field ? `Field: ${warning.field}` : undefined}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {errors.length === 0 && warnings.length === 0 && isValid && (
        <Box mb={3} textAlign="center" p={3}>
          <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h6" color="success.main">
            All validations passed!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your configuration is ready for calculation.
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (collapsible) {
    return (
      <Box>
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              {getStatusIcon()}
              <Typography variant="subtitle1">
                {title}
              </Typography>
              <Chip
                label={isValid ? 'Valid' : 'Invalid'}
                color={isValid ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderSummaryContent()}
            {showDetails && renderDetailsContent()}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {renderSummaryContent()}
      {showDetails && renderDetailsContent()}
    </Box>
  );
};

export default ValidationSummary;