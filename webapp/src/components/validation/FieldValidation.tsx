/**
 * Field Validation Component for Hydraulic Network Web Application
 * 
 * This component provides individual field validation display with
 * real-time feedback, error states, and helper text.
 */

import React from 'react';
import { 
  Box,
  Typography,
  TextField,
  FormHelperText,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Help as HelpIcon
} from '@mui/icons-material';

import { ValidationError, ErrorSeverity } from '../../types/error/errorTypes';

interface FieldValidationProps {
  field: string;
  label: string;
  value: any;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
  helperText?: string;
  showValidationIcon?: boolean;
  showErrorsInline?: boolean;
  showWarningsInline?: boolean;
  showErrorCount?: boolean;
  onFix?: (error: ValidationError) => void;
  onHelp?: () => void;
  fullWidth?: boolean;
}

const FieldValidation: React.FC<FieldValidationProps> = ({
  field,
  label,
  value,
  isValid,
  isDirty,
  isTouched,
  errors,
  warnings,
  suggestions,
  helperText,
  showValidationIcon = true,
  showErrorsInline = true,
  showWarningsInline = true,
  showErrorCount = false,
  onFix,
  onHelp,
  fullWidth = true
}) => {
  // Determine field state
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const shouldShowError = hasErrors && (isTouched || isDirty);
  const shouldShowWarning = hasWarnings && (isTouched || isDirty) && !hasErrors;
  
  // Get field status
  const getStatus = () => {
    if (shouldShowError) return 'error';
    if (shouldShowWarning) return 'warning';
    if (isValid && isDirty) return 'success';
    return 'default';
  };

  const getStatusIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    const status = getStatus();
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const status = getStatus();
  const statusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  // Helper text to display
  const getHelperText = () => {
    if (shouldShowError && errors.length > 0) {
      return errors[0].message;
    }
    if (shouldShowWarning && warnings.length > 0) {
      return warnings[0].message;
    }
    return helperText || '';
  };

  return (
    <Box sx={{ mb: 2, ...(fullWidth && { width: '100%' }) }}>
      {/* Field Label and Status */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2">
            {label}
          </Typography>
          <Chip
            size="small"
            label={status === 'success' ? 'Valid' : 
                   status === 'error' ? 'Invalid' : 
                   status === 'warning' ? 'Warning' : 'Pending'}
            color={statusColor as any}
            variant={status === 'default' ? 'outlined' : 'filled'}
          />
          {showErrorCount && (hasErrors || hasWarnings) && (
            <Chip
              size="small"
              label={`${hasErrors ? errors.length : ''}${hasErrors && hasWarnings ? ' | ' : ''}${hasWarnings ? warnings.length : ''}`}
              variant="outlined"
            />
          )}
        </Box>
        
        {onHelp && (
          <Chip
            size="small"
            icon={<HelpIcon fontSize="small" />}
            label="Help"
            variant="outlined"
            clickable
            onClick={onHelp}
          />
        )}
      </Box>

      {/* Field Input Simulation (for demonstration) */}
      <Box
        sx={{
          border: `1px solid`,
          borderColor: statusColor === 'success' ? 'success.main' :
                     statusColor === 'error' ? 'error.main' :
                     statusColor === 'warning' ? 'warning.main' :
                     'divider',
          borderRadius: 1,
          p: 1,
          bgcolor: statusColor === 'success' ? 'success.light' :
                   statusColor === 'error' ? 'error.light' :
                   statusColor === 'warning' ? 'warning.light' :
                   'transparent',
          opacity: status === 'success' ? 0.95 : 1
        }}
      >
        <Typography variant="body2" fontFamily="monospace">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </Typography>
      </Box>

      {/* Inline Error Messages */}
      {showErrorsInline && hasErrors && (
        <Box mt={1}>
          {errors.map((error, index) => (
            <Box key={index} mb={1}>
              <FormHelperText error>
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorIcon color="error" fontSize="small" />
                  <Typography variant="body2">
                    {error.message}
                  </Typography>
                  {onFix && (
                    <Chip
                      size="small"
                      label="Fix"
                      variant="outlined"
                      clickable
                      onClick={() => onFix(error)}
                    />
                  )}
                </Box>
              </FormHelperText>
            </Box>
          ))}
        </Box>
      )}

      {/* Inline Warning Messages */}
      {showWarningsInline && hasWarnings && !hasErrors && (
        <Box mt={1}>
          {warnings.map((warning, index) => (
            <Box key={index} mb={1}>
              <FormHelperText>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography variant="body2">
                    {warning.message}
                  </Typography>
                </Box>
              </FormHelperText>
            </Box>
          ))}
        </Box>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (shouldShowError || shouldShowWarning) && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Suggestions:
          </Typography>
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <Box key={index} mb={0.5}>
              <Typography variant="caption" color="text.secondary" component="div">
                • {suggestion}
              </Typography>
            </Box>
          ))}
          {suggestions.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{suggestions.length - 3} more suggestions
            </Typography>
          )}
        </Box>
      )}

      {/* Default Helper Text */}
      {!shouldShowError && !shouldShowWarning && helperText && (
        <FormHelperText>
          {helperText}
        </FormHelperText>
      )}

      {/* Field Statistics */}
      {(isDirty || isTouched) && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            {isDirty && 'Modified'}{isDirty && isTouched && ' • '}{isTouched && 'Touched'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FieldValidation;