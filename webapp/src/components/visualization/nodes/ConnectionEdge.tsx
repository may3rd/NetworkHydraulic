import React from 'react';
import { EdgeProps, getBezierPath, getSimpleBezierPath } from 'reactflow';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { Speed, MonitorWeight, Water } from '@mui/icons-material';

// Import types will be used when available
import './ConnectionEdge.css';

interface ConnectionEdgeData {
  flowRate?: number;
  velocity?: number;
  pressure?: number;
  pressureDrop?: number;
  color?: string;
  animated?: boolean;
  showLabel?: boolean;
}

const ConnectionEdge: React.FC<EdgeProps<ConnectionEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style = {},
}) => {
  // Format values with units
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

  // Determine edge color based on velocity or pressure drop
  const getVelocityColor = (velocity?: number) => {
    if (!velocity) return '#6b7280'; // gray-500
    if (velocity > 10) return '#dc2626'; // red-600
    if (velocity > 5) return '#d97706'; // orange-600
    if (velocity > 2) return '#3b82f6'; // blue-500
    return '#10b981'; // green-500
  };

  const getPressureDropColor = (pressureDrop?: number) => {
    if (!pressureDrop) return '#6b7280'; // gray-500
    if (pressureDrop > 100000) return '#dc2626'; // red-600
    if (pressureDrop > 50000) return '#d97706'; // orange-600
    if (pressureDrop > 10000) return '#3b82f6'; // blue-500
    return '#10b981'; // green-500
  };

  // Calculate edge properties
  const edgeColor = data?.color || getVelocityColor(data?.velocity);
  const isAnimated = data?.animated || (data?.velocity && data.velocity > 5);
  
  // Calculate path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Edge styles
  const edgeStyle = {
    ...style,
    stroke: edgeColor,
    strokeWidth: data?.velocity && data.velocity > 5 ? 3 : 2,
    strokeDasharray: isAnimated ? '5,5' : 'none',
    animation: isAnimated ? 'flowAnimation 2s ease-in-out infinite' : 'none',
    transition: 'all 0.3s ease',
  };

  // Determine if edge is critical
  const isCritical = (velocity?: number, pressureDrop?: number) => {
    return (velocity && velocity > 10) || (pressureDrop && pressureDrop > 100000);
  };

  return (
    <>
      {/* Edge Path */}
      <path
        id={id}
        style={edgeStyle}
        d={edgePath}
        className={`connection-edge ${isCritical(data?.velocity, data?.pressureDrop) ? 'critical' : ''} ${isAnimated ? 'animated' : ''}`}
        markerEnd={markerEnd}
      />
      
      {/* Edge Label (optional) */}
      {data?.showLabel && (
        <foreignObject
          width={120}
          height={40}
          x={labelX - 60}
          y={labelY - 20}
          className="edge-label"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <Box
            component="div"
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box className="edge-label-content">
              <Tooltip title="Flow Rate">
                <Box className="edge-property">
                  <Water fontSize="small" />
                  <Typography variant="caption">{formatFlowRate(data.flowRate)}</Typography>
                </Box>
              </Tooltip>
              
              <Tooltip title="Velocity">
                <Box className="edge-property">
                  <Speed fontSize="small" />
                  <Chip
                    label={formatVelocity(data.velocity)}
                    size="small"
                    color={data.velocity && data.velocity > 5 ? "error" : "default"}
                    className="velocity-chip"
                  />
                </Box>
              </Tooltip>
              
              {data.pressureDrop && (
                <Tooltip title="Pressure Drop">
                  <Box className="edge-property">
                    <MonitorWeight fontSize="small" />
                    <Chip
                      label={formatPressureDrop(data.pressureDrop)}
                      size="small"
                      color={data.pressureDrop && data.pressureDrop > 50000 ? "error" : "default"}
                      className="pressure-drop-chip"
                    />
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </foreignObject>
      )}
      
      {/* Flow Direction Indicator */}
      {data?.velocity && data.velocity > 0 && (
        <defs>
          <marker
            id={`arrow-${id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={edgeColor}
              className="flow-arrow"
            />
          </marker>
        </defs>
      )}
      
      {/* Critical Flow Animation */}
      {isCritical(data?.velocity, data?.pressureDrop) && (
        <style>
          {`
            @keyframes criticalFlowPulse {
              0%, 100% {
                stroke-width: 2;
                stroke: ${edgeColor};
              }
              50% {
                stroke-width: 4;
                stroke: #dc2626;
              }
            }
            
            .connection-edge.critical {
              animation: criticalFlowPulse 1.5s ease-in-out infinite;
            }
          `}
        </style>
      )}
    </>
  );
};

export default ConnectionEdge;