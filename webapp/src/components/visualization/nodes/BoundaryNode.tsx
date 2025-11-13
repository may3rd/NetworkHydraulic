import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  Power,
  Speed,
  Water,
  Info,
} from '@mui/icons-material';

interface BoundaryNodeData {
  id: string;
  label: string;
  boundaryType: 'inlet' | 'outlet';
  pressure?: number;
  temperature?: number;
  flowRate?: number;
  isSelected?: boolean;
}

const BoundaryNode: React.FC<NodeProps<BoundaryNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  // Format values with units
  const formatPressure = (pressure?: number) => {
    if (!pressure) return 'N/A';
    const bar = pressure / 100000; // Convert Pa to bar
    return `${bar.toFixed(2)} bar`;
  };

  const formatTemperature = (temperature?: number) => {
    if (!temperature) return 'N/A';
    return `${temperature.toFixed(1)}°C`;
  };

  const formatFlowRate = (flowRate?: number) => {
    if (!flowRate) return 'N/A';
    const lpm = flowRate * 60000; // Convert m³/s to L/min
    return `${lpm.toFixed(1)} L/min`;
  };

  // Determine color and icon based on boundary type
  const getBoundaryColor = (boundaryType: string) => {
    return boundaryType === 'inlet' ? '#3b82f6' : '#ef4444';
  };

  const getBoundaryIcon = (boundaryType: string) => {
    return boundaryType === 'inlet' ? <Power fontSize="small" /> : <Water fontSize="small" />;
  };

  const getBoundaryLabel = (boundaryType: string) => {
    return boundaryType === 'inlet' ? 'INLET' : 'OUTLET';
  };

  return (
    <Box className={`boundary-node ${data.boundaryType} ${selected ? 'selected' : ''}`}>
      {/* Connection Handle */}
      <Handle
        type={data.boundaryType === 'inlet' ? 'source' : 'target'}
        position={data.boundaryType === 'inlet' ? Position.Right : Position.Left}
        id={data.boundaryType === 'inlet' ? 'output' : 'input'}
        isConnectable={isConnectable}
        style={{ 
          background: getBoundaryColor(data.boundaryType), 
          border: '2px solid white' 
        }}
      />
      
      {/* Main Node Content */}
      <Box className="node-content">
        {/* Header */}
        <Box className="node-header">
          <Box className="node-icon">
            {getBoundaryIcon(data.boundaryType)}
          </Box>
          <Tooltip title={data.label || getBoundaryLabel(data.boundaryType)}>
            <Typography variant="subtitle2" className="node-title" noWrap>
              {data.label || getBoundaryLabel(data.boundaryType)}
            </Typography>
          </Tooltip>
        </Box>
        
        {/* Boundary Properties */}
        <Box className="node-properties">
          <Box className="property-row">
            <Tooltip title="Boundary Type">
              <Chip
                label={getBoundaryLabel(data.boundaryType)}
                size="small"
                style={{
                  background: getBoundaryColor(data.boundaryType),
                  color: 'white',
                  fontWeight: 600,
                }}
                className="boundary-type-chip"
              />
            </Tooltip>
          </Box>
          
          {data.pressure && (
            <Box className="property-row">
              <Tooltip title="Pressure">
                <Box className="property-item">
                  <Typography variant="caption">P =</Typography>
                  <Typography variant="caption" className="pressure-value">
                    {formatPressure(data.pressure)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
          
          {data.temperature && (
            <Box className="property-row">
              <Tooltip title="Temperature">
                <Box className="property-item">
                  <Typography variant="caption">T =</Typography>
                  <Typography variant="caption" className="temperature-value">
                    {formatTemperature(data.temperature)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
          
          {data.flowRate && (
            <Box className="property-row">
              <Tooltip title="Flow Rate">
                <Box className="property-item">
                  <Water fontSize="small" />
                  <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>
        
        {/* Status Indicator */}
        <Box className="node-footer">
          <Tooltip title="Boundary Condition">
            <Typography variant="caption" className="boundary-status">
              {data.boundaryType === 'inlet' ? 'Supply' : 'Discharge'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Optional second handle for bidirectional boundaries */}
      {false && ( // This can be enabled for special boundary conditions
        <Handle
          type={data.boundaryType === 'inlet' ? 'target' : 'source'}
          position={data.boundaryType === 'inlet' ? Position.Left : Position.Right}
          id={data.boundaryType === 'inlet' ? 'input' : 'output'}
          isConnectable={isConnectable}
          style={{ 
            background: getBoundaryColor(data.boundaryType), 
            border: '2px solid white',
            opacity: 0.5,
          }}
        />
      )}
    </Box>
  );
};

export default BoundaryNode;