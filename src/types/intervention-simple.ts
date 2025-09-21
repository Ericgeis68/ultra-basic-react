// Simple intervention type that matches the database schema exactly
export interface InterventionDB {
  id: string;
  equipment_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}