import React, { useState } from 'react';
import { Box, Grid, Typography, Alert, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

interface FittingsSelectorProps {
  className?: string;
}

const FittingsSelector: React.FC<FittingsSelectorProps> = ({ className }) => {
  const { control } = useFormContext();
  
  const [fittingsDialogOpen, setFittingsDialogOpen] = useState(false);

  // Common fittings with typical K-factors
  const fittingLibrary = [
    { type: '90° Elbow (Standard)', kFactor: 0.75, description: 'Standard 90-degree elbow' },
    { type: '90° Elbow (Long Radius)', kFactor: 0.45, description: 'Long radius 90-degree elbow' },
    { type: '45° Elbow (Standard)', kFactor: 0.35, description: 'Standard 45-degree elbow' },
    { type: '90° Tee (Through)', kFactor: 0.9, description: 'Tee fitting - straight through flow' },
    { type: '90° Tee (Branch)', kFactor: 2.0, description: 'Tee fitting - branch flow' },
    { type: 'Gate Valve (Fully Open)', kFactor: 0.17, description: 'Gate valve - fully open' },
    { type: 'Globe Valve (Fully Open)', kFactor: 6.4, description: 'Globe valve - fully open' },
    { type: 'Ball Valve (Fully Open)', kFactor: 0.05, description: 'Ball valve - fully open' },
    { type: 'Check Valve (Swing)', kFactor: 2.0, description: 'Swing check valve' },
    { type: 'Sudden Expansion', kFactor: 1.0, description: 'Sudden pipe expansion' },
    { type: 'Sudden Contraction', kFactor: 0.5, description: 'Sudden pipe contraction' },
    { type: 'Pipe Entrance (Square)', kFactor: 0.5, description: 'Square entrance from tank' },
    { type: 'Pipe Exit', kFactor: 1.0, description: 'Exit loss to tank' },
  ];

  const [selectedFittings, setSelectedFittings] = useState<Array<{type: string, quantity: number, kFactor: number, description?: string}>>([]);

  const handleAddFitting = (fitting: typeof fittingLibrary[0]) => {
    const existingIndex = selectedFittings.findIndex(f => f.type === fitting.type);
    if (existingIndex >= 0) {
      const updated = [...selectedFittings];
      updated[existingIndex].quantity += 1;
      setSelectedFittings(updated);
    } else {
      setSelectedFittings([...selectedFittings, { ...fitting, quantity: 1 }]);
    }
  };

  const handleRemoveFitting = (index: number) => {
    setSelectedFittings(selectedFittings.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedFittings];
    updated[index].quantity = Math.max(0, quantity);
    setSelectedFittings(updated.filter(f => f.quantity > 0));
  };

  const getTotalKFactor = () => {
    return selectedFittings.reduce((total, fitting) => total + (fitting.kFactor * fitting.quantity), 0);
  };

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Fittings and K-Factors
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Select fittings from the library or add custom fittings. Each fitting contributes to the total pressure loss 
          through its K-factor. The total K-factor is the sum of all fittings multiplied by their quantities.
        </Typography>
      </Alert>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => setFittingsDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Add Fitting
        </Button>
        <Typography variant="body2" color="text.secondary">
          Total K-factor: {getTotalKFactor().toFixed(3)}
        </Typography>
      </Box>

      {selectedFittings.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fitting Type</TableCell>
                <TableCell>K-Factor</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total K</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedFittings.map((fitting, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {fitting.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fitting.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {fitting.kFactor.toFixed(3)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={fitting.quantity}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                      sx={{ width: 80 }}
                      inputProps={{ min: 0, style: { textAlign: 'center' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(fitting.kFactor * fitting.quantity).toFixed(3)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleRemoveFitting(index)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            No fittings selected. Add fittings to include minor losses in your pressure drop calculations.
          </Typography>
        </Alert>
      )}

      <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Fitting Guidelines:</strong>
          {' '}
          Use manufacturer data when available for accurate K-factors. For standard fittings, 
          the values provided are typical but may vary based on specific geometry and Reynolds number.
        </Typography>
      </Alert>

      {/* Fittings Selection Dialog */}
      <Dialog 
        open={fittingsDialogOpen} 
        onClose={() => setFittingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Fittings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {fittingLibrary.map((fitting, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    handleAddFitting(fitting);
                    setFittingsDialogOpen(false);
                  }}
                  sx={{ 
                    height: '100%',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    mb: 1
                  }}
                >
                  <Box sx={{ textAlign: 'left', width: '100%' }}>
                    <Typography variant="body2" fontWeight={500}>
                      {fitting.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      K = {fitting.kFactor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fitting.description}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFittingsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FittingsSelector;