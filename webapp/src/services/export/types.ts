import type { ProcessedResult } from '../../services/calculation/resultProcessor';
import type {
  ExportFormat,
  ExportOptions as ExportOptionsType,
  ReportTemplate,
  ReportTemplateConfig,
  ExportJob,
  ExportPreferences,
  CompressionOptions,
  SecurityOptions,
  EmailDeliveryOptions,
  CloudStorageOptions,
  QualitySettings,
} from '../../components/export/types';

// Base Export Types
export interface ExportService {
  format: ExportFormat;
  canExport: (options: ExportOptionsType) => boolean;
  export: (data: ExportData, options: ExportOptionsType) => Promise<ExportResult>;
  validateOptions: (options: ExportOptionsType) => ValidationResult;
}

export interface ExportData {
  calculationId: string;
  calculationName: string;
  result: ProcessedResult;
  metadata: ExportMetadata;
  template?: ReportTemplateConfig;
  branding?: any;
  sections?: string[];
}

export interface ExportMetadata {
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

export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  dataUrl?: string;
  error?: string;
  warnings?: string[];
  metadata?: {
    exportTime: number;
    compressionRatio?: number;
    pageCount?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ExportError[];
  warnings: ExportWarning[];
  suggestions: ExportSuggestion[];
}

export interface ExportError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ExportWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
}

export interface ExportSuggestion {
  field: string;
  message: string;
  type: 'optimization' | 'usability' | 'performance' | 'security';
}

// PDF Export Types
export interface PdfExportOptions {
  format: 'a4' | 'a3' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  includeCharts: boolean;
  includeTables: boolean;
  includeMetadata: boolean;
  compress: boolean;
  embedFonts: boolean;
  addWatermark: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  addEncryption: boolean;
  password?: string;
  permissions?: string[];
  quality: 'low' | 'medium' | 'high' | 'print';
}

export interface PdfDocumentStructure {
  header: PdfHeader;
  footer: PdfFooter;
  content: PdfContentSection[];
  styles: PdfStyles;
}

export interface PdfHeader {
  showLogo: boolean;
  logoUrl?: string;
  title: string;
  showDate: boolean;
  showPageNumbers: boolean;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
}

export interface PdfFooter {
  showCompanyInfo: boolean;
  companyInfo?: string;
  confidentialityNotice?: string;
  showPageNumbers: boolean;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
}

export interface PdfContentSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'section';
  content: any;
  order: number;
  style?: PdfSectionStyle;
}

export interface PdfSectionStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  border?: string;
}

export interface PdfStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: {
    title: number;
    heading: number;
    subheading: number;
    body: number;
    caption: number;
  };
  spacing: {
    section: number;
    paragraph: number;
    cell: number;
  };
}

// Excel Export Types
export interface ExcelExportOptions {
  includeFormulas: boolean;
  freezeHeaders: boolean;
  autoFilter: boolean;
  columnWidths: Record<string, number>;
  sheetNames: Record<string, string>;
  includeCharts: boolean;
  chartPosition: string;
  chartSize: {
    width: number;
    height: number;
  };
  protectSheets: boolean;
  password?: string;
  includeHiddenData: boolean;
  dataValidation: boolean;
}

export interface ExcelWorkbookStructure {
  sheets: ExcelSheet[];
  styles: ExcelStyles;
  charts: ExcelChart[];
  dataValidation: ExcelDataValidation[];
}

export interface ExcelSheet {
  name: string;
  data: any[][];
  headers: string[];
  formulas?: Record<string, string>;
  styles?: Record<string, ExcelCellStyle>;
  frozenRows?: number;
  frozenCols?: number;
  autoFilter?: boolean;
  columnWidths?: Record<string, number>;
}

export interface ExcelCellStyle {
  font?: ExcelFont;
  fill?: ExcelFill;
  border?: ExcelBorder;
  alignment?: ExcelAlignment;
  numberFormat?: string;
}

export interface ExcelFont {
  name?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ExcelFill {
  type?: 'solid' | 'gradient';
  color?: string;
  pattern?: string;
}

export interface ExcelBorder {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface ExcelAlignment {
  horizontal?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'center' | 'bottom';
  wrapText?: boolean;
}

export interface ExcelChart {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  dataRange: string;
  position: {
    cell: string;
    x?: number;
    y?: number;
  };
  size?: {
    width: number;
    height: number;
  };
  series: ExcelChartSeries[];
}

export interface ExcelChartSeries {
  name: string;
  dataRange: string;
  color?: string;
}

export interface ExcelDataValidation {
  range: string;
  type: 'list' | 'whole' | 'decimal' | 'date' | 'textLength';
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual';
  formula1?: string;
  formula2?: string;
  showInputMessage?: boolean;
  prompt?: string;
  showErrorMessage?: boolean;
  error?: string;
}

export interface ExcelStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerStyle: ExcelCellStyle;
  dataStyle: ExcelCellStyle;
  totalStyle: ExcelCellStyle;
}

// CSV Export Types
export interface CsvExportOptions {
  delimiter: ',' | ';' | '\t' | '|';
  includeHeaders: boolean;
  includeMetadata: boolean;
  encoding: 'utf-8' | 'utf-16' | 'latin1';
  quoteChar: string;
  escapeChar: string;
  lineTerminator: '\n' | '\r\n';
  includeBOM: boolean;
}

export interface CsvData {
  headers: string[];
  rows: any[][];
  metadata?: Record<string, any>;
}

// JSON Export Types
export interface JsonExportOptions {
  format: 'compact' | 'prettified' | 'hierarchical';
  includeMetadata: boolean;
  includeRawData: boolean;
  includeCalculations: boolean;
  maxDepth?: number;
  includeTypes: boolean;
  dateFormat: 'iso' | 'timestamp' | 'custom';
  customFormat?: string;
}

export interface JsonStructure {
  calculation: {
    metadata: any;
    configuration: any;
    results: ProcessedResult;
  };
  export: {
    timestamp: string;
    format: string;
    options: JsonExportOptions;
  };
}

// XML Export Types
export interface XmlExportOptions {
  includeSchema: boolean;
  schemaUrl?: string;
  rootElement: string;
  includeMetadata: boolean;
  includeRawData: boolean;
  indent: boolean;
  indentSize: number;
  encoding: 'UTF-8' | 'UTF-16' | 'ISO-8859-1';
  includeComments: boolean;
}

export interface XmlStructure {
  declaration: {
    version: string;
    encoding: string;
    standalone?: boolean;
  };
  root: XmlElement;
  schema?: XmlSchema;
}

export interface XmlElement {
  name: string;
  attributes?: Record<string, string>;
  children?: XmlElement[];
  content?: string;
}

export interface XmlSchema {
  targetNamespace?: string;
  elements: XmlSchemaElement[];
  attributes?: XmlSchemaAttribute[];
}

export interface XmlSchemaElement {
  name: string;
  type: string;
  minOccurs?: number;
  maxOccurs?: number;
  children?: XmlSchemaElement[];
}

export interface XmlSchemaAttribute {
  name: string;
  type: string;
  use: 'required' | 'optional';
}

// Image Export Types
export interface ImageExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'webp';
  quality: number; // 0-100 for lossy formats
  resolution: 'low' | 'medium' | 'high' | 'print';
  dpi: number;
  backgroundColor: string;
  includeBorder: boolean;
  borderSize?: number;
  borderStyle?: string;
  includeMetadata: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageData {
  url: string;
  blob: Blob;
  dimensions: {
    width: number;
    height: number;
  };
  size: number;
  format: string;
}

// HTML Export Types
export interface HtmlExportOptions {
  includeStyles: boolean;
  includeScripts: boolean;
  responsive: boolean;
  includePrintStyles: boolean;
  includeInteractiveCharts: boolean;
  includeExportButtons: boolean;
  includeMetadata: boolean;
  base64Assets: boolean;
  minify: boolean;
  charset: string;
}

export interface HtmlStructure {
  head: HtmlHead;
  body: HtmlBody;
  styles?: string;
  scripts?: string;
}

export interface HtmlHead {
  title: string;
  meta: HtmlMeta[];
  links?: HtmlLink[];
  styles?: string;
}

export interface HtmlMeta {
  name: string;
  content: string;
  property?: string;
}

export interface HtmlLink {
  rel: string;
  href: string;
  type?: string;
}

export interface HtmlBody {
  header?: string;
  content: string;
  footer?: string;
  scripts?: string[];
}

// Export Service Configuration
export interface ExportServiceConfig {
  maxFileSize: number;
  supportedFormats: ExportFormat[];
  defaultOptions: Record<ExportFormat, any>;
  compressionEnabled: boolean;
  securityEnabled: boolean;
  cloudStorageEnabled: boolean;
  emailDeliveryEnabled: boolean;
  templatesEnabled: boolean;
}

// Export Job Management
export interface ExportJobManager {
  createJob: (data: ExportData, options: ExportOptionsType) => Promise<ExportJob>;
  getJob: (jobId: string) => Promise<ExportJob | null>;
  updateJob: (jobId: string, updates: Partial<ExportJob>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  listJobs: (userId?: string, limit?: number, offset?: number) => Promise<ExportJob[]>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<ExportJob>;
}

// Export Preferences Management
export interface ExportPreferencesManager {
  getPreferences: (userId: string) => Promise<ExportPreferences>;
  updatePreferences: (userId: string, preferences: Partial<ExportPreferences>) => Promise<void>;
  resetPreferences: (userId: string) => Promise<void>;
  exportPreferences: (userId: string) => Promise<ExportPreferences>;
  importPreferences: (userId: string, preferences: ExportPreferences) => Promise<void>;
}

// Template Management
export interface TemplateManager {
  getTemplates: (userId?: string) => Promise<ReportTemplateConfig[]>;
  getTemplate: (templateId: string) => Promise<ReportTemplateConfig | null>;
  createTemplate: (template: Omit<ReportTemplateConfig, 'id'>) => Promise<ReportTemplateConfig>;
  updateTemplate: (templateId: string, updates: Partial<ReportTemplateConfig>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<ReportTemplateConfig>;
  exportTemplate: (templateId: string) => Promise<any>;
  importTemplate: (templateData: any) => Promise<ReportTemplateConfig>;
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
  errorRate: number;
  successRate: number;
}

// Export Cache
export interface ExportCache {
  set: (key: string, value: any, ttl?: number) => Promise<void>;
  get: (key: string) => Promise<any>;
  has: (key: string) => Promise<boolean>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

// Export Event Types
export interface ExportEvent {
  type: 'progress' | 'completed' | 'failed' | 'cancelled';
  jobId: string;
  data?: any;
  timestamp: Date;
  userId?: string;
}

export interface ExportEventListener {
  (event: ExportEvent): void;
}

// Export Plugin System
export interface ExportPlugin {
  name: string;
  version: string;
  description: string;
  formats: ExportFormat[];
  options: Record<string, any>;
  initialize: () => Promise<void>;
  canExport: (options: ExportOptionsType) => boolean;
  export: (data: ExportData, options: ExportOptionsType) => Promise<ExportResult>;
  validateOptions: (options: ExportOptionsType) => ValidationResult;
  cleanup?: () => Promise<void>;
}

export interface ExportPluginManager {
  registerPlugin: (plugin: ExportPlugin) => void;
  unregisterPlugin: (pluginName: string) => void;
  getPlugin: (format: ExportFormat) => ExportPlugin | undefined;
  listPlugins: () => ExportPlugin[];
  initializePlugins: () => Promise<void>;
  cleanupPlugins: () => Promise<void>;
}