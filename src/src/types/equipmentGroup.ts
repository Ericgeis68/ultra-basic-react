export interface EquipmentGroup {
  id: string;
  name: string;
  description: string | null;
  shared_image_url: string | null;
  created_at: string;
  updated_at: string;
  // `equipment_ids` est maintenant géré via la table de jonction `equipment_group_members`
  // Cette propriété est ajoutée pour la commodité de l'UI après avoir récupéré les relations
  associated_equipment_ids?: string[];
  equipment_ids?: string[]; // For UI convenience
}
