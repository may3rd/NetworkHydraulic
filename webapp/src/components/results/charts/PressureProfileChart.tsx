import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import {
  Box,
  Typography,
  useTheme,
  Skeleton,
  Chip,
  alpha,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Compress as PressureIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

import type { PressureProfileData } from '../../../types/visualization';

interface PressureProfileChartProps {
  data: PressureProfileData[];
  isLoading?: boolean;
  height?: number;
  showElevation?: boolean;
}

export const PressureProfileChart: React.FC<PressureProfileChartProps> = ({
  data,
  isLoading = false,
  height = 300,
  showElevation = false,
}) => {
  const theme = useTheme();

  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : [
    { distance: 0, inletPressure: 200000, outletPressure: 195000, elevation: 0, sectionId: 'S1', velocity: 2.5 },
    { distance: 50, inletPressure: 195000, outletPressure: 185000, elevation: 5, sectionId: 'S2', velocity: 2.8 },
    { distance: 100, inletPressure: 185000, outletPressure: 170000, elevation: 10, sectionId: 'S3', velocity: 3.2 },
    { distance: 150, inletPressure: 170000, outletPressure: 150000, elevation: 15, sectionId: 'S4', velocity: 3.8 },
    { distance: 200, inletPressure: 150000, outletPressure: 125000, elevation: 20, sectionId: 'S5', velocity: 4.2 },
    { distance: 250, inletPressure: 125000, outletPressure: 100000, elevation: 25, sectionId: 'S6', velocity: 4.8 },
  ];

  // Calculate pressure drop trend
  const hasPressureDrop = chartData.some(d => d.outletPressure < d.inletPressure);
  const maxPressure = Math.max(...chartData.map(d => d.inletPressure));
  const minPressure = Math.min(...chartData.map(d => d.outletPressure));

  // Chart configuration
  const chartConfig = {
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            padding: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Section {data.sectionId}
          </Typography>
          <Typography variant="body2">
            Distance: {data.distance} m
          </Typography>
          <Typography variant="body2">
            Inlet Pressure: {(data.inletPressure / 1000).toFixed(1)} kPa
          </Typography>
          <Typography variant="body2">
            Outlet Pressure: {(data.outletPressure / 1000).toFixed(1)} kPa
          </Typography>
          <Typography variant="body2">
            Pressure Drop: {((data.inletPressure - data.outletPressure) / 1000).toFixed(1)} kPa
          </Typography>
          <Typography variant="body2">
            Velocity: {data.velocity.toFixed(2)} m/s
          </Typography>
          {showElevation && (
            <Typography variant="body2">
              Elevation: {data.elevation} m
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  // Custom tick formatter for pressure
  const pressureTickFormatter = (value: number) => {
    return `${(value / 1000).toFixed(0)}k`;
  };

  // Custom tick formatter for distance
  const distanceTickFormatter = (value: number) => {
    return `${value}m`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Pressure Profile
        </Typography>
        {hasPressureDrop && (
          <Chip
            icon={<TrendingDownIcon />}
            label="Pressure Drop"
            color="warning"
            size="small"
          />
        )}
      </Box>

      {isLoading ? (
        <Skeleton variant="rectangular" height={height} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={chartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" />
            
            <XAxis
              dataKey="distance"
              tickFormatter={distanceTickFormatter}
              label={{
                value: 'Distance',
                position: 'insideBottom',
                offset: -1,
                style: { fontSize: 12 },
              }}
            />
            
            <YAxis
              tickFormatter={pressureTickFormatter}
              label={{
                value: 'Pressure (kPa)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend />
            
            {/* Pressure lines */}
            <Line
              type="monotone"
              dataKey="inletPressure"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.primary.main }}
              name="Inlet Pressure"
            />
            
            <Line
              type="monotone"
              dataKey="outletPressure"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.secondary.main }}
              name="Outlet Pressure"
            />
            
            {/* Reference lines for critical pressures */}
            <ReferenceLine
              y={100000}
              stroke={theme.palette.error.main}
              strokeDasharray="5 5"
              label="Min Pressure"
            />
            
            <ReferenceLine
              y={maxPressure}
              stroke={theme.palette.info.main}
              strokeDasharray="2 2"
              label="Max Pressure"
            />
            
            {/* Optional elevation area chart overlay */}
            {showElevation && (
              <Area
                type="monotone"
                dataKey="elevation"
                stackId="1"
                stroke={alpha(theme.palette.success.main, 0.8)}
                fill={alpha(theme.palette.success.main, 0.2)}
                name="Elevation"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {/* Chart statistics */}
      <Box display="flex" gap={2} mt={2} flexWrap="wrap">
        <Chip
          label={`Max Pressure: ${(maxPressure / 1000).toFixed(1)} kPa`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Min Pressure: ${(minPressure / 1000).toFixed(1)} kPa`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Total Drop: ${((maxPressure - minPressure) / 1000).toFixed(1)} kPa`}
          size="small"
          color="warning"
        />
        <Chip
          label={`Sections: ${chartData.length}`}
          size="small"
          variant="outlined"
        />
      </Box>
    </Box>
  );
};