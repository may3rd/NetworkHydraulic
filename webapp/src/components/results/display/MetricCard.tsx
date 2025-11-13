import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import type { MetricCardProps } from '../../../types/visualization';

interface MetricCardPropsWithSx extends MetricCardProps {
  sx?: any;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend = 'normal',
  change,
  changeLabel,
  icon: IconComponent,
  color,
  onClick,
  loading = false,
  ...rest
}) => {
  const theme = useTheme();

  // Determine trend color and icon
  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return { color: theme.palette.success.main, icon: <TrendingUpIcon /> };
      case 'down':
        return { color: theme.palette.error.main, icon: <TrendingDownIcon /> };
      case 'critical':
        return { color: theme.palette.error.main, icon: <ErrorIcon /> };
      case 'warning':
        return { color: theme.palette.warning.main, icon: <WarningIcon /> };
      case 'stable':
      default:
        return { color: theme.palette.success.main, icon: <CheckCircleIcon /> };
    }
  };

  const trendConfig = getTrendConfig();

  // Format value based on type
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      } else {
        return val.toLocaleString(undefined, {
          maximumFractionDigits: typeof val === 'number' && val < 1 ? 3 : 1,
        });
      }
    }
    return val;
  };

  // Determine background color
  const getBackgroundColor = () => {
    if (color) {
      return alpha(color, 0.1);
    }
    switch (trend) {
      case 'critical':
        return alpha(theme.palette.error.main, 0.1);
      case 'warning':
        return alpha(theme.palette.warning.main, 0.1);
      default:
        return theme.palette.mode === 'light' 
          ? theme.palette.grey[50] 
          : theme.palette.grey[800];
    }
  };

  // Determine text color
  const getTextColor = () => {
    if (color) {
      return color;
    }
    return trendConfig.color;
  };

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        border: 1,
        borderColor: 'divider',
        backgroundColor: getBackgroundColor(),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: onClick ? 2 : 0,
          borderColor: onClick ? 'primary.main' : 'divider',
        },
        ...((rest as any).sx || {}),
      }}
      {...rest}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary" component="h3">
            {title}
          </Typography>
          {IconComponent && (
            <Box color={getTextColor()}>
              <IconComponent />
            </Box>
          )}
        </Box>

        <Box display="flex" alignItems="baseline" gap={1} mb={1}>
          <Typography variant="h4" fontWeight="bold" color={getTextColor()}>
            {loading ? '...' : formatValue(value)}
          </Typography>
          {unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
        </Box>

        {change !== undefined && changeLabel && (
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            <Chip
              icon={trend === 'up' ? <TrendingUpIcon /> : trend === 'down' ? <TrendingDownIcon /> : <RemoveIcon />}
              label={`${change > 0 ? '+' : ''}${change.toFixed(1)}% ${changeLabel}`}
              size="small"
              color={trend === 'critical' || trend === 'warning' ? 'error' : 'success'}
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        )}

        {trend !== 'normal' && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box color={trendConfig.color}>
              {trendConfig.icon}
            </Box>
            <Typography 
              variant="caption" 
              color={trendConfig.color}
              sx={{ textTransform: 'capitalize' }}
            >
              {trend} trend
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Specialized metric card for pressure values
export const PressureMetricCard: React.FC<Omit<MetricCardProps, 'color'>> = (props) => {
  const theme = useTheme();
  const value = typeof props.value === 'number' ? props.value : 0;
  
  // Determine color based on pressure value
  let color = theme.palette.success.main;
  if (value > 200000) {
    color = theme.palette.error.main; // High pressure
  } else if (value > 100000) {
    color = theme.palette.warning.main; // Medium pressure
  }

  return <MetricCard {...props} color={color} />;
};

// Specialized metric card for velocity values
export const VelocityMetricCard: React.FC<Omit<MetricCardProps, 'color'>> = (props) => {
  const theme = useTheme();
  const value = typeof props.value === 'number' ? props.value : 0;
  
  // Determine color based on velocity value
  let color = theme.palette.success.main;
  if (value > 10) {
    color = theme.palette.error.main; // Critical velocity
  } else if (value > 6) {
    color = theme.palette.warning.main; // High velocity
  }

  return <MetricCard {...props} color={color} />;
};

// Specialized metric card for efficiency values
export const EfficiencyMetricCard: React.FC<Omit<MetricCardProps, 'color'>> = (props) => {
  const theme = useTheme();
  const value = typeof props.value === 'number' ? props.value : 0;
  
  // Determine color based on efficiency percentage
  let color = theme.palette.success.main;
  if (value < 60) {
    color = theme.palette.error.main; // Low efficiency
  } else if (value < 80) {
    color = theme.palette.warning.main; // Medium efficiency
  }

  return <MetricCard {...props} color={color} />;
};