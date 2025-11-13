import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Divider,
  CardMedia,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Info,
  Speed,
  PressureSensor,
  Gavel,
  Settings as SettingsIcon,
  EmojiObjects,
  ShowChart,
  BarChart,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import type { ReportTemplateProps } from './types';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  position: 'relative',
  '& .MuiCardHeader-action': {
    alignSelf: 'center',
  },
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '2rem',
  color: theme.palette.primary.main,
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const TrendIcon = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

const RecommendationCard = styled(Card)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateX(4px)',
  },
  transition: 'all 0.2s ease',
}));

const CriticalConditionAlert = styled(Alert)(({ theme }) => ({
  '& .MuiAlert-icon': {
    fontSize: '1.5rem',
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const getTrendIcon = (trend?: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp color="success" />;
    case 'down':
      return <TrendingDown color="error" />;
    case 'critical':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'normal':
      return <CheckCircle color="success" />;
    default:
      return <Remove color="disabled" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
};

const getRecommendationIcon = (type: string, priority: string) => {
  const iconProps = {
    fontSize: 'small' as const,
    color: priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'info',
  };

  switch (type) {
    case 'optimization':
      return <EmojiObjects {...iconProps} />;
    case 'safety':
      return <Gavel {...iconProps} />;
    case 'cost':
      return <ShowChart {...iconProps} />;
    case 'performance':
      return <Speed {...iconProps} />;
    default:
      return <SettingsIcon {...iconProps} />;
  }
};

export const ExecutiveSummaryReport: React.FC<ReportTemplateProps> = ({
  calculationId,
  calculationName,
  result,
  branding = {
    primaryColor: '#1976d2',
    secondaryColor: '#424242',
    fontFamily: 'Roboto, Arial, sans-serif',
    companyName: 'Hydraulic Analysis Report',
    reportTitle: 'Executive Summary',
  },
  layout,
  sections = [],
  metadata,
  isPreview = false,
}) => {
  // Extract data from result
  const summary = result.summary;
  const performance = result.performance;
  const criticalConditions = result.criticalConditions || [];
  const recommendations = result.recommendations || [];

  // Calculate key metrics
  const keyMetrics = [
    {
      id: 'total_pressure_drop',
      label: 'Total Pressure Drop',
      value: summary.totalPressureDrop,
      unit: 'kPa',
      trend: summary.totalPressureDrop > 100 ? 'warning' : 'normal',
      target: 50,
      description: 'Total pressure loss across the network',
    },
    {
      id: 'max_velocity',
      label: 'Maximum Velocity',
      value: summary.maxVelocity,
      unit: 'm/s',
      trend: summary.maxVelocity > 10 ? 'critical' : summary.maxVelocity > 5 ? 'warning' : 'normal',
      target: 3,
      description: 'Highest flow velocity in any section',
    },
    {
      id: 'efficiency',
      label: 'System Efficiency',
      value: performance?.efficiency?.overallEfficiency || 0,
      unit: '%',
      trend: performance?.efficiency?.overallEfficiency > 80 ? 'normal' : 'warning',
      target: 90,
      description: 'Overall hydraulic efficiency',
    },
    {
      id: 'design_margin',
      label: 'Design Margin Applied',
      value: summary.designMargin || 0,
      unit: '%',
      trend: summary.designMargin > 0 ? 'normal' : 'warning',
      target: 10,
      description: 'Safety margin applied to design',
    },
  ];

  // Get sections to display based on configuration
  const displaySections = sections.filter(s => s.enabled);

  return (
    <Box
      sx={{
        fontFamily: branding.fontFamily,
        backgroundColor: 'background.default',
        minHeight: '100vh',
        p: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: '2px solid',
          borderColor: branding.primaryColor,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {branding.reportTitle || 'Executive Summary Report'}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {calculationName}
          </Typography>
          {metadata && (
            <Typography variant="body2" color="textSecondary">
              Generated on: {metadata.generatedAt.toLocaleDateString()}
            </Typography>
          )}
        </Box>
        
        {branding.logoUrl && (
          <Box>
            <CardMedia
              component="img"
              image={branding.logoUrl}
              alt={branding.companyName}
              sx={{ height: 60, width: 'auto', objectFit: 'contain' }}
            />
          </Box>
        )}
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {keyMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.id}>
            <MetricCard variant="outlined">
              <CardHeader
                title={
                  <MetricValue variant="h4">
                    {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                    <Typography component="span" variant="body2" color="textSecondary">
                      {' '}{metric.unit}
                    </Typography>
                  </MetricValue>
                }
                subheader={<MetricLabel>{metric.label}</MetricLabel>}
                action={
                  <TrendIcon>
                    {getTrendIcon(metric.trend)}
                  </TrendIcon>
                }
              />
              {metric.description && (
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="caption" color="textSecondary">
                    {metric.description}
                  </Typography>
                </CardContent>
              )}
            </MetricCard>
          </Grid>
        ))}
      </Grid>

      {/* Critical Conditions */}
      {criticalConditions.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <SectionHeader>
                    <Warning color="error" />
                    <Typography variant="h6">Critical Conditions</Typography>
                    <Chip
                      size="small"
                      label={criticalConditions.length}
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  </SectionHeader>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  {criticalConditions.map((condition, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <CriticalConditionAlert
                        severity={getSeverityColor(condition.severity)}
                        icon={condition.severity === 'critical' ? <ErrorIcon /> : <Warning />}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {condition.message}
                          </Typography>
                          {condition.sectionId && (
                            <Typography variant="caption" color="textSecondary">
                              Section: {condition.sectionId}
                            </Typography>
                          )}
                          {condition.recommendation && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Recommendation:</strong> {condition.recommendation}
                            </Typography>
                          )}
                        </Box>
                      </CriticalConditionAlert>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Performance Summary */}
      {performance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <SectionHeader>
                    <Speed />
                    <Typography variant="h6">Performance Analysis</Typography>
                  </SectionHeader>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h2" color="primary.main">
                        {(performance.efficiency?.overallEfficiency || 0).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Overall Efficiency
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                      Pressure Efficiency: {(performance.efficiency?.pressureEfficiency || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                      Velocity Efficiency: {(performance.efficiency?.velocityEfficiency || 0).toFixed(1)}%
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    {performance.optimizationPotential?.sectionsToOptimize.length > 0 && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          <strong>Optimization Potential:</strong>
                        </Typography>
                        <List dense>
                          {performance.optimizationPotential.sectionsToOptimize.slice(0, 3).map((section, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemText
                                primary={`Section ${section}`}
                                secondary="Potential improvement"
                              />
                            </ListItem>
                          ))}
                          {performance.optimizationPotential.sectionsToOptimize.length > 3 && (
                            <ListItem disableGutters>
                              <ListItemText
                                primary={`+${performance.optimizationPotential.sectionsToOptimize.length - 3} more sections`}
                              />
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <SectionHeader>
                    <EmojiObjects />
                    <Typography variant="h6">Recommendations</Typography>
                    <Chip
                      size="small"
                      label={recommendations.length}
                      color="info"
                      sx={{ ml: 1 }}
                    />
                  </SectionHeader>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  {recommendations.slice(0, 6).map((recommendation, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <RecommendationCard variant="outlined">
                        <CardHeader
                          title={
                            <Box display="flex" alignItems="center" gap={1}>
                              {getRecommendationIcon(recommendation.type, recommendation.priority)}
                              <Typography variant="body1" fontWeight="bold">
                                {recommendation.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={recommendation.priority}
                                color={recommendation.priority === 'high' ? 'error' : recommendation.priority === 'medium' ? 'warning' : 'info'}
                                sx={{ ml: 'auto' }}
                              />
                            </Box>
                          }
                          subheader={
                            <Typography variant="body2" color="textSecondary">
                              {recommendation.description}
                            </Typography>
                          }
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Typography variant="body2">
                            <strong>Impact:</strong> {recommendation.impact}
                          </Typography>
                          {recommendation.estimatedCost && (
                            <Typography variant="body2">
                              <strong>Estimated Cost:</strong> ${recommendation.estimatedCost.toLocaleString()}
                            </Typography>
                          )}
                          {recommendation.timeframe && (
                            <Typography variant="body2">
                              <strong>Timeframe:</strong> {recommendation.timeframe}
                            </Typography>
                          )}
                        </CardContent>
                      </RecommendationCard>
                    </Grid>
                  ))}
                  
                  {recommendations.length > 6 && (
                    <Grid item xs={12}>
                      <Box textAlign="center" sx={{ py: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          +{recommendations.length - 6} more recommendations available in full report
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Summary Table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <SectionHeader>
                  <BarChart />
                  <Typography variant="h6">Calculation Summary</Typography>
                </SectionHeader>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parameter</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Unit</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Inlet Pressure</TableCell>
                      <TableCell align="right">{summary.inlet.pressure.toFixed(1)}</TableCell>
                      <TableCell align="right">kPa</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label="Normal" color="success" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Outlet Pressure</TableCell>
                      <TableCell align="right">{summary.outlet.pressure.toFixed(1)}</TableCell>
                      <TableCell align="right">kPa</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label="Normal" color="success" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Pressure Drop</TableCell>
                      <TableCell align="right">{summary.totalPressureDrop.toFixed(1)}</TableCell>
                      <TableCell align="right">kPa</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={summary.totalPressureDrop > 100 ? "High" : "Normal"} 
                          color={summary.totalPressureDrop > 100 ? "warning" : "success"} 
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maximum Velocity</TableCell>
                      <TableCell align="right">{summary.maxVelocity.toFixed(2)}</TableCell>
                      <TableCell align="right">m/s</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={summary.maxVelocity > 10 ? "Critical" : summary.maxVelocity > 5 ? "High" : "Normal"} 
                          color={summary.maxVelocity > 10 ? "error" : summary.maxVelocity > 5 ? "warning" : "success"} 
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Design Margin</TableCell>
                      <TableCell align="right">{(summary.designMargin || 0).toFixed(1)}</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={summary.designMargin > 0 ? "Applied" : "None"} color="info" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box
        sx={{
          mt: 6,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="textSecondary">
          {branding.companyName || 'Hydraulic Analysis Report'}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Report generated on {metadata?.generatedAt?.toLocaleDateString() || new Date().toLocaleDateString()}
        </Typography>
        
        {branding.confidentialityNotice && (
          <Alert severity="info" sx={{ mt: 2, mb: 1 }} icon={<Info />}>
            {branding.confidentialityNotice}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default ExecutiveSummaryReport;