import React from 'react';
import { Box, RadioGroup, FormControlLabel, Radio, Typography, Alert } from '@mui/material';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { NetworkConfiguration } from '../../../types/models';

interface GasFlowModelProps {
  className?: string;
}

const GasFlowModel: React.FC<GasFlowModelProps> = ({ className }) => {
  const { control } = useFormContext<NetworkConfiguration>();
  const fluidPhase = useWatch({ name: 'fluid.phase' });

  const modelOptions = [
    {
      value: 'isothermal',
      label: 'Isothermal',
      description: 'Constant temperature throughout the network',
      icon: '🌡️',
      details: 'Assumes temperature remains constant during flow. Suitable for long pipelines with good thermal insulation or when temperature changes are minimal.'
    },
    {
      value: 'adiabatic',
      label: 'Adiabatic',
      description: 'No heat transfer (constant entropy)',
      icon: '🔥',
      details: 'Assumes no heat transfer with surroundings. Suitable for short runs, rapid flow, or when thermal effects are significant.'
    }
  ];

  const getModelDescription = (modelValue: string) => {
    switch (modelValue) {
      case 'isothermal':
        return 'Temperature remains constant throughout the pipe network. Pressure drop calculations account for density changes due to pressure only.';
      case 'adiabatic':
        return 'No heat transfer occurs between the fluid and surroundings. Temperature can change due to pressure changes, affecting density and velocity.';
      default:
        return '';
    }
  };

  const getRecommendation = (modelValue: string) => {
    switch (modelValue) {
      case 'isothermal':
        return 'Recommended for: Long pipelines, well-insulated systems, or when temperature measurements show minimal variation.';
      case 'adiabatic':
        return 'Recommended for: Short pipe runs, rapid flow conditions, or when temperature changes significantly affect system performance.';
      default:
        return '';
    }
  };

  // Only show gas flow model options for gas or vapor phases
  if (fluidPhase !== 'gas' && fluidPhase !== 'vapor') {
    return null;
  }

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Gas Flow Model
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          Select the appropriate thermodynamic model for gas flow calculations. The choice affects how temperature 
          and density changes are handled throughout the network.
        </Typography>
      </Alert>
      
      <Controller
        name="gasFlowModel"
        control={control}
        render={({ field }) => (
          <Box>
            <RadioGroup
              {...field}
              value={field.value || 'isothermal'}
              sx={{ gap: 1 }}
            >
              {modelOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {option.icon} {option.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {option.details}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: `1px solid ${field.value === option.value ? 'primary.main' : 'divider'}`,
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1,
                    backgroundColor: field.value === option.value ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.focus',
                    }
                  }}
                />
              ))}
            </RadioGroup>
            
            <Alert 
              severity="info" 
              sx={{ mt: 2, borderRadius: 1 }}
            >
              <Typography variant="body2">
                <strong>Model Details:</strong> {getModelDescription(field.value || 'isothermal')}
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Recommendation:</strong> {getRecommendation(field.value || 'isothermal')}
              </Typography>
            </Alert>
          </Box>
        )}
      />
      
      <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Model Selection Guidelines:</strong>
          {' '}
          For most applications, the isothermal model is sufficient and computationally simpler. 
          Use the adiabatic model when you expect significant temperature changes due to pressure drops 
          or when dealing with high-velocity flows where thermal effects are important.
        </Typography>
      </Alert>
    </Box>
  );
};

export default GasFlowModel;