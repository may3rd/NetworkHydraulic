import React from 'react';
import { Box, Grid, TextField, Typography, Alert, Collapse } from '@mui/material';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FluidConfiguration } from '../../../types/models';

interface AdvancedPropertiesProps {
  className?: string;
}

const AdvancedProperties: React.FC<AdvancedPropertiesProps> = ({ className }) => {
  const { control } = useFormContext<FluidConfiguration>();
  const phase = useWatch({ control, name: 'phase' });

  const isGasOrVapor = phase === 'gas' || phase === 'vapor';

  // Gas-specific properties
  const gasProperties = [
    {
      name: 'molecularWeight',
      label: 'Molecular Weight',
      unit: 'kg/kmol',
      required: true,
      description: 'Molecular weight of the gas (e.g., 28.97 for air, 2.016 for hydrogen)'
    },
    {
      name: 'zFactor',
      label: 'Compressibility Factor (Z)',
      unit: 'dimensionless',
      required: false,
      description: 'Gas compressibility factor (typically 0.8-1.2, use 1.0 if unknown)'
    },
    {
      name: 'specificHeatRatio',
      label: 'Specific Heat Ratio (k)',
      unit: 'dimensionless',
      required: false,
      description: 'Ratio of specific heats (Cp/Cv, typically 1.1-1.67)'
    }
  ];

  // Liquid-specific properties
  const liquidProperties = [
    {
      name: 'specificGravity',
      label: 'Specific Gravity',
      unit: 'dimensionless',
      required: false,
      description: 'Ratio of fluid density to water density at 4°C'
    },
    {
      name: 'bulkModulus',
      label: 'Bulk Modulus',
      unit: 'Pa',
      required: false,
      description: 'Fluid resistance to compression (for precise calculations)'
    }
  ];

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Advanced Properties
      </Typography>
      
      <Collapse in={isGasOrVapor}>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
            <Typography variant="body2">
              Gas properties are required for accurate compressible flow calculations. 
              If unsure, use typical values or consult fluid property references.
            </Typography>
          </Alert>
          
          <Grid container spacing={2}>
            {gasProperties.map((property) => (
              <Grid item xs={12} sm={6} key={property.name}>
                <Controller
                  name={property.name as keyof FluidConfiguration}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label={property.label}
                      fullWidth
                      required={property.required}
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message || 
                        (property.required ? 'Required for gas phase' : property.description)
                      }
                      InputProps={{
                        endAdornment: (
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {property.unit}
                          </Typography>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      <Collapse in={phase === 'liquid'}>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
            <Typography variant="body2">
              Liquid properties are optional but can improve calculation accuracy for specialized applications.
            </Typography>
          </Alert>
          
          <Grid container spacing={2}>
            {liquidProperties.map((property) => (
              <Grid item xs={12} sm={6} key={property.name}>
                <Controller
                  name={property.name as keyof FluidConfiguration}
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label={property.label}
                      fullWidth
                      required={property.required}
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message || 
                        (property.required ? 'Required' : property.description)
                      }
                      InputProps={{
                        endAdornment: (
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {property.unit}
                          </Typography>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      {/* Common advanced properties */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Fluid Name"
                fullWidth
                helperText="Optional descriptive name for the fluid"
                InputProps={{
                  sx: {
                    '&::placeholder': {
                      opacity: 0.7,
                    }
                  }
                }}
              />
            )}
          />
        </Grid>
      </Grid>

      {phase && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2, borderRadius: 1 }}
          icon={false}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Property Guidelines:
          </Typography>
          <Typography variant="body2">
            {phase === 'gas' && "For gases, molecular weight is critical for density calculations. "}
            {phase === 'liquid' && "For liquids, density is the most important property. "}
            When in doubt, consult engineering references or use default values for common fluids.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default AdvancedProperties;