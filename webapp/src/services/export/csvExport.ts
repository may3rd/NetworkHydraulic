import {
  ExportService,
  ExportData,
  ExportResult,
  ValidationResult,
  ExportError,
  ExportWarning,
  ExportSuggestion,
} from './types';

import type { ExportOptions as ExportOptionsType } from '../../components/export/types';

/**
 * CSV Export Service
 * Handles CSV export for data analysis and spreadsheet integration
 */
export class CsvExportService implements ExportService {
  public readonly format = 'csv';

  private defaultOptions = {
    delimiter: ',',
    includeHeaders: true,
    includeMetadata: false,
    encoding: 'utf-8',
    quoteChar: '"',
    escapeChar: '"',
    lineTerminator: '\n',
    includeBOM: false,
  };

  /**
   * Check if the service can export with given options
   */
  canExport(options: ExportOptionsType): boolean {
    return options.format === 'csv';
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

      // Generate CSV content
      const csvContent = await this.generateCsvContent(data, exportOptions);

      // Create blob and download URL
      const blob = new Blob([csvContent], { 
        type: exportOptions.encoding === 'utf-8' && exportOptions.includeBOM 
          ? 'text/csv;charset=utf-8-bom' 
          : `text/csv;charset=${exportOptions.encoding}` 
      });

      // Add BOM if requested
      let finalContent = csvContent;
      if (exportOptions.includeBOM && exportOptions.encoding === 'utf-8') {
        finalContent = '\uFEFF' + csvContent;
      }

      const fileSize = blob.size;
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = this.generateFileName(data.calculationName, options);

      return {
        success: true,
        fileName,
        fileSize,
        downloadUrl,
        dataUrl: `data:text/csv;charset=${exportOptions.encoding},${encodeURIComponent(finalContent)}`,
        metadata: {
          exportTime: Date.now(),
        },
      };
    } catch (error) {
      console.error('CSV export error:', error);
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

    // Check delimiter options
    const validDelimiters = [',', ';', '\t', '|'];
    if (options.customFields?.delimiter && !validDelimiters.includes(options.customFields.delimiter)) {
      errors.push({
        field: 'delimiter',
        message: 'Invalid delimiter. Use comma, semicolon, tab, or pipe.',
        code: 'INVALID_DELIMITER',
        severity: 'error',
      });
    }

    // Check encoding
    const validEncodings = ['utf-8', 'utf-16', 'latin1'];
    if (options.customFields?.encoding && !validEncodings.includes(options.customFields.encoding)) {
      errors.push({
        field: 'encoding',
        message: 'Invalid encoding. Use utf-8, utf-16, or latin1.',
        code: 'INVALID_ENCODING',
        severity: 'error',
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
  private mergeOptions(options: ExportOptionsType): any {
    return {
      ...this.defaultOptions,
      delimiter: options.customFields?.delimiter || this.defaultOptions.delimiter,
      includeHeaders: options.includeMetadata ?? true,
      includeMetadata: options.includeMetadata ?? false,
      encoding: options.customFields?.encoding || this.defaultOptions.encoding,
      quoteChar: options.customFields?.quoteChar || this.defaultOptions.quoteChar,
      escapeChar: options.customFields?.escapeChar || this.defaultOptions.escapeChar,
      lineTerminator: options.customFields?.lineTerminator || this.defaultOptions.lineTerminator,
      includeBOM: options.customFields?.includeBOM ?? false,
    };
  }

  /**
   * Generate CSV content
   */
  private async generateCsvContent(data: ExportData, options: any): Promise<string> {
    const lines: string[] = [];

    // Add metadata section if requested
    if (options.includeMetadata) {
      lines.push(...this.generateMetadataSection(data, options));
      lines.push(''); // Empty line separator
    }

    // Add sections data
    if (data.result.sections && data.result.sections.length > 0) {
      // Add headers
      if (options.includeHeaders) {
        const headers = this.generateSectionHeaders(data.result.sections[0]);
        lines.push(this.escapeCsvValue(headers.join(options.delimiter)));
      }

      // Add data rows
      data.result.sections.forEach(section => {
        const row = this.generateSectionRow(section, options);
        lines.push(this.escapeCsvValue(row.join(options.delimiter)));
      });
    }

    // Add summary data if available
    if (data.result.summary) {
      lines.push(''); // Empty line separator
      lines.push(...this.generateSummarySection(data.result.summary, options));
    }

    return lines.join(options.lineTerminator);
  }

  /**
   * Generate metadata section
   */
  private generateMetadataSection(data: ExportData, options: any): string[] {
    const lines: string[] = [];
    const metadata = data.metadata;

    lines.push('Metadata Section');
    if (metadata) {
      lines.push(`Calculation Name${options.delimiter}${data.calculationName}`);
      lines.push(`Generated At${options.delimiter}${metadata.generatedAt?.toISOString() || new Date().toISOString()}`);
      lines.push(`Generator Version${options.delimiter}${metadata.generatorVersion || '1.0.0'}`);
      
      if (metadata.user) {
        lines.push(`User Name${options.delimiter}${metadata.user.name || 'Unknown'}`);
        lines.push(`User Email${options.delimiter}${metadata.user.email || 'Unknown'}`);
        lines.push(`Company${options.delimiter}${metadata.user.company || 'Unknown'}`);
      }
    }

    return lines;
  }

  /**
   * Generate section headers
   */
  private generateSectionHeaders(firstSection: any): string[] {
    return [
      'Section ID',
      'Description',
      'Inlet Pressure (kPa)',
      'Outlet Pressure (kPa)',
      'Pressure Drop (kPa)',
      'Velocity (m/s)',
      'Reynolds Number',
      'Friction Factor',
      'Length (m)',
      'Diameter (m)',
      'Elevation Change (m)',
      'Status',
      'Remarks',
    ];
  }

  /**
   * Generate section data row
   */
  private generateSectionRow(section: any, options: any): string[] {
    return [
      section.id || 'Unknown',
      section.description || '',
      (section.pressureInfo?.inletPressure || 0).toFixed(3),
      (section.pressureInfo?.outletPressure || 0).toFixed(3),
      (section.pressureInfo?.pressureDrop || 0).toFixed(3),
      (section.flowInfo?.velocity || 0).toFixed(4),
      (section.flowInfo?.reynoldsNumber || 0).toFixed(0),
      (section.flowInfo?.frictionFactor || 0).toFixed(6),
      (section.length || 0).toFixed(3),
      (section.diameter || 0).toFixed(6),
      (section.elevationChange || 0).toFixed(3),
      section.status?.velocityStatus || 'normal',
      section.recommendation || '',
    ];
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(summary: any, options: any): string[] {
    const lines: string[] = [];
    lines.push('Summary Section');
    lines.push(`Total Pressure Drop (kPa)${options.delimiter}${summary.pressureInfo?.totalPressureDrop?.toFixed(3) || 'N/A'}`);
    lines.push(`Maximum Velocity (m/s)${options.delimiter}${summary.flowInfo?.maxVelocity?.toFixed(4) || 'N/A'}`);
    lines.push(`Total Length (m)${options.delimiter}${summary.networkInfo?.totalLength?.toFixed(3) || 'N/A'}`);
    lines.push(`Number of Sections${options.delimiter}${summary.networkInfo?.sectionsCount || 'N/A'}`);
    
    return lines;
  }

  /**
   * Escape CSV values
   */
  private escapeCsvValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If value contains delimiter, quote char, newlines, or starts/ends with spaces
    if (stringValue.includes(',') || 
        stringValue.includes(';') || 
        stringValue.includes('\t') || 
        stringValue.includes('"') || 
        stringValue.includes('\n') || 
        stringValue.includes('\r') ||
        stringValue.startsWith(' ') || 
        stringValue.endsWith(' ')) {
      
      // Escape quote characters by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return stringValue;
  }

  /**
   * Generate file name
   */
  private generateFileName(calculationName: string, options: ExportOptionsType): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const baseName = calculationName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    return `${baseName}_data_${timestamp}.csv`;
  }
}

// Export default instance
export default new CsvExportService();