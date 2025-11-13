import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  TableChart as TableChartIcon,
  InsertChartOutlined as ChartIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

import { SectionResultsTable } from './tables/SectionResultsTable';
import { LossBreakdownTable } from './tables/LossBreakdownTable';
import { FlowCharacteristicsTable } from './tables/FlowCharacteristicsTable';
import { ComponentResultsTable } from './tables/ComponentResultsTable';
import { PressureProfileChart } from './charts/PressureProfileChart';
import { VelocityProfileChart } from './charts/VelocityProfileChart';
import { LossBreakdownChart } from './charts/LossBreakdownChart';
import { ReynoldsChart } from './charts/ReynoldsChart';
import { FrictionFactorChart } from './charts/FrictionFactorChart';
import { InteractiveChart } from './charts/InteractiveChart';
import type { ProcessedResult, ProcessedSectionResult } from '../../services/calculation/resultProcessor';

interface ResultsTabsProps {
  result: ProcessedResult;
  filteredSections?: ProcessedSectionResult[];
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  chartData?: any;
  isLoading?: boolean;
}

export const ResultsTabs: React.FC<ResultsTabsProps> = ({
  result,
  filteredSections,
  searchTerm = '',
  onSearchTermChange,
  chartData,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  // Use provided filtered sections or fall back to all sections
  const sectionsToDisplay = filteredSections || result.sections;

  useEffect(() => {
    if (searchTerm !== tableSearchTerm) {
      setTableSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle table search
  const handleTableSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setTableSearchTerm(term);
    if (onSearchTermChange) {
      onSearchTermChange(term);
    }
  };

  // Tab definitions
  const tabs = [
    {
      label: 'Tables',
      icon: <TableChartIcon />,
      content: (
        <Box>
          <Box mb={3}>
            <TextField
              fullWidth
              placeholder="Search sections..."
              value={tableSearchTerm}
              onChange={handleTableSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: tableSearchTerm && (
                  <InputAdornment position="end">
                    <Chip
                      size="small"
                      label={`${sectionsToDisplay.length} results`}
                      color="primary"
                    />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Box>
          
          <Box mb={3}>
            <SectionResultsTable sections={sectionsToDisplay} />
          </Box>
          
          <Box mb={3}>
            <LossBreakdownTable sections={sectionsToDisplay} />
          </Box>
          
          <Box mb={3}>
            <FlowCharacteristicsTable sections={sectionsToDisplay} />
          </Box>
          
          <Box>
            <ComponentResultsTable sections={sectionsToDisplay} />
          </Box>
        </Box>
      ),
    },
    {
      label: 'Charts',
      icon: <ChartIcon />,
      content: (
        <Box>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Pressure Profile
            </Typography>
            <PressureProfileChart 
              data={chartData?.pressureProfile || []}
              isLoading={isLoading}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Velocity Profile
            </Typography>
            <VelocityProfileChart 
              data={chartData?.velocityProfile || []}
              isLoading={isLoading}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Loss Breakdown
            </Typography>
            <LossBreakdownChart 
              data={chartData?.lossBreakdown || []}
              isLoading={isLoading}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Reynolds Number Analysis
            </Typography>
            <ReynoldsChart 
              data={chartData?.reynoldsChart || []}
              isLoading={isLoading}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Friction Factor
            </Typography>
            <FrictionFactorChart 
              data={chartData?.frictionFactorChart || []}
              isLoading={isLoading}
            />
          </Box>
        </Box>
      ),
    },
    {
      label: 'Interactive',
      icon: <AnalyticsIcon />,
      content: (
        <Box>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Interactive Analysis
            </Typography>
            <InteractiveChart 
              data={chartData?.interactiveChart || []}
              isLoading={isLoading}
            />
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Use the interactive chart to explore different aspects of the hydraulic analysis. 
              Zoom, pan, and hover over data points for detailed information.
            </Typography>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Search Bar for Mobile */}
      {isMobile && (
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search sections or data..."
            value={tableSearchTerm}
            onChange={handleTableSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
          />
        </Box>
      )}

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minWidth: isMobile ? 100 : 140,
            fontSize: isMobile ? '0.875rem' : '1rem',
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon}
            label={isMobile ? '' : tab.label}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box mt={3}>
        {tabs[activeTab].content}
      </Box>
    </Box>
  );
};