import React, { useState } from 'react';
import { Box, Grid, TextField, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FluidConfiguration } from '../../../types/models';

interface FlowConditionsProps {
  className?: string;
}

const FlowConditions: React.FC<FlowConditionsProps> = ({ className }) => {
  const { control, setValue } = useFormContext<FluidConfiguration>();
  const [useMassFlow, setUseMassFlow] = useState<boolean>(true);
  const phase = useWatch({ control, name: 'phase' });
  const massFlowRate = useWatch({ control, name: 'massFlowRate' });
  const volumetricFlowRate = useWatch({ control, name: 'volumetricFlowRate' });

  const handleFlowTypeToggle = (checked: boolean) => {
    setUseMassFlow(checked);
    // Clear the opposite field when switching
    if (checked) {
      setValue('volumetricFlowRate', undefined);
    } else {
      setValue('massFlowRate', undefined);
    }
  };

  const massFlowUnits = [
    { value: 'kg/s', label: 'kg/s' },
    { value: 'lb/min', label: 'lb/min' },
    { value: 'ton/h', label: 'ton/h' },
  ];

  const volumetricFlowUnits = [
    { value: 'm3/s', label: 'm³/s' },
    { value: 'L/min', label: 'L/min' },
    { value: 'gpm', label: 'gpm' },
  ];

  const calculateMissingFlowRate = () => {
    const density = useWatch({ control, name: 'density' });
    if (!density) return;

    if (useMassFlow && volumetricFlowRate) {
      // Calculate mass flow from volumetric flow
      setValue('massFlowRate', volumetricFlowRate * density);
    } else if (!useMassFlow && massFlowRate) {
      // Calculate volumetric flow from mass flow
      setValue('volumetricFlowRate', massFlowRate / density);
    }
  };

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Flow Conditions
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Specify either mass flow rate or volumetric flow rate. For liquids, mass flow rate is typically preferred. 
          For gases, volumetric flow rate at standard conditions is often used.
        </Typography>
      </Alert>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Typography variant="body1">Flow Rate Type:</Typography>
        </Grid>
        <Grid item xs={6} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={useMassFlow}
                onChange={(e) => handleFlowTypeToggle(e.target.checked)}
                color="primary"
              />
            }
            label={useMassFlow ? "Mass Flow" : "Volumetric Flow"}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <Typography variant="body2" color="text.secondary">
            {useMassFlow ? "Enter mass flow rate" : "Enter volumetric flow rate"}
          </Typography>
        </Grid>
      </Grid>

      {useMassFlow ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="massFlowRate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Mass Flow Rate"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value="kg/s"
                            label="Unit"
                            size="small"
                            disabled
                          >
                            {massFlowUnits.map((unit) => (
                              <MenuItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="standardFlowRate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Standard Flow Rate (Optional)"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Flow rate at standard conditions"}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value="m3/s"
                            label="Unit"
                            size="small"
                            disabled
                          >
                            <MenuItem value="m3/s">m³/s (std)</MenuItem>
                            <MenuItem value="L/min">L/min (std)</MenuItem>
                            <MenuItem value="gpm">gpm (std)</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="volumetricFlowRate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Volumetric Flow Rate"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value="m3/s"
                            label="Unit"
                            size="small"
                            disabled
                          >
                            {volumetricFlowUnits.map((unit) => (
                              <MenuItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="standardFlowRate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Standard Flow Rate (Optional)"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Flow rate at standard conditions"}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value="m3/s"
                            label="Unit"
                            size="small"
                            disabled
                          >
                            <MenuItem value="m3/s">m³/s (std)</MenuItem>
                            <MenuItem value="L/min">L/min (std)</MenuItem>
                            <MenuItem value="gpm">gpm (std)</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      )}


      {phase === 'gas' && (
        <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            For gas calculations, ensure the flow rate is specified at the correct pressure and temperature conditions. 
            Standard flow rates are typically referenced to 1 atm and 15°C (60°F).
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FlowConditions;