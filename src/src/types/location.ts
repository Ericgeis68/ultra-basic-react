export interface Location {
  id: string;
  name: string;
  service_id: string | null; // Foreign key to services table
  created_at?: string;
  updated_at?: string;
}
