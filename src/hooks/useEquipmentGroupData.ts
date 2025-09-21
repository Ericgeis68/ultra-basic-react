import { useState, useEffect } from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { junctionTableManager } from '@/lib/junction-tables'; // Import the correct manager

/**
 * Hook to enrich Equipment and EquipmentGroup objects with their many-to-many relationships
 * using the junctionTableManager.
 */
export function useEquipmentGroupData(equipments: Equipment[], groups: EquipmentGroup[]) {
  const [enrichedEquipments, setEnrichedEquipments] = useState<Equipment[]>([]);
  const [enrichedGroups, setEnrichedGroups] = useState<EquipmentGroup[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(true);

  useEffect(() => {
    const enrichData = async () => {
      setLoadingRelations(true);
      
      // Enrich equipments with their associated group IDs
      const enrichedEquipmentsPromises = equipments.map(async (equipment) => {
        const associated_group_ids = await junctionTableManager.getGroupsForEquipment(equipment.id);
        return { ...equipment, associated_group_ids };
      });
      const newEnrichedEquipments = await Promise.all(enrichedEquipmentsPromises);
      setEnrichedEquipments(newEnrichedEquipments);

      // Enrich groups with their associated equipment IDs
      const enrichedGroupsPromises = groups.map(async (group) => {
        const associated_equipment_ids = await junctionTableManager.getEquipmentsForGroup(group.id);
        return { ...group, associated_equipment_ids };
      });
      const newEnrichedGroups = await Promise.all(enrichedGroupsPromises);
      setEnrichedGroups(newEnrichedGroups);
      
      setLoadingRelations(false);
    };

    // Only run if there are equipments or groups to process
    if (equipments.length > 0 || groups.length > 0) {
      enrichData();
    } else {
      // If no data, reset and stop loading
      setEnrichedEquipments([]);
      setEnrichedGroups([]);
      setLoadingRelations(false);
    }
  }, [equipments, groups]); // Re-run when source data changes

  return {
    enrichedEquipments,
    enrichedGroups,
    loadingRelations,
  };
}
