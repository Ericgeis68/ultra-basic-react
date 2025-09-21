import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface EquipmentTableProps {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  onEquipmentClick: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipments,
  groups,
  onEquipmentClick,
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

  const getGroupNames = (equipment: Equipment) => {
    if (!equipment.equipment_group_ids || equipment.equipment_group_ids.length === 0) {
      return 'Aucun groupe';
    }
    
    const groupNames = groups
      .filter(group => equipment.equipment_group_ids!.includes(group.id))
      .map(group => group.name);
    
    return groupNames.length > 0 ? groupNames.join(', ') : 'Groupes introuvables';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Modèle</TableHead>
          <TableHead>Numéro de série</TableHead>
          <TableHead>Groupes</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Prêt</TableHead>
          <TableHead>État de santé</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipments.map((equipment) => (
          <TableRow 
            key={equipment.id} 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onEquipmentClick(equipment)}
          >
            <TableCell className="font-medium">{equipment.name}</TableCell>
            <TableCell>{equipment.model || '-'}</TableCell>
            <TableCell>{equipment.serial_number || '-'}</TableCell>
            <TableCell>{getGroupNames(equipment)}</TableCell>
            <TableCell>
              <Badge 
                variant="outline" 
                className={getStatusBadgeColor(equipment.status)}
              >
                {getStatusText(equipment.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {equipment.loan_status ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  En prêt
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Disponible</span>
              )}
            </TableCell>
            <TableCell>
              {equipment.health_percentage !== undefined && equipment.health_percentage !== null ? (
                <EquipmentHealthBar percentage={equipment.health_percentage} />
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEquipmentClick(equipment)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(equipment)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(equipment)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default EquipmentTable;
