import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Wrench } from 'lucide-react';

interface EquipmentActionsButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  onCreateIntervention?: () => void;
  isMobile: boolean;
  showCreateIntervention?: boolean;
}

const EquipmentActionsButtons: React.FC<EquipmentActionsButtonsProps> = ({
  onEdit,
  onDelete,
  onCreateIntervention,
  isMobile,
  showCreateIntervention = false
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-6 no-print">
      <Button variant="outline" onClick={onEdit} className="text-xs md:text-sm">
        <Edit className="mr-1 h-3 w-3 md:h-4 md:w-4" />
        Modifier
      </Button>
      <Button variant="destructive" onClick={onDelete} className="text-xs md:text-sm">
        <Trash2 className="mr-1 h-3 w-3 md:h-4 md:w-4" />
        Supprimer
      </Button>
      {isMobile && showCreateIntervention && onCreateIntervention && (
        <Button
          variant="outline"
          onClick={onCreateIntervention}
          className="text-xs md:text-sm"
        >
          <Wrench className="mr-1 h-3 w-3 md:h-4 md:w-4" />
          Actions
        </Button>
      )}
    </div>
  );
};

export default EquipmentActionsButtons;
