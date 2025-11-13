import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider } from '@mui/material';
import { useConfigurationStore } from '../../../stores/configuration';
import BasicProperties from './BasicProperties';
import PhaseSelection from './PhaseSelection';
import FlowConditions from './FlowConditions';
import AdvancedProperties from './AdvancedProperties';

interface FluidPropertiesProps {
  className?: string;
}

const FluidProperties: React.FC<FluidPropertiesProps> = ({ className }) => {
  const fluid = useConfigurationStore((state) => state.fluid);

  return (
    <Card className={className} elevation={3}>
      <CardHeader 
        title="Fluid Properties"
        subheader="Configure fluid characteristics and flow conditions"
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <PhaseSelection />
          <BasicProperties />
          <FlowConditions />
          <AdvancedProperties />
        </Box>
      </CardContent>
    </Card>
  );
};

export default FluidProperties;