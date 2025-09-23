import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/hooks/use-supabase-collection';
import { useEquipmentGroupRelations } from '@/hooks/useEquipmentGroupRelations';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Equipment } from '@/types/equipment';
import { Plus, X, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EquipmentGroupManagerProps {
  equipment: Equipment;
  onUpdate?: () => void;
}

const EquipmentGroupManager: React.FC<EquipmentGroupManagerProps> = ({ 
  equipment, 
  onUpdate 
}) => {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [currentGroupIds, setCurrentGroupIds] = useState<string[]>([]);

  const {
    data: groups,
    loading: groupsLoading
  } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups'
  });

  const {
    loading: relationsLoading,
    getGroupsForEquipment,
    addEquipmentToGroup,
    removeEquipmentFromGroup
  } = useEquipmentGroupRelations();

  // Charger les groupes actuels de l'équipement
  useEffect(() => {
    const loadCurrentGroups = async () => {
      const groupIds = await getGroupsForEquipment(equipment.id);
      setCurrentGroupIds(groupIds);
    };
    loadCurrentGroups();
  }, [equipment.id, getGroupsForEquipment]);

  const currentGroups = groups?.filter(group => 
    currentGroupIds.includes(group.id)
  ) || [];

  const availableGroups = groups?.filter(group => 
    !currentGroupIds.includes(group.id)
  ) || [];

  const handleAddToGroup = async () => {
    if (!selectedGroupId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un groupe",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await addEquipmentToGroup(equipment.id, selectedGroupId);
      // La fonction retourne void, donc on considère que c'est un succès s'il n'y a pas d'erreur
      const group = groups?.find(g => g.id === selectedGroupId);
      setCurrentGroupIds(prev => [...prev, selectedGroupId]);
      setSelectedGroupId('');
      onUpdate?.();

      toast({
        title: "Succès",
        description: `Équipement ajouté au groupe "${group?.name || 'inconnu'}"`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'équipement au groupe",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    try {
      await removeEquipmentFromGroup(equipment.id, groupId);
      const group = groups?.find(g => g.id === groupId);
      setCurrentGroupIds(prev => prev.filter(id => id !== groupId));
      onUpdate?.();

      toast({
        title: "Succès",
        description: `Équipement retiré du groupe "${group?.name || 'inconnu'}"`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'équipement du groupe",
        variant: "destructive"
      });
    }
  };

  if (groupsLoading || relationsLoading) {
    return <div className="text-sm text-muted-foreground">Chargement des groupes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Groupes d'équipements</span>
      </div>

      {/* Groupes actuels */}
      {currentGroups.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {currentGroups.map((group) => (
            <Badge key={group.id} variant="secondary" className="flex items-center gap-1">
              {group.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFromGroup(group.id)}
                className="h-auto p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun groupe assigné</p>
      )}

      {/* Ajouter à un groupe */}
      {availableGroups.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un groupe" />
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddToGroup} 
            disabled={!selectedGroupId}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}

      {availableGroups.length === 0 && groups?.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun groupe disponible</p>
      )}
    </div>
  );
};

export default EquipmentGroupManager;
