import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  CropSquare,
  Speed,
  Info,
} from '@mui/icons-material';

interface OrificeNodeData {
  id: string;
  label: string;
  diameter: number;
  thickness: number;
  flowRate?: number;
  pressureDrop?: number;
  betaRatio: number;
  isSelected?: boolean;
}

const OrificeNode: React.FC<NodeProps<OrificeNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  // Format values with units
  const formatDiameter = (diameter: number) => {
    const mm = diameter * 1000;
    return `${mm.toFixed(1)} mm`;
  };

  const formatThickness = (thickness: number) => {
    const mm = thickness * 1000;
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

  // Determine color based on beta ratio and pressure drop
  const getBetaRatioColor = (betaRatio: number) => {
    if (betaRatio < 0.2) return 'error'; // Very restrictive
    if (betaRatio < 0.4) return 'warning'; // Restrictive
    if (betaRatio < 0.6) return 'info'; // Moderate restriction
    return 'success'; // Low restriction
  };

  const getPressureDropColor = (pressureDrop?: number) => {
    if (!pressureDrop) return 'default';
    if (pressureDrop > 150000) return 'error'; // > 1.5 bar
    if (pressureDrop > 75000) return 'warning'; // > 0.75 bar
    if (pressureDrop > 25000) return 'info'; // > 0.25 bar
    return 'success';
  };

  // Calculate criticality indicator
  const isCritical = (betaRatio: number, pressureDrop?: number) => {
    return betaRatio < 0.1 || (pressureDrop && pressureDrop > 150000);
  };

  return (
    <Box className={`orifice-node ${selected ? 'selected' : ''} ${isCritical(data.betaRatio, data.pressureDrop) ? 'critical' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{ background: '#ef4444', border: '2px solid white' }}
      />
      
      {/* Main Node Content */}
      <Box className="node-content">
        {/* Header */}
        <Box className="node-header">
          <Box className="node-icon">
            <CropSquare fontSize="small" />
          </Box>
          <Tooltip title={data.label || 'Orifice Plate'}>
            <Typography variant="subtitle2" className="node-title" noWrap>
              {data.label || 'Orifice'}
            </Typography>
          </Tooltip>
          {isCritical(data.betaRatio, data.pressureDrop) && (
            <Tooltip title="Critical orifice conditions">
              <Box className="critical-indicator">
                <Info color="error" fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {/* Orifice Properties */}
        <Box className="node-properties">
          <Box className="property-row">
            <Tooltip title="Beta Ratio (d/D)">
              <Box className="property-item">
                <Typography variant="caption">β =</Typography>
                <Chip
                  label={data.betaRatio.toFixed(3)}
                  size="small"
                  color={getBetaRatioColor(data.betaRatio)}
                  className="beta-ratio-chip"
                />
              </Box>
            </Tooltip>
            
            <Tooltip title="Orifice Diameter">
              <Typography variant="caption">{formatDiameter(data.diameter)}</Typography>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Plate Thickness">
              <Box className="property-item">
                <Typography variant="caption">t =</Typography>
                <Typography variant="caption" className="thickness-value">
                  {formatThickness(data.thickness)}
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Flow Rate">
              <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
            </Tooltip>
          </Box>
          
          {data.pressureDrop && (
            <Box className="property-row">
              <Tooltip title="Pressure Drop">
                <Chip
                  label={formatPressureDrop(data.pressureDrop)}
                  size="small"
                  color={getPressureDropColor(data.pressureDrop)}
                  className="pressure-drop-chip"
                />
              </Tooltip>
              
              <Tooltip title="Flow Velocity">
                <Box className="property-item">
                  <Speed fontSize="small" />
                  <Typography variant="caption">High</Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
          
          {/* Orifice characteristics */}
          <Box className="property-row">
            <Tooltip title="Flow Restriction Level">
              <Typography variant="caption" className="restriction-text">
                {data.betaRatio < 0.3 ? 'High' : data.betaRatio < 0.5 ? 'Medium' : 'Low'} restriction
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{ background: '#ef4444', border: '2px solid white' }}
      />
    </Box>
  );
};

export default OrificeNode;