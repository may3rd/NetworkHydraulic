import React from 'react';
import { Box, Button, ButtonGroup, Typography, Chip, Tooltip } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useCalculationStore } from '../../stores/calculation';

interface SolverControlsProps {
  onValidate?: () => Promise<boolean>;
  onCalculate?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  onPause?: () => void;
  onResume?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  disabled?: boolean;
}

export const SolverControls: React.FC<SolverControlsProps> = ({
  onValidate,
  onCalculate,
  onCancel,
  onPause,
  onResume,
  onRetry,
  disabled = false,
}) => {
  const status = useCalculationStore((state) => state.status);
  const progress = useCalculationStore((state) => state.progress);
  const error = useCalculationStore((state) => state.error);

  const handleStartCalculation = async () => {
    if (onValidate) {
      const isValid = await onValidate();
      if (!isValid) return;
    }
    onCalculate?.();
  };

  const handleCancelCalculation = async () => {
    onCancel?.();
  };

  const handleRetryCalculation = async () => {
    onRetry?.();
  };

  const getStatusChip = () => {
    switch (status) {
      case 'running':
        return (
          <Chip
            label={`Running... ${progress.toFixed(1)}%`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
          />
        );
      case 'completed':
        return (
          <Chip
            label="Completed"
            color="success"
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
          />
        );
      case 'error':
        return (
          <Chip
            label="Error"
            color="error"
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
          />
        );
      default:
        return (
          <Chip
            label="Ready"
            color="default"
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
          />
        );
    }
  };

  const getControlButtons = () => {
    switch (status) {
      case 'idle':
        return (
          <ButtonGroup variant="contained" aria-label="calculation controls">
            <Tooltip title="Start calculation">
              <Button
                startIcon={<PlayIcon />}
                onClick={handleStartCalculation}
                disabled={disabled}
                color="primary"
              >
                Start
              </Button>
            </Tooltip>
          </ButtonGroup>
        );

      case 'running':
        return (
          <ButtonGroup variant="contained" aria-label="calculation controls">
            <Tooltip title="Pause calculation">
              <Button
                startIcon={<PauseIcon />}
                onClick={onPause}
                color="warning"
              >
                Pause
              </Button>
            </Tooltip>
            <Tooltip title="Cancel calculation">
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelCalculation}
                color="error"
              >
                Cancel
              </Button>
            </Tooltip>
          </ButtonGroup>
        );

      case 'completed':
        return (
          <ButtonGroup variant="contained" aria-label="calculation controls">
            <Tooltip title="Start new calculation">
              <Button
                startIcon={<PlayIcon />}
                onClick={handleStartCalculation}
                disabled={disabled}
                color="primary"
              >
                New
              </Button>
            </Tooltip>
            <Tooltip title="Retry calculation">
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRetryCalculation}
                color="secondary"
              >
                Retry
              </Button>
            </Tooltip>
          </ButtonGroup>
        );

      case 'error':
        return (
          <ButtonGroup variant="contained" aria-label="calculation controls">
            <Tooltip title="Retry calculation">
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRetryCalculation}
                color="secondary"
              >
                Retry
              </Button>
            </Tooltip>
            <Tooltip title="Start new calculation">
              <Button
                startIcon={<PlayIcon />}
                onClick={handleStartCalculation}
                disabled={disabled}
                color="primary"
              >
                New
              </Button>
            </Tooltip>
          </ButtonGroup>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" component="h3">
          Calculation Controls
        </Typography>
        {getStatusChip()}
      </Box>
      
      <Box>
        {getControlButtons()}
      </Box>
    </Box>
  );
};