import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Grid,
} from '@mui/material';
import {
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedDuration?: number;
  actualDuration?: number;
}

interface ProgressIndicatorProps {
  progress: number;
  message: string;
  stage: string;
  stages?: ProgressStage[];
  startTime?: Date;
  estimatedTime?: number;
  showDetailedStages?: boolean;
  showElapsedTime?: boolean;
  showEstimatedTime?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  stage,
  stages = [],
  startTime,
  estimatedTime,
  showDetailedStages = true,
  showElapsedTime = true,
  showEstimatedTime = true,
}) => {
  const calculateElapsedTime = () => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'running':
        return <UpdateIcon color="primary" />;
      default:
        return <HourglassIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Calculation Progress
        </Typography>
        
        {/* Main progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>

        {/* Current stage */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Stage:
          </Typography>
          <Chip
            label={stage}
            icon={<UpdateIcon />}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Time information */}
        {(showElapsedTime || showEstimatedTime) && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {showElapsedTime && startTime && (
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  Elapsed: {formatTime(calculateElapsedTime())}
                </Typography>
              </Grid>
            )}
            {showEstimatedTime && estimatedTime && (
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  Estimated: {formatTime(estimatedTime)}
                </Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* Detailed stages */}
        {showDetailedStages && stages.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Detailed Progress:
            </Typography>
            {stages.map((stageItem) => (
              <Box
                key={stageItem.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                  px: 2,
                  mb: 1,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {getStageIcon(stageItem.status)}
                <Box sx={{ ml: 1, flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {stageItem.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stageItem.description}
                  </Typography>
                </Box>
                <Chip
                  label={stageItem.status}
                  color={getStatusColor(stageItem.status) as any}
                  size="small"
                  variant="outlined"
                />
                {stageItem.progress > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {stageItem.progress.toFixed(1)}%
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Status alerts */}
        {progress === 100 && (
          <Alert severity="success" icon={<CheckIcon />}>
            Calculation completed successfully!
          </Alert>
        )}
        
        {progress < 100 && progress > 0 && (
          <Alert severity="info" icon={<UpdateIcon />}>
            Calculation is in progress. Please wait...
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};