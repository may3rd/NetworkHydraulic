import React, { useRef, useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnConnectStartParams,
  OnConnectEnd,
  Connection,
  NodeMouseHandler,
  EdgeMouseHandler,
  ConnectionMode,
  ControlButton,
  ReactFlowInstance,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, IconButton, Tooltip, Chip, Typography } from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  FitScreen,
  Refresh,
  Settings as SettingsIcon,
  Fullscreen,
  Download,
} from '@mui/icons-material';

import { NetworkNode, NetworkEdge, NetworkLayout, NetworkDiagramState } from '../../types/visualization/network';
import PipeNode from './nodes/PipeNode';
import FittingNode from './nodes/FittingNode';
import ValveNode from './nodes/ValveNode';
import OrificeNode from './nodes/OrificeNode';
import BoundaryNode from './nodes/BoundaryNode';
import ConnectionEdge from './nodes/ConnectionEdge';
import NetworkLayoutSelector from './NetworkLayoutSelector';
import NodeInspector from './interactive/NodeInspector';
import EdgeInspector from './interactive/EdgeInspector';
import FlowAnalysisOverlay from './analysis/FlowAnalysisOverlay';
import LossAnalysisOverlay from './analysis/LossAnalysisOverlay';
import { useNetworkDiagram } from '../../hooks/network/useNetworkDiagram';

import './NetworkDiagram.css';

// Node types mapping
const nodeTypes = {
  pipe: PipeNode,
  fitting: FittingNode,
  valve: ValveNode,
  orifice: OrificeNode,
  boundary: BoundaryNode,
};

// Edge types mapping
const edgeTypes = {
  default: ConnectionEdge,
};

interface NetworkDiagramProps {
  initialNodes?: NetworkNode[];
  initialEdges?: NetworkEdge[];
  layout?: NetworkLayout;
  onNodeClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  onDataChange?: (data: { nodes: NetworkNode[]; edges: NetworkEdge[] }) => void;
  showAnalysis?: boolean;
  config?: any;
}

const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  initialNodes = [],
  initialEdges = [],
  layout = 'hierarchical',
  onNodeClick,
  onEdgeClick,
  onDataChange,
  showAnalysis = true,
  config,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [reactFlowBounds, setReactFlowBounds] = useState<DOMRect>();
  const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null);

  // Use network diagram hook for state management
  const {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    zoomLevel,
    panPosition,
    isDragging,
    layout: currentLayout,
    analysisData,
    showFlowAnalysis,
    showLossAnalysis,
    showCriticalPoints,
    updateNode,
    updateEdge,
    selectNode,
    selectEdge,
    setLayout,
    setZoomLevel,
    setPanPosition,
    setShowFlowAnalysis,
    setShowLossAnalysis,
    setShowCriticalPoints,
    applyLayout,
    exportNetwork,
    importNetwork,
  } = useNetworkDiagram({
    initialNodes,
    initialEdges,
    initialLayout: { type: layout },
    onDataChange,
  });

  // Initialize React Flow bounds
  useEffect(() => {
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      setReactFlowBounds(bounds);
    }
  }, [reactFlowWrapper]);

  // Handle node click
  const onNodeSelect: NodeMouseHandler = useCallback(
    (event, node) => {
      const networkNode = node as NetworkNode;
      selectNode(networkNode.id);
      onNodeClick?.(networkNode);
    },
    [selectNode, onNodeClick]
  );

  // Handle edge click
  const onEdgeSelect: EdgeMouseHandler = useCallback(
    (event, edge) => {
      const networkEdge = edge as NetworkEdge;
      selectEdge(networkEdge.id);
      onEdgeClick?.(networkEdge);
    },
    [selectEdge, onEdgeClick]
  );

  // Handle viewport change
  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  // Handle viewport change
  const onViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      setZoomLevel(viewport.zoom);
      setPanPosition({ x: viewport.x, y: viewport.y });
    },
    [setZoomLevel, setPanPosition]
  );

  // Fit view to nodes
  const fitViewToNodes = useCallback(() => {
    reactFlowInstance.fitView({
      padding: 0.1,
      includeHiddenNodes: false,
      maxZoom: 1.5,
      minZoom: 0.1,
    });
  }, [reactFlowInstance]);

  // Export network diagram
  const handleExport = useCallback(async () => {
    const exportedData = await exportNetwork();
    // Trigger download
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network-diagram-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportNetwork]);

  // Import network diagram
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importNetwork(data);
      } catch (error) {
        console.error('Failed to import network diagram:', error);
      }
    };
    reader.readAsText(file);
  }, [importNetwork]);

  // Custom controls
  const CustomControls = () => (
    <Box className="network-controls">
      <Tooltip title="Zoom In">
        <IconButton size="small" onClick={() => reactFlowInstance.zoomIn()}>
          <ZoomIn fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Zoom Out">
        <IconButton size="small" onClick={() => reactFlowInstance.zoomOut()}>
          <ZoomOut fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Fit to Screen">
        <IconButton size="small" onClick={fitViewToNodes}>
          <FitScreen fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Apply Layout">
        <IconButton size="small" onClick={() => applyLayout(currentLayout.type)}>
          <Refresh fontSize="small" />
        </IconButton>
      </Tooltip>
      
      {showAnalysis && (
        <>
          <Tooltip title="Toggle Flow Analysis">
            <IconButton size="small" onClick={() => setShowFlowAnalysis(!showFlowAnalysis)}>
              <Chip 
                label="Flow" 
                size="small" 
                color={showFlowAnalysis ? "primary" : "default"} 
              />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Loss Analysis">
            <IconButton size="small" onClick={() => setShowLossAnalysis(!showLossAnalysis)}>
              <Chip 
                label="Loss" 
                size="small" 
                color={showLossAnalysis ? "secondary" : "default"} 
              />
            </IconButton>
          </Tooltip>
        </>
      )}
      
      <Tooltip title="Export Network">
        <IconButton size="small" onClick={handleExport}>
          <Download fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box className="network-diagram-container" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <Box className="network-diagram-wrapper">
          {/* Network Diagram */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeSelect}
            onEdgeClick={onEdgeSelect}
            onPaneClick={onPaneClick}
            onInit={() => {
              fitViewToNodes();
            }}
            onMove={(event) => {
              const viewport = reactFlowInstance.getViewport();
              onViewportChange(viewport);
            }}
            fitView
            connectionMode={ConnectionMode.Loose}
            defaultMarkerColor="#2563eb"
            minZoom={0.1}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            className="network-flow"
          >
            {/* Background */}
            <Background
              gap={12}
              color="#e2e8f0"
            />
            
            {/* Mini Map */}
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'pipe': return '#3b82f6';
                  case 'fitting': return '#10b981';
                  case 'valve': return '#f59e0b';
                  case 'orifice': return '#ef4444';
                  case 'boundary': return '#8b5cf6';
                  default: return '#6b7280';
                }
              }}
              nodeBorderRadius={5}
              zoomable
              pannable
            />
            
            {/* Custom Controls */}
            <Controls 
              position="top-right"
              className="react-flow-controls"
            >
              <ControlButton onClick={fitViewToNodes}>
                <FitScreen fontSize="small" />
              </ControlButton>
            </Controls>
            
            {/* Custom Controls */}
            <CustomControls />
          </ReactFlow>
          
          {/* Layout Selector */}
          <NetworkLayoutSelector
            currentLayout={currentLayout.type}
            onLayoutChange={(newLayout: NetworkLayout) => {
              setLayout({ type: newLayout });
              applyLayout(newLayout);
            }}
          />
          
          {/* Node Inspector */}
          {selectedNode && (
            <NodeInspector
              nodeId={selectedNode}
              node={nodes.find((n: NetworkNode) => n.id === selectedNode)}
              onClose={() => selectNode(null)}
            />
          )}
          
          {/* Edge Inspector */}
          {selectedEdge && (
            <EdgeInspector
              edgeId={selectedEdge}
              edge={edges.find((e: NetworkEdge) => e.id === selectedEdge)}
              onClose={() => selectEdge(null)}
            />
          )}
          
          {/* Analysis Overlays */}
          {showAnalysis && showFlowAnalysis && analysisData?.flowAnalysis && (
            <FlowAnalysisOverlay
              data={analysisData.flowAnalysis}
              nodes={nodes}
              edges={edges}
            />
          )}
          
          {showAnalysis && showLossAnalysis && analysisData?.lossAnalysis && (
            <LossAnalysisOverlay
              data={analysisData.lossAnalysis}
              nodes={nodes}
              edges={edges}
            />
          )}
        </Box>
      </ReactFlowProvider>
    </Box>
  );
};

export default NetworkDiagram;