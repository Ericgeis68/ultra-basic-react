import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, X, Search, WrenchIcon, Users, Barcode, Warehouse, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Part } from '@/types/part';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { useCollection } from '@/hooks/use-supabase-collection';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { junctionTableManager } from '@/lib/junction-tables'; // Import junctionTableManager

interface PartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Partial<Part> & { group_ids?: string[] }) => void; // onSave now expects group_ids separately
  part?: Part | null;
  equipments: Equipment[];
  groups?: EquipmentGroup[];
}

const PartFormModal: React.FC<PartFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  part,
  equipments = [],
  groups = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    quantity: 0,
    min_quantity: 0,
    location: '',
    supplier: '',
    last_restock_date: '',
    image: '',
    equipment_ids: [] as string[],
    group_ids: [] as string[] // Managed locally for form
  });

  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);

  // Fetch related data for EquipmentSelector filters
  const { data: buildings } = useCollection<BuildingType>({ tableName: 'buildings' });
  const { data: services } = useCollection<Service>({ tableName: 'services' });
  const { data: locations } = useCollection<Location>({ tableName: 'locations' });

  // Initialize form data when part changes
  useEffect(() => {
    const initializeFormData = async () => {
      if (part) {
        const associatedGroupIds = await junctionTableManager.getGroupsForPart(part.id);
        setFormData({
          name: part.name || '',
          reference: part.reference || '',
          quantity: part.quantity || 0,
          min_quantity: part.min_quantity || 0,
          location: part.location || '',
          supplier: part.supplier || '',
          last_restock_date: part.last_restock_date || '',
          image: part.image || '',
          equipment_ids: part.equipment_ids || [],
          group_ids: associatedGroupIds || [] // Set from fetched join table data
        });
      } else {
        setFormData({
          name: '',
          reference: '',
          quantity: 0,
          min_quantity: 0,
          location: '',
          supplier: '',
          last_restock_date: '',
          image: '',
          equipment_ids: [],
          group_ids: []
        });
      }
    };

    if (isOpen) {
      initializeFormData();
    }
  }, [part, isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentSelected = (equipment: Equipment) => {
    if (!formData.equipment_ids.includes(equipment.id)) {
      setFormData(prev => ({
        ...prev,
        equipment_ids: [...prev.equipment_ids, equipment.id]
      }));
    }
    setIsEquipmentSelectorOpen(false);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: prev.equipment_ids.filter(id => id !== equipmentId)
    }));
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      group_ids: prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId]
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.reference.trim()) {
      return;
    }

    const partData: Partial<Part> & { group_ids?: string[] } = {
      name: formData.name,
      reference: formData.reference,
      quantity: formData.quantity,
      min_quantity: formData.min_quantity,
      location: formData.location || undefined,
      supplier: formData.supplier || undefined,
      last_restock_date: formData.last_restock_date || undefined,
      image: formData.image || undefined,
      equipment_ids: formData.equipment_ids.length > 0 ? formData.equipment_ids : undefined,
      // group_ids is passed separately for the junction table
      group_ids: formData.group_ids.length > 0 ? formData.group_ids : undefined,
    };

    if (part) {
      partData.id = part.id;
    }

    onSave(partData);
  };

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : equipmentId;
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : groupId;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {part ? "Modifier la pièce" : "Nouvelle pièce"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <div className="relative">
                  <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nom de la pièce"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Référence *</Label>
                <div className="relative">
                  <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="Référence de la pièce"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_quantity">Quantité minimale</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => handleInputChange('min_quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <div className="relative">
                  <Warehouse className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Emplacement de stockage"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <div className="relative">
                  <Truck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Nom du fournisseur"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_restock_date">Date du dernier réapprovisionnement</Label>
              <Input
                id="last_restock_date"
                type="date"
                value={formData.last_restock_date}
                onChange={(e) => handleInputChange('last_restock_date', e.target.value)}
              />
            </div>

            <div className="space-y-4 border rounded-md p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <WrenchIcon className="h-4 w-4" />
                  Équipements associés
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEquipmentSelectorOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Sélectionner
                </Button>
              </div>

              {formData.equipment_ids.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun équipement sélectionné</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.equipment_ids.map((equipmentId) => (
                    <Badge key={equipmentId} variant="outline" className="bg-green-50 text-green-700 border-green-200 pr-1">
                      <WrenchIcon className="w-3 h-3 mr-1" />
                      {getEquipmentName(equipmentId)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEquipment(equipmentId)}
                        className="ml-1 p-0 h-auto hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 border rounded-md p-4">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groupes d'équipements associés
              </Label>

              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun groupe disponible</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={formData.group_ids.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer flex-1">
                        {group.name}
                        {group.description && (
                          <span className="text-muted-foreground ml-2">- {group.description}</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {formData.group_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.group_ids.map((groupId) => (
                    <Badge key={groupId} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <Users className="w-3 h-3 mr-1" />
                      {getGroupName(groupId)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim() || !formData.reference.trim()}>
              {part ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onSelect={handleEquipmentSelected}
        equipments={equipments}
        groups={groups}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        title="Sélectionner un équipement pour la pièce"
        placeholder="Rechercher un équipement à associer..."
      />
    </>
  );
};

export default PartFormModal;
