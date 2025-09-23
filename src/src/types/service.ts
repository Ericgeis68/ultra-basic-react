export interface Service {
  id: string;
  name: string;
  building_id: string | null; // Foreign key to buildings table
  created_at?: string;
  updated_at?: string;
}
