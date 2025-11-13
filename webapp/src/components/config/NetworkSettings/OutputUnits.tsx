import React from 'react';
import { Box, Grid, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { NetworkConfiguration } from '../../../types/models';

interface OutputUnitsProps {
  className?: string;
}

const OutputUnits: React.FC<OutputUnitsProps> = ({ className }) => {
  const { control } = useFormContext<NetworkConfiguration>();

  const unitOptions = {
    pressure: [
      { value: 'Pa', label: 'Pascal (Pa)' },
      { value: 'kPa', label: 'kiloPascal (kPa)' },
      { value: 'bar', label: 'Bar (bar)' },
      { value: 'psi', label: 'psi (psi)' },
      { value: 'atm', label: 'Atmosphere (atm)' },
    ],
    temperature: [
      { value: 'K', label: 'Kelvin (K)' },
      { value: 'C', label: 'Celsius (°C)' },
      { value: 'F', label: 'Fahrenheit (°F)' },
    ],
    length: [
      { value: 'm', label: 'Meter (m)' },
      { value: 'mm', label: 'Millimeter (mm)' },
      { value: 'in', label: 'Inch (in)' },
      { value: 'ft', label: 'Foot (ft)' },
    ],
    flowRate: [
      { value: 'm3/s', label: 'm³/s' },
      { value: 'L/min', label: 'L/min' },
      { value: 'gpm', label: 'gpm' },
      { value: 'kg/s', label: 'kg/s' },
      { value: 'lb/min', label: 'lb/min' },
    ],
    velocity: [
      { value: 'm/s', label: 'm/s' },
      { value: 'ft/s', label: 'ft/s' },
      { value: 'km/h', label: 'km/h' },
    ],
    density: [
      { value: 'kg/m3', label: 'kg/m³' },
      { value: 'lb/ft3', label: 'lb/ft³' },
      { value: 'g/cm3', label: 'g/cm³' },
    ],
  };

  const getDefaultUnit = (category: string) => {
    switch (category) {
      case 'pressure': return 'kPa';
      case 'temperature': return 'C';
      case 'length': return 'm';
      case 'flowRate': return 'm3/s';
      case 'velocity': return 'm/s';
      case 'density': return 'kg/m3';
      default: return '';
    }
  };

  const getUnitDescription = (category: string) => {
    switch (category) {
      case 'pressure': return 'Pressure measurements throughout the network';
      case 'temperature': return 'Temperature values in results';
      case 'length': return 'Pipe lengths, diameters, and elevation changes';
      case 'flowRate': return 'Volumetric and mass flow rates';
      case 'velocity': return 'Fluid velocity in pipes';
      case 'density': return 'Fluid density values';
      default: return '';
    }
  };

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Output Units
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Configure the units for displaying calculation results. These settings control how results are presented 
          in tables, charts, and reports. The underlying calculations always use SI units internally.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {Object.entries(unitOptions).map(([category, options]) => (
          <Grid item xs={12} sm={6} key={category}>
            <Controller
              name={`outputUnits.${category}` as any}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </InputLabel>
                  <Select
                    {...field}
                    value={field.value || getDefaultUnit(category)}
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                  >
                    {options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{option.label}</span>
                          {field.value === option.value && (
                            <Chip size="small" label="Selected" color="primary" variant="outlined" />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {getUnitDescription(category)}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Unit Conversion:</strong> All results will be automatically converted to your selected units. 
          You can mix and match units from different systems (e.g., SI for pressure, Imperial for length) based on your preferences.
        </Typography>
      </Alert>

      <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Consistency Tip:</strong> For engineering calculations, it's often best to use consistent unit systems 
          (all SI or all Imperial) to avoid confusion and ensure dimensional consistency in manual calculations.
        </Typography>
      </Alert>
    </Box>
  );
};

export default OutputUnits;