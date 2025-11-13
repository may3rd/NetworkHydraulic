import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/system';
import {
  Dashboard as DashboardIcon,
  TableChart as TableChartIcon,
  InsertChartOutlined as ChartIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ResultsNavigationProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  resultInfo: {
    networkName: string;
    sectionsCount: number;
    calculationTime: number;
    criticalSections: number;
  };
  actions?: {
    onFilter?: () => void;
    onSort?: () => void;
    onSearch?: () => void;
    onExport?: () => void;
    onRefresh?: () => void;
  };
  drawerOpen?: boolean;
  onDrawerToggle?: () => void;
  width?: number;
}

export const ResultsNavigation: React.FC<ResultsNavigationProps> = ({
  activeTab,
  onTabChange,
  resultInfo,
  actions,
  drawerOpen = false,
  onDrawerToggle,
  width = 240,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    {
      id: 0,
      label: 'Dashboard',
      icon: <DashboardIcon />,
      count: undefined,
    },
    {
      id: 1,
      label: 'Tables',
      icon: <TableChartIcon />,
      count: resultInfo.sectionsCount,
    },
    {
      id: 2,
      label: 'Charts',
      icon: <ChartIcon />,
      count: undefined,
    },
    {
      id: 3,
      label: 'Analysis',
      icon: <AnalyticsIcon />,
      count: undefined,
    },
    {
      id: 4,
      label: 'Settings',
      icon: <SettingsIcon />,
      count: undefined,
    },
  ];

  const renderActions = () => (
    <Box p={2}>
      <Typography variant="subtitle2" gutterBottom>
        Actions
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <IconButton
          size="small"
          onClick={actions?.onFilter}
          title="Filter Results"
          sx={{
            justifyContent: 'flex-start',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <FilterIcon fontSize="small" sx={{ mr: 1 }} />
          Filter
        </IconButton>
        
        <IconButton
          size="small"
          onClick={actions?.onSort}
          title="Sort Results"
          sx={{
            justifyContent: 'flex-start',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <SortIcon fontSize="small" sx={{ mr: 1 }} />
          Sort
        </IconButton>
        
        <IconButton
          size="small"
          onClick={actions?.onSearch}
          title="Search Results"
          sx={{
            justifyContent: 'flex-start',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <SearchIcon fontSize="small" sx={{ mr: 1 }} />
          Search
        </IconButton>
        
        <IconButton
          size="small"
          onClick={actions?.onExport}
          title="Export Results"
          sx={{
            justifyContent: 'flex-start',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export
        </IconButton>
        
        <IconButton
          size="small"
          onClick={actions?.onRefresh}
          title="Refresh Results"
          sx={{
            justifyContent: 'flex-start',
            px: 1,
            py: 0.5,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
          Refresh
        </IconButton>
      </Box>
    </Box>
  );

  const renderStats = () => (
    <Box p={2}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Stats
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        <Chip
          label={`${resultInfo.sectionsCount} sections`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${resultInfo.calculationTime.toFixed(2)}s calc time`}
          size="small"
          variant="outlined"
        />
        {resultInfo.criticalSections > 0 && (
          <Chip
            label={`${resultInfo.criticalSections} critical`}
            size="small"
            color="error"
          />
        )}
      </Box>
    </Box>
  );

  const navigationContent = (
    <Box sx={{ width, height: '100%', backgroundColor: theme.palette.background.paper }}>
      {/* Header */}
      <Box p={2} borderBottom={1} borderColor="divider">
        <Typography variant="h6" component="h2" gutterBottom>
          Results
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" paragraph>
          {resultInfo.networkName}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.id}
            selected={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ListItemIcon>
              {activeTab === item.id ? (
                React.cloneElement(item.icon, { 
                  color: 'primary' as const,
                  sx: { color: theme.palette.primary.main }
                })
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
              }}
            />
            {item.count !== undefined && (
              <Chip
                label={item.count}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Actions */}
      {renderActions()}

      <Divider />

      {/* Stats */}
      {renderStats()}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {navigationContent}
      </Drawer>
    );
  }

  return navigationContent;
};