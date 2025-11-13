import React from 'react';
import { Box, ButtonGroup, Button, Tooltip, Typography, Chip } from '@mui/material';
import {
  AccountTree,
  LinearScale,
  BubbleChart,
  Schema,
  DragHandle,
  Refresh,
} from '@mui/icons-material';

import { NetworkLayout } from '../../types/visualization/network';

interface NetworkLayoutSelectorProps {
  currentLayout: NetworkLayout;
  onLayoutChange: (layout: NetworkLayout) => void;
  onApplyLayout?: () => void;
  disabled?: boolean;
}

const NetworkLayoutSelector: React.FC<NetworkLayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  onApplyLayout,
  disabled = false,
}) => {
  const layouts: { value: NetworkLayout; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'horizontal',
      label: 'Horizontal',
      icon: <LinearScale />,
      description: 'Left-to-right flow layout',
    },
    {
      value: 'vertical',
      label: 'Vertical',
      icon: <LinearScale style={{ transform: 'rotate(90deg)' }} />,
      description: 'Top-to-bottom flow layout',
    },
    {
      value: 'circular',
      label: 'Circular',
      icon: <BubbleChart />,
      description: 'Circular arrangement',
    },
    {
      value: 'hierarchical',
      label: 'Hierarchical',
      icon: <Schema />,
      description: 'Tree-like structure',
    },
    {
      value: 'force-directed',
      label: 'Force-Directed',
      icon: <AccountTree />,
      description: 'Physics-based layout',
    },
    {
      value: 'manual',
      label: 'Manual',
      icon: <DragHandle />,
      description: 'Custom positioning',
    },
  ];

  return (
    <Box className="network-layout-selector">
      <Box className="layout-header">
        <Typography variant="subtitle2" className="layout-title">
          Network Layout
        </Typography>
        <Tooltip title="Apply current layout algorithm">
          <Button
            size="small"
            onClick={onApplyLayout}
            disabled={disabled}
            startIcon={<Refresh />}
            className="apply-layout-btn"
          >
            Apply
          </Button>
        </Tooltip>
      </Box>
      
      <ButtonGroup 
        variant="outlined" 
        aria-label="network layout selection"
        className="layout-buttons"
        disabled={disabled}
      >
        {layouts.map((layout) => (
          <Tooltip 
            key={layout.value}
            title={
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {layout.label}
                </Typography>
                <Typography variant="body2">
                  {layout.description}
                </Typography>
              </Box>
            }
            arrow
          >
            <Button
              key={layout.value}
              onClick={() => onLayoutChange(layout.value)}
              className={`layout-btn ${currentLayout === layout.value ? 'active' : ''}`}
              startIcon={layout.icon}
              size="small"
            >
              {layout.label}
              {currentLayout === layout.value && (
                <Chip 
                  size="small" 
                  label="Active" 
                  color="primary" 
                  className="active-chip"
                />
              )}
            </Button>
          </Tooltip>
        ))}
      </ButtonGroup>
      
      <Box className="layout-info">
        <Typography variant="caption" color="text.secondary">
          Current: {currentLayout.charAt(0).toUpperCase() + currentLayout.slice(1)}
        </Typography>
      </Box>
    </Box>
  );
};

export default NetworkLayoutSelector;