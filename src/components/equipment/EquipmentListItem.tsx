import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import EquipmentHealthBar from './EquipmentHealthBar';

interface EquipmentListItemProps {
  equipment: Equipment;
  groups: EquipmentGroup[];
  onClick: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

const EquipmentListItem: React.FC<EquipmentListItemProps> = ({
  equipment,
  groups,
  onClick,
  onEdit,
  onDelete,
}) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'faulty':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'maintenance':
        return 'En maintenance';
      case 'faulty':
        return 'En panne';
      default:
        return status;
    }
  };

  const getGroupNames = () => {
    if (!equipment.equipment_group_ids || equipment.equipment_group_ids.length === 0) {
      return 'Aucun groupe';
    }
    
    const groupNames = groups
      .filter(group => equipment.equipment_group_ids!.includes(group.id))
      .map(group => group.name);
    
    return groupNames.length > 0 ? groupNames.join(', ') : 'Groupes introuvables';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas déclencher onClick si on clique sur le menu ou ses boutons
    if ((e.target as HTMLElement).closest('[role="menuitem"]') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick(equipment);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(equipment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(equipment);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(equipment);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate" title={equipment.name}>{equipment.name}</h3>
            <p className="text-sm text-gray-600 truncate" title={equipment.model || 'Modèle non spécifié'}>
              {equipment.model || 'Modèle non spécifié'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={`${getStatusBadgeColor(equipment.status)} text-xs px-2 py-1`}
            >
              {getStatusText(equipment.status)}
            </Badge>
            {equipment.loan_status && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                En prêt
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Numéro de série:</span>{' '}
            {equipment.serial_number || 'Non spécifié'}
          </div>
          <div>
            <span className="font-medium">Groupes:</span> {getGroupNames()}
          </div>
        </div>

        {equipment.health_percentage !== undefined && equipment.health_percentage !== null && (
          <div className="mt-3">
            <EquipmentHealthBar percentage={equipment.health_percentage} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentListItem;
