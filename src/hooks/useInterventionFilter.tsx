import { useState, useMemo } from 'react';
import { Intervention } from '@/types/intervention';
import { isWithinInterval, parseISO } from 'date-fns';

export interface InterventionFilterOptions {
  technicianFilter: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  statusFilter: 'all' | 'completed' | 'in-progress';
}

export function useInterventionFilter(interventions: Intervention[]) {
  const [filters, setFilters] = useState<InterventionFilterOptions>({
    technicianFilter: '',
    dateFrom: undefined,
    dateTo: undefined,
    statusFilter: 'all',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredInterventions = useMemo(() => {
    if (!interventions) return [];

    return interventions.filter(intervention => {
      // Filter by technician
      if (filters.technicianFilter) {
        const technicianNames = intervention.technicians?.join(', ').toLowerCase() || '';
        if (!technicianNames.includes(filters.technicianFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by status
      if (filters.statusFilter !== 'all') {
        if (intervention.status !== filters.statusFilter) {
          return false;
        }
      }

      // Filter by date range (scheduled_date)
      if (filters.dateFrom || filters.dateTo) {
        if (!intervention.scheduled_date) return false;

        try {
          const scheduledDate = parseISO(intervention.scheduled_date);
          const fromDate = filters.dateFrom;
          const toDate = filters.dateTo;

          if (fromDate && toDate) {
            if (!isWithinInterval(scheduledDate, { start: fromDate, end: toDate })) {
              return false;
            }
          } else if (fromDate) {
            if (scheduledDate < fromDate) return false;
          } else if (toDate) {
            if (scheduledDate > toDate) return false;
          }
        } catch (e) {
          console.error("Error parsing date for filter:", intervention.scheduled_date, e);
          return false; // Exclude if date is invalid
        }
      }

      return true;
    });
  }, [interventions, filters]);

  const updateFilter = <K extends keyof InterventionFilterOptions>(key: K, value: InterventionFilterOptions[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      technicianFilter: '',
      dateFrom: undefined,
      dateTo: undefined,
      statusFilter: 'all',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'string') return value !== '' && value !== 'all';
    if (value instanceof Date) return true;
    return false;
  });

  return {
    filters,
    filteredInterventions,
    isFilterOpen,
    setIsFilterOpen,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
