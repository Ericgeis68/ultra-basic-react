export interface Part {
  id: string;
  name: string;
  reference: string;
  // equipmentId?: string; // Removed or kept for backward compatibility if needed, but not used for saving
  equipmentName?: string; // Derived field, not saved
  quantity: number;
  min_quantity: number; // Use snake_case to match DB schema
  location: string;
  supplier: string;
  last_restock_date: string; // Use snake_case to match DB schema
  image?: string;
  equipment_ids?: string[] | null; // Use snake_case to match DB schema
  // group_ids a été supprimé car géré par la table de jonction part_group_members
  description?: string;
  unit?: string;
  price?: number;
}

export interface PartWithStock extends Part {
  status: 'normal' | 'warning' | 'critical';
  associatedGroupIds?: string[]; // Ajouté pour l'affichage des groupes associés via la table de jonction
}

export interface PartUsage {
  id: string;
  partId: string;
  interventionId: string;
  quantity: number;
  date: string;
  technicianId: string;
  technicianName: string;
}
