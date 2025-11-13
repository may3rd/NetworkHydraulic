import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  TablePagination,
  TableSortLabel,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Speed as SpeedIcon,
  Compress as PressureIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/system';

import { MetricCard } from '../display/MetricCard';
import type { ProcessedSectionResult } from '../../../services/calculation/resultProcessor';

// Define sort keys for nested properties
type SortableKeys =
  | 'id'
  | 'description'
  | 'velocity'
  | 'pressureDrop'
  | 'reynoldsNumber'
  | 'frictionFactor';

interface SectionResultsTableProps {
  sections: ProcessedSectionResult[];
  maxHeight?: number;
  onSectionClick?: (section: ProcessedSectionResult) => void;
}

export const SectionResultsTable: React.FC<SectionResultsTableProps> = ({
  sections,
  maxHeight = 600,
  onSectionClick,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortableKeys>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sorting
  const handleSort = (property: SortableKeys) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortBy(property);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  // Get sorting value based on property
  const getSortValue = (section: ProcessedSectionResult, property: SortableKeys): any => {
    switch (property) {
      case 'velocity':
        return section.flow.velocity;
      case 'pressureDrop':
        return section.flow.pressureDrop;
      case 'reynoldsNumber':
        return section.flow.reynoldsNumber;
      case 'frictionFactor':
        return section.flow.frictionFactor;
      case 'id':
        return section.id;
      case 'description':
        return section.description || '';
      default:
        return section[property as keyof ProcessedSectionResult];
    }
  };

  // Handle search
  const filteredAndSortedSections = useMemo(() => {
    let filtered = sections;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = sections.filter(section =>
        section.id.toLowerCase().includes(lowerSearchTerm) ||
        section.description.toLowerCase().includes(lowerSearchTerm) ||
        section.flow.velocity.toString().includes(lowerSearchTerm) ||
        section.flow.pressureDrop.toString().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const aValue = getSortValue(a, sortBy);
      const bValue = getSortValue(b, sortBy);
      
      // Handle nested object sorting
      let aStrValue = aValue;
      let bStrValue = bValue;
      
      if (typeof aValue === 'object' && aValue !== null) {
        aStrValue = JSON.stringify(aValue);
      }
      if (typeof bValue === 'object' && bValue !== null) {
        bStrValue = JSON.stringify(bValue);
      }
      
      if (aStrValue < bStrValue) return sortOrder === 'asc' ? -1 : 1;
      if (aStrValue > bStrValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sections, searchTerm, sortBy, sortOrder]);

  // Get status color for velocity
  const getVelocityStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      default: return theme.palette.success.main;
    }
  };

  // Get status color for pressure
  const getPressureStatusColor = (status: string) => {
    switch (status) {
      case 'low': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      default: return theme.palette.success.main;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, type: 'velocity' | 'pressure') => {
    if (status === 'critical' || status === 'low') {
      return <ErrorIcon fontSize="small" color="error" />;
    } else if (status === 'high') {
      return <WarningIcon fontSize="small" color="warning" />;
    } else {
      return <InfoIcon fontSize="small" color="success" />;
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (sectionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(sectionId)) {
      newExpandedRows.delete(sectionId);
    } else {
      newExpandedRows.add(sectionId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Get current page data
  const paginatedSections = filteredAndSortedSections.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
      {/* Table Header */}
      <Box p={2} borderBottom={1} borderColor="divider">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Section Results ({filteredAndSortedSections.length} sections)
          </Typography>
          <TextField
            size="small"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 50 }} />
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'id'}
                  direction={sortOrder}
                  onClick={() => handleSort('id')}
                >
                  Section ID
                </TableSortLabel>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'velocity'}
                  direction={sortOrder}
                  onClick={() => handleSort('velocity')}
                >
                  Velocity (m/s)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'pressureDrop'}
                  direction={sortOrder}
                  onClick={() => handleSort('pressureDrop')}
                >
                  Pressure Drop (Pa)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'reynoldsNumber'}
                  direction={sortOrder}
                  onClick={() => handleSort('reynoldsNumber')}
                >
                  Reynolds #
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSections.map((section) => {
              const isExpanded = expandedRows.has(section.id);
              const velocityStatusColor = getVelocityStatusColor(section.status.velocityStatus);
              const pressureStatusColor = getPressureStatusColor(section.status.pressureStatus);

              return (
                <React.Fragment key={section.id}>
                  <TableRow
                    hover
                    onClick={() => onSectionClick?.(section)}
                    sx={{
                      cursor: onSectionClick ? 'pointer' : 'default',
                      backgroundColor: isExpanded ? alpha(theme.palette.primary.main, 0.05) : 'inherit',
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(section.id);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {section.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {section.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SpeedIcon fontSize="small" sx={{ color: velocityStatusColor }} />
                        <Typography variant="body2">
                          {section.flow.velocity.toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {section.flow.pressureDrop.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {section.flow.reynoldsNumber.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title={`Velocity: ${section.status.velocityStatus}`}>
                          {getStatusIcon(section.status.velocityStatus, 'velocity')}
                        </Tooltip>
                        <Tooltip title={`Pressure: ${section.status.pressureStatus}`}>
                          {getStatusIcon(section.status.pressureStatus, 'pressure')}
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View detailed analysis">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ py: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Box ml={6} mr={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box height={80}>
                                <Typography variant="body2" fontWeight="bold">
                                  Diameter
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {section.geometry.diameter.toFixed(4)} m
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box height={80}>
                                <Typography variant="body2" fontWeight="bold">
                                  Length
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {section.geometry.length.toFixed(2)} m
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box height={80}>
                                <Typography variant="body2" fontWeight="bold">
                                  Friction Factor
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {section.flow.frictionFactor.toFixed(4)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box height={80}>
                                <Typography variant="body2" fontWeight="bold">
                                  Area
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {section.geometry.area.toFixed(4)} m²
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                              <Box mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                  Recommendation:
                                </Typography>
                                <Typography variant="body2">
                                  {section.status.recommendation}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                              <Box mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                  Loss Breakdown:
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={0.5}>
                                  <Typography variant="caption">
                                    Friction Loss: {section.losses.frictionLoss.toFixed(0)} Pa ({((section.losses.frictionLoss / section.losses.totalLoss) * 100).toFixed(1)}%)
                                  </Typography>
                                  <Typography variant="caption">
                                    Fitting Loss: {section.losses.fittingLoss.toFixed(0)} Pa ({((section.losses.fittingLoss / section.losses.totalLoss) * 100).toFixed(1)}%)
                                  </Typography>
                                  <Typography variant="caption">
                                    Elevation Loss: {section.losses.elevationLoss.toFixed(0)} Pa ({((section.losses.elevationLoss / section.losses.totalLoss) * 100).toFixed(1)}%)
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredAndSortedSections.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};