import React from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUp, ArrowDown, MoreHorizontal, Edit, Trash2, Wrench, FileText, CalendarClock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onEditEquipment?: (equipment: Equipment) => void;
  onDeleteEquipment?: (equipment: Equipment) => void;
  onCreateInterventionFromList?: (equipment: Equipment) => void;
  onOpenDocumentsFromList?: (equipment: Equipment) => void;
  onOpenMaintenanceFromList?: (equipment: Equipment) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  fadingIds?: Set<string>;
}

const EquipmentListView: React.FC<EquipmentListViewProps> = ({ 
  equipments, 
  groups, 
  buildings = [],
  services = [],
  locations = [],
  onEquipmentClick,
  onEditEquipment,
  onDeleteEquipment,
  onCreateInterventionFromList,
  onOpenDocumentsFromList,
  onOpenMaintenanceFromList,
  sortColumn,
  sortDirection,
  onSortChange,
  fadingIds
}) => {
  const { listFields } = useEquipmentFieldVisibility();

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
        return (() => { const v = equipment.purchase_date; if (!v) return ''; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })();
      case 'warranty_expiry':
        return (() => { const v = equipment.warranty_expiry; if (!v) return ''; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })();
      case 'date_mise_en_service':
        return (() => { const v = equipment.date_mise_en_service; if (!v) return ''; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })();
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
    onSortChange(columnKey);
  };


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
          {listFields.image && <TableHead className="w-[100px]">Image</TableHead>}
          {renderSortableHeader('name', 'Nom')}
          {renderSortableHeader('model', 'Modèle', listFields.model)}
          {renderSortableHeader('manufacturer', 'Fabricant', listFields.manufacturer)}
          {renderSortableHeader('status', 'Statut', listFields.status)}
          {renderSortableHeader('health_percentage', 'Santé', listFields.health_percentage)}
          {renderSortableHeader('inventory_number', 'Inventaire', listFields.inventory_number)}
          {renderSortableHeader('serial_number', 'N° Série', listFields.serial_number)}
          {renderSortableHeader('uf', 'UF', listFields.uf)}
          {renderSortableHeader('supplier', 'Fournisseur', listFields.supplier)}
          {renderSortableHeader('purchase_date', "Date d'achat", listFields.purchase_date)}
          {renderSortableHeader('purchase_price', "Prix d'achat (€)", listFields.purchase_price)}
          {renderSortableHeader('warranty_expiry', 'Garantie', listFields.warranty_expiry)}
          {renderSortableHeader('date_mise_en_service', 'Mise en service', listFields.date_mise_en_service)}
          {renderSortableHeader('building', 'Bâtiment', listFields.building)}
          {renderSortableHeader('service', 'Service', listFields.service)}
          {renderSortableHeader('location', 'Local', listFields.location)}
          {renderSortableHeader('groups', 'Groupes', listFields.groups)}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipments && equipments.length > 0 ? (
          equipments.map(equipment => {
            const imageUrl = getImageUrlToDisplay(equipment);
            
            return (
              <TableRow key={equipment.id} className={fadingIds?.has(equipment.id) ? 'transition-opacity duration-300 opacity-0' : ''}>
                {listFields.image && (
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
                )}
                <TableCell className="font-medium">{equipment.name}</TableCell>
                {listFields.model && <TableCell>{equipment.model || 'Non spécifié'}</TableCell>}
                {listFields.manufacturer && <TableCell>{equipment.manufacturer || 'Non spécifié'}</TableCell>}
                {listFields.status && (
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeColor(equipment.status)}
                    >
                      {getStatusText(equipment.status)}
                    </Badge>
                  </TableCell>
                )}
                {listFields.health_percentage && (
                  <TableCell>
                    {equipment.health_percentage !== undefined && equipment.health_percentage !== null ? (
                      <div className="w-24">
                        <EquipmentHealthBar percentage={equipment.health_percentage} showLabel={true} labelPlacement="inline" compact />
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
                {listFields.purchase_date && <TableCell>{(() => { const v = equipment.purchase_date; if (!v) return 'Non spécifié'; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</TableCell>}
                {listFields.purchase_price && (
                  <TableCell>{equipment.purchase_price != null ? `${equipment.purchase_price} €` : 'Non spécifié'}</TableCell>
                )}
                {listFields.warranty_expiry && <TableCell>{(() => { const v = equipment.warranty_expiry; if (!v) return 'Non spécifié'; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</TableCell>}
                {listFields.date_mise_en_service && <TableCell>{(() => { const v = equipment.date_mise_en_service; if (!v) return 'Non spécifié'; const d = new Date(v); if (isNaN(d.getTime())) return v; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</TableCell>}
                {listFields.building && <TableCell>{getBuildingName(equipment.building_id)}</TableCell>}
                {listFields.service && <TableCell>{getServiceName(equipment.service_id)}</TableCell>}
                {listFields.location && <TableCell>{getLocationName(equipment.location_id)}</TableCell>}
                {listFields.groups && <TableCell>{getGroupNames(equipment)}</TableCell>}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEquipmentClick(equipment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => (onCreateInterventionFromList ? onCreateInterventionFromList(equipment) : onEquipmentClick(equipment))}>
                          <Wrench className="mr-2 h-4 w-4" />
                          Créer intervention
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => (onOpenDocumentsFromList ? onOpenDocumentsFromList(equipment) : onEquipmentClick(equipment))}>
                          <FileText className="mr-2 h-4 w-4" />
                          Documents techniques
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => (onOpenMaintenanceFromList ? onOpenMaintenanceFromList(equipment) : onEquipmentClick(equipment))}>
                          <CalendarClock className="mr-2 h-4 w-4" />
                          Programmer maintenance
                        </DropdownMenuItem>
                        {onEditEquipment && (
                          <DropdownMenuItem onClick={() => onEditEquipment(equipment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {onDeleteEquipment && (
                          <DropdownMenuItem onClick={() => onDeleteEquipment(equipment)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
