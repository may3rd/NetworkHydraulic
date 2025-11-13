import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useCalculationStore } from '../../stores/calculation';

interface StatusMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  details?: string;
}

interface ExecutionStatusProps {
  messages: StatusMessage[];
  onClearMessages?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  autoHideErrors?: boolean;
  maxMessages?: number;
}

export const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  messages = [],
  onClearMessages,
  onRetry,
  showDetails = true,
  autoHideErrors = false,
  maxMessages = 50,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [hiddenErrors, setHiddenErrors] = React.useState<Set<string>>(new Set());

  const status = useCalculationStore((state) => state.status);
  const progress = useCalculationStore((state) => state.progress);
  const error = useCalculationStore((state) => state.error);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleHideError = (messageId: string) => {
    setHiddenErrors(prev => new Set([...prev, messageId]));
  };

  const handleClearAllMessages = () => {
    onClearMessages?.();
    setHiddenErrors(new Set());
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'running':
        return {
          text: 'Calculation Running',
          color: 'primary' as const,
          icon: <TimerIcon color="primary" />,
          chipColor: 'primary' as const,
        };
      case 'completed':
        return {
          text: 'Calculation Completed',
          color: 'success' as const,
          icon: <CheckIcon color="success" />,
          chipColor: 'success' as const,
        };
      case 'error':
        return {
          text: 'Calculation Failed',
          color: 'error' as const,
          icon: <ErrorIcon color="error" />,
          chipColor: 'error' as const,
        };
      default:
        return {
          text: 'Ready to Calculate',
          color: 'default' as const,
          icon: <InfoIcon color="disabled" />,
          chipColor: 'default' as const,
        };
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'success':
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

  // Filter out hidden errors if auto-hide is enabled
  const visibleMessages = autoHideErrors 
    ? messages.filter(msg => !(hiddenErrors.has(msg.id) && msg.type === 'error'))
    : messages;

  // Get recent messages (up to maxMessages)
  const recentMessages = visibleMessages.slice(-maxMessages);

  const renderStatusAlert = () => {
    const statusInfo = getStatusInfo();
    
    if (status === 'error' && error) {
      return (
        <Alert
          severity="error"
          icon={statusInfo.icon}
          action={
            onRetry && (
              <IconButton size="small" onClick={onRetry} color="error">
                <RefreshIcon />
              </IconButton>
            )
          }
          sx={{ mb: 2 }}
        >
          <Typography variant="body1">
            {error}
          </Typography>
        </Alert>
      );
    }

    if (status === 'completed') {
      return (
        <Alert
          severity="success"
          icon={statusInfo.icon}
          sx={{ mb: 2 }}
        >
          <Typography variant="body1">
            Calculation completed successfully with {recentMessages.filter(m => m.type === 'success').length} success messages.
          </Typography>
        </Alert>
      );
    }

    if (status === 'running') {
      return (
        <Alert
          severity="info"
          icon={statusInfo.icon}
          sx={{ mb: 2 }}
        >
          <Typography variant="body1">
            Calculation is running ({progress.toFixed(1)}%). Please wait...
          </Typography>
        </Alert>
      );
    }

    return (
      <Alert
        severity="info"
        icon={statusInfo.icon}
        sx={{ mb: 2 }}
      >
        <Typography variant="body1">
          Ready to start calculation.
        </Typography>
      </Alert>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusInfo().icon}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Execution Status
            </Typography>
            <Chip
              label={getStatusInfo().text}
              color={getStatusInfo().chipColor}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {recentMessages.length > 0 && (
              <Badge badgeContent={recentMessages.length} color="primary">
                <IconButton size="small" onClick={handleToggleExpand} aria-label="show messages">
                  <ExpandIcon 
                    sx={{ 
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </IconButton>
              </Badge>
            )}
            {recentMessages.length > 0 && (
              <IconButton size="small" onClick={handleClearAllMessages} aria-label="clear messages">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {renderStatusAlert()}

        {showDetails && recentMessages.length > 0 && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recent Messages
              </Typography>
              <List dense>
                {recentMessages.map((message, index) => (
                  <ListItem key={message.id} alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemIcon>
                      {getSeverityIcon(message.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color={`${getSeverityColor(message.type)}.main`}>
                          {message.message}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                          {message.details && (
                            <Typography variant="body2" color="text.secondary" component="div">
                              {message.details}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    {message.type === 'error' && (
                      <IconButton
                        size="small"
                        onClick={() => handleHideError(message.id)}
                        aria-label="hide error"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          </Collapse>
        )}

        {showDetails && recentMessages.length === 0 && expanded && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No messages to display.
              </Typography>
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};