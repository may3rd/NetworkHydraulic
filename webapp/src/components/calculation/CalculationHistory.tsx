import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Pagination,
  Stack,
} from '@mui/material';
import {
  History as HistoryIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useCalculationStore } from '../../stores/calculation';

interface CalculationHistoryItem {
  id: string;
  timestamp: string;
  status: 'completed' | 'error' | 'cancelled';
  duration?: number;
  sectionsCount: number;
  description?: string;
  result?: any;
  error?: string;
}

interface CalculationHistoryProps {
  items?: CalculationHistoryItem[];
  onRunCalculation?: (id: string) => void;
  onDeleteCalculation?: (id: string) => void;
  onExportCalculation?: (id: string, format: string) => void;
  onDuplicateCalculation?: (id: string) => void;
  onClearHistory?: () => void;
  showActions?: boolean;
  maxItemsPerPage?: number;
  searchable?: boolean;
}

export const CalculationHistory: React.FC<CalculationHistoryProps> = ({
  items = [],
  onRunCalculation,
  onDeleteCalculation,
  onExportCalculation,
  onDuplicateCalculation,
  onClearHistory,
  showActions = true,
  maxItemsPerPage = 10,
  searchable = true,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const history = useCalculationStore((state) => state.history);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedItem(itemId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (selectedItem && onDeleteCalculation) {
      onDeleteCalculation(selectedItem);
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (selectedItem && onDuplicateCalculation) {
      onDuplicateCalculation(selectedItem);
    }
    handleMenuClose();
  };

  const handleExport = (format: string) => {
    if (selectedItem && onExportCalculation) {
      onExportCalculation(selectedItem, format);
    }
    handleMenuClose();
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'error':
        return <Chip label="Error" color="error" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} min`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(item.timestamp).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate items
  const paginatedItems = filteredItems.slice(
    (page - 1) * maxItemsPerPage,
    page * maxItemsPerPage
  );

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Calculation History
            </Typography>
            {items.length > 0 && (
              <Chip
                label={items.length}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        action={
          items.length > 0 && (
            <Button
              startIcon={<ClearIcon />}
              onClick={onClearHistory}
              size="small"
              color="error"
            >
              Clear All
            </Button>
          )
        }
        sx={{ pb: 1 }}
      />
      
      <CardContent>
        {searchable && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search calculations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSearchClear}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {items.length === 0 ? (
          <Alert severity="info" icon={<HistoryIcon />}>
            No calculations in history. Run your first calculation to see it here.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Time</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Sections</TableCell>
                    <TableCell align="center">Duration</TableCell>
                    <TableCell align="center">Status</TableCell>
                    {showActions && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.description || `Calculation ${item.id.substring(0, 8)}`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {item.sectionsCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {formatDuration(item.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {getStatusChip(item.status)}
                      </TableCell>
                      {showActions && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, item.id)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedItems.length} of {filteredItems.length} calculations
              </Typography>
              <Pagination
                count={Math.ceil(filteredItems.length / maxItemsPerPage)}
                page={page}
                onChange={handlePageChange}
                size="small"
              />
            </Box>
          </>
        )}

        {/* Actions menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          {onRunCalculation && (
            <MenuItem onClick={() => { onRunCalculation(selectedItem!); handleMenuClose(); }}>
              <ListItemIcon>
                <PlayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rerun Calculation</ListItemText>
            </MenuItem>
          )}
          {onDuplicateCalculation && (
            <MenuItem onClick={handleDuplicate}>
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
          )}
          {onExportCalculation && (
            <>
              <MenuItem onClick={() => handleExport('json')}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as JSON</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('excel')}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as Excel</ListItemText>
              </MenuItem>
            </>
          )}
          {onDeleteCalculation && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};