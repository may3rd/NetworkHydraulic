import React from 'react';
import { Box, Grid, TextField, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

interface PipePropertiesProps {
  className?: string;
}

const PipeProperties: React.FC<PipePropertiesProps> = ({ className }) => {
  const { control } = useFormContext();

  const scheduleOptions = [
    '5', '10', '20', '30', '40', '80', '120', '160', 'XXS'
  ];

  const npsOptions = [
    0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24
  ];

  const [dimensionType, setDimensionType] = React.useState<'nps' | 'diameter'>('nps');

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Pipe Geometry Properties
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Specify pipe dimensions either using standard NPS (Nominal Pipe Size) with schedule, 
          or provide direct diameter measurement. NPS is recommended for standard pipe sizes.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="pipeNPD"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth>
                <InputLabel>Dimension Type</InputLabel>
                <Select
                  {...field}
                  value={dimensionType}
                  label="Dimension Type"
                  onChange={(e) => {
                    setDimensionType(e.target.value as 'nps' | 'diameter');
                    field.onChange(e.target.value);
                  }}
                >
                  <MenuItem value="nps">NPS (Nominal Pipe Size)</MenuItem>
                  <MenuItem value="diameter">Direct Diameter</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      {dimensionType === 'nps' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="pipeNPD"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth>
                  <InputLabel>NPS Size</InputLabel>
                  <Select
                    {...field}
                    label="NPS Size"
                  >
                    {npsOptions.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}"
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="schedule"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth>
                  <InputLabel>Schedule</InputLabel>
                  <Select
                    {...field}
                    label="Schedule"
                  >
                    {scheduleOptions.map((schedule) => (
                      <MenuItem key={schedule} value={schedule}>
                        {schedule}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="length"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Length"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Length of this pipe section"}
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
              name="roughness"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Roughness"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Pipe internal roughness (typically 0.0015-0.046 mm for steel)"}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        mm
                      </Typography>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="pipeDiameter"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Pipe Diameter"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Internal diameter of the pipe"}
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
              name="length"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Length"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Length of this pipe section"}
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
              name="roughness"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Roughness"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Pipe internal roughness"}
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
        </Grid>
      )}

      <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Standard Pipe Dimensions:</strong>
          {' '}
          For NPS 1/8" to NPS 12", the pipe outside diameter is standardized. 
          The schedule determines the wall thickness. Common schedules: 40 (standard), 80 (extra strong).
        </Typography>
      </Alert>
    </Box>
  );
};

export default PipeProperties;