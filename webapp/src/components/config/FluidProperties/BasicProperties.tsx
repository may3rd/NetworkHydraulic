import React from 'react';
import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { FluidConfiguration } from '../../../types/models';

interface BasicPropertiesProps {
  className?: string;
}

const BasicProperties: React.FC<BasicPropertiesProps> = ({ className }) => {
  const { control, watch } = useFormContext<FluidConfiguration>();
  const phase = watch('phase');

  const temperatureUnits = [
    { value: 'K', label: 'Kelvin (K)' },
    { value: 'C', label: 'Celsius (°C)' },
    { value: 'F', label: 'Fahrenheit (°F)' },
  ];

  const pressureUnits = [
    { value: 'Pa', label: 'Pascal (Pa)' },
    { value: 'kPa', label: 'kiloPascal (kPa)' },
    { value: 'bar', label: 'Bar (bar)' },
    { value: 'psi', label: 'psi (psi)' },
  ];

  return (
    <Box className={className}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="temperature"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Temperature"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ ml: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 60 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value="K"
                          label="Unit"
                          size="small"
                          disabled
                        >
                          {temperatureUnits.map((unit) => (
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
            name="pressure"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Pressure"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ ml: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 60 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value="Pa"
                          label="Unit"
                          size="small"
                          disabled
                        >
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
        {(phase === 'liquid' || phase === 'vapor') && (
          <Grid item xs={12} sm={6}>
            <Controller
              name="density"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Density"
                  fullWidth
                  required={phase === 'liquid'}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || (phase === 'liquid' ? 'Required for liquid phase' : 'Optional for vapor')}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ ml: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <InputLabel>Unit</InputLabel>
                          <Select value="kg/m3" label="Unit" size="small" disabled>
                            <MenuItem value="kg/m3">kg/m³</MenuItem>
                            <MenuItem value="lb/ft3">lb/ft³</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <Controller
            name="viscosity"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Viscosity"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ ml: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Unit</InputLabel>
                        <Select value="Pa.s" label="Unit" size="small" disabled>
                          <MenuItem value="Pa.s">Pa·s</MenuItem>
                          <MenuItem value="cP">cP</MenuItem>
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
    </Box>
  );
};

export default BasicProperties;