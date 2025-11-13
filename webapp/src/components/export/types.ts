import type { ProcessedResult } from '../../services/calculation/resultProcessor';

// Alias for backward compatibility
type CalculationResult = ProcessedResult;

// Export Format Types
export type ExportFormat = 
  | 'pdf' 
  | 'excel' 
  | 'csv' 
  | 'json' 
  | 'xml' 
  | 'html' 
  | 'png' 
  | 'svg' 
  | 'jpg';

export type ExportStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type ReportTemplate = 
  | 'executive_summary'
  | 'detailed_technical'
  | 'calculation_report'
  | 'comparison_report'
  | 'one_page'
  | 'custom';

// Export Configuration
export interface ExportOptions {
  format: ExportFormat;
  template?: ReportTemplate;
  includeCharts?: boolean;
  includeNetworkDiagram?: boolean;
  includeRawData?: boolean;
  includeMetadata?: boolean;
  customBranding?: boolean;
  compressLargeFiles?: boolean;
  addWatermark?: boolean;
  includeTimestamp?: boolean;
  selectedSections?: string[];
  customFields?: Record<string, any>;
}

// Export Job
export interface ExportJob {
  id: string;
  userId: string;
  calculationId: string;
  options: ExportOptions;
  status: ExportStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  retryCount: number;
}

// Report Template Configuration
export interface ReportTemplateConfig {
  id: ReportTemplate;
  name: string;
  description: string;
  sections: ReportSection[];
  layout: ReportLayout;
  branding: ReportBranding;
  defaultOptions: Partial<ExportOptions>;
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
}

export interface ReportFooter {
  showCompanyInfo: boolean;
  companyInfo?: string;
  confidentialityNotice?: string;
  showPageNumbers: boolean;
}

export interface ReportBranding {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  watermarkText?: string;
  customCss?: string;
}

// Batch Export
export interface BatchExportRequest {
  calculationIds: string[];
  options: ExportOptions;
  schedule?: {
    runAt: Date;
    recurring?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  notifications?: {
    emailOnComplete?: boolean;
    email?: string;
  };
}

export interface BatchExportJob {
  id: string;
  userId: string;
  requests: BatchExportRequest[];
  status: ExportStatus;
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  results: ExportJob[];
  summary: BatchExportSummary;
}

export interface BatchExportSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalFileSize: number;
  estimatedCompletion: Date;
}

// Export History
export interface ExportHistoryItem {
  id: string;
  calculationId: string;
  calculationName: string;
  calculationDate: Date;
  format: ExportFormat;
  template?: ReportTemplate;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  lastDownloaded?: Date;
  createdAt: Date;
  expiresAt?: Date;
  tags: string[];
  notes?: string;
}

// Export Preferences
export interface ExportPreferences {
  defaultFormat: ExportFormat;
  defaultTemplate: ReportTemplate;
  autoCompressLargeFiles: boolean;
  defaultIncludeCharts: boolean;
  defaultIncludeNetworkDiagram: boolean;
  defaultIncludeRawData: boolean;
  emailNotifications: boolean;
  exportHistoryRetentionDays: number;
  maxFileSizeMB: number;
  recentTemplates: ReportTemplate[];
  customBranding: ReportBranding;
}

// Export Validation
export interface ExportValidationResult {
  isValid: boolean;
  errors: ExportValidationError[];
  warnings: ExportValidationWarning[];
  suggestions: ExportValidationSuggestion[];
}

export interface ExportValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ExportValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ExportValidationSuggestion {
  field: string;
  message: string;
  type: 'optimization' | 'usability' | 'performance';
}

// Export Hooks State
export interface ExportState {
  activeJobs: ExportJob[];
  history: ExportHistoryItem[];
  preferences: ExportPreferences;
  templates: ReportTemplateConfig[];
  isInitialized: boolean;
}

export interface ExportActions {
  exportCalculation: (calculationId: string, options: ExportOptions) => Promise<ExportJob>;
  batchExport: (request: BatchExportRequest) => Promise<BatchExportJob>;
  cancelExport: (jobId: string) => Promise<void>;
  retryExport: (jobId: string) => Promise<ExportJob>;
  downloadExport: (jobId: string) => Promise<void>;
  deleteExport: (jobId: string) => Promise<void>;
  getExportHistory: (limit?: number, offset?: number) => Promise<ExportHistoryItem[]>;
  updatePreferences: (preferences: Partial<ExportPreferences>) => Promise<void>;
  addHistoryItem: (item: ExportHistoryItem) => void;
  removeHistoryItem: (itemId: string) => void;
  clearHistory: () => Promise<void>;
  validateExportOptions: (options: ExportOptions) => Promise<ExportValidationResult>;
}

// Export Hook Return Type
export interface UseExportReturn {
  state: ExportState;
  actions: ExportActions;
  isLoading: boolean;
  error?: string;
}

// Report Generation State
export interface ReportGenerationState {
  isGenerating: boolean;
  currentStep: string;
  progress: number;
  estimatedTime: number;
  outputFileSize?: number;
  error?: string;
}

// Export Progress
export interface ExportProgressState {
  jobId: string;
  status: ExportStatus;
  progress: number;
  currentStep: string;
  message: string;
  eta?: Date;
  error?: string;
}

// Custom Export Events
export interface ExportEvent {
  type: 'progress' | 'completed' | 'failed' | 'cancelled';
  jobId: string;
  data?: any;
  timestamp: Date;
}

// File Compression Options
export interface CompressionOptions {
  enabled: boolean;
  format: 'zip' | 'gzip' | '7z';
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  password?: string;
  splitLargeFiles?: boolean;
  maxSplitSizeMB?: number;
}

// Security Options
export interface SecurityOptions {
  addWatermark: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  encryptFile?: boolean;
  password?: string;
  readOnly?: boolean;
  expiryDate?: Date | undefined;
}

// Email Delivery Options
export interface EmailDeliveryOptions {
  enabled: boolean;
  recipients: string[];
  subject?: string;
  message?: string;
  attachFile: boolean;
  includeLink: boolean;
  expiryHours?: number;
}

// Cloud Storage Integration
export interface CloudStorageOptions {
  enabled: boolean;
  provider: 'google_drive' | 'dropbox' | 'onedrive' | 'aws_s3';
  credentials?: Record<string, any>;
  folderPath?: string;
  shareableLink?: boolean;
  linkExpiry?: Date | undefined;
}

// Template Variables for Dynamic Content
export interface TemplateVariables {
  calculation: CalculationResult;
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

// Export Analytics
export interface ExportAnalytics {
  totalExports: number;
  exportsByFormat: Record<ExportFormat, number>;
  exportsByTemplate: Record<ReportTemplate, number>;
  averageExportTime: number;
  mostPopularSections: string[];
  fileSizes: {
    average: number;
    largest: number;
    smallest: number;
  };
  userEngagement: {
    downloadsPerExport: number;
    repeatExportRate: number;
    timeSinceLastExport: number;
  };
}

// Report Quality Settings
export interface QualitySettings {
  imageResolution: 'low' | 'medium' | 'high' | 'print';
  chartQuality: 'standard' | 'enhanced' | 'premium';
  compressionLevel: 'none' | 'light' | 'medium' | 'heavy';
  fontEmbedding: boolean;
  vectorGraphics: boolean;
}

// Export Configuration Presets
export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  options: ExportOptions;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}