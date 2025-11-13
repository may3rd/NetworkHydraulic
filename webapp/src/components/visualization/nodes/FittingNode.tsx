import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  Settings,
  Speed,
  Info,
} from '@mui/icons-material';

interface FittingNodeData {
  id: string;
  label: string;
  fittingType: string;
  kFactor: number;
  diameter: number;
  flowRate?: number;
  velocity?: number;
  pressureDrop?: number;
  description: string;
  isSelected?: boolean;
}

const FittingNode: React.FC<NodeProps<FittingNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  // Format values with units
  const formatDiameter = (diameter: number) => {
    const mm = diameter * 1000;
    return `${mm.toFixed(1)} mm`;
  };

  const formatFlowRate = (flowRate?: number) => {
    if (!flowRate) return 'N/A';
    const lpm = flowRate * 60000; // Convert m³/s to L/min
    return `${lpm.toFixed(1)} L/min`;
  };

  const formatVelocity = (velocity?: number) => {
    if (!velocity) return 'N/A';
    return `${velocity.toFixed(2)} m/s`;
  };

  const formatPressureDrop = (pressureDrop?: number) => {
    if (!pressureDrop) return 'N/A';
    const bar = pressureDrop / 100000; // Convert Pa to bar
    return `${bar.toFixed(3)} bar`;
  };

  // Determine color based on K-factor and pressure drop
  const getKFactorColor = (kFactor: number) => {
    if (kFactor > 10) return 'error';
    if (kFactor > 5) return 'warning';
    if (kFactor > 2) return 'info';
    return 'success';
  };

  const getPressureDropColor = (pressureDrop?: number) => {
    if (!pressureDrop) return 'default';
    if (pressureDrop > 100000) return 'error'; // > 1 bar
    if (pressureDrop > 50000) return 'warning'; // > 0.5 bar
    if (pressureDrop > 10000) return 'info'; // > 0.1 bar
    return 'success';
  };

  // Calculate criticality indicator
  const isCritical = (kFactor: number, pressureDrop?: number) => {
    return kFactor > 10 || (pressureDrop && pressureDrop > 100000);
  };

  return (
    <Box className={`fitting-node ${selected ? 'selected' : ''} ${isCritical(data.kFactor, data.pressureDrop) ? 'critical' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{ background: '#10b981', border: '2px solid white' }}
      />
      
      {/* Main Node Content */}
      <Box className="node-content">
        {/* Header */}
        <Box className="node-header">
          <Box className="node-icon">
            <Settings fontSize="small" />
          </Box>
          <Tooltip title={data.label || data.fittingType}>
            <Typography variant="subtitle2" className="node-title" noWrap>
              {data.label || data.fittingType}
            </Typography>
          </Tooltip>
          {isCritical(data.kFactor, data.pressureDrop) && (
            <Tooltip title="High resistance fitting">
              <Box className="critical-indicator">
                <Info color="error" fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {/* Fitting Properties */}
        <Box className="node-properties">
          <Box className="property-row">
            <Tooltip title="Fitting Type">
              <Typography variant="caption" className="fitting-type">
                {data.fittingType}
              </Typography>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="K-Factor (Resistance Coefficient)">
              <Box className="property-item">
                <Typography variant="caption">K =</Typography>
                <Chip
                  label={data.kFactor.toFixed(2)}
                  size="small"
                  color={getKFactorColor(data.kFactor)}
                  className="k-factor-chip"
                />
              </Box>
            </Tooltip>
            
            <Tooltip title="Inner Diameter">
              <Box className="property-item">
                <Typography variant="caption">{formatDiameter(data.diameter)}</Typography>
              </Box>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Flow Rate">
              <Box className="property-item">
                <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Velocity">
              <Box className="property-item">
                <Speed fontSize="small" />
                <Typography variant="caption">{formatVelocity(data.velocity)}</Typography>
              </Box>
            </Tooltip>
          </Box>
          
          {data.pressureDrop && (
            <Box className="property-row">
              <Tooltip title="Pressure Drop">
                <Box className="property-item">
                  <Typography variant="caption">ΔP =</Typography>
                  <Chip
                    label={formatPressureDrop(data.pressureDrop)}
                    size="small"
                    color={getPressureDropColor(data.pressureDrop)}
                    className="pressure-drop-chip"
                  />
                </Box>
              </Tooltip>
            </Box>
          )}
          
          {data.description && (
            <Box className="property-row">
              <Tooltip title="Description">
                <Typography variant="caption" className="description-text">
                  {data.description}
                </Typography>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{ background: '#10b981', border: '2px solid white' }}
      />
    </Box>
  );
};

export default FittingNode;