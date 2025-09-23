export type EquipmentStatus = 'operational' | 'maintenance' | 'faulty';

export interface EquipmentRelationship {
  related_equipment_id: string;
  equipment_id?: string; // For UI convenience
  type: RelationshipType;
}

export type RelationshipType = 'parent' | 'child' | 'component' | 'assembly' | 'other' | 'related' | 'same-model' | 'same-manufacturer' | 'same-location' | 'shared-parts' | 'parts-reference' | 'docs-reference' | 'reference-to';

export interface EquipmentHistoryEntry {
  id: string;
  equipment_id: string;
  action: string;
  user_id: string;
  created_at: string;
  field_name?: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_at?: string;
  changed_by?: string;
  metadata?: any;
}

export interface Equipment {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  description?: string | null;
  supplier: string | null;
  status: EquipmentStatus;
  health_percentage: number | null;
  date_mise_en_service: string | null; // Stored as YYYY-MM-DD in DB
  purchase_date: string | null; // Stored as YYYY-MM-DD in DB
  warranty_expiry: string | null; // Stored as YYYY-MM-DD in DB
  uf: string | null; // UF is a string, not a foreign key to a UF table
  building_id: string | null;
  service_id: string | null;
  location_id: string | null;
  image_url: string | null;
  relationships: EquipmentRelationship[] | null;
  // `equipment_group_ids` est maintenant géré via la table de jonction `equipment_group_members`
  // Cette propriété est ajoutée pour la commodité de l'UI après avoir récupéré les relations
  associated_group_ids?: string[];
  equipment_group_ids?: string[]; // For UI convenience
  inventory_number: string | null;
  serial_number: string | null;
  tag_number?: string | null; // Additional tag number field
  loan_status: boolean; // Indique si l'équipement est en prêt
  created_at?: string;
  updated_at?: string;
}

// New type for UI representation, including resolved names
export interface EquipmentUI extends Equipment {
  buildingName?: string | null;
  serviceName?: string | null;
  locationName?: string | null;
  groupNames?: string[]; // Array of group names
}

// Type for sortable columns
export type EquipmentSortColumn = 
  'name' | 'model' | 'manufacturer' | 'status' | 'health_percentage' | 
  'inventory_number' | 'serial_number' | 'uf' | 'buildingName' | 
  'serviceName' | 'locationName' | 'created_at'; // Changed to created_at for consistency
