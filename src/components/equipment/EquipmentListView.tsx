import React, { useState, useMemo } from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUp, ArrowDown } from 'lucide-react'; // Import ArrowUp and ArrowDown
import EquipmentHealthBar from './EquipmentHealthBar';
import { useEquipmentFieldVisibility } from '@/hooks/useEquipmentFieldVisibility';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EquipmentListViewProps {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  onEquipmentClick: (equipment: Equipment) => void;
}

const EquipmentListView: React.FC<EquipmentListViewProps> = ({ 
  equipments, 
  groups, 
  buildings = [],
  services = [],
  locations = [],
  onEquipmentClick 
}) => {
  const { listFields } = useEquipmentFieldVisibility();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    const groupIds = equipment.associated_group_ids || equipment.equipment_group_ids || [];
    if (!groupIds || groupIds.length === 0) {
      return 'Aucun groupe';
    }
    
    const groupNames = groups
      .filter(group => groupIds.includes(group.id))
      .map(group => group.name);
    
    return groupNames.length > 0 ? groupNames.join(', ') : 'Groupes introuvables';
  };

  const getBuildingName = (buildingId?: string | null) => {
    if (!buildingId) return 'Non spécifié';
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Non spécifié';
  };

  const getServiceName = (serviceId?: string | null) => {
    if (!serviceId) return 'Non spécifié';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Non spécifié';
  };

  const getLocationName = (locationId?: string | null) => {
    if (!locationId) return 'Non spécifié';
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Non spécifié';
  };

  const getSharedImageUrl = (equipment: Equipment) => {
    const groupIds = equipment.associated_group_ids || equipment.equipment_group_ids || [];
    if (!groupIds || groupIds.length === 0) return null;
    
    const groupWithImage = groups.find(group =>
      group.shared_image_url && groupIds.includes(group.id)
    );
    
    return groupWithImage?.shared_image_url || null;
  };

  const getImageUrlToDisplay = (equipment: Equipment) => {
    const sharedImageUrl = getSharedImageUrl(equipment);
    return sharedImageUrl || equipment.image_url || null;
  };

  const getColumnValue = (equipment: Equipment, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return equipment.name || '';
      case 'model':
        return equipment.model || '';
      case 'manufacturer':
        return equipment.manufacturer || '';
      case 'supplier':
        return equipment.supplier || '';
      case 'status':
        return getStatusText(equipment.status);
      case 'health_percentage':
        return equipment.health_percentage !== null ? equipment.health_percentage : -1; // Use -1 for sorting null health
      case 'inventory_number':
        return equipment.inventory_number || '';
      case 'serial_number':
        return equipment.serial_number || '';
      case 'uf':
        return equipment.uf || '';
      case 'purchase_date':
        return equipment.purchase_date || '';
      case 'warranty_expiry':
        return equipment.warranty_expiry || '';
      case 'date_mise_en_service':
        return equipment.date_mise_en_service || '';
      case 'building':
        return getBuildingName(equipment.building_id);
      case 'service':
        return getServiceName(equipment.service_id);
      case 'location':
        return getLocationName(equipment.location_id);
      case 'groups':
        return getGroupNames(equipment);
      default:
        return '';
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prevDir => (prevDir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedEquipments = useMemo(() => {
    if (!sortColumn) {
      return equipments;
    }

    const sortableEquipments = [...equipments];

    return sortableEquipments.sort((a, b) => {
      const valA = getColumnValue(a, sortColumn);
      const valB = getColumnValue(b, sortColumn);

      // Handle null/undefined/empty string values for sorting
      const normalizedValA = valA === null || valA === undefined || valA === '' || valA === 'Non spécifié' || valA === 'Aucun groupe' ? null : valA;
      const normalizedValB = valB === null || valB === undefined || valB === '' || valB === 'Non spécifié' || valB === 'Aucun groupe' ? null : valB;

      if (normalizedValA === null && normalizedValB === null) return 0;
      if (normalizedValA === null) return sortDirection === 'asc' ? 1 : -1;
      if (normalizedValB === null) return sortDirection === 'asc' ? -1 : 1;

      // Special handling for numbers (e.g., health_percentage) and dates
      if (sortColumn === 'health_percentage') {
        const numA = normalizedValA as number;
        const numB = normalizedValB as number;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      if (['purchase_date', 'warranty_expiry', 'date_mise_en_service'].includes(sortColumn)) {
        const dateA = new Date(normalizedValA as string).getTime();
        const dateB = new Date(normalizedValB as string).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Default to string comparison
      const strA = String(normalizedValA).toLowerCase();
      const strB = String(normalizedValB).toLowerCase();

      if (strA < strB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (strA > strB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [equipments, sortColumn, sortDirection, buildings, services, locations, groups]);

  const renderSortableHeader = (columnKey: string, label: string, isVisible: boolean = true) => {
    if (!isVisible) return null;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleSort(columnKey)}
      >
        <div className="flex items-center justify-between">
          {label}
          {sortColumn === columnKey && (
            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <Table>
      <TableCaption>Liste des équipements</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Image</TableHead>
          {renderSortableHeader('name', 'Nom')}
          {renderSortableHeader('model', 'Modèle', listFields.model)}
          {renderSortableHeader('manufacturer', 'Fabricant', listFields.manufacturer)}
          {renderSortableHeader('status', 'Statut')}
          {renderSortableHeader('health_percentage', 'Santé', listFields.health_percentage)}
          {renderSortableHeader('inventory_number', 'Inventaire', listFields.inventory_number)}
          {renderSortableHeader('serial_number', 'N° Série', listFields.serial_number)}
          {renderSortableHeader('uf', 'UF', listFields.uf)}
          {renderSortableHeader('supplier', 'Fournisseur', listFields.supplier)}
          {renderSortableHeader('purchase_date', "Date d'achat", listFields.purchase_date)}
          {renderSortableHeader('warranty_expiry', 'Garantie', listFields.warranty_expiry)}
          {renderSortableHeader('date_mise_en_service', 'Mise en service', listFields.date_mise_en_service)}
          {renderSortableHeader('building', 'Bâtiment', listFields.building)}
          {renderSortableHeader('service', 'Service', listFields.service)}
          {renderSortableHeader('location', 'Local', listFields.location)}
          {renderSortableHeader('groups', 'Groupes', listFields.groups)}
          {renderSortableHeader('description', 'Description', listFields.description)}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedEquipments && sortedEquipments.length > 0 ? (
          sortedEquipments.map(equipment => {
            const imageUrl = getImageUrlToDisplay(equipment);
            
            return (
              <TableRow key={equipment.id}>
                <TableCell>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Photo de ${equipment.name}`}
                      className="h-10 w-10 object-contain rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/40?text=N/A';
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{equipment.name}</TableCell>
                {listFields.model && <TableCell>{equipment.model || 'Non spécifié'}</TableCell>}
                {listFields.manufacturer && <TableCell>{equipment.manufacturer || 'Non spécifié'}</TableCell>}
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={getStatusBadgeColor(equipment.status)}
                  >
                    {getStatusText(equipment.status)}
                  </Badge>
                </TableCell>
                {listFields.health_percentage && (
                  <TableCell>
                    {equipment.health_percentage !== undefined && equipment.health_percentage !== null ? (
                      <div className="w-20">
                        <EquipmentHealthBar percentage={equipment.health_percentage} showLabel={false} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                )}
                {listFields.inventory_number && <TableCell>{equipment.inventory_number || 'Non spécifié'}</TableCell>}
                {listFields.serial_number && <TableCell>{equipment.serial_number || 'Non spécifié'}</TableCell>}
                {listFields.uf && <TableCell>{equipment.uf || 'Non spécifié'}</TableCell>}
                {listFields.supplier && <TableCell>{equipment.supplier || 'Non spécifié'}</TableCell>}
                {listFields.purchase_date && <TableCell>{equipment.purchase_date || 'Non spécifié'}</TableCell>}
                {listFields.warranty_expiry && <TableCell>{equipment.warranty_expiry || 'Non spécifié'}</TableCell>}
                {listFields.date_mise_en_service && <TableCell>{equipment.date_mise_en_service || 'Non spécifié'}</TableCell>}
                {listFields.building && <TableCell>{getBuildingName(equipment.building_id)}</TableCell>}
                {listFields.service && <TableCell>{getServiceName(equipment.service_id)}</TableCell>}
                {listFields.location && <TableCell>{getLocationName(equipment.location_id)}</TableCell>}
                {listFields.groups && <TableCell>{getGroupNames(equipment)}</TableCell>}
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEquipmentClick(equipment)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={20} className="text-center py-6 text-muted-foreground">
              Aucun équipement trouvé.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default EquipmentListView;
