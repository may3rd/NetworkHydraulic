import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useForm, FormProvider, useController } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ValidationError, ValidationWarning } from './FilePreview';

interface FormValidationProps {
  schema: yup.Schema<any>;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  onError?: (errors: any) => void;
  children: React.ReactNode;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  disabled?: boolean;
  showValidationSummary?: boolean;
  showFieldErrors?: boolean;
 实时Validation?: boolean;
}

interface ValidationSummaryProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
  onRetry?: () => void;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  warnings,
  isValid,
  onRetry
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getStatus = () => {
    if (isValid) {
      return { 
        severity: 'success' as const, 
        icon: <SuccessIcon />, 
        title: 'Validation Passed',
        message: 'Form is valid and ready to submit'
      };
    } else if (errors.length > 0) {
      return { 
        severity: 'error' as const, 
        icon: <ErrorIcon />, 
        title: 'Validation Failed',
        message: `${errors.length} error(s) found`
      };
    } else if (warnings.length > 0) {
      return { 
        severity: 'warning' as const, 
        icon: <WarningIcon />, 
        title: 'Validation Warnings',
        message: `${warnings.length} warning(s) found`
      };
    }
    return { 
      severity: 'info' as const, 
      icon: <InfoIcon />, 
      title: 'Validation Info',
      message: 'Please review the form'
    };
  };

  const status = getStatus();

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        avatar={status.icon}
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1">
              {status.title}
            </Typography>
            <Chip
              size="small"
              label={isValid ? 'Valid' : 'Invalid'}
              color={status.severity}
            />
          </Box>
        }
        subheader={status.message}
        action={
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-label="expand/collapse"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
        sx={{ pb: 0 }}
      />
      
      <Collapse in={expanded} timeout="auto">
        <CardContent>
          {/* Errors */}
          {errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="error.main">
                Errors ({errors.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Suggestion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {error.field}
                      </TableCell>
                      <TableCell>{error.message}</TableCell>
                      <TableCell>{error.suggestion || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="warning.main">
                Warnings ({warnings.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Suggestion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warnings.map((warning, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {warning.field}
                      </TableCell>
                      <TableCell>{warning.message}</TableCell>
                      <TableCell>{warning.suggestion || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Actions */}
          {onRetry && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Fix the errors above to enable submission
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={onRetry}
                startIcon={<RefreshIcon />}
              >
                Retry Validation
              </Button>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

const FormValidation: React.FC<FormValidationProps> = ({
  schema,
  defaultValues = {},
  onSubmit,
  onError,
  children,
  mode = 'onChange',
  disabled = false,
  showValidationSummary = true,
  showFieldErrors = true,
 实时Validation = true
}) => {
  const [validationResults, setValidationResults] = React.useState<{
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }>({
    isValid: false,
    errors: [],
    warnings: []
  });

  const methods = useForm({
    resolver: yupResolver(schema as any),
    defaultValues,
    mode: mode as any,
    reValidateMode: mode as any
  });

  const {
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty, submitCount },
    watch,
    trigger
  } = methods;

  // Watch all form values for real-time validation
  const formValues = watch();

  // Perform real-time validation when values change
  React.useEffect(() => {
    if (实时Validation && isDirty) {
      const validateForm = async () => {
        try {
          await trigger(); // Trigger validation for all fields
          
          // Convert react-hook-form errors to our validation format
          const formErrors: ValidationError[] = [];
          const formWarnings: ValidationWarning[] = [];
          
          const processErrors = (errorObj: any, path = '') => {
            for (const [key, error] of Object.entries(errorObj)) {
              const fieldPath = path ? `${path}.${key}` : key;
              
              if (error && typeof error === 'object' && 'message' in error) {
                formErrors.push({
                  field: fieldPath,
                  message: error.message as string,
                  severity: 'error',
                  suggestion: getSuggestionForKey(key)
                });
              } else if (typeof error === 'object') {
                processErrors(error, fieldPath);
              }
            }
          };
          
          processErrors(errors);
          
          setValidationResults({
            isValid: formErrors.length === 0,
            errors: formErrors,
            warnings: formWarnings
          });
        } catch (error) {
          console.error('Validation error:', error);
        }
      };
      
      const debounceTimer = setTimeout(validateForm, 300); // Debounce for performance
      return () => clearTimeout(debounceTimer);
    }
  }, [formValues, trigger, isDirty,实时Validation]);

  // Handle form submission
  const onFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  const getSuggestionForKey = (key: string): string => {
    const suggestions: Record<string, string> = {
      name: 'Enter a descriptive name',
      phase: 'Select the appropriate fluid phase',
      temperature: 'Enter temperature in Kelvin',
      pressure: 'Enter pressure in Pascals',
      density: 'Enter density in kg/m³',
      molecularWeight: 'Enter molecular weight in kg/kmol',
      viscosity: 'Enter viscosity in Pa·s',
      length: 'Enter length in meters',
      diameter: 'Enter diameter in meters',
      roughness: 'Enter roughness in meters',
      elevationChange: 'Enter elevation change in meters',
      fittings: 'Select appropriate fittings for the section'
    };
    
    return suggestions[key] || 'Please check this field';
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        {/* Validation Summary */}
        {showValidationSummary && (
          <ValidationSummary
            errors={validationResults.errors}
            warnings={validationResults.warnings}
            isValid={validationResults.isValid}
            onRetry={() => trigger()}
          />
        )}

        {/* Form Content */}
        <Box>
          {children}
          
          {/* Submit Button */}
          <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              {isSubmitting && <LinearProgress />}
              <Typography variant="body2" color="text.secondary">
                {isDirty && `Last updated: ${new Date().toLocaleTimeString()}`}
              </Typography>
            </Box>
            
            <Button
              type="submit"
              variant="contained"
              disabled={!validationResults.isValid || disabled || isSubmitting}
              size="large"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </form>
    </FormProvider>
  );
};

// Hook for creating controlled form fields with validation
export const useValidatedField = (
  name: string,
  validationSchema: yup.Schema<any>,
  options: {
    label?: string;
    helperText?: string;
    required?: boolean;
    disabled?: boolean;
  } = {}
) => {
  const { label, helperText, required, disabled } = options;
  
  const controller = useController({
    name,
    rules: {
      validate: async (value: any) => {
        try {
          await validationSchema.validateAt(name, { [name]: value });
          return true;
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            return error.message;
          }
          return 'Validation failed';
        }
      }
    }
  });

  const getFieldProps = () => ({
    ...controller.field,
    label,
    required,
    disabled,
    error: !!controller.fieldState.error,
    helperText: controller.fieldState.error?.message || helperText
  });

  return {
    ...controller,
    getFieldProps,
    hasError: !!controller.fieldState.error
  };
};

export default FormValidation;