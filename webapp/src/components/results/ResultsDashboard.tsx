import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Compare as CompareIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  InsertChartOutlined as ChartIcon,
  TableChart as TableChartIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { ResultsSummary } from './ResultsSummary';
import { ResultsTabs } from './ResultsTabs';
import { ResultsNavigation } from './ResultsNavigation';
import { CriticalConditions } from './analysis/CriticalConditions';
import { PerformanceAnalysis } from './analysis/PerformanceAnalysis';
import { ResultsComparison } from './analysis/ResultsComparison';
import { MetricCard } from './display/MetricCard';
import { ResultsCard } from './display/ResultsCard';
import { AlertSummary } from './display/AlertSummary';
import { ResultsMetadata } from './display/ResultsMetadata';
import { useResults } from '../../hooks/results/useResults';
import { useChartData } from '../../hooks/results/useChartData';
import { ExportFormats } from '../../types/visualization';
import type { ProcessedResult } from '../../services/calculation/resultProcessor';

interface ResultsDashboardProps {
  result: ProcessedResult;
  isLoading?: boolean;
  error?: string;
  onExport?: (format: ExportFormats) => Promise<void>;
  onCompare?: (otherResults: ProcessedResult[]) => void;
  onRefresh?: () => void;
  className?: string;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  isLoading = false,
  error,
  onExport,
  onCompare,
  onRefresh,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'warning' | 'error' | 'info'>('info');

  // Results hooks
  const { filteredSections, searchResults, searchTerm, setSearchTerm } = useResults(result);
  const { chartData, isLoading: isChartDataLoading } = useChartData(result, filteredSections);

  // Critical conditions
  const criticalConditions = result.sections
    .filter(section => 
      section.status.velocityStatus === 'critical' || 
      section.status.pressureStatus === 'low'
    )
    .map(section => ({
      id: `section-${section.id}`,
      type: section.status.velocityStatus === 'critical' ? 'velocity' : 'pressure' as const,
      severity: 'critical' as const,
      message: section.status.recommendation,
      sectionId: section.id,
      value: section.flow.velocity,
      threshold: section.status.velocityStatus === 'critical' ? 10 : 50,
      recommendation: section.status.recommendation,
    }));

  const warnings = result.warnings || [];

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = async (format: ExportFormats) => {
    try {
      if (onExport) {
        await onExport(format);
        showNotification('Export completed successfully', 'success');
      }
      handleExportClose();
    } catch (error) {
      showNotification('Export failed: ' + (error as Error).message, 'error');
    }
  };

  const showNotification = (message: string, severity: typeof alertSeverity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Calculate key metrics for summary cards
  const summaryMetrics = {
    totalPressureDrop: result.summary.pressureInfo.totalPressureDrop,
    maxVelocity: result.summary.pressureInfo.maxVelocity,
    criticalSections: criticalConditions.length,
    averageVelocity: result.performance.averageVelocity,
    pressureEfficiency: result.performance.pressureEfficiency,
    sectionsCount: result.sections.length,
  };

  const tabPanels = [
    {
      label: 'Summary',
      icon: <TrendingUpIcon />,
      content: (
        <Grid container spacing={3}>
          {/* Executive Summary */}
          <Grid item xs={12}>
            <ResultsSummary
              summary={result.summary}
              performance={result.performance}
              warnings={warnings}
              criticalConditions={criticalConditions}
            />
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Total Pressure Drop"
              value={summaryMetrics.totalPressureDrop}
              unit="Pa"
              trend={summaryMetrics.totalPressureDrop > 100000 ? 'warning' : 'normal'}
              color={theme.palette.error.main}
              onClick={() => setActiveTab(2)} // Switch to charts tab
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Maximum Velocity"
              value={summaryMetrics.maxVelocity}
              unit="m/s"
              trend={summaryMetrics.maxVelocity > 8 ? 'warning' : 'normal'}
              color={theme.palette.warning.main}
              onClick={() => setActiveTab(1)} // Switch to tables tab
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Critical Sections"
              value={summaryMetrics.criticalSections}
              trend={summaryMetrics.criticalSections > 0 ? 'critical' : 'normal'}
              color={theme.palette.error.main}
              onClick={() => setActiveTab(3)} // Switch to analysis tab
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Pressure Efficiency"
              value={summaryMetrics.pressureEfficiency}
              unit="%"
              trend={summaryMetrics.pressureEfficiency < 80 ? 'warning' : 'normal'}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Sections Count"
              value={summaryMetrics.sectionsCount}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MetricCard
              title="Calculation Time"
              value={result.performance.totalCalculationTime}
              unit="s"
              color={theme.palette.primary.main}
            />
          </Grid>

          {/* Critical Conditions */}
          {criticalConditions.length > 0 && (
            <Grid item xs={12}>
              <CriticalConditions
                conditions={criticalConditions}
                onSectionClick={(sectionId: string) => {
                  // Navigate to specific section in tables
                  setSearchTerm(sectionId);
                  setActiveTab(1);
                }}
              />
            </Grid>
          )}

          {/* Performance Analysis */}
          <Grid item xs={12}>
            <PerformanceAnalysis
              result={result}
              criticalConditions={criticalConditions}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Tables',
      icon: <TableChartIcon />,
      content: (
        <ResultsTabs
          result={result}
          filteredSections={filteredSections}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      ),
    },
    {
      label: 'Charts',
      icon: <ChartIcon />,
      content: (
        <ResultsTabs
          result={result}
          chartData={chartData}
          isLoading={isChartDataLoading}
        />
      ),
    },
    {
      label: 'Analysis',
      icon: <AnalyticsIcon />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PerformanceAnalysis
              result={result}
              criticalConditions={criticalConditions}
            />
          </Grid>
          <Grid item xs={12}>
            <ResultsComparison
              baseline={result}
              comparison={[]}
              onCompare={onCompare}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: 'Export',
      icon: <DownloadIcon />,
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ResultsCard title="Export Options" subtitle="Choose format and options">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('pdf')}
                    fullWidth
                  >
                    Export PDF
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('excel')}
                    fullWidth
                  >
                    Export Excel
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('json')}
                    fullWidth
                  >
                    Export JSON
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                    fullWidth
                  >
                    Export CSV
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                    fullWidth
                  >
                    Print Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      navigator.share?.({
                        title: `Hydraulic Analysis - ${result.summary.networkInfo.name}`,
                        text: 'Hydraulic network analysis results',
                      });
                    }}
                    fullWidth
                  >
                    Share
                  </Button>
                </Grid>
              </Grid>
            </ResultsCard>
          </Grid>
          <Grid item xs={12}>
            <ResultsMetadata result={result} />
          </Grid>
        </Grid>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" className={className || ''}>
      {/* Header */}
      <Box mb={3}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Results Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {result.summary.networkInfo.name}
            </Typography>
          </Grid>
          <Grid item>
            <Grid container spacing={1} alignItems="center">
              {onRefresh && (
                <Grid item>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                </Grid>
              )}
              <Grid item>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={handleExportClick}
                  variant="contained"
                  color="primary"
                >
                  Export
                </Button>
                <Menu
                  anchorEl={exportMenuAnchor}
                  open={Boolean(exportMenuAnchor)}
                  onClose={handleExportClose}
                >
                  <MenuItem onClick={() => handleExport('pdf')}>Export PDF</MenuItem>
                  <MenuItem onClick={() => handleExport('excel')}>Export Excel</MenuItem>
                  <MenuItem onClick={() => handleExport('json')}>Export JSON</MenuItem>
                  <MenuItem onClick={() => handleExport('csv')}>Export CSV</MenuItem>
                </Menu>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Status Chips */}
        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
          <Chip
            label={`Status: ${result.summary.pressureInfo.criticalVelocity ? 'Critical' : 'Normal'}`}
            color={result.summary.pressureInfo.criticalVelocity ? 'error' : 'success'}
            size="small"
          />
          <Chip
            label={`Sections: ${result.sections.length}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Warnings: ${warnings.length}`}
            color={warnings.length > 0 ? 'warning' : 'default'}
            size="small"
          />
          <Chip
            label={`Critical: ${criticalConditions.length}`}
            color={criticalConditions.length > 0 ? 'error' : 'default'}
            size="small"
          />
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {warnings.length > 0 && (
        <AlertSummary
          warnings={warnings}
          criticalConditions={criticalConditions}
          onClose={() => {}}
        />
      )}

      {/* Main Content */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: isMobile ? 120 : 160,
            },
          }}
        >
          {tabPanels.map((panel, index) => (
            <Tab
              key={index}
              icon={panel.icon}
              label={isMobile ? '' : panel.label}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box p={3}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <Typography>Loading results...</Typography>
            </Box>
          ) : (
            panel.content
          )}
        </Box>
      </Paper>

      {/* Notifications */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
      />
    </Container>
  );
};