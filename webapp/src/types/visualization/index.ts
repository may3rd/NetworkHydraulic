// Results Dashboard Types
export interface ResultsDashboardProps {
  result: ProcessedResult;
  isLoading?: boolean;
  error?: string;
  onExport?: (format: 'pdf' | 'excel' | 'json' | 'csv') => void;
  onCompare?: (otherResults: ProcessedResult[]) => void;
}

export interface ResultsSummaryProps {
  summary: ProcessedResult['summary'];
  performance?: {
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
  };
  warnings: string[];
  criticalConditions?: CriticalCondition[];
}

export interface CriticalCondition {
  id: string;
  type: 'velocity' | 'pressure' | 'temperature' | 'flow_rate';
  severity: 'warning' | 'critical';
  message: string;
  sectionId?: string;
  value: number;
  threshold: number;
  recommendation?: string;
}

// Chart Types
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

export interface LossBreakdownData {
  type: 'friction' | 'fittings' | 'elevation' | 'components';
  value: number;
  percentage: number;
  color: string;
}

export interface ReynoldsChartData {
  distance: number;
  reynoldsNumber: number;
  criticalReynolds: number;
  flowRegime: 'laminar' | 'transitional' | 'turbulent';
  sectionId: string;
}

// Chart Configuration Types
export interface ChartConfig {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  interaction?: {
    mode: 'point' | 'nearest' | 'index' | 'dataset';
    axis?: 'x' | 'y' | 'xy';
  };
  plugins?: {
    legend?: LegendConfig;
    tooltip?: TooltipConfig;
    zoom?: ZoomConfig;
  };
  scales?: {
    x?: AxisConfig;
    y?: AxisConfig;
    y1?: AxisConfig;
    y2?: AxisConfig;
  };
}

export interface LegendConfig {
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  labels?: {
    usePointStyle?: boolean;
    padding?: number;
    font?: FontConfig;
  };
}

export interface TooltipConfig {
  enabled?: boolean;
  mode?: 'point' | 'nearest' | 'index' | 'dataset';
  intersect?: boolean;
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  callbacks?: {
    beforeTitle?: (context: any) => string;
    title?: (context: any) => string;
    afterTitle?: (context: any) => string;
    label?: (context: any) => string;
    afterLabel?: (context: any) => string;
  };
}

export interface ZoomConfig {
  pan?: {
    enabled?: boolean;
    mode?: 'x' | 'y' | 'xy';
  };
  zoom?: {
    wheel?: {
      enabled?: boolean;
    };
    pinch?: {
      enabled?: boolean;
    };
    mode?: 'x' | 'y' | 'xy';
  };
}

export interface AxisConfig {
  type?: 'linear' | 'logarithmic' | 'category' | 'time';
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: {
    display?: boolean;
    text?: string;
    font?: FontConfig;
  };
  grid?: {
    display?: boolean;
    color?: string;
    lineWidth?: number;
  };
  ticks?: {
    stepSize?: number;
    min?: number;
    max?: number;
    callback?: (value: any) => string;
  };
}

export interface FontConfig {
  family?: string;
  size?: number;
  weight?: string | number;
  style?: 'normal' | 'italic';
  lineHeight?: number;
}

// Table Types
export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => string | number | JSX.Element;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => JSX.Element;
}

export interface TableData {
  id: string;
  [key: string]: any;
}

export interface TableConfig {
  columns: TableColumn<any>[];
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize: number;
    pageSizeOptions: number[];
  };
  selection?: {
    enabled: boolean;
    multiple: boolean;
  };
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml';
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
  includeRawData?: boolean;
  customTitle?: string;
  includeTimestamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  error?: string;
}

// Analysis Types
export interface PerformanceAnalysis {
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

export interface SensitivityAnalysis {
  parameters: string[];
  scenarios: SensitivityScenario[];
  results: SensitivityResult[];
}

export interface SensitivityScenario {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, number>;
}

export interface SensitivityResult {
  scenarioId: string;
  parameter: string;
  originalValue: number;
  newValue: number;
  impactOnPressureDrop: number;
  impactOnVelocity: number;
  impactOnEfficiency: number;
}

export interface ResultsComparison {
  baseline: ProcessedResult;
  comparison: ProcessedResult[];
  metrics: ComparisonMetric[];
  differences: ComparisonDifference[];
}

export interface ComparisonMetric {
  name: string;
  baselineValue: number;
  comparisonValues: number[];
  unit: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ComparisonDifference {
  metric: string;
  difference: number;
  percentage: number;
  significance: 'increase' | 'decrease' | 'neutral';
}

// Filter and Search Types
export interface ResultsFilter {
  sectionIds?: string[];
  velocityRange?: [number, number];
  pressureRange?: [number, number];
  reynoldsRange?: [number, number];
  status?: ('normal' | 'warning' | 'critical')[];
  hasIssues?: boolean;
  dateRange?: [Date, Date];
}

export interface SearchQuery {
  term: string;
  fields: string[];
  caseSensitive?: boolean;
  fuzzy?: boolean;
}

export interface FilterOptions {
  sections: Array<{ id: string; label: string }>;
  statuses: Array<{ value: string; label: string; color: string }>;
  velocityRanges: Array<{ min: number; max: number; label: string }>;
  pressureRanges: Array<{ min: number; max: number; label: string }>;
}

// Visualization State Types
export interface VisualizationState {
  activeTab: 'summary' | 'tables' | 'charts' | 'analysis' | 'export';
  selectedSections: string[];
  chartZoomLevel: number;
  chartPanPosition: { x: number; y: number };
  tableFilters: ResultsFilter;
  tableSort: {
    field: string;
    direction: 'asc' | 'desc';
  };
  searchTerm: string;
  searchResults: TableData[];
}

export interface VisualizationActions {
  setActiveTab: (tab: VisualizationState['activeTab']) => void;
  setSelectedSections: (sections: string[]) => void;
  setChartZoomLevel: (level: number) => void;
  setChartPanPosition: (position: { x: number; y: number }) => void;
  setTableFilters: (filters: ResultsFilter) => void;
  setTableSort: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  setSearchTerm: (term: string) => void;
  setSearchResults: (results: TableData[]) => void;
  resetFilters: () => void;
  resetSearch: () => void;
}

// Context Types
export interface VisualizationContextValue {
  state: VisualizationState;
  actions: VisualizationActions;
  result: ProcessedResult;
  chartData: ChartDataCache;
  filteredSections: ProcessedSectionResult[];
}

export interface ChartDataCache {
  pressureProfile?: PressureProfileData[];
  velocityProfile?: VelocityProfileData[];
  lossBreakdown?: LossBreakdownData[];
  reynoldsChart?: ReynoldsChartData[];
  frictionFactorChart?: ChartData;
  interactiveChart?: ChartData;
}

// Theme Types
export interface ChartTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  text: string;
  grid: string;
  axis: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable' | 'critical' | 'warning' | 'normal';
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

export interface ResultsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevation';
  loading?: boolean;
  error?: string;
}

// Export Formats
export type ExportFormats = 'pdf' | 'excel' | 'csv' | 'json' | 'xml';

// Import necessary types from existing modules
// Note: These types will be defined in the resultProcessor service
export interface ProcessedResult {
  network: {
    name: string;
    direction: string;
    boundaryPressure: number;
    fluid: any; // FluidConfiguration
  };
  sections: ProcessedSectionResult[];
  summary: {
    inlet: any; // StatePoint
    outlet: any; // StatePoint
    pressureDrop: any; // PressureDropSummary
  };
  warnings?: string[];
  executionTime: number;
  metadata: {
    version: string;
    timestamp: string;
    solver: string;
  };
}

export interface ProcessedSectionResult {
  id: string;
  position: number;
  inletPressure: number;
  outletPressure: number;
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  elevation: number;
  length: number;
  diameter: number;
  roughness: number;
  flowRate: number;
  status: 'normal' | 'warning' | 'critical';
  losses: {
    friction: number;
    fittings: number;
    elevation: number;
    components: number;
  };
}