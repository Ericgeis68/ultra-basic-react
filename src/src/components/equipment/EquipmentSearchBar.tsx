import React from 'react';
import { Search, LayoutGrid, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EquipmentSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const EquipmentSearchBar: React.FC<EquipmentSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex items-center gap-3 flex-col sm:flex-row">
      <div className="relative flex-grow w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher un équipement..." 
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center border rounded-md overflow-hidden self-end">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none px-3 h-9"
          onClick={() => onViewModeChange('grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none px-3 h-9"
          onClick={() => onViewModeChange('list')}
        >
          <LayoutList className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EquipmentSearchBar;
