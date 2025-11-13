import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Button,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { ValidationResult, ValidationError } from '../../types/models';

interface ValidationPanelProps {
  validationResult: ValidationResult | null;
  onValidate?: () => Promise<void>;
  onFixError?: (error: ValidationError) => void;
  showDetails?: boolean;
  autoValidate?: boolean;
  disabled?: boolean;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResult,
  onValidate,
  onFixError,
  showDetails = true,
  autoValidate = false,
  disabled = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleValidate = async () => {
    onValidate?.();
  };

  const getValidationStatus = () => {
    if (!validationResult) {
      return { status: 'unknown', color: 'default' as const };
    }
    if (!validationResult.isValid) {
      return { status: 'invalid', color: 'error' as const };
    }
    if (validationResult.warnings.length > 0) {
      return { status: 'warnings', color: 'warning' as const };
    }
    return { status: 'valid', color: 'success' as const };
  };

  const getStatusIcon = () => {
    const { status } = getValidationStatus();
    switch (status) {
      case 'valid':
        return <CheckIcon color="success" />;
      case 'invalid':
        return <ErrorIcon color="error" />;
      case 'warnings':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const renderErrorItem = (error: ValidationError, index: number) => (
    <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
      <ListItemIcon>
        <ErrorIcon color="error" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" color="error.main" fontWeight="medium">
            {error.field ? `${error.field}:` : ''} {error.message}
          </Typography>
        }
        secondary={
          error.suggestion && (
            <Typography variant="caption" color="text.secondary">
              Suggestion: {error.suggestion}
            </Typography>
          )
        }
      />
      {onFixError && error.suggestion && (
        <Button
          size="small"
          onClick={() => onFixError(error)}
          color="error"
          variant="outlined"
        >
          Fix
        </Button>
      )}
    </ListItem>
  );

  const renderWarningItem = (warning: any, index: number) => (
    <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
      <ListItemIcon>
        <WarningIcon color="warning" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" color="warning.main" fontWeight="medium">
            {warning.field ? `${warning.field}:` : ''} {warning.message}
          </Typography>
        }
        secondary={
          warning.suggestion && (
            <Typography variant="caption" color="text.secondary">
              Note: {warning.suggestion}
            </Typography>
          )
        }
      />
    </ListItem>
  );

  const renderValidationSummary = () => {
    if (!validationResult) {
      return (
        <Alert severity="info" icon={<InfoIcon />}>
          No validation performed yet. Click "Validate" to check configuration.
        </Alert>
      );
    }

    const { isValid, errors, warnings } = validationResult;
    
    if (isValid && errors.length === 0 && warnings.length === 0) {
      return (
        <Alert severity="success" icon={<CheckIcon />}>
          Configuration is valid with no warnings.
        </Alert>
      );
    }

    const errorCount = errors.length;
    const warningCount = warnings.length;

    return (
      <Alert 
        severity={isValid ? "warning" : "error"}
        icon={isValid ? <WarningIcon /> : <ErrorIcon />}
        action={
          <Chip 
            label={`${errorCount} errors, ${warningCount} warnings`}
            size="small"
            color={isValid ? "warning" : "error"}
          />
        }
      >
        {isValid 
          ? `Configuration is valid but has ${warningCount} warning(s).`
          : `Configuration has ${errorCount} error(s) that must be fixed.`
        }
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getStatusIcon()}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Configuration Validation
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleValidate}
                disabled={disabled}
                size="small"
                variant="outlined"
              >
                Validate
              </Button>
              {showDetails && validationResult && (
                <IconButton
                  size="small"
                  onClick={handleToggleExpand}
                  aria-label="expand"
                >
                  <ExpandIcon 
                    sx={{ 
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      
      <CardContent>
        {renderValidationSummary()}
        
        {showDetails && validationResult && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              {/* Errors section */}
              {validationResult.errors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Errors ({validationResult.errors.length})
                  </Typography>
                  <List dense>
                    {validationResult.errors.map((error, index) => 
                      renderErrorItem(error, index)
                    )}
                  </List>
                </Box>
              )}
              
              {/* Warnings section */}
              {validationResult.warnings.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Warnings ({validationResult.warnings.length})
                  </Typography>
                  <List dense>
                    {validationResult.warnings.map((warning, index) => 
                      renderWarningItem(warning, index)
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};