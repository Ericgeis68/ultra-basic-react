import { useState, useMemo } from 'react';
import { EquipmentHistoryEntry } from '@/types/equipment';

export interface HistoryFilterOptions {
  technicianFilter: string;
  dateFrom: string;
  dateTo: string;
  fieldFilter: string;
}

export function useEquipmentHistoryFilter(historyEntries: EquipmentHistoryEntry[]) {
  const [filters, setFilters] = useState<HistoryFilterOptions>({
    technicianFilter: '',
    dateFrom: '',
    dateTo: '',
    fieldFilter: '',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    if (!historyEntries) return [];

    return historyEntries.filter(entry => {
      // Filter by technician
      if (filters.technicianFilter && !entry.changed_by?.toLowerCase().includes(filters.technicianFilter.toLowerCase())) {
        return false;
      }

      // Filter by field name
      if (filters.fieldFilter && !entry.field_name?.toLowerCase().includes(filters.fieldFilter.toLowerCase())) {
        return false;
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        const entryDate = new Date(entry.changed_at);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (entryDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (entryDate > toDate) return false;
        }
      }

      return true;
    });
  }, [historyEntries, filters]);

  const updateFilter = (key: keyof HistoryFilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      technicianFilter: '',
      dateFrom: '',
      dateTo: '',
      fieldFilter: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return {
    filters,
    filteredHistory,
    isFilterOpen,
    setIsFilterOpen,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
