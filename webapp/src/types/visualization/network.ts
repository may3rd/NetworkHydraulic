import { Node, Edge } from 'reactflow';
// Import types will be added when models are available
// import { PipeSection, Fitting, Valve, Orifice } from '../../models/index';

// Network visualization core types
export interface NetworkNode extends Node {
  type: 'pipe' | 'fitting' | 'valve' | 'orifice' | 'boundary';
  data: PipeNodeData | FittingNodeData | ValveNodeData | OrificeNodeData | BoundaryNodeData;
}

export interface NetworkEdgeData {
  flowRate?: number;
  velocity?: number;
  pressure?: number;
  pressureDrop?: number;
  color?: string;
  animated?: boolean;
}

export interface NetworkEdge extends Omit<Edge, 'data'> {
  data: NetworkEdgeData;
}

// Node data types
export interface BaseNodeData {
  id: string;
  label: string;
  description?: string;
  position?: { x: number; y: number };
}

export interface PipeNodeData extends BaseNodeData {
  type: 'pipe';
  sectionId: string;
  diameter: number;
  length: number;
  roughness: number;
  flowRate?: number;
  velocity?: number;
  pressure?: number;
  pressureDrop?: number;
  material?: string;
}

export interface FittingNodeData extends BaseNodeData {
  type: 'fitting';
  fittingType: string;
  kFactor: number;
  diameter: number;
  flowRate?: number;
  velocity?: number;
  pressureDrop?: number;
  description: string;
}

export interface ValveNodeData extends BaseNodeData {
  type: 'valve';
  valveType: string;
  cv: number;
  opening: number;
  diameter: number;
  flowRate?: number;
  pressureDrop?: number;
  specifications?: Record<string, any>;
}

export interface OrificeNodeData extends BaseNodeData {
  type: 'orifice';
  diameter: number;
  thickness: number;
  flowRate?: number;
  pressureDrop?: number;
  betaRatio: number;
}

export interface BoundaryNodeData extends BaseNodeData {
  type: 'boundary';
  boundaryType: 'inlet' | 'outlet';
  pressure?: number;
  temperature?: number;
  flowRate?: number;
}

// Layout types
export type NetworkLayout = 'horizontal' | 'vertical' | 'circular' | 'hierarchical' | 'force-directed' | 'manual';

export interface NetworkLayoutConfig {
  type: NetworkLayout;
  options?: {
    spacing?: number;
    levelDistance?: number;
    nodeDistance?: number;
    springConstant?: number;
    gravity?: number;
  };
}

// Analysis overlay types
export interface FlowAnalysisData {
  velocityRange: [number, number];
  pressureRange: [number, number];
  flowDirection: 'forward' | 'backward' | 'bidirectional';
  criticalPoints: string[];
}

export interface LossAnalysisData {
  totalLoss: number;
  frictionLoss: number;
  fittingLoss: number;
  valveLoss: number;
  orificeLoss: number;
  lossDistribution: {
    sectionId: string;
    frictionLoss: number;
    fittingLoss: number;
    valveLoss: number;
    totalLoss: number;
  }[];
}

export interface NetworkMetrics {
  totalSections: number;
  totalFittings: number;
  totalValves: number;
  totalOrifices: number;
  totalLength: number;
  maxVelocity: number;
  maxPressureDrop: number;
  networkEfficiency: number;
  criticalSections: string[];
}

// Network diagram state
export interface NetworkDiagramState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: NetworkLayoutConfig;
  selectedNode?: string | null;
  selectedEdge?: string | null;
  isDragging: boolean;
  zoomLevel: number;
  panPosition: { x: number; y: number };
  showFlowAnalysis: boolean;
  showLossAnalysis: boolean;
  showCriticalPoints: boolean;
  analysisData?: {
    flowAnalysis?: FlowAnalysisData;
    lossAnalysis?: LossAnalysisData;
    metrics?: NetworkMetrics;
  };
}

// Network interaction events
export interface NetworkInteractionEvent {
  type: 'nodeClick' | 'edgeClick' | 'nodeDrag' | 'nodeDrop' | 'zoomChange' | 'panChange';
  target: string;
  data?: any;
}

// Network processing result
export interface NetworkProcessingResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics: NetworkMetrics;
  analysis: {
    flowAnalysis: FlowAnalysisData;
    lossAnalysis: LossAnalysisData;
  };
  layout: NetworkLayoutConfig;
}

// D3.js layout types
export interface D3Node {
  id: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface D3Link {
  source: string;
  target: string;
  value: number;
  type?: string;
}

export interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}

// Network export types
export interface NetworkExportData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: NetworkLayoutConfig;
  metadata: {
    timestamp: string;
    networkName: string;
    version: string;
    units: string;
  };
}

// Network configuration for visualization
export interface NetworkVisualizationConfig {
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  nodeSize: 'small' | 'medium' | 'large';
  edgeThickness: 'thin' | 'medium' | 'thick';
  colorScheme: 'velocity' | 'pressure' | 'pressureDrop' | 'flowRate';
  animationEnabled: boolean;
  autoLayout: boolean;
  showMetrics: boolean;
  showCriticalPoints: boolean;
}