import { supabase } from '@/integrations/supabase/client';
import { Equipment, EquipmentHistoryEntry, EquipmentStatus } from '@/types/equipment';
import { deletePartsByEquipmentId } from './parts';
import { deleteDocumentsByEquipmentId } from './documents';
import { Json } from '@/integrations/supabase/types';

/**
 * Fetches a single equipment by its ID.
 */
export async function fetchEquipmentById(equipmentId: string): Promise<Equipment | null> {
  console.log(`Fetching equipment with ID: ${equipmentId}`);
  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .eq('id', equipmentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching equipment ${equipmentId}:`, error);
    throw error;
  }

  if (data) {
    const validEquipment: Equipment = {
      ...data,
      status: data.status as EquipmentStatus,
      loan_status: (data as any).loan_status || false
    };
    console.log(`Fetched equipment:`, validEquipment);
    return validEquipment;
  }

  return null;
}

/**
 * Deletes interventions linked to a specific equipment.
 */
async function deleteInterventionsByEquipmentId(equipmentId: string): Promise<void> {
  console.log(`Attempting to delete interventions linked to equipment ID: ${equipmentId}`);

  try {
    const { error } = await supabase
      .from('interventions')
      .delete()
      .eq('equipment_id', equipmentId);

    if (error) {
      console.error(`Error deleting interventions for equipment ${equipmentId}:`, error);
      throw error;
    }

    console.log(`Interventions for equipment ${equipmentId} deleted successfully.`);
  } catch (err) {
    console.error(`Exception deleting interventions for equipment ${equipmentId}:`, err);
    throw err;
  }
}

/**
 * Deletes equipment history linked to a specific equipment.
 */
async function deleteEquipmentHistoryByEquipmentId(equipmentId: string): Promise<void> {
  console.log(`Attempting to delete equipment history linked to equipment ID: ${equipmentId}`);

  try {
    const { error } = await supabase
      .from('equipment_history')
      .delete()
      .eq('equipment_id', equipmentId);

    if (error) {
      console.error(`Error deleting equipment history for equipment ${equipmentId}:`, error);
      throw error;
    }

    console.log(`Equipment history for equipment ${equipmentId} deleted successfully.`);
  } catch (err) {
    console.error(`Exception deleting equipment history for equipment ${equipmentId}:`, err);
    throw err;
  }
}

/**
 * Deletes an equipment's image from storage.
 */
async function deleteEquipmentImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  try {
    console.log(`Attempting to delete image: ${imageUrl}`);
    
    // Extract the file path from the URL
    let filePath = '';
    
    if (imageUrl.includes('/storage/v1/object/public/')) {
      // URL format: https://[project].supabase.co/storage/v1/object/public/equipment-images/filename.jpg
      const parts = imageUrl.split('/storage/v1/object/public/equipment-images/');
      if (parts.length > 1) {
        filePath = parts[1];
      }
    } else if (imageUrl.includes('/equipment-images/')) {
      // Simpler format: just extract after /equipment-images/
      const parts = imageUrl.split('/equipment-images/');
      if (parts.length > 1) {
        filePath = parts[1];
      }
    } else {
      // Assume it's just a filename
      const urlParts = imageUrl.split('/');
      filePath = urlParts[urlParts.length - 1];
    }

    if (filePath && filePath.includes('.')) {
      console.log(`Deleting file from storage: ${filePath}`);
      
      const { error: storageError } = await supabase.storage
        .from('equipment-images')
        .remove([filePath]);

      if (storageError) {
        console.error(`Error deleting image file:`, storageError);
        // Don't throw error for storage deletion failures, just log
      } else {
        console.log(`Successfully deleted image file: ${filePath}`);
      }
    } else {
      console.warn(`Could not extract valid file path from URL: ${imageUrl}`);
    }
  } catch (error) {
    console.error(`Error processing image deletion:`, error);
    // Don't throw error for image deletion failures
  }
}

/**
 * Safely handles documents and parts when deleting equipment.
 * Only deletes them if they're not used by any groups.
 */
async function safelyHandleDocumentsAndParts(equipmentId: string): Promise<void> {
  console.log(`Safely handling documents and parts for equipment ${equipmentId}`);
  
  try {
    // For documents: get documents that contain this equipment ID
  const { data: docs } = await supabase
      .from('documents')
      .select('id, equipment_ids')
      .contains('equipment_ids', [equipmentId]);
    
    for (const doc of docs || []) {
      // Always remove the equipment ID from the array
      const currentEquipmentIds = doc.equipment_ids || [];
      const updatedEquipmentIds = currentEquipmentIds.filter(id => id !== equipmentId);
      
      // Check if document still has references (other equipment IDs, group_ids, or group relations)
      const { data: groupUsage } = await supabase
        .from('document_group_members')
        .select('group_id')
        .eq('document_id', doc.id);
      
      const hasOtherEquipmentIds = updatedEquipmentIds.length > 0;
      const hasGroupRelations = groupUsage && groupUsage.length > 0;
      
      if (!hasOtherEquipmentIds && !hasGroupRelations) {
        // No more references, delete the document
        console.log(`Deleting document ${doc.id} - no remaining references`);
        await supabase.from('documents').delete().eq('id', doc.id);
      } else {
        // Update document to remove the equipment ID but keep the document
        console.log(`Removing equipment ${equipmentId} from document ${doc.id} - document still has other references`);
        await supabase
          .from('documents')
          .update({ equipment_ids: updatedEquipmentIds.length > 0 ? updatedEquipmentIds : null })
          .eq('id', doc.id);
      }
    }
    
    // For parts: get parts that contain this equipment ID  
    const { data: parts } = await supabase
      .from('parts')
      .select('id, equipment_ids, group_ids')
      .contains('equipment_ids', [equipmentId]);
    
    for (const part of parts || []) {
      // Always remove the equipment ID from the array
      const currentEquipmentIds = part.equipment_ids || [];
      const updatedEquipmentIds = currentEquipmentIds.filter(id => id !== equipmentId);
      
      // Check if part still has references (other equipment IDs, group_ids, or group relations)
      const { data: groupUsage } = await supabase
        .from('part_group_members')
        .select('group_id')
        .eq('part_id', part.id);
      
      const hasOtherEquipmentIds = updatedEquipmentIds.length > 0;
      const hasDirectGroupIds = part.group_ids && part.group_ids.length > 0;
      const hasGroupRelations = groupUsage && groupUsage.length > 0;
      
      if (!hasOtherEquipmentIds && !hasDirectGroupIds && !hasGroupRelations) {
        // No more references, delete the part
        console.log(`Deleting part ${part.id} - no remaining references`);
        await supabase.from('parts').delete().eq('id', part.id);
      } else {
        // Update part to remove the equipment ID but keep the part
        console.log(`Removing equipment ${equipmentId} from part ${part.id} - part still has other references`);
        await supabase
          .from('parts')
          .update({ equipment_ids: updatedEquipmentIds.length > 0 ? updatedEquipmentIds : null })
          .eq('id', part.id);
      }
    }
    
  } catch (error) {
    console.error('Error in safelyHandleDocumentsAndParts:', error);
    // Don't throw - just log and continue
    console.log('Skipping document/part deletion to ensure safety');
  }
}

/**
 * Handles group cleanup when an equipment is removed from groups.
 * Only deletes groups and their shared data if they become completely empty and user chooses to.
 */
async function handleGroupCleanup(equipmentId: string, groupIds: string[], shouldDeleteEmptyGroups: boolean = true): Promise<void> {
  console.log(`Handling group cleanup for equipment ${equipmentId} with groups:`, groupIds);

  if (!groupIds || groupIds.length === 0) {
    console.log(`Equipment has no groups to clean up`);
    return;
  }

  const emptyGroupsToDelete: string[] = [];

  // For each group, check if this equipment was the last one
  for (const groupId of groupIds) {
    try {
      // Check how many other equipments are still in this group
      const { data: otherEquipments } = await supabase
        .from('equipment_group_members')
        .select('equipment_id')
        .eq('group_id', groupId)
        .neq('equipment_id', equipmentId);

      if (!otherEquipments || otherEquipments.length === 0) {
        // This group will be empty after removing this equipment
        console.log(`Group ${groupId} will become empty`);
        
        if (shouldDeleteEmptyGroups) {
          emptyGroupsToDelete.push(groupId);
          console.log(`Marking group ${groupId} for deletion`);
          
          // Get shared documents for this group
          const { data: sharedDocs } = await supabase
            .from('document_group_members')
            .select('document_id')
            .eq('group_id', groupId);
            
          // Get shared parts for this group  
          const { data: sharedParts } = await supabase
            .from('part_group_members')
            .select('part_id')
            .eq('group_id', groupId);
          
          // Delete shared documents that are not used elsewhere
          if (sharedDocs && sharedDocs.length > 0) {
            for (const doc of sharedDocs) {
              const { data: otherGroups } = await supabase
                .from('document_group_members')
                .select('group_id')
                .eq('document_id', doc.document_id)  
                .neq('group_id', groupId);
                
              const { data: directLink } = await supabase
                .from('documents')
                .select('equipment_id')
                .eq('id', doc.document_id)
                .not('equipment_id', 'is', null);
              
              if ((!otherGroups || otherGroups.length === 0) && (!directLink || directLink.length === 0)) {
                console.log(`Deleting orphaned shared document ${doc.document_id}`);
                await supabase.from('documents').delete().eq('id', doc.document_id);
              }
            }
          }
          
          // Delete shared parts that are not used elsewhere
          if (sharedParts && sharedParts.length > 0) {
            for (const part of sharedParts) {
              const { data: otherGroups } = await supabase
                .from('part_group_members')
                .select('group_id')
                .eq('part_id', part.part_id)
                .neq('group_id', groupId);
                
              const { data: directLink } = await supabase
                .from('parts')
                .select('equipment_id')
                .eq('id', part.part_id)
                .not('equipment_id', 'is', null);
              
              if ((!otherGroups || otherGroups.length === 0) && (!directLink || directLink.length === 0)) {
                console.log(`Deleting orphaned shared part ${part.part_id}`);
                await supabase.from('parts').delete().eq('id', part.part_id);
              }
            }
          }
        }
      } else {
        console.log(`Group ${groupId} still has ${otherEquipments.length} other equipment(s)`);
      }
    } catch (err) {
      console.error(`Error processing group ${groupId}:`, err);
    }
  }

  // Delete empty groups if requested
  if (shouldDeleteEmptyGroups && emptyGroupsToDelete.length > 0) {
    console.log(`Deleting ${emptyGroupsToDelete.length} empty groups`);
    await supabase.from('equipment_groups').delete().in('id', emptyGroupsToDelete);
  }
}

/**
 * Deletes an equipment by its ID and all related data.
 * Handles group logic for documents and parts.
 */
export async function deleteEquipment(equipmentId: string, shouldDeleteEmptyGroups: boolean = true): Promise<void> {
  console.log(`Attempting to delete equipment with ID: ${equipmentId}`);

  try {
    // First, fetch the equipment to get its group information and image URL
    const equipment = await fetchEquipmentById(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }

    // Fetch current group memberships via junction table
    const { junctionTableManager } = await import('@/lib/junction-tables');
    const groupIds = await junctionTableManager.getGroupsForEquipment(equipmentId);
    const imageUrl = equipment.image_url;

    console.log(`Equipment found - Name: ${equipment.name}, Image URL: ${imageUrl}`);

    // 1. Delete interventions linked to this equipment
    await deleteInterventionsByEquipmentId(equipmentId);

    // 2. Delete equipment history
    await deleteEquipmentHistoryByEquipmentId(equipmentId);

    // 3. Safely handle documents and parts, checking group usage
    await safelyHandleDocumentsAndParts(equipmentId);
    
    // 4. Remove junction table memberships to satisfy FK constraints
    await supabase
      .from('equipment_group_members')
      .delete()
      .eq('equipment_id', equipmentId);

    // 5. Handle group cleanup if needed (based on previous memberships)
    await handleGroupCleanup(equipmentId, groupIds, shouldDeleteEmptyGroups);

    // 6. Delete the equipment's image from storage if it exists
    if (imageUrl) {
      await deleteEquipmentImage(imageUrl);
    }

    // 7. Finally, delete the equipment itself from the database
    console.log(`Deleting equipment ${equipmentId} from database`);
    const { error: deleteError } = await supabase
      .from('equipments')
      .delete()
      .eq('id', equipmentId);

    if (deleteError) {
      console.error(`Error deleting equipment ${equipmentId} from database:`, deleteError);
      throw deleteError;
    }

    console.log(`Equipment with ID ${equipmentId} and all related data deleted successfully from database and storage.`);
  } catch (err) {
    console.error(`Error in deleteEquipment for ${equipmentId}:`, err);
    throw err;
  }
}

/**
 * Logs a change made to an equipment's field.
 */
export async function logEquipmentChange(
  equipmentId: string,
  fieldName: string,
  oldValue: Json | null,
  newValue: Json | null,
  changedBy: string | null = null
): Promise<void> {
  console.log(`Logging change for equipment ${equipmentId}: ${fieldName} from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)} by ${changedBy}`);

  try {
    const { error } = await supabase
      .from('equipment_history')
      .insert([{
        equipment_id: equipmentId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        changed_by: changedBy
      }]);

    if (error) {
      console.error(`Error logging equipment change for ${equipmentId}:`, error);
      throw error;
    } else {
      console.log(`Equipment change logged successfully for ${equipmentId} by ${changedBy}.`);
    }
  } catch (err) {
    console.error(`Exception logging equipment change for ${equipmentId}:`, err);
    throw err;
  }
}

export async function fetchEquipmentHistory(equipmentId: string): Promise<EquipmentHistoryEntry[]> {
  console.log(`Fetching history for equipment with ID: ${equipmentId}`);

  try {
    const { data, error } = await supabase
      .from('equipment_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .neq('field_name', 'image_url')
      .neq('field_name', 'imageUrl')
      .order('changed_at', { ascending: false });

    if (error) {
      console.error(`Error fetching equipment history ${equipmentId}:`, error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} history entries (excluding image changes):`, data);
    return (data || []) as EquipmentHistoryEntry[];
  } catch (err) {
    console.error(`Exception fetching equipment history for ${equipmentId}:`, err);
    throw err;
  }
}
