import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Alert,
  Collapse,
  IconButton,
  Grid,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Cancel,
  Refresh,
  Download,
  Timer,
  Security,
  Settings,
  CloudUpload,
  FileDownload,
} from '@mui/icons-material';

import type { ExportJob, ExportStatus } from './types';

interface ExportProgressProps {
  job: ExportJob & { currentStep?: string; message?: string };
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

const getStatusIcon = (status: ExportStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case 'failed':
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    case 'cancelled':
      return <Cancel sx={{ color: 'warning.main' }} />;
    case 'processing':
      return <Timer sx={{ color: 'info.main' }} />;
    case 'pending':
    default:
      return <Info sx={{ color: 'info.main' }} />;
  }
};

const getStatusColor = (status: ExportStatus) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'warning';
    case 'processing':
      return 'info';
    case 'pending':
    default:
      return 'info';
  };
};

const getStepIcon = (step: string, status: 'pending' | 'active' | 'completed' | 'failed') => {
  const iconProps = {
    fontSize: 'small' as const,
  };

  switch (step) {
    case 'validation':
      return status === 'completed' ? (
        <Security sx={{ color: 'success.main', ...iconProps }} />
      ) : (
        <Security sx={{ color: status === 'failed' ? 'error.main' : 'text.disabled', ...iconProps }} />
      );
    case 'processing':
      return status === 'completed' ? (
        <Settings sx={{ color: 'success.main', ...iconProps }} />
      ) : (
        <Settings sx={{ color: status === 'failed' ? 'error.main' : 'text.disabled', ...iconProps }} />
      );
    case 'formatting':
      return status === 'completed' ? (
        <CloudUpload sx={{ color: 'success.main', ...iconProps }} />
      ) : (
        <CloudUpload sx={{ color: status === 'failed' ? 'error.main' : 'text.disabled', ...iconProps }} />
      );
    case 'delivery':
      return status === 'completed' ? (
        <FileDownload sx={{ color: 'success.main', ...iconProps }} />
      ) : (
        <FileDownload sx={{ color: status === 'failed' ? 'error.main' : 'text.disabled', ...iconProps }} />
      );
    default:
      return status === 'completed' ? (
        <Info sx={{ color: 'success.main', ...iconProps }} />
      ) : (
        <Info sx={{ color: status === 'failed' ? 'error.main' : 'text.disabled', ...iconProps }} />
      );
  }
};

const exportSteps = [
  { id: 'validation', name: 'Validating options' },
  { id: 'processing', name: 'Processing data' },
  { id: 'formatting', name: 'Formatting document' },
  { id: 'delivery', name: 'Preparing download' },
];

export const ExportProgress: React.FC<ExportProgressProps> = ({
  job,
  onCancel,
  onRetry,
  onDownload,
  showDetails = true,
  compact = false,
}) => {
  const getStatusText = (status: ExportStatus): string => {
    switch (status) {
      case 'pending':
        return 'Waiting to start';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed successfully';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getProgressValue = (status: ExportStatus, progress: number): number => {
    if (status === 'completed') return 100;
    if (status === 'failed' || status === 'cancelled') return 0;
    return progress;
  };

  const getCurrentStep = (status: ExportStatus, currentStep: string): string => {
    if (status === 'completed') return 'Completed';
    if (status === 'failed' || status === 'cancelled') return currentStep;
    return currentStep || 'Processing';
  };

  const getStepStatus = (stepId: string, currentStep: string, status: ExportStatus): 'pending' | 'active' | 'completed' | 'failed' => {
    if (status === 'completed') {
      return stepId === 'delivery' ? 'completed' : 'completed';
    }
    if (status === 'failed' || status === 'cancelled') {
      return stepId === currentStep ? 'failed' : 'pending';
    }
    if (status === 'processing') {
      const currentStepIndex = exportSteps.findIndex(step => step.id === currentStep);
      const stepIndex = exportSteps.findIndex(step => step.id === stepId);
      
      if (stepIndex < currentStepIndex) return 'completed';
      if (stepIndex === currentStepIndex) return 'active';
      return 'pending';
    }
    return 'pending';
  };

  const formatDuration = (startTime?: Date, endTime?: Date): string => {
    if (!startTime) return 'N/A';
    
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const canDownload = job.status === 'completed' && job.downloadUrl;
  const canRetry = job.status === 'failed' && job.retryCount < 3;
  const canCancel = job.status === 'processing';

  return (
    <Card variant={compact ? 'outlined' : 'elevation'}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(job.status)}
            <Typography variant="h6">
              Export Progress
            </Typography>
            <Chip
              size="small"
              label={getStatusText(job.status)}
              color={getStatusColor(job.status)}
              variant="outlined"
            />
          </Box>
        }
        action={
          !compact && (
            <Box display="flex" gap={1}>
              {canCancel && (
                <Tooltip title="Cancel export">
                  <IconButton size="small" onClick={() => onCancel?.(job.id)}>
                    <Cancel />
                  </IconButton>
                </Tooltip>
              )}
              {canRetry && (
                <Tooltip title="Retry export">
                  <IconButton size="small" onClick={() => onRetry?.(job.id)}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}
              {canDownload && (
                <Tooltip title="Download file">
                  <IconButton size="small" onClick={() => onDownload?.(job.id)}>
                    <Download />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      />
      
      <CardContent>
        <Grid container spacing={2}>
          {/* Progress Bar */}
          <Grid item xs={12}>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  {getCurrentStep(job.status, job.currentStep || 'Processing')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getProgressValue(job.status, job.progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgressValue(job.status, job.progress)}
                color={getStatusColor(job.status)}
              />
            </Box>
          </Grid>

          {/* Duration and File Info */}
          {!compact && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body2">
                    {formatDuration(job.createdAt, job.completedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    File Size
                  </Typography>
                  <Typography variant="body2">
                    {job.fileSize ? `${(job.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Detailed Steps */}
          {showDetails && !compact && (
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom fontWeight="bold">
                Processing Steps
              </Typography>
              <List dense>
                {exportSteps.map((step) => {
                  const stepStatus = getStepStatus(step.id, job.currentStep || 'validation', job.status);
                  return (
                    <ListItem key={step.id} dense>
                      <ListItemIcon>
                        {getStepIcon(step.id, stepStatus)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: stepStatus === 'active' ? 'bold' : 'normal' }}>
                            {step.name}
                          </Typography>
                        }
                        secondary={
                          stepStatus === 'completed' ? (
                            <Typography variant="caption" sx={{ color: 'success.main' }}>
                              Completed
                            </Typography>
                          ) : stepStatus === 'failed' ? (
                            <Typography variant="caption" sx={{ color: 'error.main' }}>
                              Failed
                            </Typography>
                          ) : stepStatus === 'active' ? (
                            <Typography variant="caption" sx={{ color: 'info.main' }}>
                              In progress
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Pending
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Grid>
          )}

          {/* Error Information */}
          {job.status === 'failed' && job.error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Error Details
                </Typography>
                <Typography variant="body2">
                  {job.error}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Warning Information */}
          {job.status === 'cancelled' && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  This export was cancelled. You can start a new export or retry this one.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Success Information */}
          {job.status === 'completed' && (
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Export completed successfully! The file is ready for download.
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Actions */}
          {!compact && (
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="space-between" mt={2}>
                {onCancel && canCancel && (
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => onCancel(job.id)}
                  >
                    Cancel
                  </Button>
                )}
                
                {onRetry && canRetry && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Refresh />}
                    onClick={() => onRetry(job.id)}
                  >
                    Retry Export
                  </Button>
                )}
                
                {onDownload && canDownload && (
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => onDownload(job.id)}
                  >
                    Download File
                  </Button>
                )}
                
                {job.downloadUrl && (
                  <Button
                    variant="text"
                    onClick={() => {
                      if (job.downloadUrl) {
                        window.open(job.downloadUrl, '_blank');
                      }
                    }}
                  >
                    View Online
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Compact version for dashboard widgets
export const CompactExportProgress: React.FC<{
  job: ExportJob & { currentStep?: string };
  onClick?: () => void;
}> = ({ job, onClick }) => {
  const getStatusText = (status: ExportStatus): string => {
    switch (status) {
      case 'pending':
        return 'Waiting to start';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed successfully';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getProgressValue = (status: ExportStatus, progress: number): number => {
    if (status === 'completed') return 100;
    if (status === 'failed' || status === 'cancelled') return 0;
    return progress;
  };

  return (
    <Card variant="outlined" sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ 
            bgcolor: getStatusColor(job.status) === 'success' ? 'success.main' : 
                     getStatusColor(job.status) === 'error' ? 'error.main' : 
                     getStatusColor(job.status) === 'warning' ? 'warning.main' : 'info.main',
            width: 32, 
            height: 32 
          }}>
            {getStatusIcon(job.status)}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="body2" fontWeight="bold">
              {job.fileName || 'Export Job'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {getStatusText(job.status)}
            </Typography>
          </Box>
          
          <Box textAlign="right">
            <Typography variant="body2" fontWeight="bold">
              {getProgressValue(job.status, job.progress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getProgressValue(job.status, job.progress)}
              color={getStatusColor(job.status)}
              sx={{ width: 60, mt: 0.5 }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExportProgress;