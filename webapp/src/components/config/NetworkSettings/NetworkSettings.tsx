import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider } from '@mui/material';
import BoundaryConditions from './BoundaryConditions';
import FlowDirection from './FlowDirection';
import GasFlowModel from './GasFlowModel';
import OutputUnits from './OutputUnits';

interface NetworkSettingsProps {
  className?: string;
}

const NetworkSettings: React.FC<NetworkSettingsProps> = ({ className }) => {
  return (
    <Card className={className} elevation={3}>
      <CardHeader 
        title="Network Settings"
        subheader="Configure boundary conditions and calculation options"
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <BoundaryConditions />
          <FlowDirection />
          <GasFlowModel />
          <OutputUnits />
        </Box>
      </CardContent>
    </Card>
  );
};

export default NetworkSettings;