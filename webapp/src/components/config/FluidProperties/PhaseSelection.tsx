import React from 'react';
import { Box, RadioGroup, FormControlLabel, Radio, Typography, Alert } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { FluidConfiguration } from '../../../types/models';

interface PhaseSelectionProps {
  className?: string;
}

const PhaseSelection: React.FC<PhaseSelectionProps> = ({ className }) => {
  const { control, watch } = useFormContext<FluidConfiguration>();
  const phase = watch('phase');

  const phaseOptions = [
    {
      value: 'liquid',
      label: 'Liquid',
      description: 'For liquids like water, oil, chemicals, etc.',
      icon: '💧'
    },
    {
      value: 'gas',
      label: 'Gas',
      description: 'For gases like air, nitrogen, natural gas, etc.',
      icon: '💨'
    },
    {
      value: 'vapor',
      label: 'Vapor',
      description: 'For vapors and steam applications',
      icon: '☁️'
    }
  ];

  const getPhaseDescription = (phaseValue: string) => {
    switch (phaseValue) {
      case 'liquid':
        return 'Liquids have relatively constant density and are typically incompressible for hydraulic calculations.';
      case 'gas':
        return 'Gases are compressible and require consideration of density changes, molecular weight, and gas properties.';
      case 'vapor':
        return 'Vapors behave similarly to gases but may require special consideration for phase change conditions.';
      default:
        return '';
    }
  };

  return (
    <Box className={className}>
      <Controller
        name="phase"
        control={control}
        render={({ field }) => (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Fluid Phase
            </Typography>
            <RadioGroup
              {...field}
              value={field.value || ''}
              sx={{ gap: 1 }}
            >
              {phaseOptions.map((option) => (
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
                    border: `1px solid ${phase === option.value ? 'primary.main' : 'divider'}`,
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1,
                    backgroundColor: phase === option.value ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.focus',
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </Box>
        )}
      />
      
      {phase && (
        <Alert 
          severity="info" 
          sx={{ mt: 2, borderRadius: 1 }}
          icon={phaseOptions.find(opt => opt.value === phase)?.icon}
        >
          <Typography variant="body2">
            {getPhaseDescription(phase)}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default PhaseSelection;