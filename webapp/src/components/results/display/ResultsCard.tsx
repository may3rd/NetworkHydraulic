import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface ResultsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevation';
  loading?: boolean;
  error?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  exportable?: boolean;
  onExport?: () => void;
  shareable?: boolean;
  onShare?: () => void;
  refreshable?: boolean;
  onRefresh?: () => void;
  sx?: any;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  loading = false,
  error,
  collapsible = false,
  expanded = true,
  onToggleExpand,
  exportable = false,
  onExport,
  shareable = false,
  onShare,
  refreshable = false,
  onRefresh,
  sx,
}) => {
  const theme = useTheme();

  // Determine card variant styles
  const getCardSx = () => {
    const baseStyles = {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...sx,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyles,
          border: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.grey[50] 
            : theme.palette.grey[900],
        };
      case 'elevation':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.background.paper
            : theme.palette.grey[800],
        };
      default:
        return baseStyles;
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <Card sx={getCardSx()}>
        <CardHeader
          title={title}
          subheader={subtitle}
          action={
            <Box display="flex" gap={1}>
              <Chip size="small" label="Loading..." variant="outlined" />
            </Box>
          }
        />
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <Typography color="text.secondary">Loading data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card sx={getCardSx()}>
        <CardHeader
          title={title}
          subheader={subtitle}
          action={
            <Box display="flex" gap={1}>
              <Chip size="small" label="Error" color="error" />
            </Box>
          }
        />
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
            flexDirection="column"
            gap={2}
          >
            <InfoIcon color="error" sx={{ fontSize: 48 }} />
            <Typography color="error" align="center">
              {error}
            </Typography>
            {onRefresh && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
              >
                Try Again
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={getCardSx()}>
      {/* Card Header */}
      <CardHeader
        title={
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        }
        subheader={subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {/* Action buttons */}
            {refreshable && (
              <IconButton size="small" onClick={onRefresh} title="Refresh">
                <RefreshIcon />
              </IconButton>
            )}
            
            {shareable && (
              <IconButton size="small" onClick={onShare} title="Share">
                <ShareIcon />
              </IconButton>
            )}
            
            {exportable && (
              <IconButton size="small" onClick={onExport} title="Export">
                <DownloadIcon />
              </IconButton>
            )}
            
            {collapsible && (
              <IconButton 
                size="small" 
                onClick={onToggleExpand} 
                title={expanded ? "Collapse" : "Expand"}
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            
            {actions}
          </Box>
        }
        sx={{
          paddingBottom: 1,
        }}
      />

      {/* Card Content */}
      {(expanded || !collapsible) && (
        <CardContent
          sx={{
            flexGrow: 1,
            paddingTop: 0,
            paddingBottom: '16px !important',
          }}
        >
          {children}
        </CardContent>
      )}

      {/* Card Actions */}
      {actions && (
        <CardActions
          sx={{
            justifyContent: 'flex-end',
            paddingTop: 0,
          }}
        >
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

// Specialized result cards for common use cases

export const SummaryCard: React.FC<Omit<ResultsCardProps, 'variant'>> = (props) => (
  <ResultsCard {...props} variant="outlined" />
);

export const ChartCard: React.FC<Omit<ResultsCardProps, 'variant' | 'exportable' | 'onExport'>> = (props) => (
  <ResultsCard {...props} variant="elevation" exportable onExport={() => {}} />
);

export const TableCard: React.FC<Omit<ResultsCardProps, 'variant' | 'exportable' | 'onExport'>> = (props) => (
  <ResultsCard {...props} variant="default" exportable onExport={() => {}} />
);

export const AnalysisCard: React.FC<Omit<ResultsCardProps, 'variant'>> = (props) => (
  <ResultsCard {...props} variant="outlined" />
);