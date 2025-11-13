import { useState, useEffect, useMemo } from 'react';
import { ProcessedSectionResult } from '../../services/calculation/resultProcessor';
import type { ResultsFilter, SearchQuery } from '../../types/visualization';

interface UseResultsOptions {
  searchTerm?: string;
  filters?: ResultsFilter;
  sortBy?: keyof ProcessedSectionResult;
  sortOrder?: 'asc' | 'desc';
}

interface UseResultsReturn {
  filteredSections: ProcessedSectionResult[];
  searchResults: ProcessedSectionResult[];
  searchTerm: string;
  filters: ResultsFilter;
  sortBy: keyof ProcessedSectionResult;
  sortOrder: 'asc' | 'desc';
  setSearchTerm: (term: string) => void;
  setFilters: (filters: ResultsFilter) => void;
  setSort: (sortBy: keyof ProcessedSectionResult, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
  resetSearch: () => void;
  getSectionById: (id: string) => ProcessedSectionResult | undefined;
  getSectionsByStatus: (status: string[]) => ProcessedSectionResult[];
  getCriticalSections: () => ProcessedSectionResult[];
  getStatistics: () => {
    totalSections: number;
    criticalSections: number;
    warningSections: number;
    normalSections: number;
    averageVelocity: number;
    averagePressureDrop: number;
    maxVelocity: number;
    maxPressureDrop: number;
  };
}

export const useResults = (
  result: any,
  options: UseResultsOptions = {}
): UseResultsReturn => {
  const {
    searchTerm: initialSearchTerm = '',
    filters: initialFilters = {},
    sortBy: initialSortBy = 'id',
    sortOrder: initialSortOrder = 'asc',
  } = options;

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<ResultsFilter>(initialFilters);
  const [sortBy, setSortBy] = useState<keyof ProcessedSectionResult>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  const sections = result?.sections || [];

  // Search function
  const performSearch = useMemo(() => {
    if (!searchTerm.trim()) {
      return sections;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return sections.filter((section: ProcessedSectionResult) => {
      // Search in section ID, description, and numeric values
      const searchableFields = [
        section.id.toLowerCase(),
        section.description?.toLowerCase() || '',
        section.flow.velocity.toString(),
        section.flow.pressureDrop.toString(),
        section.flow.reynoldsNumber.toString(),
        section.status.velocityStatus,
        section.status.pressureStatus,
      ];

      return searchableFields.some(field => 
        field.includes(lowerSearchTerm)
      );
    });
  }, [sections, searchTerm]);

  // Filter function
  const performFilters = useMemo(() => {
    let filtered = performSearch;

    // Filter by section IDs
    if (filters.sectionIds && filters.sectionIds.length > 0) {
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        filters.sectionIds?.includes(section.id)
      );
    }

    // Filter by velocity range
    if (filters.velocityRange) {
      const [min, max] = filters.velocityRange;
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        section.flow.velocity >= min && section.flow.velocity <= max
      );
    }

    // Filter by pressure range
    if (filters.pressureRange) {
      const [min, max] = filters.pressureRange;
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        section.flow.pressureDrop >= min && section.flow.pressureDrop <= max
      );
    }

    // Filter by Reynolds number range
    if (filters.reynoldsRange) {
      const [min, max] = filters.reynoldsRange;
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        section.flow.reynoldsNumber >= min && section.flow.reynoldsNumber <= max
      );
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        filters.status?.includes(section.status.velocityStatus as any) ||
        filters.status?.includes(section.status.pressureStatus as any)
      );
    }

    // Filter by issues
    if (filters.hasIssues) {
      filtered = filtered.filter((section: ProcessedSectionResult) =>
        section.status.velocityStatus === 'critical' ||
        section.status.velocityStatus === 'high' ||
        section.status.pressureStatus === 'low' ||
        section.status.pressureStatus === 'high'
      );
    }

    return filtered;
  }, [performSearch, filters]);

  // Sort function
  const sortedSections = useMemo(() => {
    const sorted = [...performFilters];
    
    return sorted.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested object sorting
      if (typeof aValue === 'object' && aValue !== null) {
        aValue = JSON.stringify(aValue);
      }
      if (typeof bValue === 'object' && bValue !== null) {
        bValue = JSON.stringify(bValue);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [performFilters, sortBy, sortOrder]);

  // Statistics calculation
  const getStatistics = useMemo(() => {
    const totalSections = sortedSections.length;
    const criticalSections = sortedSections.filter(s => 
      s.status.velocityStatus === 'critical' || s.status.pressureStatus === 'low'
    ).length;
    const warningSections = sortedSections.filter(s => 
      s.status.velocityStatus === 'high' || s.status.pressureStatus === 'high'
    ).length;
    const normalSections = totalSections - criticalSections - warningSections;

    const velocities = sortedSections.map(s => s.flow.velocity);
    const pressureDrops = sortedSections.map(s => s.flow.pressureDrop);

    return {
      totalSections,
      criticalSections,
      warningSections,
      normalSections,
      averageVelocity: velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0,
      averagePressureDrop: pressureDrops.length > 0 ? pressureDrops.reduce((a, b) => a + b, 0) / pressureDrops.length : 0,
      maxVelocity: velocities.length > 0 ? Math.max(...velocities) : 0,
      maxPressureDrop: pressureDrops.length > 0 ? Math.max(...pressureDrops) : 0,
    };
  }, [sortedSections]);

  // Utility functions
  const getSectionById = (id: string) => {
    return sortedSections.find(section => section.id === id);
  };

  const getSectionsByStatus = (statusList: string[]) => {
    return sortedSections.filter(section => 
      statusList.includes(section.status.velocityStatus) ||
      statusList.includes(section.status.pressureStatus)
    );
  };

  const getCriticalSections = () => {
    return sortedSections.filter(section => 
      section.status.velocityStatus === 'critical' ||
      section.status.pressureStatus === 'low'
    );
  };

  // Reset functions
  const resetFilters = () => {
    setFilters({});
  };

  const resetSearch = () => {
    setSearchTerm('');
  };

  // Set sort function
  const setSort = (newSortBy: keyof ProcessedSectionResult, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  return {
    filteredSections: sortedSections,
    searchResults: performSearch,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    setSearchTerm,
    setFilters,
    setSort,
    resetFilters,
    resetSearch,
    getSectionById,
    getSectionsByStatus,
    getCriticalSections,
    getStatistics: () => getStatistics,
  };
};