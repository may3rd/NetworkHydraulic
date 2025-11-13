import React from 'react';
import { Box, RadioGroup, FormControlLabel, Radio, Typography, Alert } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { NetworkConfiguration } from '../../../types/models';

interface FlowDirectionProps {
  className?: string;
}

const FlowDirection: React.FC<FlowDirectionProps> = ({ className }) => {
  const { control } = useFormContext<NetworkConfiguration>();

  const directionOptions = [
    {
      value: 'auto',
      label: 'Auto-Detect',
      description: 'Automatically determine flow direction from pressure boundary conditions',
      icon: '🔄'
    },
    {
      value: 'forward',
      label: 'Forward',
      description: 'Flow from upstream to downstream (inlet to outlet)',
      icon: '➡️'
    },
    {
      value: 'backward',
      label: 'Backward',
      description: 'Flow from downstream to upstream (reverse flow)',
      icon: '⬅️'
    }
  ];

  const getDirectionDescription = (directionValue: string) => {
    switch (directionValue) {
      case 'auto':
        return 'The solver will automatically determine flow direction based on pressure boundary conditions. Recommended for most applications.';
      case 'forward':
        return 'Forces flow from the network inlet to the outlet. Use when you know the flow direction and want to ensure consistent results.';
      case 'backward':
        return 'Forces reverse flow from outlet to inlet. Useful for scenarios like pump bypass or reverse flow conditions.';
      default:
        return '';
    }
  };

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Flow Direction
      </Typography>
      
      <Controller
        name="direction"
        control={control}
        render={({ field }) => (
          <Box>
            <RadioGroup
              {...field}
              value={field.value || 'auto'}
              sx={{ gap: 1 }}
            >
              {directionOptions.map((option) => (
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
                {getDirectionDescription(field.value || 'auto')}
              </Typography>
            </Alert>

            {field.value === 'auto' && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Auto-Detect Recommendation:</strong> This is the preferred option for most hydraulic calculations. 
                  The solver will examine your pressure boundary conditions and automatically determine the appropriate flow direction.
                </Typography>
              </Alert>
            )}

            {(field.value === 'forward' || field.value === 'backward') && (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Manual Direction:</strong> You have manually specified the flow direction. 
                  Ensure your pressure boundary conditions are consistent with this choice to avoid convergence issues.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      />
    </Box>
  );
};

export default FlowDirection;