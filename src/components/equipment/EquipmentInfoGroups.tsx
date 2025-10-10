import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Equipment } from '@/types/equipment';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { MapPin, Settings, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { junctionTableManager } from '@/lib/junction-tables';

interface EquipmentInfoGroupsProps {
  equipment: Equipment;
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  equipmentGroups?: EquipmentGroup[];
  buildingsLoading?: boolean;
  servicesLoading?: boolean;
  locationsLoading?: boolean;
  buildingsError?: Error | null;
  servicesError?: Error | null;
  locationsError?: Error | null;
}

const EquipmentInfoGroups: React.FC<EquipmentInfoGroupsProps> = ({
  equipment,
  buildings = [],
  services = [],
  locations = [],
  equipmentGroups = [],
  buildingsLoading = false,
  servicesLoading = false,
  locationsLoading = false,
  buildingsError = null,
  servicesError = null,
  locationsError = null,
}) => {
  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      console.error("Failed to parse date string:", dateString, e);
      return dateString;
    }
  };

  const getBuildingName = (buildingId: string | null): string => {
    if (!buildingId || !buildings) return '';
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : '';
  };

  const getServiceName = (serviceId: string | null): string => {
    if (!serviceId || !services) return '';
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : '';
  };

  const getLocationName = (locationId: string | null): string => {
    if (!locationId || !locations) return '';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : '';
  };

  const [groupNames, setGroupNames] = useState<string>('');
  const [effectiveDescription, setEffectiveDescription] = useState<string>('');

  useEffect(() => {
    const computeNames = async () => {
      const groupIds = equipment.associated_group_ids || [];
      if (groupIds && groupIds.length > 0) {
        const names = equipmentGroups
          .filter(group => groupIds.includes(group.id))
          .map(group => group.name)
          .join(', ');
        if (names) { setGroupNames(names); return; }
      }
      // Fallback: fetch from junction table
      const fetchedIds = await junctionTableManager.getGroupsForEquipment(equipment.id);
      const names = equipmentGroups
        .filter(group => fetchedIds.includes(group.id))
        .map(group => group.name)
        .join(', ');
      setGroupNames(names);
    };
    computeNames();
  }, [equipment, equipmentGroups]);

  // Calculer une description effective: PRIORITÉ à la description du groupe associé
  useEffect(() => {
    const computeDescription = async () => {
      // D'abord, chercher une description depuis les groupes associés (PRIORITÉ)
      const groupIds = equipment.associated_group_ids && equipment.associated_group_ids.length > 0
        ? equipment.associated_group_ids
        : await junctionTableManager.getGroupsForEquipment(equipment.id);

      const firstGroupWithDesc = equipmentGroups
        .filter(g => groupIds.includes(g.id))
        .find(g => g.description && String(g.description).trim().length > 0);

      if (firstGroupWithDesc) {
        setEffectiveDescription(String(firstGroupWithDesc.description).trim());
        return;
      }

      // Sinon, utiliser la description de l'équipement (fallback)
      const equipmentDesc = equipment?.description ? String(equipment.description).trim() : '';
      setEffectiveDescription(equipmentDesc);
    };
    computeDescription();
  }, [equipment, equipmentGroups]);

  return (
    <div className="space-y-6">
      {/* Groupe Technique */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Informations techniques</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Modèle</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.model || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Fabricant</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.manufacturer || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Fournisseur</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.supplier || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Numéro de série</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.serial_number || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Inventaire</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.inventory_number || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>UF</Label>
            <p className="text-sm text-muted-foreground break-words">{equipment.uf || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Statut de prêt</Label>
            <p className="text-sm text-muted-foreground">
              {equipment.loan_status ? 'Oui' : 'Non'}
            </p>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{effectiveDescription || 'Non renseigné'}</p>
          </div>
        </div>
      </div>

      {/* Groupe Localisation */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Localisation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Bâtiment</Label>
            {buildingsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : buildingsError ? (
              <p className="text-sm text-destructive">Erreur</p>
            ) : (
              <p className="text-sm text-muted-foreground break-words">{getBuildingName(equipment.building_id) || 'Non renseigné'}</p>
            )}
          </div>
          <div>
            <Label>Service</Label>
            {servicesLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : servicesError ? (
              <p className="text-sm text-destructive">Erreur</p>
            ) : (
              <p className="text-sm text-muted-foreground break-words">{getServiceName(equipment.service_id) || 'Non renseigné'}</p>
            )}
          </div>
          <div>
            <Label>Local</Label>
            {locationsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : locationsError ? (
              <p className="text-sm text-destructive">Erreur</p>
            ) : (
              <p className="text-sm text-muted-foreground break-words">{getLocationName(equipment.location_id) || 'Non renseigné'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Groupe Dates */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dates importantes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Date d'achat</Label>
            <p className="text-sm text-muted-foreground">{formatDateOnly(equipment.purchase_date) || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Date de mise en service</Label>
            <p className="text-sm text-muted-foreground">{formatDateOnly(equipment.date_mise_en_service) || 'Non renseigné'}</p>
          </div>
          <div>
            <Label>Fin de garantie</Label>
            <p className="text-sm text-muted-foreground">{formatDateOnly(equipment.warranty_expiry) || 'Non renseigné'}</p>
          </div>
        </div>
      </div>

      {/* Groupe Groupes d'équipement */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Groupes d'équipement</h3>
        </div>
        <div>
          <Label>Groupes associés</Label>
          <p className="text-sm text-muted-foreground break-words">
            {groupNames || 'Aucun groupe associé'}
          </p>
        </div>
      </div>

    </div>
  );
};

export default EquipmentInfoGroups;
