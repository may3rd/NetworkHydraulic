import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Compress as PressureIcon,
  Thermostat as ThermostatIcon,
  Gavel as GavelIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

import { MetricCard } from './display/MetricCard';
import { CriticalCondition } from '../../types/visualization';

interface ResultsSummaryProps {
  summary: any; // ProcessedResult['summary']
  performance: any; // ProcessedResult['performance']
  warnings: string[];
  criticalConditions?: CriticalCondition[];
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  summary,
  performance,
  warnings,
  criticalConditions = [],
}) => {
  const theme = useTheme();

  // Calculate status indicators
  const getStatusTrend = (value: number, threshold: number, type: 'high' | 'low' = 'high') => {
    if (type === 'high') {
      if (value > threshold) return 'critical';
      if (value > threshold * 0.8) return 'warning';
      return 'normal';
    } else {
      if (value < threshold) return 'critical';
      if (value < threshold * 1.2) return 'warning';
      return 'normal';
    }
  };

  // Get recommendations from performance data
  const recommendations = performance.recommendations || [];

  return (
    <Grid container spacing={3}>
      {/* Executive Summary Card */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUpIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" component="h2">
                Executive Summary
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {/* Network Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Network Information
                </Typography>
                <Box ml={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Network Name:
                    </Typography>
                    <Typography variant="body2">
                      {summary.networkInfo.name}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Direction:
                    </Typography>
                    <Chip
                      label={summary.networkInfo.direction}
                      size="small"
                      color={summary.networkInfo.direction === 'auto' ? 'info' : 'primary'}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Length:
                    </Typography>
                    <Typography variant="body2">
                      {summary.networkInfo.totalLength.toFixed(1)} m
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Total Elevation:
                    </Typography>
                    <Typography variant="body2">
                      {summary.networkInfo.totalElevationChange.toFixed(2)} m
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Fluid Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Fluid Information
                </Typography>
                <Box ml={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Phase:
                    </Typography>
                    <Chip
                      label={summary.fluidInfo.phase}
                      size="small"
                      color={summary.fluidInfo.phase === 'liquid' ? 'primary' : 'secondary'}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Temperature:
                    </Typography>
                    <Typography variant="body2">
                      {summary.fluidInfo.temperature.toFixed(1)} K
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Density:
                    </Typography>
                    <Typography variant="body2">
                      {summary.fluidInfo.density.toFixed(1)} kg/m³
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Viscosity:
                    </Typography>
                    <Typography variant="body2">
                      {summary.fluidInfo.viscosity.toFixed(6)} Pa·s
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Key Metrics Row */}
      <Grid item xs={12} md={6} lg={3}>
        <MetricCard
          title="Inlet Pressure"
          value={summary.pressureInfo.inletPressure}
          unit="Pa"
          trend={getStatusTrend(summary.pressureInfo.inletPressure, 100000, 'low')}
          color={theme.palette.info.main}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <MetricCard
          title="Outlet Pressure"
          value={summary.pressureInfo.outletPressure}
          unit="Pa"
          trend={getStatusTrend(summary.pressureInfo.outletPressure, 50000, 'low')}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <MetricCard
          title="Total Pressure Drop"
          value={summary.pressureInfo.totalPressureDrop}
          unit="Pa"
          trend={getStatusTrend(summary.pressureInfo.totalPressureDrop, 100000)}
          color={theme.palette.error.main}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <MetricCard
          title="Maximum Velocity"
          value={summary.pressureInfo.maxVelocity}
          unit="m/s"
          trend={getStatusTrend(summary.pressureInfo.maxVelocity, 8)}
          color={theme.palette.warning.main}
        />
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12} md={6} lg={4}>
        <MetricCard
          title="Pressure Efficiency"
          value={performance.pressureEfficiency}
          unit="%"
          trend={getStatusTrend(performance.pressureEfficiency, 80, 'low')}
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <MetricCard
          title="Average Velocity"
          value={performance.averageVelocity}
          unit="m/s"
          trend={getStatusTrend(performance.averageVelocity, 6)}
          color={theme.palette.info.main}
        />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <MetricCard
          title="Calculation Time"
          value={performance.totalCalculationTime}
          unit="s"
          color={theme.palette.success.main}
        />
      </Grid>

      {/* Critical Conditions */}
      {criticalConditions.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Critical Conditions ({criticalConditions.length})
                </Typography>
              </Box>
              <List>
                {criticalConditions.map((condition, index) => (
                  <React.Fragment key={condition.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        {condition.type === 'velocity' ? (
                          <SpeedIcon color="error" />
                        ) : condition.type === 'pressure' ? (
                          <PressureIcon color="error" />
                        ) : (
                          <ThermostatIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="error.main">
                            {condition.message}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Section: {condition.sectionId} | Value: {condition.value.toFixed(2)} | 
                              Threshold: {condition.threshold.toFixed(2)}
                            </Typography>
                            {condition.recommendation && (
                              <Typography variant="caption" color="text.secondary" component="div">
                                Recommendation: {condition.recommendation}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Grid item xs={12}>
          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              Warnings ({warnings.length})
            </Typography>
            <List dense>
              {warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </Alert>
        </Grid>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <GavelIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Recommendations ({recommendations.length})
                </Typography>
              </Box>
              <List>
                {recommendations.map((recommendation: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TimelineIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.primary">
                          {recommendation}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Status Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Status Summary
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={summary.pressureInfo.criticalVelocity ? 'Critical' : 'Normal'}
                    color={summary.pressureInfo.criticalVelocity ? 'error' : 'success'}
                    size="small"
                  />
                  <Typography variant="body2">Velocity Status</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={warnings.length > 0 ? 'Warnings' : 'Clean'}
                    color={warnings.length > 0 ? 'warning' : 'success'}
                    size="small"
                  />
                  <Typography variant="body2">Warnings</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={criticalConditions.length > 0 ? 'Critical Issues' : 'No Critical Issues'}
                    color={criticalConditions.length > 0 ? 'error' : 'success'}
                    size="small"
                  />
                  <Typography variant="body2">Critical Issues</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label="Completed"
                    color="success"
                    size="small"
                  />
                  <Typography variant="body2">Calculation Status</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};