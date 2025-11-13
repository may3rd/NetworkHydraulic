import { ProcessedResult } from '../../services/calculation/resultProcessor';
import type { ExportFormats } from '../../types/visualization';

interface ExportOptions {
  format: ExportFormats;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeSummary?: boolean;
  includeRawData?: boolean;
  customTitle?: string;
  includeTimestamp?: boolean;
}

interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  error?: string;
}

export class ExportFormatters {
  /**
   * Export results to various formats
   */
  static async exportResults(
    result: ProcessedResult,
    options: ExportOptions
  ): Promise<ExportResult> {
    const {
      format,
      includeCharts = false,
      includeTables = true,
      includeSummary = true,
      includeRawData = false,
      customTitle,
      includeTimestamp = true,
    } = options;

    try {
      const timestamp = includeTimestamp ? new Date().toISOString().split('T')[0] : '';
      const title = customTitle || `${result.summary.networkInfo.name}_Results`;
      const fileName = `${title}_${timestamp}.${format}`;

      let content: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = this.convertToJson(result, { includeRawData });
          mimeType = 'application/json';
          break;

        case 'csv':
          content = this.convertToCsv(result, { includeTables });
          mimeType = 'text/csv';
          break;

        case 'excel':
          // For Excel, we would typically use a library like xlsx
          // This is a simplified version that creates CSV content
          content = this.convertToCsv(result, { includeTables });
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          content = this.convertToPdf(result, { 
            includeSummary, 
            includeTables, 
            includeCharts 
          });
          mimeType = 'application/pdf';
          break;

        case 'xml':
          content = this.convertToXml(result, { includeRawData });
          mimeType = 'application/xml';
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create download URL
      const blob = new Blob([content], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      const fileSize = blob.size;

      return {
        success: true,
        fileName,
        fileSize,
        downloadUrl,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        fileSize: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Convert result to JSON format
   */
  private static convertToJson(
    result: ProcessedResult, 
    options: { includeRawData: boolean }
  ): string {
    const { includeRawData } = options;

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: 'JSON',
        version: '1.0',
      },
      summary: result.summary,
      performance: result.performance,
      sections: result.sections.map(section => ({
        id: section.id,
        description: section.description,
        geometry: section.geometry,
        flow: section.flow,
        losses: section.losses,
        status: section.status,
      })),
      warnings: result.warnings || [],
      ...(includeRawData && { rawData: result }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert result to CSV format
   */
  private static convertToCsv(
    result: ProcessedResult, 
    options: { includeTables: boolean }
  ): string {
    const { includeTables } = options;

    const lines: string[] = [];

    // Add header
    lines.push('Hydraulic Network Analysis Results');
    lines.push(`Network: ${result.summary.networkInfo.name}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    // Add summary section
    if (includeTables) {
      lines.push('=== EXECUTIVE SUMMARY ===');
      lines.push(`Total Pressure Drop,${result.summary.pressureInfo.totalPressureDrop},Pa`);
      lines.push(`Maximum Velocity,${result.summary.pressureInfo.maxVelocity},m/s`);
      lines.push(`Average Velocity,${result.performance.averageVelocity},m/s`);
      lines.push(`Pressure Efficiency,${result.performance.pressureEfficiency},%`);
      lines.push(`Calculation Time,${result.performance.totalCalculationTime},s`);
      lines.push('');

      // Add sections table header
      lines.push('=== SECTION RESULTS ===');
      lines.push('Section ID,Description,Length (m),Diameter (m),Velocity (m/s),Pressure Drop (Pa),Reynolds Number,Friction Factor,Velocity Status,Pressure Status');
      
      // Add section data
      result.sections.forEach(section => {
        lines.push([
          section.id,
          section.description || '',
          section.geometry.length,
          section.geometry.diameter,
          section.flow.velocity,
          section.flow.pressureDrop,
          section.flow.reynoldsNumber,
          section.flow.frictionFactor,
          section.status.velocityStatus,
          section.status.pressureStatus,
        ].join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Convert result to PDF format (simplified HTML for PDF generation)
   */
  private static convertToPdf(
    result: ProcessedResult,
    options: { 
      includeSummary: boolean;
      includeTables: boolean;
      includeCharts: boolean;
    }
  ): string {
    const { includeSummary, includeTables, includeCharts } = options;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Hydraulic Analysis Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .metric { border: 1px solid #ddd; padding: 10px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .warning { color: #ff9800; }
        .error { color: #f44336; }
        .success { color: #4caf50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hydraulic Network Analysis Results</h1>
        <h2>${result.summary.networkInfo.name}</h2>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    ${includeSummary ? `
    <div class="section">
        <h3>Executive Summary</h3>
        <div class="summary-grid">
            <div class="metric">
                <strong>Total Pressure Drop</strong><br>
                ${result.summary.pressureInfo.totalPressureDrop.toLocaleString()} Pa
            </div>
            <div class="metric">
                <strong>Maximum Velocity</strong><br>
                ${result.summary.pressureInfo.maxVelocity.toFixed(2)} m/s
            </div>
            <div class="metric">
                <strong>Pressure Efficiency</strong><br>
                ${result.performance.pressureEfficiency.toFixed(1)}%
            </div>
            <div class="metric">
                <strong>Sections Count</strong><br>
                ${result.sections.length}
            </div>
        </div>
    </div>
    ` : ''}

    ${includeTables ? `
    <div class="section">
        <h3>Section Results</h3>
        <table>
            <thead>
                <tr>
                    <th>Section ID</th>
                    <th>Length (m)</th>
                    <th>Velocity (m/s)</th>
                    <th>Pressure Drop (Pa)</th>
                    <th>Reynolds Number</th>
                    <th>Velocity Status</th>
                </tr>
            </thead>
            <tbody>
                ${result.sections.map(section => `
                <tr>
                    <td>${section.id}</td>
                    <td>${section.geometry.length.toFixed(2)}</td>
                    <td>${section.flow.velocity.toFixed(2)}</td>
                    <td>${section.flow.pressureDrop.toLocaleString()}</td>
                    <td>${section.flow.reynoldsNumber.toLocaleString()}</td>
                    <td class="${section.status.velocityStatus === 'critical' ? 'error' : 
                               section.status.velocityStatus === 'high' ? 'warning' : 'success'}">
                        ${section.status.velocityStatus}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${result.warnings && result.warnings.length > 0 ? `
    <div class="section">
        <h3>Warnings</h3>
        <ul>
            ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

</body>
</html>`;

    return html;
  }

  /**
   * Convert result to XML format
   */
  private static convertToXml(
    result: ProcessedResult, 
    options: { includeRawData: boolean }
  ): string {
    const { includeRawData } = options;

    const escapeXml = (text: string) => 
      text.replace(/[<>&'"]/g, (char) => 
        `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[char]};`
      );

    return `<?xml version="1.0" encoding="UTF-8"?>
<HydraulicAnalysisResult>
  <Metadata>
    <ExportDate>${new Date().toISOString()}</ExportDate>
    <Format>XML</Format>
    <NetworkName>${escapeXml(result.summary.networkInfo.name)}</NetworkName>
  </Metadata>
  
  <Summary>
    <NetworkInfo>
      <Name>${escapeXml(result.summary.networkInfo.name)}</Name>
      <Direction>${escapeXml(result.summary.networkInfo.direction)}</Direction>
      <TotalLength>${result.summary.networkInfo.totalLength}</TotalLength>
      <TotalElevationChange>${result.summary.networkInfo.totalElevationChange}</TotalElevationChange>
    </NetworkInfo>
    
    <FluidInfo>
      <Phase>${escapeXml(result.summary.fluidInfo.phase)}</Phase>
      <Temperature>${result.summary.fluidInfo.temperature}</Temperature>
      <Pressure>${result.summary.fluidInfo.pressure}</Pressure>
      <Density>${result.summary.fluidInfo.density}</Density>
      <Viscosity>${result.summary.fluidInfo.viscosity}</Viscosity>
    </FluidInfo>
    
    <PressureInfo>
      <InletPressure>${result.summary.pressureInfo.inletPressure}</InletPressure>
      <OutletPressure>${result.summary.pressureInfo.outletPressure}</OutletPressure>
      <TotalPressureDrop>${result.summary.pressureInfo.totalPressureDrop}</TotalPressureDrop>
      <MaxVelocity>${result.summary.pressureInfo.maxVelocity}</MaxVelocity>
      <CriticalVelocity>${result.summary.pressureInfo.criticalVelocity}</CriticalVelocity>
    </PressureInfo>
  </Summary>
  
  <Performance>
    <TotalCalculationTime>${result.performance.totalCalculationTime}</TotalCalculationTime>
    <SectionsCount>${result.performance.sectionsCount}</SectionsCount>
    <AverageVelocity>${result.performance.averageVelocity}</AverageVelocity>
    <PressureEfficiency>${result.performance.pressureEfficiency}</PressureEfficiency>
  </Performance>
  
  <Sections>
    ${result.sections.map(section => `
    <Section>
      <Id>${escapeXml(section.id)}</Id>
      <Description>${escapeXml(section.description || 'No description')}</Description>
      <Geometry>
        <Length>${section.geometry.length}</Length>
        <Diameter>${section.geometry.diameter}</Diameter>
        <Area>${section.geometry.area}</Area>
        <Roughness>${section.geometry.roughness}</Roughness>
        <ElevationChange>${section.geometry.elevationChange}</ElevationChange>
      </Geometry>
      <Flow>
        <InletPressure>${section.flow.inletPressure}</InletPressure>
        <OutletPressure>${section.flow.outletPressure}</OutletPressure>
        <PressureDrop>${section.flow.pressureDrop}</PressureDrop>
        <Velocity>${section.flow.velocity}</Velocity>
        <ReynoldsNumber>${section.flow.reynoldsNumber}</ReynoldsNumber>
        <FrictionFactor>${section.flow.frictionFactor}</FrictionFactor>
      </Flow>
      <Status>
        <VelocityStatus>${escapeXml(section.status.velocityStatus)}</VelocityStatus>
        <PressureStatus>${escapeXml(section.status.pressureStatus)}</PressureStatus>
        <Recommendation>${escapeXml(section.status.recommendation)}</Recommendation>
      </Status>
    </Section>`).join('')}
  </Sections>
  
  ${result.warnings && result.warnings.length > 0 ? `
  <Warnings>
    ${result.warnings.map(warning => `<Warning>${escapeXml(warning)}</Warning>`).join('')}
  </Warnings>
  ` : ''}
  
  ${includeRawData ? `
  <RawData>
    ${escapeXml(JSON.stringify(result))}
  </RawData>
  ` : ''}
</HydraulicAnalysisResult>`;
  }

  /**
   * Download exported file
   */
  static downloadFile(result: ExportResult): void {
    if (!result.success || !result.downloadUrl) {
      throw new Error('Cannot download file: export was not successful');
    }

    const link = document.createElement('a');
    link.href = result.downloadUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(result.downloadUrl);
  }
}