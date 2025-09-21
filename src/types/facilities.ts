export interface Building {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  building_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  service_id: string | null;
  created_at?: string;
  updated_at?: string;
}
