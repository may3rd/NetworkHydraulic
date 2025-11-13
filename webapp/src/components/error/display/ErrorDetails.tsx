/**
 * Error Details Component for Hydraulic Network Web Application
 * 
 * This component provides detailed error information display with
 * technical details, context, and troubleshooting information.
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
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ReportProblem as CriticalIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { ErrorSeverity, BaseError, ErrorContext, ErrorTracking } from '../../../types/error/errorTypes';
import { SEVERITY_LEVELS } from '../../../types/error/severityLevels';

interface ErrorDetailsProps {
  error: BaseError;
  context?: ErrorContext;
  tracking?: ErrorTracking;
  showTechnicalDetails?: boolean;
  showContext?: boolean;
  showActions?: boolean;
  onRetry?: () => void;
  onHelp?: () => void;
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({
  error,
  context,
  tracking,
  showTechnicalDetails = true,
  showContext = true,
  showActions = true,
  onRetry,
  onHelp
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Get appropriate icon for severity
  const getSeverityIcon = () => {
    switch (error.severity) {
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

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp);
  };

  // Format error details for display
  const formatDetails = (details: any) => {
    if (!details) return 'No details available';
    
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return String(details);
    }
  };

  const tabs = [
    { label: 'Overview', icon: getSeverityIcon() },
    ...(showTechnicalDetails ? [{ label: 'Technical', icon: <CodeIcon /> }] : []),
    ...(showContext ? [{ label: 'Context', icon: <SettingsIcon /> }] : []),
    ...(tracking ? [{ label: 'Tracking', icon: <TimelineIcon /> }] : [])
  ];

  const renderOverview = () => (
    <Box>
      <Alert
        severity={error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.ERROR ? 'error' : 
                 error.severity === ErrorSeverity.WARNING ? 'warning' : 'info'}
        variant="outlined"
        sx={{ mb: 3 }}
      >
        <AlertTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getSeverityIcon()}
            <Typography variant="h6" component="span">
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
        </AlertTitle>
        <Typography variant="body1">
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

      {error.userMessage && (
        <Box mb={3} p={2} bgcolor="rgba(255,193,7,0.1)" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            User Message:
          </Typography>
          <Typography variant="body1">
            {error.userMessage}
          </Typography>
        </Box>
      )}

      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Error Information:
        </Typography>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                Error ID
              </TableCell>
              <TableCell>{error.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                Timestamp
              </TableCell>
              <TableCell>{formatTimestamp(error.timestamp)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                Category
              </TableCell>
              <TableCell>
                <Chip 
                  label={error.category} 
                  size="small"
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                Recoverable
              </TableCell>
              <TableCell>
                <Chip 
                  label={error.recoverable ? 'Yes' : 'No'} 
                  color={error.recoverable ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
            {error.code && (
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Error Code
                </TableCell>
                <TableCell>
                  <Chip 
                    label={error.code} 
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {showActions && (onRetry || onHelp) && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Actions:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {onRetry && error.recoverable && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Retry Action
              </Button>
            )}
            {onHelp && (
              <Button
                variant="outlined"
                startIcon={<HelpIcon />}
                onClick={onHelp}
              >
                Get Help
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderTechnicalDetails = () => (
    <Box>
      {error.details && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Technical Details:
          </Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(0,0,0,0.05)', 
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflow: 'auto',
              maxHeight: 400
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {formatDetails(error.details)}
            </pre>
          </Paper>
        </Box>
      )}
    </Box>
  );

  const renderContext = () => (
    <Box>
      {context && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Error Context:
          </Typography>
          <Table size="small">
            <TableBody>
              {context.component && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Component
                  </TableCell>
                  <TableCell>{context.component}</TableCell>
                </TableRow>
              )}
              {context.action && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Action
                  </TableCell>
                  <TableCell>{context.action}</TableCell>
                </TableRow>
              )}
              {context.userId && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    User ID
                  </TableCell>
                  <TableCell>{context.userId}</TableCell>
                </TableRow>
              )}
              {context.url && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    URL
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                      {context.url}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {context.userAgent && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    User Agent
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {context.userAgent}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );

  const renderTracking = () => (
    <Box>
      {tracking && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Error Tracking Information:
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Error ID
                </TableCell>
                <TableCell>{tracking.errorId}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Session ID
                </TableCell>
                <TableCell>{tracking.sessionId}</TableCell>
              </TableRow>
              {tracking.componentStack && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Component Stack
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {tracking.componentStack}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {tracking.errorBoundary && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    Error Boundary
                  </TableCell>
                  <TableCell>{tracking.errorBoundary}</TableCell>
                </TableRow>
              )}
              {tracking.userAction && (
                <TableRow>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    User Action
                  </TableCell>
                  <TableCell>{tracking.userAction}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  Environment
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">URL: {tracking.environment?.url || 'Unknown'}</Typography>
                    <Typography variant="body2">Timestamp: {tracking.environment?.timestamp ? formatTimestamp(tracking.environment.timestamp) : 'Unknown'}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderOverview();
      case 1:
        return renderTechnicalDetails();
      case 2:
        return renderContext();
      case 3:
        return renderTracking();
      default:
        return renderOverview();
    }
  };

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            sx={{ textTransform: 'none' }}
          />
        ))}
      </Tabs>
      
      <Divider />
      
      <Box p={3}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default ErrorDetails;