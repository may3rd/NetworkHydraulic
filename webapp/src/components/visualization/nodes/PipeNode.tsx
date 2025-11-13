import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import {
  Straighten,
  Speed,
  MonitorWeight,
  Water,
  Info,
} from '@mui/icons-material';

// Import types will be used when available
import './PipeNode.css';

interface PipeNodeData {
  id: string;
  label: string;
  sectionId: string;
  diameter: number;
  length: number;
  roughness: number;
  flowRate?: number;
  velocity?: number;
  pressure?: number;
  pressureDrop?: number;
  material?: string;
  isSelected?: boolean;
}

const PipeNode: React.FC<NodeProps<PipeNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  // Format values with units
  const formatDiameter = (diameter: number) => {
    const mm = diameter * 1000;
    return `${mm.toFixed(1)} mm`;
  };

  const formatLength = (length: number) => {
    if (length >= 1) {
      return `${length.toFixed(2)} m`;
    } else {
      return `${(length * 1000).toFixed(1)} mm`;
    }
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

  const formatPressure = (pressure?: number) => {
    if (!pressure) return 'N/A';
    const bar = pressure / 100000; // Convert Pa to bar
    return `${bar.toFixed(2)} bar`;
  };

  const formatPressureDrop = (pressureDrop?: number) => {
    if (!pressureDrop) return 'N/A';
    const bar = pressureDrop / 100000; // Convert Pa to bar
    return `${bar.toFixed(3)} bar`;
  };

  // Determine color based on velocity or pressure drop
  const getVelocityColor = (velocity?: number) => {
    if (!velocity) return 'default';
    if (velocity > 10) return 'error';
    if (velocity > 5) return 'warning';
    if (velocity > 2) return 'info';
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
  const isCritical = (velocity?: number, pressureDrop?: number) => {
    return (velocity && velocity > 10) || (pressureDrop && pressureDrop > 100000);
  };

  return (
    <Box className={`pipe-node ${selected ? 'selected' : ''} ${isCritical(data.velocity, data.pressureDrop) ? 'critical' : ''}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        style={{ background: '#3b82f6', border: '2px solid white' }}
      />
      
      {/* Main Node Content */}
      <Box className="node-content">
        {/* Header */}
        <Box className="node-header">
          <Box className="node-icon">
            <Water fontSize="small" />
          </Box>
          <Tooltip title={data.label || data.sectionId}>
            <Typography variant="subtitle2" className="node-title" noWrap>
              {data.label || data.sectionId}
            </Typography>
          </Tooltip>
          {isCritical(data.velocity, data.pressureDrop) && (
            <Tooltip title="Critical conditions detected">
              <Box className="critical-indicator">
                <Info color="error" fontSize="small" />
              </Box>
            </Tooltip>
          )}
        </Box>
        
        {/* Pipe Properties */}
        <Box className="node-properties">
          <Box className="property-row">
            <Tooltip title="Inner Diameter">
              <Box className="property-item">
                <Straighten fontSize="small" />
                <Typography variant="caption">{formatDiameter(data.diameter)}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Length">
              <Box className="property-item">
                <Straighten fontSize="small" />
                <Typography variant="caption">{formatLength(data.length)}</Typography>
              </Box>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Flow Rate">
              <Box className="property-item">
                <Water fontSize="small" />
                <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Velocity">
              <Box className="property-item">
                <Speed fontSize="small" />
                <Chip
                  label={formatVelocity(data.velocity)}
                  size="small"
                  color={getVelocityColor(data.velocity)}
                  className="velocity-chip"
                />
              </Box>
            </Tooltip>
          </Box>
          
          <Box className="property-row">
            <Tooltip title="Pressure">
              <Box className="property-item">
                <MonitorWeight fontSize="small" />
                <Typography variant="caption">{formatPressure(data.pressure)}</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Pressure Drop">
              <Box className="property-item">
                <MonitorWeight fontSize="small" />
                <Chip
                  label={formatPressureDrop(data.pressureDrop)}
                  size="small"
                  color={getPressureDropColor(data.pressureDrop)}
                  className="pressure-drop-chip"
                />
              </Box>
            </Tooltip>
          </Box>
          
          {data.material && (
            <Box className="property-row">
              <Tooltip title="Material">
                <Box className="property-item">
                  <Typography variant="caption" className="material-text">
                    {data.material}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>
        
        {/* Section ID */}
        <Box className="node-footer">
          <Typography variant="caption" className="section-id">
            ID: {data.sectionId}
          </Typography>
        </Box>
      </Box>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        style={{ background: '#3b82f6', border: '2px solid white' }}
      />
    </Box>
  );
};

export default PipeNode;