/**
 * Error Summary Component for Hydraulic Network Web Application
 * 
 * This component provides a summary view of multiple errors with
 * categorization, filtering, and action buttons.
 */

import React, { useState } from 'react';
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
  Divider,
  Badge,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ReportProblem as CriticalIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorCategory } from '../../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../../types/error/severityLevels';

interface ErrorSummaryProps {
  errors: BaseError[];
  onDismiss?: (error: BaseError) => void;
  onRetry?: (error: BaseError) => void;
  onShowDetails?: (error: BaseError) => void;
  showCategoryFilter?: boolean;
  showSeverityFilter?: boolean;
  maxErrorsToShow?: number;
  collapsible?: boolean;
  showCounts?: boolean;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  onDismiss,
  onRetry,
  onShowDetails,
  showCategoryFilter = true,
  showSeverityFilter = true,
  maxErrorsToShow = 10,
  collapsible = false,
  showCounts = true
}) => {
  const [expanded, setExpanded] = useState(!collapsible);
  const [selectedSeverities, setSelectedSeverities] = useState<ErrorSeverity[]>([
    ErrorSeverity.ERROR, ErrorSeverity.WARNING, ErrorSeverity.CRITICAL
  ]);
  const [selectedCategories, setSelectedCategories] = useState<ErrorCategory[]>([]);

  // Filter errors based on selected criteria
  const filteredErrors = errors.filter(error => {
    const severityMatch = selectedSeverities.length === 0 || selectedSeverities.includes(error.severity);
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(error.category as ErrorCategory);
    return severityMatch && categoryMatch;
  });

  // Get error counts by severity
  const getErrorCounts = () => {
    const counts = {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.INFO]: 0
    };
    
    errors.forEach(error => {
      counts[error.severity]++;
    });
    
    return counts;
  };

  // Get error counts by category
  const getErrorCountsByCategory = () => {
    const counts: Record<string, number> = {};
    
    errors.forEach(error => {
      counts[error.category] = (counts[error.category] || 0) + 1;
    });
    
    return counts;
  };

  // Get appropriate icon for severity
  const getSeverityIcon = (severity: ErrorSeverity) => {
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

  const errorCounts = getErrorCounts();
  const categoryCounts = getErrorCountsByCategory();

  if (errors.length === 0) {
    return (
      <Box p={3} textAlign="center" bgcolor="rgba(0,0,0,0.02)" borderRadius={1}>
        <Typography color="text.secondary">
          No errors to display
        </Typography>
      </Box>
    );
  }

  const displayErrors = maxErrorsToShow ? filteredErrors.slice(0, maxErrorsToShow) : filteredErrors;

  return (
    <Box>
      {showCounts && (
        <Box mb={2} display="flex" gap={2} flexWrap="wrap">
          {Object.entries(errorCounts).map(([severity, count]) => (
            count > 0 && (
              <Chip
                key={severity}
                label={`${count} ${severity}${count > 1 ? 's' : ''}`}
                icon={getSeverityIcon(severity as ErrorSeverity)}
                color={severity === ErrorSeverity.CRITICAL ? 'error' : 
                       severity === ErrorSeverity.ERROR ? 'error' : 
                       severity === ErrorSeverity.WARNING ? 'warning' : 'info'}
                variant="outlined"
                size="small"
              />
            )
          ))}
        </Box>
      )}

      {showCategoryFilter && Object.keys(categoryCounts).length > 1 && (
        <Box mb={2} display="flex" gap={1} flexWrap="wrap">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <Chip
              key={category}
              label={`${category} (${count})`}
              clickable
              color={selectedCategories.includes(category as ErrorCategory) ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                if (selectedCategories.includes(category as ErrorCategory)) {
                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                } else {
                  setSelectedCategories([...selectedCategories, category as ErrorCategory]);
                }
              }}
            />
          ))}
        </Box>
      )}

      {showSeverityFilter && (
        <Box mb={2} display="flex" gap={1} flexWrap="wrap">
          {Object.entries(errorCounts).map(([severity, count]) => (
            count > 0 && (
              <Chip
                key={severity}
                label={`${severity} (${count})`}
                clickable
                color={selectedSeverities.includes(severity as ErrorSeverity) ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  if (selectedSeverities.includes(severity as ErrorSeverity)) {
                    setSelectedSeverities(selectedSeverities.filter(s => s !== severity));
                  } else {
                    setSelectedSeverities([...selectedSeverities, severity as ErrorSeverity]);
                  }
                }}
              />
            )
          ))}
        </Box>
      )}

      {collapsible ? (
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1">
                Errors ({filteredErrors.length})
              </Typography>
              {filteredErrors.length > 0 && (
                <Badge badgeContent={filteredErrors.length} color="error" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ErrorList 
              errors={displayErrors}
              onDismiss={onDismiss}
              onRetry={onRetry}
              onShowDetails={onShowDetails}
            />
          </AccordionDetails>
        </Accordion>
      ) : (
        <ErrorList 
          errors={displayErrors}
          onDismiss={onDismiss}
          onRetry={onRetry}
          onShowDetails={onShowDetails}
        />
      )}

      {maxErrorsToShow && filteredErrors.length > maxErrorsToShow && (
        <Box mt={1} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Showing {maxErrorsToShow} of {filteredErrors.length} errors
          </Typography>
          <Button size="small" color="primary">
            Show All
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Helper component for rendering error list
const ErrorList: React.FC<{
  errors: BaseError[];
  onDismiss?: (error: BaseError) => void;
  onRetry?: (error: BaseError) => void;
  onShowDetails?: (error: BaseError) => void;
}> = ({ errors, onDismiss, onRetry, onShowDetails }) => {
  return (
    <List dense>
      {errors.map((error, index) => (
        <React.Fragment key={error.id}>
          <ListItem 
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {error.severity === ErrorSeverity.CRITICAL ? (
                    <CriticalIcon fontSize="small" color="error" />
                  ) : error.severity === ErrorSeverity.ERROR ? (
                    <ErrorIcon fontSize="small" color="error" />
                  ) : error.severity === ErrorSeverity.WARNING ? (
                    <WarningIcon fontSize="small" color="warning" />
                  ) : (
                    <InfoIcon fontSize="small" color="info" />
                  )}
                  <Typography variant="subtitle2">
                    {error.code ? `${error.code}: ` : ''}
                    {error.message.split(':')[0]}
                  </Typography>
                  <Chip
                    size="small"
                    label={error.severity.toUpperCase()}
                    color={error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                           error.severity === ErrorSeverity.ERROR ? 'error' : 
                           error.severity === ErrorSeverity.WARNING ? 'warning' : 'info'}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {error.message.split(':')[1] ? error.message.split(':')[1].trim() : error.message}
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <Box display="flex" gap={0.5}>
                {onShowDetails && (
                  <IconButton
                    edge="end"
                    aria-label="show details"
                    onClick={() => onShowDetails?.(error)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                )}
                {onRetry && error.recoverable && (
                  <IconButton
                    edge="end"
                    aria-label="retry"
                    onClick={() => onRetry?.(error)}
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                )}
                {onDismiss && (
                  <IconButton
                    edge="end"
                    aria-label="dismiss"
                    onClick={() => onDismiss?.(error)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};

export default ErrorSummary;