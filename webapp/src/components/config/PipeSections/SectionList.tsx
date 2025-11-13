import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Typography, Alert } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useConfigurationStore } from '../../../stores/configuration';

interface SectionListProps {
  className?: string;
}

const SectionList: React.FC<SectionListProps> = ({ className }) => {
  const sections = useConfigurationStore((state) => state.sections);
  const { updateSection, removeSection } = useConfigurationStore((state) => state.actions);

  const handleDeleteSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      removeSection(sectionId);
    }
  };

  const getFlowDirectionChip = (direction?: string) => {
    switch (direction) {
      case 'forward':
        return <Chip label="Forward" color="success" size="small" />;
      case 'backward':
        return <Chip label="Backward" color="warning" size="small" />;
      case 'bidirectional':
        return <Chip label="Bi-Directional" color="info" size="small" />;
      default:
        return <Chip label="Auto" color="default" size="small" />;
    }
  };

  const getFittingCount = (fittings: any[]) => {
    return fittings?.reduce((total, fitting) => total + (fitting.quantity || 0), 0) || 0;
  };

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Pipe Sections List
      </Typography>
      
      {sections.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            No pipe sections configured. Add a section to begin defining your network geometry.
          </Typography>
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Dimensions</TableCell>
                <TableCell>Length</TableCell>
                <TableCell>Fittings</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {section.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {section.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {section.pipeDiameter ? `${(section.pipeDiameter * 1000).toFixed(1)} mm` : 
                       section.pipeNPD ? `${section.pipeNPD}" NPS` : 'Not specified'}
                    </Typography>
                    {section.schedule && (
                      <Typography variant="caption" color="text.secondary">
                        Sch {section.schedule}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(section.length || 0).toFixed(1)} m
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getFittingCount(section.fittings)} types
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getFlowDirectionChip(section.direction)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton 
          color="primary" 
          size="small"
          sx={{ 
            backgroundColor: 'action.hover',
            '&:hover': { backgroundColor: 'action.focus' },
            borderRadius: 1,
            px: 1
          }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            Add Section
          </Typography>
        </IconButton>
      </Box>

      {sections.length > 0 && (
        <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Network Summary:</strong> {sections.length} section{sections.length !== 1 ? 's' : ''} configured. 
            Total length: {sections.reduce((total, s) => total + (s.length || 0), 0).toFixed(1)} m.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SectionList;