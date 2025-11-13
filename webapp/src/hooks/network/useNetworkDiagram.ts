import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';

import { 
  NetworkNode, 
  NetworkEdge, 
  NetworkLayoutConfig, 
  NetworkDiagramState,
  NetworkExportData,
  NetworkVisualizationConfig 
} from '../../types/visualization/network';

interface UseNetworkDiagramProps {
  initialNodes?: NetworkNode[];
  initialEdges?: NetworkEdge[];
  initialLayout?: NetworkLayoutConfig;
  onDataChange?: (data: { nodes: NetworkNode[]; edges: NetworkEdge[] }) => void;
  config?: NetworkVisualizationConfig;
}

const useNetworkDiagram = ({
  initialNodes = [],
  initialEdges = [],
  initialLayout = { type: 'hierarchical' },
  onDataChange,
  config = {
    showNodeLabels: true,
    showEdgeLabels: true,
    nodeSize: 'medium',
    edgeThickness: 'medium',
    colorScheme: 'velocity',
    animationEnabled: true,
    autoLayout: true,
    showMetrics: true,
    showCriticalPoints: true,
  },
}: UseNetworkDiagramProps = {}): NetworkDiagramState & {
  // State setters
  updateNode: (nodeId: string, data: Partial<NetworkNode['data']>) => void;
  updateEdge: (edgeId: string, data: Partial<NetworkEdge['data']>) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  setLayout: (layout: NetworkLayoutConfig) => void;
  setZoomLevel: (zoom: number) => void;
  setPanPosition: (position: { x: number; y: number }) => void;
  setShowFlowAnalysis: (show: boolean) => void;
  setShowLossAnalysis: (show: boolean) => void;
  setShowCriticalPoints: (show: boolean) => void;
  
  // Layout and analysis
  applyLayout: (layoutType: string) => void;
  autoLayout: () => void;
  
  // Export/Import
  exportNetwork: () => Promise<NetworkExportData>;
  importNetwork: (data: NetworkExportData) => void;
  
  // Utility functions
  resetView: () => void;
  clearSelection: () => void;
  clearNetwork: () => void;
} => {
  // State
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [edges, setEdges] = useState<NetworkEdge[]>(initialEdges);
  const [layout, setLayoutState] = useState<NetworkLayoutConfig>(initialLayout);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevelState] = useState(1);
  const [panPosition, setPanPositionState] = useState({ x: 0, y: 0 });
  const [showFlowAnalysis, setShowFlowAnalysisState] = useState(false);
  const [showLossAnalysis, setShowLossAnalysisState] = useState(false);
  const [showCriticalPoints, setShowCriticalPointsState] = useState(false);
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Refs
  const previousNodesRef = useRef<NetworkNode[]>(initialNodes);
  const previousEdgesRef = useRef<NetworkEdge[]>(initialEdges);

  // Update previous refs when nodes/edges change
  useEffect(() => {
    const hasChanged = 
      JSON.stringify(previousNodesRef.current) !== JSON.stringify(nodes) ||
      JSON.stringify(previousEdgesRef.current) !== JSON.stringify(edges);
    
    if (hasChanged) {
      previousNodesRef.current = nodes;
      previousEdgesRef.current = edges;
      onDataChange?.({ nodes, edges });
    }
  }, [nodes, edges, onDataChange]);

  // Update node data
  const updateNode = useCallback((nodeId: string, data: Partial<NetworkNode['data']>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, []);

  // Update edge data
  const updateEdge = useCallback((edgeId: string, data: Partial<NetworkEdge['data']>) => {
    setEdges(prevEdges => 
      prevEdges.map(edge => 
        edge.id === edgeId 
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      )
    );
  }, []);

  // Selection handlers
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId);
    if (nodeId) setSelectedEdge(null);
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setSelectedEdge(edgeId);
    if (edgeId) setSelectedNode(null);
  }, []);

  // Layout handlers
  const setLayout = useCallback((newLayout: NetworkLayoutConfig) => {
    setLayoutState(newLayout);
  }, []);

  const applyLayout = useCallback(async (layoutType: string) => {
    try {
      // This would integrate with actual layout algorithms
      console.log(`Applying ${layoutType} layout...`);
      
      // For now, just update the layout state
      setLayoutState(prev => ({ ...prev, type: layoutType as any }));
      
      // Trigger re-layout by updating nodes with new positions
      // This would be implemented with actual layout algorithms
      setNodes(prevNodes => 
        prevNodes.map((node, index) => ({
          ...node,
          position: {
            x: Math.random() * 400,
            y: Math.random() * 300
          }
        }))
      );
    } catch (error) {
      console.error('Failed to apply layout:', error);
    }
  }, []);

  const autoLayout = useCallback(() => {
    if (config.autoLayout) {
      applyLayout(layout.type);
    }
  }, [applyLayout, layout.type, config.autoLayout]);

  // View management
  const resetView = useCallback(() => {
    setZoomLevelState(1);
    setPanPositionState({ x: 0, y: 0 });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const clearNetwork = useCallback(() => {
    setNodes([]);
    setEdges([]);
    clearSelection();
  }, [clearSelection]);

  // Export/Import
  const exportNetwork = useCallback(async (): Promise<NetworkExportData> => {
    return {
      nodes,
      edges,
      layout,
      metadata: {
        timestamp: new Date().toISOString(),
        networkName: 'Hydraulic Network',
        version: '1.0.0',
        units: 'SI',
      },
    };
  }, [nodes, edges, layout]);

  const importNetwork = useCallback((data: NetworkExportData) => {
    setNodes(data.nodes);
    setEdges(data.edges);
    if (data.layout) {
      setLayoutState(data.layout);
    }
  }, []);

  // Viewport change handlers
  const setZoomLevel = useCallback((zoom: number) => {
    setZoomLevelState(zoom);
  }, []);

  const setPanPosition = useCallback((position: { x: number; y: number }) => {
    setPanPositionState(position);
  }, []);

  // Analysis toggle handlers
  const setShowFlowAnalysis = useCallback((show: boolean) => {
    setShowFlowAnalysisState(show);
  }, []);

  const setShowLossAnalysis = useCallback((show: boolean) => {
    setShowLossAnalysisState(show);
  }, []);

  const setShowCriticalPoints = useCallback((show: boolean) => {
    setShowCriticalPointsState(show);
  }, []);

  return {
    // State
    nodes,
    edges,
    layout,
    selectedNode,
    selectedEdge,
    isDragging,
    zoomLevel,
    panPosition,
    showFlowAnalysis,
    showLossAnalysis,
    showCriticalPoints,
    analysisData,
    
    // State setters
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
    
    // Layout and analysis
    applyLayout,
    autoLayout,
    
    // Export/Import
    exportNetwork,
    importNetwork,
    
    // Utility functions
    resetView,
    clearSelection,
    clearNetwork,
  };
};

export default useNetworkDiagram;