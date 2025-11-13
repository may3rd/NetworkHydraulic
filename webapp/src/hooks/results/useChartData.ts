import { useMemo } from 'react';
import { ProcessedResult, ProcessedSectionResult } from '../../services/calculation/resultProcessor';
import type { 
  PressureProfileData, 
  VelocityProfileData, 
  LossBreakdownData, 
  ReynoldsChartData,
  ChartDataCache 
} from '../../types/visualization';

interface UseChartDataOptions {
  includeDistance?: boolean;
  cumulativeDistance?: number;
}

export const useChartData = (
  result: ProcessedResult,
  filteredSections: ProcessedSectionResult[],
  options: UseChartDataOptions = {}
) => {
  const { includeDistance = true, cumulativeDistance = 0 } = options;

  // Process pressure profile data
  const pressureProfileData = useMemo((): PressureProfileData[] => {
    const data: PressureProfileData[] = [];
    let distance = cumulativeDistance;

    filteredSections.forEach((section, index) => {
      data.push({
        distance,
        inletPressure: section.flow.inletPressure,
        outletPressure: section.flow.outletPressure,
        elevation: section.geometry.elevationChange,
        sectionId: section.id,
        velocity: section.flow.velocity,
      });

      if (includeDistance) {
        distance += section.geometry.length;
      } else {
        // Use section index for x-axis
        data[data.length - 1].distance = index;
      }
    });

    return data;
  }, [filteredSections, cumulativeDistance, includeDistance]);

  // Process velocity profile data
  const velocityProfileData = useMemo((): VelocityProfileData[] => {
    const data: VelocityProfileData[] = [];
    let distance = cumulativeDistance;

    filteredSections.forEach((section, index) => {
      data.push({
        distance,
        velocity: section.flow.velocity,
        reynoldsNumber: section.flow.reynoldsNumber,
        frictionFactor: section.flow.frictionFactor,
        sectionId: section.id,
      });

      if (includeDistance) {
        distance += section.geometry.length;
      } else {
        data[data.length - 1].distance = index;
      }
    });

    return data;
  }, [filteredSections, cumulativeDistance, includeDistance]);

  // Process loss breakdown data
  const lossBreakdownData = useMemo((): LossBreakdownData[] => {
    const totalFrictionLoss = filteredSections.reduce((sum, s) => sum + s.losses.frictionLoss, 0);
    const totalFittingLoss = filteredSections.reduce((sum, s) => sum + s.losses.fittingLoss, 0);
    const totalElevationLoss = filteredSections.reduce((sum, s) => sum + s.losses.elevationLoss, 0);
    const totalComponentLoss = filteredSections.reduce((sum, s) => sum + s.losses.componentLoss, 0);
    const totalLoss = totalFrictionLoss + totalFittingLoss + totalElevationLoss + totalComponentLoss;

    const data: LossBreakdownData[] = [];

    if (totalFrictionLoss > 0) {
      data.push({
        type: 'friction',
        value: totalFrictionLoss,
        percentage: (totalFrictionLoss / totalLoss) * 100,
        color: '#1976d2',
      });
    }

    if (totalFittingLoss > 0) {
      data.push({
        type: 'fittings',
        value: totalFittingLoss,
        percentage: (totalFittingLoss / totalLoss) * 100,
        color: '#ed6c02',
      });
    }

    if (totalElevationLoss > 0) {
      data.push({
        type: 'elevation',
        value: totalElevationLoss,
        percentage: (totalElevationLoss / totalLoss) * 100,
        color: '#00796b',
      });
    }

    if (totalComponentLoss > 0) {
      data.push({
        type: 'components',
        value: totalComponentLoss,
        percentage: (totalComponentLoss / totalLoss) * 100,
        color: '#c62828',
      });
    }

    return data;
  }, [filteredSections]);

  // Process Reynolds number data
  const reynoldsChartData = useMemo((): ReynoldsChartData[] => {
    const data: ReynoldsChartData[] = [];
    let distance = cumulativeDistance;

    filteredSections.forEach((section, index) => {
      const criticalReynolds = 4000; // Turbulent flow threshold
      const flowRegime = section.flow.reynoldsNumber < 2000 
        ? 'laminar' 
        : section.flow.reynoldsNumber < criticalReynolds 
          ? 'transitional' 
          : 'turbulent';

      data.push({
        distance,
        reynoldsNumber: section.flow.reynoldsNumber,
        criticalReynolds,
        flowRegime,
        sectionId: section.id,
      });

      if (includeDistance) {
        distance += section.geometry.length;
      } else {
        data[data.length - 1].distance = index;
      }
    });

    return data;
  }, [filteredSections, cumulativeDistance, includeDistance]);

  // Generate friction factor chart data
  const frictionFactorData = useMemo(() => {
    const data = filteredSections.map((section, index) => ({
      distance: includeDistance ? cumulativeDistance + section.geometry.length * (index + 0.5) : index,
      frictionFactor: section.flow.frictionFactor,
      sectionId: section.id,
      velocity: section.flow.velocity,
      reynoldsNumber: section.flow.reynoldsNumber,
    }));

    return {
      labels: data.map(d => `Section ${d.sectionId}`),
      datasets: [
        {
          label: 'Friction Factor',
          data: data.map(d => d.frictionFactor),
          backgroundColor: 'rgba(25, 118, 210, 0.2)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }, [filteredSections, cumulativeDistance, includeDistance]);

  // Generate interactive chart data
  const interactiveChartData = useMemo(() => {
    const data = filteredSections.map((section, index) => ({
      distance: includeDistance ? cumulativeDistance + section.geometry.length * (index + 0.5) : index,
      pressureDrop: section.flow.pressureDrop,
      velocity: section.flow.velocity,
      reynoldsNumber: section.flow.reynoldsNumber,
      frictionFactor: section.flow.frictionFactor,
      sectionId: section.id,
      status: section.status.velocityStatus,
    }));

    return {
      labels: data.map(d => `Section ${d.sectionId}`),
      datasets: [
        {
          label: 'Pressure Drop (Pa)',
          data: data.map(d => d.pressureDrop),
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          borderColor: 'rgba(244, 67, 54, 1)',
          yAxisID: 'y',
        },
        {
          label: 'Velocity (m/s)',
          data: data.map(d => d.velocity),
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: 'rgba(76, 175, 80, 1)',
          yAxisID: 'y1',
        },
        {
          label: 'Reynolds Number',
          data: data.map(d => d.reynoldsNumber),
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderColor: 'rgba(33, 150, 243, 1)',
          yAxisID: 'y2',
        },
      ],
    };
  }, [filteredSections, cumulativeDistance, includeDistance]);

  // Cache all chart data
  const chartDataCache: ChartDataCache = {
    pressureProfile: pressureProfileData,
    velocityProfile: velocityProfileData,
    lossBreakdown: lossBreakdownData,
    reynoldsChart: reynoldsChartData,
    frictionFactorChart: frictionFactorData,
    interactiveChart: interactiveChartData,
  };

  // Statistics
  const statistics = useMemo(() => {
    const maxPressure = Math.max(...filteredSections.map(s => s.flow.inletPressure));
    const minPressure = Math.min(...filteredSections.map(s => s.flow.outletPressure));
    const maxVelocity = Math.max(...filteredSections.map(s => s.flow.velocity));
    const maxReynolds = Math.max(...filteredSections.map(s => s.flow.reynoldsNumber));
    const totalPressureDrop = filteredSections.reduce((sum, s) => sum + s.flow.pressureDrop, 0);
    const averageFrictionFactor = filteredSections.reduce((sum, s) => sum + s.flow.frictionFactor, 0) / filteredSections.length;

    return {
      maxPressure,
      minPressure,
      maxVelocity,
      maxReynolds,
      totalPressureDrop,
      averageFrictionFactor,
      sectionsCount: filteredSections.length,
    };
  }, [filteredSections]);

  return {
    chartData: chartDataCache,
    statistics,
    isLoading: false, // This would be true if we were fetching data asynchronously
    error: null, // This would contain error information if chart generation failed
  };
};