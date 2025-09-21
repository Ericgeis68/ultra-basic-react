import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { HistoryFilterOptions } from '@/hooks/useEquipmentHistoryFilter';

interface EquipmentHistoryFilterProps {
  filters: HistoryFilterOptions;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterChange: (key: keyof HistoryFilterOptions, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const EquipmentHistoryFilter: React.FC<EquipmentHistoryFilterProps> = ({
  filters,
  isOpen,
  onOpenChange,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-2 h-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtrer l'historique</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="technician-filter">Technicien</Label>
              <Input
                id="technician-filter"
                placeholder="Nom du technicien..."
                value={filters.technicianFilter}
                onChange={(e) => onFilterChange('technicianFilter', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="field-filter">Champ modifié</Label>
              <Input
                id="field-filter"
                placeholder="Ex: name, status..."
                value={filters.fieldFilter}
                onChange={(e) => onFilterChange('fieldFilter', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="date-from">Du</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Au</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full"
              >
                Effacer tous les filtres
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EquipmentHistoryFilter;
