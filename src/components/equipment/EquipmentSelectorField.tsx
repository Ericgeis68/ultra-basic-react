import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Equipment, EquipmentStatus } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import { useEquipmentGroupNames } from '@/hooks/useEquipmentGroupNames';

interface EquipmentSelectorFieldProps {
  selectedEquipmentId: string;
  onEquipmentSelected: (equipment: Equipment) => void;
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings: BuildingType[];
  services: Service[];
  locations: Location[];
  disabled?: boolean;
  loading?: boolean;
}

const EquipmentSelectorField: React.FC<EquipmentSelectorFieldProps> = ({
  selectedEquipmentId,
  onEquipmentSelected,
  equipments,
  groups,
  buildings,
  services,
  locations,
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getGroupName } = useEquipmentGroupNames();

  const selectedEquipment = useMemo(() => {
    return equipments.find(equipment => equipment.id === selectedEquipmentId) || null;
  }, [equipments, selectedEquipmentId]);

  const selectedEquipmentGroups = useMemo(() => {
    if (!selectedEquipment) return [];
    return groups.filter(group => 
      selectedEquipment.associated_group_ids?.includes(group.id) || 
      selectedEquipment.equipment_group_ids?.includes(group.id)
    );
  }, [selectedEquipment, groups]);

  const handleSelect = (equipment: Equipment) => {
    onEquipmentSelected(equipment);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {selectedEquipment ? (
        <div className="border rounded-md p-3 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate text-sm sm:text-base">{selectedEquipment.name}</h4>
                <EquipmentStatusBadge status={selectedEquipment.status} />
              </div>
              
              <div className="space-y-1 text-xs sm:text-sm">
                {selectedEquipment.location_id && (
                  <div>
                    Localisation:{" "}
                    <span className="font-medium">
                      {locations.find(loc => loc.id === selectedEquipment.location_id)?.name || "Inconnue"}
                    </span>
                  </div>
                )}
                {selectedEquipment.service_id && (
                  <div>
                    Service:{" "}
                    <span className="font-medium">
                      {services.find(service => service.id === selectedEquipment.service_id)?.name || "Non spécifié"}
                    </span>
                  </div>
                )}
                {selectedEquipment.building_id && (
                  <div>
                    Bâtiment:{" "}
                    <span className="font-medium">
                      {buildings.find(building => building.id === selectedEquipment.building_id)?.name || "Non spécifié"}
                    </span>
                  </div>
                )}
              </div>

              {/* Fixed group display */}
              {selectedEquipmentGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Groupes: {selectedEquipmentGroups.map(group => getGroupName(group.id)).join(', ')}
                  </Badge>
                </div>
              )}
            </div>
            
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="ml-2 flex-shrink-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={disabled || loading}
          className="w-full justify-start text-left font-normal"
        >
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Chargement des équipements..." : "Sélectionner un équipment"}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un équipement</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Rechercher un équipement..."
            className="mb-4"
          />
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {equipments.map((equipment) => (
                <Card
                  key={equipment.id}
                  className="bg-transparent shadow-none rounded-none"
                >
                  <CardContent className="p-2.5">
                    <Button
                      variant="ghost"
                      className="flex items-center justify-between w-full hover:bg-secondary/50"
                      onClick={() => handleSelect(equipment)}
                    >
                      <div className="flex-1 flex items-start gap-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium leading-none">{equipment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {locations.find(loc => loc.id === equipment.location_id)?.name || "Inconnu"}
                          </p>
                        </div>
                      </div>
                      <EquipmentStatusBadge status={equipment.status} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentSelectorField;
