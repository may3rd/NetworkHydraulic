import type { CalculationResult, SectionResult, PipeSection } from '../../types/models';

export interface ProcessedResult {
  id: string;
  summary: {
    networkInfo: {
      name: string;
      direction: string;
      totalLength: number;
      totalElevationChange: number;
    };
    fluidInfo: {
      phase: string;
      temperature: number;
      pressure: number;
      density: number;
      viscosity: number;
    };
    flowInfo: {
      massFlowRate: number;
      volumetricFlowRate: number;
      designMargin: number;
    };
    pressureInfo: {
      inletPressure: number;
      outletPressure: number;
      totalPressureDrop: number;
      maxVelocity: number;
      criticalVelocity: boolean;
    };
  };
  sections: ProcessedSectionResult[];
  performance: {
    totalCalculationTime: number;
    sectionsCount: number;
    averageVelocity: number;
    pressureEfficiency: number;
    recommendations: string[];
  };
  warnings: string[];
  errors: string[];
}

export interface ProcessedSectionResult {
  id: string;
  description: string;
  geometry: {
    length: number;
    diameter: number;
    area: number;
    inletDiameter: number | undefined;
    outletDiameter: number | undefined;
    roughness: number;
    elevationChange: number;
  };
  flow: {
    inletPressure: number;
    outletPressure: number;
    pressureDrop: number;
    velocity: number;
    reynoldsNumber: number;
    frictionFactor: number;
    massFlowRate: number;
    volumetricFlowRate: number;
  };
  losses: {
    frictionLoss: number;
    fittingLoss: number;
    elevationLoss: number;
    componentLoss: number;
    totalLoss: number;
    lossPercentage: number;
  };
  status: {
    velocityStatus: 'normal' | 'high' | 'critical';
    pressureStatus: 'normal' | 'high' | 'low';
    recommendation: string;
  };
}

export interface ResultProcessingOptions {
  includeDetailedAnalysis?: boolean;
  calculateEfficiency?: boolean;
  generateRecommendations?: boolean;
  validateStandards?: boolean;
  unitSystem?: 'si' | 'imperial';
}

export class ResultProcessor {
  /**
   * Process raw calculation result into structured format
   */
  processResult(
    rawResult: CalculationResult,
    options: ResultProcessingOptions = {}
  ): ProcessedResult {
    const {
      includeDetailedAnalysis = true,
      calculateEfficiency = true,
      generateRecommendations = true,
      validateStandards = true,
      unitSystem = 'si',
    } = options;

    const sections = this.processSections(rawResult.sections, unitSystem);
    const summary = this.createSummary(rawResult, sections);
    const performance = this.calculatePerformance(rawResult, sections, options);
    const { warnings, errors } = this.validateResults(rawResult, sections);

    let recommendations: string[] = [];
    if (generateRecommendations) {
      recommendations = this.generateRecommendations(summary, sections, performance);
    }

    return {
      id: this.generateResultId(),
      summary,
      sections,
      performance: {
        ...performance,
        recommendations,
      },
      warnings,
      errors,
    };
  }

  /**
   * Process individual section results
   */
  private processSections(sections: SectionResult[], pipeSections: PipeSection[], unitSystem: string): ProcessedSectionResult[] {
    return sections.map((section, index) => {
      const pipeSection = pipeSections[index];
      const diameter = pipeSection?.pipeDiameter || 0.1; // Default diameter if not available
      const area = Math.PI * Math.pow(diameter / 2, 2);
      const velocity = section.velocity;
      const pressureDrop = section.pressureDrop;
      const frictionLoss = section.pressureDrop * (section.remarks?.includes('friction') ? 0.5 : 0.3) || 0; // Estimate based on available data
      const fittingLoss = section.fittingsPressureDrop || 0;
      const elevationLoss = section.pressureDrop * (section.elevationChange > 0 ? 0.2 : 0) || 0; // Estimate based on elevation
      const componentLoss = (section.valvePressureDrop || 0) + (section.orificePressureDrop || 0);
      const totalLoss = frictionLoss + fittingLoss + elevationLoss + componentLoss;

      const velocityStatus = this.evaluateVelocity(velocity);
      const pressureStatus = this.evaluatePressure(section.inletPressure, section.outletPressure);
      const recommendation = this.getSectionRecommendation(velocityStatus, pressureStatus, section);

      return {
        id: section.id,
        description: pipeSection?.description || '',
        geometry: {
          length: pipeSection?.length || 0,
          diameter,
          area,
          inletDiameter: pipeSection?.inletDiameter,
          outletDiameter: pipeSection?.outletDiameter,
          roughness: pipeSection?.roughness || 0,
          elevationChange: section.elevationChange,
        },
        flow: {
          inletPressure: section.inletPressure,
          outletPressure: section.outletPressure,
          pressureDrop,
          velocity,
          reynoldsNumber: section.reynoldsNumber,
          frictionFactor: section.frictionFactor,
          massFlowRate: 0, // Not available in SectionResult
          volumetricFlowRate: 0, // Not available in SectionResult
        },
        losses: {
          frictionLoss,
          fittingLoss,
          elevationLoss,
          componentLoss,
          totalLoss,
          lossPercentage: totalLoss / pressureDrop * 100,
        },
        status: {
          velocityStatus,
          pressureStatus,
          recommendation,
        },
      };
    });
  }

  /**
   * Create summary from raw result and processed sections
   */
  private createSummary(rawResult: CalculationResult, sections: ProcessedSectionResult[]) {
    const totalLength = sections.reduce((sum, s) => sum + s.geometry.length, 0);
    const totalElevationChange = sections.reduce((sum, s) => sum + s.geometry.elevationChange, 0);
    const maxVelocity = Math.max(...sections.map(s => s.flow.velocity));
    const totalPressureDrop = sections.reduce((sum, s) => sum + s.flow.pressureDrop, 0);

    return {
      networkInfo: {
        name: rawResult.network.name || 'Unknown Network',
        direction: rawResult.network.direction || 'auto',
        totalLength,
        totalElevationChange,
      },
      fluidInfo: {
        phase: rawResult.network.fluid.phase,
        temperature: rawResult.network.fluid.temperature,
        pressure: rawResult.network.fluid.pressure,
        density: rawResult.network.fluid.density || 0,
        viscosity: rawResult.network.fluid.viscosity,
      },
      flowInfo: {
        massFlowRate: rawResult.network.fluid.massFlowRate || 0,
        volumetricFlowRate: rawResult.network.fluid.volumetricFlowRate || 0,
        designMargin: 0, // Not available in current structure
      },
      pressureInfo: {
        inletPressure: sections[0]?.flow.inletPressure || 0,
        outletPressure: sections[sections.length - 1]?.flow.outletPressure || 0,
        totalPressureDrop,
        maxVelocity,
        criticalVelocity: maxVelocity > 10, // Velocity > 10 m/s is considered critical
      },
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(
    rawResult: CalculationResult,
    sections: ProcessedSectionResult[],
    options: ResultProcessingOptions
  ) {
    const sectionsCount = sections.length;
    const totalCalculationTime = rawResult.executionTime || 0;
    const averageVelocity = sections.reduce((sum, s) => sum + s.flow.velocity, 0) / sectionsCount;
    
    let pressureEfficiency = 100;
    if (options.calculateEfficiency) {
      // Calculate efficiency based on pressure losses vs available pressure
      const totalPressureAvailable = sections[0]?.flow.inletPressure || 1;
      const totalLosses = sections.reduce((sum, s) => sum + s.losses.totalLoss, 0);
      pressureEfficiency = Math.max(0, ((totalPressureAvailable - totalLosses) / totalPressureAvailable) * 100);
    }

    return {
      totalCalculationTime,
      sectionsCount,
      averageVelocity,
      pressureEfficiency,
    };
  }

  /**
   * Validate results and identify issues
   */
  private validateResults(
    rawResult: CalculationResult,
    sections: ProcessedSectionResult[]
  ): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for high velocities
    sections.forEach(section => {
      if (section.status.velocityStatus === 'critical') {
        warnings.push(`Section ${section.id}: Critical velocity detected (${section.flow.velocity.toFixed(2)} m/s)`);
      } else if (section.status.velocityStatus === 'high') {
        warnings.push(`Section ${section.id}: High velocity (${section.flow.velocity.toFixed(2)} m/s)`);
      }
    });

    // Check for excessive pressure drops
    sections.forEach(section => {
      const pressureDropPercentage = (section.flow.pressureDrop / section.flow.inletPressure) * 100;
      if (pressureDropPercentage > 50) {
        warnings.push(`Section ${section.id}: Excessive pressure drop (${pressureDropPercentage.toFixed(1)}%)`);
      }
    });

    // Add any calculation warnings
    if (rawResult.warnings) {
      warnings.push(...rawResult.warnings);
    }

    return { warnings, errors };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    summary: any,
    sections: ProcessedSectionResult[],
    performance: any
  ): string[] {
    const recommendations: string[] = [];

    // Velocity recommendations
    const criticalSections = sections.filter(s => s.status.velocityStatus === 'critical');
    if (criticalSections.length > 0) {
      recommendations.push(`Consider increasing pipe diameter in ${criticalSections.length} section(s) to reduce velocity`);
    }

    // Pressure efficiency recommendations
    if (performance.pressureEfficiency < 80) {
      recommendations.push('System pressure efficiency is low. Consider reducing pipe roughness or diameter');
    }

    // General recommendations
    if (summary.pressureInfo.maxVelocity > 8) {
      recommendations.push('Maximum velocity is high. Review pipe sizing for optimal performance');
    }

    // Section-specific recommendations
    sections.forEach(section => {
      if (section.status.recommendation !== 'No action needed') {
        recommendations.push(`Section ${section.id}: ${section.status.recommendation}`);
      }
    });

    return recommendations;
  }

  /**
   * Evaluate velocity status
   */
  private evaluateVelocity(velocity: number): 'normal' | 'high' | 'critical' {
    if (velocity > 10) return 'critical';
    if (velocity > 6) return 'high';
    return 'normal';
  }

  /**
   * Evaluate pressure status
   */
  private evaluatePressure(inletPressure: number, outletPressure: number): 'normal' | 'high' | 'low' {
    const pressureDrop = inletPressure - outletPressure;
    const dropPercentage = pressureDrop / inletPressure;
    
    if (dropPercentage > 0.8) return 'low';
    if (dropPercentage < 0.1) return 'high';
    return 'normal';
  }

  /**
   * Get section-specific recommendation
   */
  private getSectionRecommendation(
    velocityStatus: 'normal' | 'high' | 'critical',
    pressureStatus: 'normal' | 'high' | 'low',
    section: any
  ): string {
    if (velocityStatus === 'critical') {
      return 'Increase pipe diameter to reduce velocity and pressure drop';
    }
    if (velocityStatus === 'high') {
      return 'Consider increasing diameter for better efficiency';
    }
    if (pressureStatus === 'low') {
      return 'High pressure drop detected - review pipe sizing and fittings';
    }
    return 'No action needed';
  }

  /**
   * Generate unique result ID
   */
  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export result to various formats
   */
  exportResult(processedResult: ProcessedResult, format: 'json' | 'csv' | 'xml'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(processedResult, null, 2);
      case 'csv':
        return this.convertToCSV(processedResult);
      case 'xml':
        return this.convertToXML(processedResult);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert result to CSV format
   */
  private convertToCSV(result: ProcessedResult): string {
    const headers = [
      'Section ID',
      'Length (m)',
      'Diameter (m)',
      'Velocity (m/s)',
      'Pressure Drop (Pa)',
      'Reynolds Number',
      'Friction Factor',
      'Velocity Status',
      'Recommendation'
    ];

    const rows = result.sections.map(section => [
      section.id,
      section.geometry.length,
      section.geometry.diameter,
      section.flow.velocity,
      section.flow.pressureDrop,
      section.flow.reynoldsNumber,
      section.flow.frictionFactor,
      section.status.velocityStatus,
      section.status.recommendation.replace(/,/g, ';') // Escape commas
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert result to XML format
   */
  private convertToXML(result: ProcessedResult): string {
    const escapeXml = (text: string) => 
      text.replace(/[<>&'"]/g, (char) => 
        `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[char]};`
      );

    return `<?xml version="1.0" encoding="UTF-8"?>
<HydraulicAnalysisResult>
  <Metadata>
    <Id>${escapeXml(result.id)}</Id>
    <Timestamp>${new Date().toISOString()}</Timestamp>
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
  </Summary>
  <Sections>
    ${result.sections.map(section => `
    <Section>
      <Id>${escapeXml(section.id)}</Id>
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
</HydraulicAnalysisResult>`;
  }
}

// Export singleton instance
export const resultProcessor = new ResultProcessor();