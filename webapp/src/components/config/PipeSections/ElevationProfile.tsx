import React from 'react';
import { Box, Grid, TextField, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

interface ElevationProfileProps {
  className?: string;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({ className }) => {
  const { control } = useFormContext();

  const elevationChangeTypes = [
    { value: 'flat', label: 'Flat (No elevation change)' },
    { value: 'rise', label: 'Rise (Upward slope)' },
    { value: 'drop', label: 'Drop (Downward slope)' },
    { value: 'complex', label: 'Complex (Multiple changes)' },
  ];

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Elevation Profile
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Specify elevation changes for this pipe section. Elevation changes significantly affect pressure 
          calculations in liquid systems due to hydrostatic pressure differences.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="elevationChangeType"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth>
                <InputLabel>Elevation Change Type</InputLabel>
                <Select
                  {...field}
                  label="Elevation Change Type"
                >
                  {elevationChangeTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Controller
            name="elevationChange"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Elevation Change"
                fullWidth
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Height difference from inlet to outlet"}
                InputProps={{
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      m
                    </Typography>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="inletElevation"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Inlet Elevation (Optional)"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Absolute elevation at section inlet"}
                InputProps={{
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      m
                    </Typography>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="outletElevation"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Outlet Elevation (Optional)"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Absolute elevation at section outlet"}
                InputProps={{
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      m
                    </Typography>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="slopeDescription"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Slope Description (Optional)"
                fullWidth
                multiline
                rows={2}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || "Description of the slope profile (e.g., 'gradual 5° slope', 'steep hill')"}
              />
            )}
          />
        </Grid>
      </Grid>

      <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Elevation Guidelines:</strong>
          {' '}
          For liquids, elevation changes directly affect pressure: ΔP = ρgh. 
          Positive elevation change (rise) increases pressure drop, while negative change (drop) decreases it. 
          For gases, elevation effects are usually negligible unless elevation changes are very large.
        </Typography>
      </Alert>

      <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Calculation Notes:</strong>
          {' '}
          If both elevation change and absolute elevations are provided, the elevation change takes precedence. 
          Absolute elevations are used for system-wide elevation profiles and visualization purposes.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ElevationProfile;