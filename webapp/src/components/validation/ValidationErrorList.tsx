/**
 * Validation Error List Component for Hydraulic Network Web Application
 * 
 * This component provides a detailed list of validation errors and warnings
 * with field-specific information and suggested fixes.
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
  AlertTitle,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Link as LinkIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import { ValidationError, ErrorSeverity } from '../../types/error/errorTypes';

interface ValidationErrorListProps {
  errors: ValidationError[];
  warnings: ValidationError[];
  showFieldNames?: boolean;
  showSeverityIcons?: boolean;
  showSuggestions?: boolean;
  collapsible?: boolean;
  maxItems?: number;
  onFix?: (error: ValidationError) => void;
  onLearnMore?: (error: ValidationError) => void;
  groupByField?: boolean;
}

const ValidationErrorList: React.FC<ValidationErrorListProps> = ({
  errors,
  warnings,
  showFieldNames = true,
  showSeverityIcons = true,
  showSuggestions = true,
  collapsible = false,
  maxItems,
  onFix,
  onLearnMore,
  groupByField = false
}) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Group errors and warnings by field if requested
  const groupByFieldName = (items: ValidationError[]) => {
    if (!groupByField) return { '': items };
    
    const groups: Record<string, ValidationError[]> = {};
    items.forEach(item => {
      const field = item.field || 'General';
      if (!groups[field]) {
        groups[field] = [];
      }
      groups[field].push(item);
    });
    return groups;
  };

  // Get appropriate icon for severity
  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return <ErrorIcon color="error" fontSize="small" />;
      case ErrorSeverity.WARNING:
        return <WarningIcon color="warning" fontSize="small" />;
      case ErrorSeverity.INFO:
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return 'error';
      case ErrorSeverity.WARNING:
        return 'warning';
      case ErrorSeverity.INFO:
      default:
        return 'info';
    }
  };

  const totalErrors = errors.length;
  const totalWarnings = warnings.length;
  const hasErrors = totalErrors > 0;
  const hasWarnings = totalWarnings > 0;

  // Limit items if maxItems is set
  const displayErrors = maxItems ? errors.slice(0, maxItems) : errors;
  const displayWarnings = maxItems ? warnings.slice(0, maxItems) : warnings;

  const errorGroups = groupByFieldName(displayErrors);
  const warningGroups = groupByFieldName(displayWarnings);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderErrorItem = (error: ValidationError, index: number) => {
    const itemId = `error_${index}_${error.field || 'general'}`;
    const isExpanded = expandedItems.has(itemId);

    return (
      <React.Fragment key={index}>
        <ListItem 
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': { borderBottom: 'none' }
          }}
        >
          <ListItemIcon>
            {showSeverityIcons && getSeverityIcon(error.severity)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2">
                  {error.message}
                </Typography>
                <Chip
                  size="small"
                  label={error.severity.toUpperCase()}
                  color={getSeverityColor(error.severity)}
                  variant="outlined"
                />
                {error.field && (
                  <Chip
                    size="small"
                    label={error.field}
                    variant="outlined"
                  />
                )}
              </Box>
            }
            secondary={
              error.details && isExpanded ? (
                <Typography variant="body2" color="text.secondary">
                  {typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}
                </Typography>
              ) : undefined
            }
          />
          <ListItemSecondaryAction>
            <Box display="flex" gap={0.5}>
              {error.suggestion && (
                <IconButton
                  edge="end"
                  aria-label={isExpanded ? "hide details" : "show details"}
                  onClick={() => toggleExpanded(itemId)}
                  size="small"
                >
                  {isExpanded ? <ExpandLessIcon /> : <HelpIcon />}
                </IconButton>
              )}
              {onLearnMore && (
                <IconButton
                  edge="end"
                  aria-label="learn more"
                  onClick={() => onLearnMore(error)}
                  size="small"
                >
                  <LinkIcon />
                </IconButton>
              )}
              {onFix && (
                <Button
                  size="small"
                  onClick={() => onFix(error)}
                  variant="outlined"
                >
                  Fix
                </Button>
              )}
            </Box>
          </ListItemSecondaryAction>
        </ListItem>

        {error.suggestion && isExpanded && (
          <Box ml={6} mb={2} mr={2}>
            <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
              <AlertTitle>Suggestion</AlertTitle>
              {error.suggestion}
            </Alert>
          </Box>
        )}
      </React.Fragment>
    );
  };

  const renderGroup = (groupName: string, items: ValidationError[], type: 'error' | 'warning') => {
    if (items.length === 0) return null;

    const icon = type === 'error' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />;
    const color = type === 'error' ? 'error' : 'warning';

    return (
      <Box key={groupName} mb={3}>
        {groupByField && (
          <Typography variant="subtitle2" gutterBottom>
            {icon} {groupName} ({items.length})
          </Typography>
        )}
        <List dense>
          {items.map((item, index) => renderErrorItem(item, index + (type === 'error' ? 0 : 1000)))}
        </List>
      </Box>
    );
  };

  if (!hasErrors && !hasWarnings) {
    return (
      <Box p={3} textAlign="center" bgcolor="rgba(0,0,0,0.02)" borderRadius={1}>
        <Typography color="text.secondary">
          No validation errors or warnings to display.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {collapsible ? (
        <>
          {hasErrors && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorIcon color="error" />
                  <Typography variant="subtitle1">
                    Errors ({totalErrors})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(errorGroups).map(([groupName, items]) => 
                  renderGroup(groupName, items, 'error')
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {hasWarnings && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon color="warning" />
                  <Typography variant="subtitle1">
                    Warnings ({totalWarnings})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(warningGroups).map(([groupName, items]) => 
                  renderGroup(groupName, items, 'warning')
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      ) : (
        <Box>
          {hasErrors && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="error.main">
                Validation Errors ({totalErrors})
              </Typography>
              {Object.entries(errorGroups).map(([groupName, items]) => 
                renderGroup(groupName, items, 'error')
              )}
            </Box>
          )}

          {hasWarnings && (
            <Box>
              <Typography variant="h6" gutterBottom color="warning.main">
                Validation Warnings ({totalWarnings})
              </Typography>
              {Object.entries(warningGroups).map(([groupName, items]) => 
                renderGroup(groupName, items, 'warning')
              )}
            </Box>
          )}
        </Box>
      )}

      {maxItems && (errors.length > maxItems || warnings.length > maxItems) && (
        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Showing {maxItems} of {totalErrors + totalWarnings} issues
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ValidationErrorList;