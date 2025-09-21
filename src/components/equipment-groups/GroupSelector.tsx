import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, X } from 'lucide-react';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (groupId: string, isChecked: boolean) => void; // Modified for multi-selection
  selectedGroupIds: string[]; // To show currently selected groups
  groups: EquipmentGroup[];
  title?: string;
  placeholder?: string;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedGroupIds,
  groups,
  title = "Sélectionner des groupes d'équipements",
  placeholder = "Rechercher un groupe..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Reset page and search term when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Filter and search logic
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' ||
        group.name.toLowerCase().includes(searchLower) ||
        (group.description && group.description.toLowerCase().includes(searchLower));
    });
  }, [groups, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCheckboxChange = (groupId: string, isChecked: boolean) => {
    onSelect(groupId, isChecked);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-2 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-hidden min-h-0">
          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 sm:h-10"
            />
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground shrink-0">
            <span>
              {filteredGroups.length} groupe{filteredGroups.length > 1 ? 's' : ''} trouvé{filteredGroups.length > 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} sur {totalPages}
              </span>
            )}
          </div>

          {/* Group List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full border rounded-md">
              <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
                {paginatedGroups.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm">Aucun groupe trouvé avec ces critères</p>
                  </div>
                ) : (
                  paginatedGroups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "p-2 sm:p-3 border rounded-lg flex items-center justify-between gap-2",
                        selectedGroupIds.includes(group.id) && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">{group.name}</h4>
                        {group.description && (
                          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={selectedGroupIds.includes(group.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(group.id, checked === true)}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              >
                Préc.
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              >
                Suiv.
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 mt-2 sm:mt-4">
          <Button variant="outline" onClick={onClose} className="h-8 sm:h-9 text-xs sm:text-sm">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelector;
