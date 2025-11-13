import type { ProcessedResult } from '../../services/calculation/resultProcessor';

// Report Template Types
export interface ReportTemplateProps {
  calculationId: string;
  calculationName: string;
  result: ProcessedResult;
  branding?: ReportBranding;
  layout?: ReportLayout;
  sections?: ReportSection[];
  metadata?: ReportMetadata;
  onSectionChange?: (sectionId: string, enabled: boolean) => void;
  isPreview?: boolean;
}

export interface ReportBranding {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  companyName?: string;
  reportTitle?: string;
  customCss?: string;
}

export interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A3' | 'letter' | 'legal';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header: ReportHeader;
  footer: ReportFooter;
}

export interface ReportHeader {
  showLogo: boolean;
  logoUrl?: string;
  title: string;
  showDate: boolean;
  showPageNumbers: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface ReportFooter {
  showCompanyInfo: boolean;
  companyInfo?: string;
  confidentialityNotice?: string;
  showPageNumbers: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  content: ReportSectionContent;
}

export type ReportSectionContent = 
  | 'executive_summary'
  | 'calculation_results'
  | 'network_diagram'
  | 'pressure_profile'
  | 'velocity_distribution'
  | 'loss_breakdown'
  | 'critical_conditions'
  | 'recommendations'
  | 'methodology'
  | 'appendices';

export interface ReportMetadata {
  generatedAt: Date;
  generatorVersion: string;
  calculationVersion?: string;
  user?: {
    name: string;
    email: string;
    company: string;
    role: string;
  };
  system?: {
    environment: string;
    hostname?: string;
    userAgent?: string;
  };
}

export interface ReportSectionProps extends ReportTemplateProps {
  section: ReportSection;
}

// Report Data Types
export interface ExecutiveSummaryData {
  totalPressureDrop: number;
  maxVelocity: number;
  designMarginApplied: number;
  criticalConditions: CriticalCondition[];
  keyMetrics: KeyMetric[];
  recommendations: Recommendation[];
  performanceSummary: PerformanceSummary;
}

export interface CriticalCondition {
  id: string;
  type: 'velocity' | 'pressure' | 'temperature' | 'flow_rate' | 'reynolds';
  severity: 'warning' | 'critical';
  message: string;
  sectionId?: string;
  value: number;
  threshold: number;
  recommendation?: string;
}

export interface KeyMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable' | 'critical' | 'warning' | 'normal';
  target?: number;
  description?: string;
}

export interface Recommendation {
  id: string;
  type: 'optimization' | 'safety' | 'cost' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  estimatedCost?: number;
  estimatedBenefit?: number;
  timeframe?: string;
}

export interface PerformanceSummary {
  efficiency: {
    pressureEfficiency: number;
    velocityEfficiency: number;
    overallEfficiency: number;
  };
  optimizationPotential: {
    sectionsToOptimize: string[];
    potentialImprovements: string[];
    estimatedBenefit: number;
  };
  costAnalysis: {
    energyLossCost: number;
    optimizationCost: number;
    roi: number;
  };
}

export interface CalculationResultsData {
  sections: SectionResult[];
  summary: CalculationSummary;
  flowCharacteristics: FlowCharacteristics;
  lossBreakdown: LossBreakdownData;
}

export interface SectionResult {
  id: string;
  description: string;
  inletPressure: number;
  outletPressure: number;
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  elevationChange: number;
  length: number;
  diameter: number;
  status: 'normal' | 'warning' | 'critical';
  remarks: string;
}

export interface CalculationSummary {
  inlet: {
    pressure: number;
    temperature: number;
    density: number;
    velocity: number;
  };
  outlet: {
    pressure: number;
    temperature: number;
    density: number;
    velocity: number;
  };
  totalPressureDrop: number;
  totalLength: number;
  maxVelocity: number;
  averageVelocity: number;
}

export interface FlowCharacteristics {
  massFlowRate: number;
  volumetricFlowRate: number;
  fluidProperties: {
    density: number;
    viscosity: number;
    molecularWeight?: number;
    zFactor?: number;
  };
  flowRegime: 'laminar' | 'transitional' | 'turbulent';
  criticalVelocities: {
    maximumAllowable: number;
    erosional: number;
    minimum: number;
  };
}

export interface LossBreakdownData {
  friction: {
    total: number;
    percentage: number;
  };
  fittings: {
    total: number;
    percentage: number;
    details: FittingLoss[];
  };
  elevation: {
    total: number;
    percentage: number;
  };
  components: {
    total: number;
    percentage: number;
    details: ComponentLoss[];
  };
}

export interface FittingLoss {
  type: string;
  count: number;
  kFactor: number;
  pressureDrop: number;
}

export interface ComponentLoss {
  type: string;
  description: string;
  pressureDrop: number;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  yAxisID?: string;
}

export interface PressureProfileData {
  distance: number;
  inletPressure: number;
  outletPressure: number;
  elevation: number;
  sectionId: string;
  velocity: number;
}

export interface VelocityProfileData {
  distance: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  sectionId: string;
}

// Network Diagram Data
export interface NetworkDiagramData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout: 'hierarchical' | 'circular' | 'force-directed' | 'sankey';
}

export interface NetworkNode {
  id: string;
  type: 'inlet' | 'outlet' | 'junction' | 'valve' | 'orifice' | 'pipe';
  position: { x: number; y: number };
  data: {
    label: string;
    flowRate: number;
    pressure: number;
    diameter: number;
    status: 'normal' | 'warning' | 'critical';
  };
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'pipe' | 'connection';
  data: {
    length: number;
    diameter: number;
    pressureDrop: number;
    velocity: number;
    status: 'normal' | 'warning' | 'critical';
  };
}

// Methodology Data
export interface MethodologyData {
  calculationMethod: string;
  assumptions: string[];
  standards: string[];
  fluidModel: string;
  frictionFactorMethod: string;
  fittingLossMethod: string;
  validation: {
    date: Date;
    method: string;
    accuracy: string;
  };
}

// Export Configuration
export interface ReportExportConfig {
  format: 'pdf' | 'excel' | 'html' | 'png' | 'svg';
  quality: 'low' | 'medium' | 'high' | 'print';
  includeCharts: boolean;
  includeRawData: boolean;
  includeMetadata: boolean;
  compressImages: boolean;
  watermark?: {
    text: string;
    opacity: number;
    position: 'center' | 'diagonal';
  };
  encryption?: {
    password: string;
    permissions: string[];
  };
}

// Report Generation Context
export interface ReportGenerationContext {
  calculationId: string;
  calculationName: string;
  result: ProcessedResult;
  branding: ReportBranding;
  layout: ReportLayout;
  sections: ReportSection[];
  metadata: ReportMetadata;
  config: ReportExportConfig;
  variables: TemplateVariables;
}

export interface TemplateVariables {
  calculation: ProcessedResult;
  user: {
    name: string;
    email: string;
    company: string;
    role: string;
  };
  system: {
    version: string;
    timestamp: Date;
    environment: string;
  };
  custom: Record<string, any>;
}

// PDF Generation Options
export interface PdfGenerationOptions {
  format: 'a4' | 'a3' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  compress: boolean;
  embedFonts: boolean;
  addWatermark: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  addEncryption: boolean;
  password?: string;
}

// Excel Generation Options
export interface ExcelGenerationOptions {
  includeFormulas: boolean;
  freezeHeaders: boolean;
  autoFilter: boolean;
  columnWidths: Record<string, number>;
  sheetNames: Record<string, string>;
  includeCharts: boolean;
  chartPosition: string;
  protectSheets: boolean;
  password?: string;
}