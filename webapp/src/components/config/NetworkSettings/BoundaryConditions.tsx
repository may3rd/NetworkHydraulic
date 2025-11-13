import React from 'react';
import { Box, Grid, TextField, Typography, Alert, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NetworkConfiguration } from '../../../types/models';

interface BoundaryConditionsProps {
  className?: string;
}

const BoundaryConditions: React.FC<BoundaryConditionsProps> = ({ className }) => {
  const { control } = useFormContext<NetworkConfiguration>();
  const direction = useWatch({ control, name: 'direction' });

  const pressureUnits = [
    { value: 'Pa', label: 'Pascal (Pa)' },
    { value: 'kPa', label: 'kiloPascal (kPa)' },
    { value: 'bar', label: 'Bar (bar)' },
    { value: 'psi', label: 'psi (psi)' },
    { value: 'atm', label: 'Atmosphere (atm)' },
  ];

  const [pressureType, setPressureType] = React.useState<'upstream-downstream' | 'boundary'>('upstream-downstream');

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Boundary Conditions
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Set the pressure boundary conditions for your network. For most calculations, specify upstream and downstream pressures. 
          For complex networks, you may use boundary pressure with flow direction.
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Pressure Configuration Method:
        </Typography>
        <RadioGroup
          value={pressureType}
          onChange={(e) => setPressureType(e.target.value as typeof pressureType)}
          row
        >
          <FormControlLabel
            value="upstream-downstream"
            control={<Radio />}
            label="Upstream/Downstream"
          />
          <FormControlLabel
            value="boundary"
            control={<Radio />}
            label="Boundary Pressure"
          />
        </RadioGroup>
      </Box>

      {pressureType === 'upstream-downstream' ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="upstreamPressure"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Upstream Pressure"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Pressure at network inlet"}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select value="Pa" label="Unit" size="small" disabled>
                            {pressureUnits.map((unit) => (
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
              name="downstreamPressure"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Downstream Pressure"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Pressure at network outlet"}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select value="Pa" label="Unit" size="small" disabled>
                            {pressureUnits.map((unit) => (
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
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="boundaryPressure"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Boundary Pressure"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Reference pressure for the network"}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select value="Pa" label="Unit" size="small" disabled>
                            {pressureUnits.map((unit) => (
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
        </Grid>
      )}

      <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Pressure Guidelines:</strong>
          {' '}
          {pressureType === 'upstream-downstream' ? (
            <>
              Upstream pressure should be higher than downstream pressure for forward flow. 
              The pressure difference drives the flow through the network.
            </>
          ) : (
            <>
              Boundary pressure serves as a reference point. Combined with flow direction, 
              it helps determine pressure distribution throughout the network.
            </>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default BoundaryConditions;