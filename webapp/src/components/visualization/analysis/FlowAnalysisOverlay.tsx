import React from 'react';
import { Box, Typography, Chip, LinearProgress, Tooltip } from '@mui/material';
import {
  Speed,
  Water,
  Info,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

import { FlowAnalysisData } from '../../../types/visualization/network';

interface FlowAnalysisOverlayProps {
  data: FlowAnalysisData;
  nodes: any[];
  edges: any[];
  visible?: boolean;
}

const FlowAnalysisOverlay: React.FC<FlowAnalysisOverlayProps> = ({
  data,
  nodes,
  edges,
  visible = true,
}) => {
  if (!visible) return null;

  // Calculate statistics
  const totalNodes = nodes.length;
  const totalEdges = edges.length;
  
  const highVelocityNodes = nodes.filter(node => 
    node.data?.velocity && node.data.velocity > 5
  ).length;
  
  const criticalNodes = nodes.filter(node => 
    node.data?.velocity && node.data.velocity > 10
  ).length;
  
  const highPressureDropEdges = edges.filter(edge => 
    edge.data?.pressureDrop && edge.data.pressureDrop > 50000
  ).length;

  // Format velocity range
  const formatVelocityRange = (range: [number, number]) => {
    return `${range[0].toFixed(2)} - ${range[1].toFixed(2)} m/s`;
  };

  // Format pressure range
  const formatPressureRange = (range: [number, number]) => {
    const minBar = range[0] / 100000;
    const maxBar = range[1] / 100000;
    return `${minBar.toFixed(2)} - ${maxBar.toFixed(2)} bar`;
  };

  // Get flow direction icon
  const getFlowDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'forward':
        return <TrendingUp color="success" fontSize="small" />;
      case 'backward':
        return <TrendingDown color="error" fontSize="small" />;
      case 'bidirectional':
        return <TrendingUp color="info" fontSize="small" />;
      default:
        return <Info color="disabled" fontSize="small" />;
    }
  };

  // Determine overall network health
  const getNetworkHealth = () => {
    const criticalPercentage = (criticalNodes / totalNodes) * 100;
    const highVelocityPercentage = (highVelocityNodes / totalNodes) * 100;
    
    if (criticalPercentage > 20) return { status: 'Critical', color: 'error' as const };
    if (criticalPercentage > 10 || highVelocityPercentage > 30) return { status: 'Warning', color: 'warning' as const };
    if (highVelocityPercentage > 10) return { status: 'Good', color: 'info' as const };
    return { status: 'Excellent', color: 'success' as const };
  };

  const networkHealth = getNetworkHealth();

  return (
    <Box className="flow-analysis-overlay">
      <Box className="analysis-header">
        <Typography variant="h6" className="analysis-title">
          Flow Analysis
        </Typography>
        <Chip
          label={networkHealth.status}
          color={networkHealth.color}
          size="small"
          icon={<Info fontSize="small" />}
        />
      </Box>
      
      <Box className="analysis-content">
        {/* Velocity Analysis */}
        <Box className="analysis-section">
          <Typography variant="subtitle2" className="section-title">
            <Speed fontSize="small" /> Velocity Analysis
          </Typography>
          
          <Box className="metric-row">
            <Typography variant="body2">Range:</Typography>
            <Typography variant="body2" className="metric-value">
              {formatVelocityRange(data.velocityRange)}
            </Typography>
          </Box>
          
          <Box className="metric-row">
            <Typography variant="body2">High Velocity Nodes:</Typography>
            <Chip
              label={`${highVelocityNodes}/${totalNodes}`}
              color={highVelocityNodes > totalNodes * 0.3 ? "warning" : "default"}
              size="small"
            />
          </Box>
          
          <Box className="metric-row">
            <Typography variant="body2">Critical Velocity Nodes:</Typography>
            <Chip
              label={`${criticalNodes}/${totalNodes}`}
              color={criticalNodes > 0 ? "error" : "success"}
              size="small"
            />
          </Box>
          
          <Box className="progress-container">
            <Typography variant="caption">Velocity Distribution</Typography>
            <LinearProgress
              variant="determinate"
              value={(criticalNodes / totalNodes) * 100}
              color={criticalNodes > 0 ? "error" : "success"}
              className="velocity-progress"
            />
          </Box>
        </Box>
        
        {/* Pressure Analysis */}
        <Box className="analysis-section">
          <Typography variant="subtitle2" className="section-title">
            <Water fontSize="small" /> Pressure Analysis
          </Typography>
          
          <Box className="metric-row">
            <Typography variant="body2">Range:</Typography>
            <Typography variant="body2" className="metric-value">
              {formatPressureRange(data.pressureRange)}
            </Typography>
          </Box>
          
          <Box className="metric-row">
            <Typography variant="body2">High Pressure Drop Edges:</Typography>
            <Chip
              label={`${highPressureDropEdges}/${totalEdges}`}
              color={highPressureDropEdges > 0 ? "warning" : "default"}
              size="small"
            />
          </Box>
          
          <Box className="progress-container">
            <Typography variant="caption">Pressure Health</Typography>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, 100 - (highPressureDropEdges / totalEdges) * 100)}
              color={highPressureDropEdges === 0 ? "success" : "warning"}
              className="pressure-progress"
            />
          </Box>
        </Box>
        
        {/* Flow Direction Analysis */}
        <Box className="analysis-section">
          <Typography variant="subtitle2" className="section-title">
            Flow Direction
          </Typography>
          
          <Box className="metric-row">
            <Typography variant="body2">Direction:</Typography>
            <Box className="direction-indicator">
              {getFlowDirectionIcon(data.flowDirection)}
              <Typography variant="body2" className="direction-text">
                {data.flowDirection.charAt(0).toUpperCase() + data.flowDirection.slice(1)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Critical Points */}
        {data.criticalPoints.length > 0 && (
          <Box className="analysis-section">
            <Typography variant="subtitle2" className="section-title">
              Critical Points
            </Typography>
            
            <Box className="critical-points-list">
              {data.criticalPoints.map((point, index) => (
                <Tooltip key={index} title={`Critical condition at ${point}`}>
                  <Chip
                    label={point}
                    color="error"
                    size="small"
                    variant="outlined"
                    className="critical-point-chip"
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Recommendations */}
        <Box className="analysis-section">
          <Typography variant="subtitle2" className="section-title">
            Recommendations
          </Typography>
          
          <Box className="recommendations-list">
            {criticalNodes > 0 && (
              <Typography variant="body2" className="recommendation">
                ⚠️ Reduce flow velocity in {criticalNodes} critical nodes
              </Typography>
            )}
            
            {highPressureDropEdges > 0 && (
              <Typography variant="body2" className="recommendation">
                🔧 Optimize {highPressureDropEdges} high-pressure-drop sections
              </Typography>
            )}
            
            {totalNodes > 0 && highVelocityNodes === 0 && highPressureDropEdges === 0 && (
              <Typography variant="body2" className="recommendation good">
                ✅ Network operating within optimal parameters
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Add CSS class for styling */}
      <Box className="flow-analysis-overlay-content" />
    </Box>
  );
};

export default FlowAnalysisOverlay;