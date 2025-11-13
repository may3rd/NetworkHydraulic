import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  Settings,
  Speed,
  Info,
} from '@mui/icons-material';

interface ValveNodeData {
  id: string;
  label: string;
  valveType: string;
  cv: number;
  opening: number;
  diameter: number;
  flowRate?: number;
  pressureDrop?: number;
  specifications?: Record<string, any>;
  isSelected?: boolean;
}

const ValveNode: React.FC<NodeProps<ValveNodeData>> = ({
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

  const formatPressureDrop = (pressureDrop?: number) => {
    if (!pressureDrop) return 'N/A';
    const bar = pressureDrop / 100000; // Convert Pa to bar
    return `${bar.toFixed(3)} bar`;
  };

  // Determine color based on opening percentage and pressure drop
  const getOpeningColor = (opening: number) => {
    if (opening < 20) return 'error';
    if (opening < 50) return 'warning';
    if (opening < 80) return 'info';
    return 'success';
  };

  const getPressureDropColor = (pressureDrop?: number) => {
    if (!pressureDrop) return 'default';
    if (pressureDrop > 200000) return 'error'; // > 2 bar
    if (pressureDrop > 100000) return 'warning'; // > 1 bar
    if (pressureDrop > 50000) return 'info'; // > 0.5 bar
    return 'success';
  };

  // Calculate criticality indicator
  const isCritical = (opening: number, pressureDrop?: number) => {
    return opening < 10 || (pressureDrop && pressureDrop > 200000);
  };

  return (
    <Box className={`valve-node ${selected ? 'selected' : ''} ${isCritical(data.opening, data.pressureDrop) ? 'critical' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{ background: '#f59e0b', border: '2px solid white' }}
      />
      
      {/* Main Node Content */}
      <Box className="node-content">
        {/* Header */}
        <Box className="node-header">
          <Box className="node-icon">
            <Settings fontSize="small" />
          </Box>
          <Tooltip title={data.label || data.valveType}>
            <Typography variant="subtitle2" className="node-title" noWrap>
              {data.label || data.valveType}
            </Typography>
          </Tooltip>
          {isCritical(data.opening, data.pressureDrop) && (
            <Tooltip title="Critical valve condition">
              <Box className="critical-indicator">
                <Info color="error" fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {/* Valve Properties */}
        <Box className="node-properties">
          <Box className="property-row">
            <Tooltip title="Valve Type">
              <Typography variant="caption" className="valve-type">
                {data.valveType}
              </Typography>
            </Tooltip>
            
            <Tooltip title="Opening Percentage">
              <Chip
                label={`${data.opening.toFixed(1)}%`}
                size="small"
                color={getOpeningColor(data.opening)}
                className="opening-chip"
              />
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Flow Coefficient (Cv)">
              <Box className="property-item">
                <Typography variant="caption">Cv =</Typography>
                <Typography variant="caption" className="cv-value">
                  {data.cv.toFixed(2)}
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Inner Diameter">
              <Typography variant="caption">{formatDiameter(data.diameter)}</Typography>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Flow Rate">
              <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
            </Tooltip>
            
            {data.pressureDrop && (
              <Tooltip title="Pressure Drop">
                <Chip
                  label={formatPressureDrop(data.pressureDrop)}
                  size="small"
                  color={getPressureDropColor(data.pressureDrop)}
                  className="pressure-drop-chip"
                />
              </Tooltip>
            )}
          </Box>
          
          {/* Specifications */}
          {data.specifications && Object.keys(data.specifications).length > 0 && (
            <Box className="property-row">
              <Tooltip title="Valve Specifications">
                <Typography variant="caption" className="specifications-text">
                  {Object.entries(data.specifications)
                    .slice(0, 2)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}
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
        style={{ background: '#f59e0b', border: '2px solid white' }}
      />
    </Box>
  );
};

export default ValveNode;