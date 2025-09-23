import { supabase } from '@/integrations/supabase/client';
import { Part } from '@/types/part';
import { junctionTableManager, groupBasedQueries } from './junction-tables';

/**
 * Fetches parts related to a specific equipment ID or any of its equipment group IDs.
 * This function now uses the groupBasedQueries helper to fetch parts via the junction table.
 *
 * @param equipmentId The ID of the equipment.
 * @param groupIds An array of equipment group IDs the equipment belongs to.
 * @returns A promise resolving with the list of relevant parts.
 */
export async function getPartsForEquipment(equipmentId: string, groupIds: string[]): Promise<Part[]> {
  console.log(`[getPartsForEquipment] Fetching parts for equipment ID: ${equipmentId} and group IDs:`, groupIds);

  if (!equipmentId && (!groupIds || groupIds.length === 0)) {
    console.log("[getPartsForEquipment] No equipment ID or group IDs provided, returning empty array.");
    return [];
  }

  try {
    const parts = await groupBasedQueries.getPartsForEquipmentAndGroups(equipmentId, groupIds);
    console.log(`[getPartsForEquipment] Successfully fetched ${parts?.length || 0} parts`);
    return parts || [];
  } catch (error) {
    console.error(`[getPartsForEquipment] Exception when fetching parts:`, error);
    throw error;
  }
}

// Keep backward compatibility if needed, but prefer getPartsForEquipment
export const fetchPartsForEquipmentAndGroups = getPartsForEquipment;


/**
 * Deletes parts linked directly to a specific equipment ID.
 *
 * @param equipmentId The ID of the equipment whose related parts should be deleted.
 * @returns A promise resolving when the operation is complete.
 */
export async function deletePartsByEquipmentId(equipmentId: string): Promise<void> {
  console.log(`[deletePartsByEquipmentId] Deleting parts linked to equipment ID: ${equipmentId}`);

  try {
    const { error } = await supabase
      .from('parts')
      .delete()
      .contains('equipment_ids', [equipmentId]);

    if (error) {
      console.error(`Error deleting parts for equipment ${equipmentId}:`, error);
      throw error;
    }

    console.log(`Parts for equipment ${equipmentId} deleted successfully.`);
  } catch (err) {
    console.error(`Exception deleting parts for equipment ${equipmentId}:`, err);
    throw err;
  }
}
