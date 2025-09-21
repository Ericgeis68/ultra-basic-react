import { supabase } from '@/integrations/supabase/client';

/**
 * Synchronise l'URL de l'image d'un groupe avec les équipements qui lui sont associés.
 * Cette fonction met à jour le champ `image_url` des équipements spécifiés.
 *
 * @param groupId L'ID du groupe d'équipement.
 * @param imageUrl L'URL de l'image à synchroniser. Peut être null pour effacer l'image.
 * @param equipmentIds Un tableau d'IDs d'équipements associés à ce groupe.
 */
export const syncEquipmentImagesWithGroup = async (
  groupId: string,
  imageUrl: string | null,
  equipmentIds: string[]
) => {
  if (!imageUrl) {
    console.log(`No image URL provided for group ${groupId}. Skipping image sync.`);
    return;
  }

  if (equipmentIds.length === 0) {
    console.log(`No equipments associated with group ${groupId}. Skipping image sync.`);
    return;
  }

  try {
    // Mettre à jour le champ `image_url` pour tous les équipements associés
    const { error } = await supabase
      .from('equipments')
      .update({ image_url: imageUrl })
      .in('id', equipmentIds);

    if (error) {
      console.error('Error updating equipment images for group sync:', error);
      throw error;
    }
    console.log(`Successfully synchronized image for ${equipmentIds.length} equipments in group ${groupId}.`);
  } catch (error) {
    console.error('Failed to synchronize equipment images with group:', error);
    throw error;
  }
};
