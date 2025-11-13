import {
  ExportService,
  ExportData,
  ExportResult,
  PdfExportOptions,
  PdfDocumentStructure,
  PdfHeader,
  PdfFooter,
  PdfContentSection,
  PdfStyles,
  ValidationResult,
  ExportError,
  ExportWarning,
  ExportSuggestion,
} from './types';

import type { ExportOptions as ExportOptionsType } from '../../components/export/types';

import type { ProcessedResult } from '../../services/calculation/resultProcessor';

// Mock jsPDF and html2canvas imports for browser environment
declare global {
  interface Window {
    jsPDF?: any;
    html2canvas?: any;
  }
}

/**
 * PDF Export Service
 * Handles professional PDF document generation with charts, tables, and formatting
 */
export class PdfExportService implements ExportService {
  public readonly format = 'pdf';

  private defaultOptions: PdfExportOptions = {
    format: 'a4',
    orientation: 'portrait',
    margins: { top: 25, bottom: 25, left: 25, right: 25 },
    includeCharts: true,
    includeTables: true,
    includeMetadata: true,
    compress: true,
    embedFonts: true,
    addWatermark: false,
    watermarkOpacity: 0.15,
    addEncryption: false,
    quality: 'high',
  };

  /**
   * Check if the service can export with given options
   */
  canExport(options: ExportOptionsType): boolean {
    return options.format === 'pdf';
  }

  /**
   * Main export method
   */
  async export(data: ExportData, options: ExportOptionsType): Promise<ExportResult> {
    try {
      // Validate options
      const validationResult = this.validateOptions(options);
      if (!validationResult.isValid) {
        return {
          success: false,
          fileName: '',
          fileSize: 0,
          error: 'Invalid export options',
          warnings: validationResult.warnings.map(w => w.message),
        };
      }

      // Merge with default options
      const exportOptions = this.mergeOptions(options);

      // Generate PDF document structure
      const documentStructure = await this.generateDocumentStructure(data, exportOptions);

      // Create PDF using jsPDF
      const pdf = await this.createPdf(documentStructure, exportOptions);

      // Generate file name
      const fileName = this.generateFileName(data.calculationName, options);

      // Convert to blob and create download URL
      const pdfBlob = pdf.output('blob');
      const fileSize = pdfBlob.size;
      const downloadUrl = URL.createObjectURL(pdfBlob);

      return {
        success: true,
        fileName,
        fileSize,
        downloadUrl,
        metadata: {
          exportTime: Date.now(),
          pageCount: pdf.getNumberOfPages(),
        },
      };
    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        fileName: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  /**
   * Validate export options
   */
  validateOptions(options: ExportOptionsType): ValidationResult {
    const errors: ExportError[] = [];
    const warnings: ExportWarning[] = [];
    const suggestions: ExportSuggestion[] = [];

    // Check required fields
    if (!options.template) {
      errors.push({
        field: 'template',
        message: 'Template is required for PDF export',
        code: 'MISSING_TEMPLATE',
        severity: 'critical',
      });
    }

    // Check watermark options
    if (options.addWatermark && !options.customFields?.watermarkText) {
      warnings.push({
        field: 'watermarkText',
        message: 'Watermark text not specified, using default',
        code: 'MISSING_WATERMARK_TEXT',
        severity: 'warning',
      });
    }

    // Check security options
    if (options.customFields?.encryptFile && !options.customFields?.password) {
      errors.push({
        field: 'password',
        message: 'Password is required when encryption is enabled',
        code: 'MISSING_PASSWORD',
        severity: 'error',
      });
    }

    // Performance suggestions
    if (options.includeCharts && options.includeRawData) {
      suggestions.push({
        field: 'performance',
        message: 'Consider reducing chart quality for large datasets',
        type: 'performance',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Merge user options with defaults
   */
  private mergeOptions(options: ExportOptionsType): PdfExportOptions {
    const qualitySettings = (options.customFields?.qualitySettings as any) || {};
    
    return {
      ...this.defaultOptions,
      format: options.format === 'a3' ? 'a3' : 'a4' as 'a4',
      orientation: options.template === 'comparison_report' ? 'landscape' : 'portrait',
      includeCharts: options.includeCharts ?? true,
      includeTables: options.includeRawData ?? false,
      includeMetadata: options.includeMetadata ?? true,
      compress: options.compressLargeFiles ?? true,
      addWatermark: options.customFields?.addWatermark ?? false,
      watermarkText: options.customFields?.watermarkText || 'Confidential',
      watermarkOpacity: options.customFields?.watermarkOpacity || 0.15,
      addEncryption: options.customFields?.encryptFile ?? false,
      password: options.customFields?.password,
      quality: qualitySettings.imageResolution || 'high',
    };
  }

  /**
   * Generate PDF document structure
   */
  private async generateDocumentStructure(
    data: ExportData,
    options: PdfExportOptions
  ): Promise<PdfDocumentStructure> {
    const styles = this.generateStyles();
    const header = this.generateHeader(data, options);
    const footer = this.generateFooter(data, options);
    
    const content: PdfContentSection[] = [];

    // Add executive summary section
    if (options.includeTables) {
      content.push({
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'table',
        content: this.generateExecutiveSummaryTable(data.result),
        order: 1,
      });
    }

    // Add detailed results section
    if (options.includeTables) {
      content.push({
        id: 'detailed_results',
        title: 'Detailed Results',
        type: 'table',
        content: this.generateDetailedResultsTable(data.result),
        order: 2,
      });
    }

    // Add charts section
    if (options.includeCharts) {
      const charts = await this.generateCharts(data.result);
      content.push({
        id: 'charts',
        title: 'Charts and Graphs',
        type: 'chart',
        content: charts,
        order: 3,
      });
    }

    // Add metadata section
    if (options.includeMetadata) {
      content.push({
        id: 'metadata',
        title: 'Export Metadata',
        type: 'text',
        content: this.generateMetadataSection(data),
        order: 4,
      });
    }

    return {
      header,
      footer,
      content: content.sort((a, b) => a.order - b.order),
      styles,
    };
  }

  /**
   * Generate PDF styles
   */
  private generateStyles(): PdfStyles {
    return {
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      fontFamily: 'helvetica',
      fontSize: {
        title: 24,
        heading: 16,
        subheading: 14,
        body: 12,
        caption: 10,
      },
      spacing: {
        section: 10,
        paragraph: 5,
        cell: 3,
      },
    };
  }

  /**
   * Generate PDF header
   */
  private generateHeader(data: ExportData, options: PdfExportOptions): PdfHeader {
    return {
      showLogo: true,
      logoUrl: data.branding?.logoUrl,
      title: data.calculationName,
      showDate: true,
      showPageNumbers: true,
      backgroundColor: data.branding?.primaryColor || '#1976d2',
      textColor: '#ffffff',
      height: 30,
    };
  }

  /**
   * Generate PDF footer
   */
  private generateFooter(data: ExportData, options: PdfExportOptions): PdfFooter {
    return {
      showCompanyInfo: true,
      companyInfo: data.branding?.companyName || 'Hydraulic Analysis Report',
      confidentialityNotice: data.branding?.confidentialityNotice,
      showPageNumbers: true,
      backgroundColor: '#f5f5f5',
      textColor: '#666666',
      height: 20,
    };
  }

  /**
   * Generate executive summary table
   */
  private generateExecutiveSummaryTable(result: ProcessedResult): any {
    const summary = result.summary;
    return [
      ['Metric', 'Value', 'Unit', 'Status'],
      ['Total Pressure Drop', 'N/A', 'kPa', 'Normal'],
      ['Maximum Velocity', 'N/A', 'm/s', 'Normal'],
      ['Design Margin', '0.0', '%', 'None'],
      ['Critical Conditions', '0', 'count', 'None'],
    ];
  }

  /**
   * Generate detailed results table
   */
  private generateDetailedResultsTable(result: ProcessedResult): any {
    const sections = result.sections || [];
    const tableData = [['Section', 'Inlet Pressure', 'Outlet Pressure', 'Pressure Drop', 'Velocity', 'Status']];
    
    sections.forEach(section => {
      tableData.push([
        section.id || 'Unknown',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        typeof section.status === 'string' ? section.status : 'normal',
      ]);
    });

    return tableData;
  }

  /**
   * Generate charts from result data
   */
  private async generateCharts(result: ProcessedResult): Promise<any[]> {
    // This would typically use charting libraries to generate images
    // For now, we'll return placeholder chart data
    const charts = [];

    // Pressure profile chart
    if (result.sections?.length > 0) {
      charts.push({
        type: 'line',
        title: 'Pressure Profile',
        data: {
          labels: result.sections.map((_, index) => `Section ${index + 1}`),
          datasets: [
            {
              label: 'Inlet Pressure',
              data: result.sections ? result.sections.map(() => 0) : [],
              borderColor: '#1976d2',
              fill: false,
            },
            {
              label: 'Outlet Pressure',
              data: result.sections ? result.sections.map(() => 0) : [],
              borderColor: '#ff9800',
              fill: false,
            },
          ],
        },
      });
    }

    return charts;
  }

  /**
   * Generate metadata section
   */
  private generateMetadataSection(data: ExportData): string {
    const metadata = data.metadata;
    return `
Export Information:
- Generated: ${metadata?.generatedAt?.toLocaleString() || new Date().toLocaleString()}
- Generator Version: ${metadata?.generatorVersion || '1.0.0'}
- Calculation ID: ${data.calculationId}
- User: ${metadata?.user?.name || 'Unknown'}

Document Settings:
- Format: PDF
- Quality: High
- Charts: ${data.template?.sections?.some(s => s.enabled) ? 'Included' : 'Not included'}
- Tables: Included
- Metadata: Included
    `.trim();
  }

  /**
   * Create PDF document using jsPDF
   */
  private async createPdf(
    documentStructure: PdfDocumentStructure,
    options: PdfExportOptions
  ): Promise<any> {
    // This is a simplified implementation
    // In a real application, you would use jsPDF with proper formatting
    if (typeof window === 'undefined' || !window.jsPDF) {
      throw new Error('jsPDF is not available in this environment');
    }

    const jsPDF = window.jsPDF;
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: options.format,
    });

    // Set document properties
    pdf.setProperties({
      title: documentStructure.header.title,
      author: 'Hydraulic Analysis System',
      subject: 'Calculation Results',
      keywords: 'hydraulic, pressure, flow, analysis',
      creator: 'NetworkHydraulic Web Application',
    });

    // Add content pages
    this.addContentPages(pdf, documentStructure, options);

    // Apply watermark if enabled
    if (options.addWatermark) {
      this.addWatermark(pdf, options.watermarkText || 'Confidential', options.watermarkOpacity || 0.15);
    }

    // Apply encryption if enabled
    if (options.addEncryption && options.password) {
      // Note: jsPDF encryption support may vary
      console.warn('PDF encryption not fully implemented in this version');
    }

    return pdf;
  }

  /**
   * Add content pages to PDF
   */
  private addContentPages(pdf: any, documentStructure: PdfDocumentStructure, options: PdfExportOptions): void {
    const { header, footer, content, styles } = documentStructure;
    
    // Add title page
    this.addTitlePage(pdf, header, styles);
    
    // Add table of contents
    this.addTableOfContents(pdf, content, styles);
    
    // Add content pages
    content.forEach((section, index) => {
      if (index > 0) pdf.addPage();
      this.addContentSection(pdf, section, styles);
    });

    // Add footer to all pages
    this.addFooterToAllPages(pdf, footer, styles);
  }

  /**
   * Add title page
   */
  private addTitlePage(pdf: any, header: PdfHeader, styles: PdfStyles): void {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Background
    pdf.setFillColor(styles.primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Title
    pdf.setFontSize(styles.fontSize.title);
    pdf.setTextColor('#ffffff');
    pdf.setFontStyle('bold');
    pdf.text(header.title, pageWidth / 2, 30, { align: 'center' });

    // Subtitle
    pdf.setFontSize(styles.fontSize.body);
    pdf.text('Hydraulic Network Analysis Report', pageWidth / 2, 45, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(pdf: any, content: PdfContentSection[], styles: PdfStyles): void {
    pdf.addPage();
    pdf.setFontSize(styles.fontSize.heading);
    pdf.setTextColor(styles.secondaryColor);
    pdf.setFontStyle('bold');
    pdf.text('Table of Contents', 20, 30);

    content.forEach((section, index) => {
      const y = 50 + index * 10;
      pdf.setFontSize(styles.fontSize.body);
      pdf.setTextColor(styles.secondaryColor);
      pdf.setFontStyle('normal');
      pdf.text(`${section.title}`, 20, y);
      pdf.text(`${pdf.getNumberOfPages()}`, pdf.internal.pageSize.width - 20, y, { align: 'right' });
    });
  }

  /**
   * Add content section
   */
  private addContentSection(pdf: any, section: PdfContentSection, styles: PdfStyles): void {
    const pageWidth = pdf.internal.pageSize.width;
    
    // Section title
    pdf.setFontSize(styles.fontSize.heading);
    pdf.setTextColor(styles.primaryColor);
    pdf.setFontStyle('bold');
    pdf.text(section.title, 20, 30);

    // Section content
    if (section.type === 'table' && Array.isArray(section.content)) {
      this.addTable(pdf, section.content, styles);
    } else if (section.type === 'text') {
      pdf.setFontSize(styles.fontSize.body);
      pdf.setTextColor(styles.secondaryColor);
      pdf.setFontStyle('normal');
      pdf.text(section.content as string, 20, 50);
    }
  }

  /**
   * Add table to PDF
   */
  private addTable(pdf: any, data: any[][], styles: PdfStyles): void {
    if (!data || data.length === 0) return;

    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const colWidth = (pageWidth - 2 * margin) / data[0].length;
    let y = 50;

    // Table header
    pdf.setFontSize(styles.fontSize.body);
    pdf.setFontStyle('bold');
    pdf.setFillColor(styles.primaryColor);
    pdf.setTextColor('#ffffff');

    data[0].forEach((cell, index) => {
      pdf.rect(margin + index * colWidth, y, colWidth, 10, 'F');
      pdf.text(cell.toString(), margin + index * colWidth + 2, y + 7);
    });

    // Table rows
    y += 10;
    pdf.setFillColor('#f9f9f9');
    pdf.setTextColor(styles.secondaryColor);

    for (let i = 1; i < data.length; i++) {
      const fillColor = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
      pdf.setFillColor(fillColor);

      data[i].forEach((cell, index) => {
        pdf.rect(margin + index * colWidth, y, colWidth, 8, 'F');
        pdf.text(cell.toString(), margin + index * colWidth + 2, y + 6);
      });

      y += 8;
    }
  }

  /**
   * Add footer to all pages
   */
  private addFooterToAllPages(pdf: any, footer: PdfFooter, styles: PdfStyles): void {
    const pageCount = pdf.getNumberOfPages();
    const pageHeight = pdf.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer background
      pdf.setFillColor(footer.backgroundColor || '#f5f5f5');
      pdf.rect(0, pageHeight - 20, 210, 20, 'F');

      // Footer text
      pdf.setFontSize(8);
      pdf.setTextColor(footer.textColor || '#666666');
      
      if (footer.showCompanyInfo && footer.companyInfo) {
        pdf.text(footer.companyInfo, 20, pageHeight - 7);
      }

      if (footer.showPageNumbers) {
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - 30, pageHeight - 7);
      }

      if (footer.confidentialityNotice) {
        pdf.setFontSize(6);
        pdf.text(footer.confidentialityNotice, pdf.internal.pageSize.width / 2, pageHeight - 7, { align: 'center' });
      }
    }
  }

  /**
   * Add watermark to PDF
   */
  private addWatermark(pdf: any, text: string, opacity: number): void {
    const pageCount = pdf.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Save current state
      pdf.saveGraphicsState();
      
      // Set transparency
      pdf.setGState(new pdf.GState({ opacity }));
      
      // Set text properties
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.setFontStyle('bold');
      
      // Add diagonal watermark
      pdf.text(text, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      
      // Restore state
      pdf.restoreGraphicsState();
    }
  }

  /**
   * Generate file name
   */
  private generateFileName(calculationName: string, options: ExportOptionsType): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const templateName = options.template || 'report';
    return `${calculationName.replace(/\s+/g, '_')}_${templateName}_${timestamp}.pdf`;
  }

  /**
   * Get status indicator
   */
  private getStatus(value: number, threshold: number): string {
    return value > threshold ? 'High' : 'Normal';
  }
}

// Export default instance
export default new PdfExportService();