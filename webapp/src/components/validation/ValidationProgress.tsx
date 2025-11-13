/**
 * Validation Progress Component for Hydraulic Network Web Application
 * 
 * This component provides a visual progress indicator for validation operations
 * with real-time feedback and performance metrics.
 */

import React from 'react';
import { 
  Box,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

interface ValidationProgressProps {
  progress: number;
  totalSteps: number;
  currentStep: number;
  currentStepName?: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'warning';
  errors?: number;
  warnings?: number;
  startTime?: Date;
  estimatedTimeRemaining?: number;
  showPerformanceMetrics?: boolean;
  showStepDetails?: boolean;
  fullWidth?: boolean;
}

const ValidationProgress: React.FC<ValidationProgressProps> = ({
  progress,
  totalSteps,
  currentStep,
  currentStepName,
  status,
  errors = 0,
  warnings = 0,
  startTime,
  estimatedTimeRemaining,
  showPerformanceMetrics = true,
  showStepDetails = true,
  fullWidth = true
}) => {
  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!startTime) return 0;
    return Date.now() - startTime.getTime();
  };

  const elapsedMillis = getElapsedTime();
  const elapsedSeconds = Math.floor(elapsedMillis / 1000);
  const formattedTime = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { color: 'success', icon: <CheckCircleIcon /> };
      case 'error':
        return { color: 'error', icon: <ErrorIcon /> };
      case 'warning':
        return { color: 'warning', icon: <WarningIcon /> };
      case 'running':
      case 'idle':
      default:
        return { color: 'info', icon: <InfoIcon /> };
    }
  };

  const statusConfig = getStatusConfig();
  const isCompleted = status === 'completed';
  const isInProgress = status === 'running';

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!startTime || !isCompleted) return null;
    
    const totalTime = elapsedSeconds;
    const stepsPerSecond = totalSteps > 0 ? totalSteps / totalTime : 0;
    
    return {
      totalTime,
      stepsPerSecond,
      averageTimePerStep: totalTime / totalSteps
    };
  };

  const performance = getPerformanceMetrics();

  return (
    <Card 
      variant="outlined"
      sx={{ 
        ...(fullWidth && { width: '100%' }),
        backgroundColor: status === 'completed' ? 'rgba(76, 175, 80, 0.05)' :
                      status === 'error' ? 'rgba(244, 67, 54, 0.05)' :
                      status === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                      'transparent'
      }}
    >
      <CardContent>
        {/* Progress Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {statusConfig.icon}
            <Typography variant="h6">
              {status === 'completed' ? 'Validation Complete' : 
               status === 'error' ? 'Validation Error' :
               status === 'warning' ? 'Validation Warning' :
               'Validating Configuration'}
            </Typography>
            <Chip
              label={status.toUpperCase()}
              color={statusConfig.color as any}
              size="small"
              variant="outlined"
            />
          </Box>
          
          {isInProgress && (
            <Typography variant="body2" color="text.secondary">
              {formattedTime}
            </Typography>
          )}
        </Box>

        {/* Progress Bar */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {currentStepName || `Step ${currentStep} of ${totalSteps}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant={isInProgress ? "determinate" : "indeterminate"}
            value={progress} 
            color={statusConfig.color as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Step Details */}
        {showStepDetails && isInProgress && (
          <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
            <AlertTitle>Current Progress</AlertTitle>
            <Typography variant="body2">
              Processing: <strong>{currentStepName || `Step ${currentStep}`}</strong>
            </Typography>
            <Typography variant="body2">
              Progress: {currentStep} of {totalSteps} steps completed
            </Typography>
            {estimatedTimeRemaining && (
              <Typography variant="body2">
                Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 1000)} seconds
              </Typography>
            )}
          </Alert>
        )}

        {/* Status Summary */}
        {(isCompleted || status === 'error' || status === 'warning') && (
          <Alert 
            severity={statusConfig.color as any}
            variant="outlined" 
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {isCompleted ? 'Validation Summary' : 
               status === 'error' ? 'Validation Failed' :
               'Validation Completed with Warnings'}
            </AlertTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Steps completed:</strong> {totalSteps}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Duration:</strong> {formattedTime}
                </Typography>
              </Grid>
              {errors > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="error.main">
                    <strong>Errors:</strong> {errors}
                  </Typography>
                </Grid>
              )}
              {warnings > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="warning.main">
                    <strong>Warnings:</strong> {warnings}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Alert>
        )}

        {/* Performance Metrics */}
        {showPerformanceMetrics && performance && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Performance Metrics:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={4}>
                <Chip
                  icon={<TimerIcon />}
                  label={`${performance.totalTime}s total`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  icon={<SpeedIcon />}
                  label={`${performance.stepsPerSecond.toFixed(2)} steps/s`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={`${performance.averageTimePerStep.toFixed(2)}s/step`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationProgress;