import { Json } from "@/integrations/supabase/types";

// Define a specific type for the parts structure in the 'parts' column
export interface UsedPart {
  name: string;
  quantity: number;
  [key: string]: Json; // This makes it compatible with Json type
}

// Define the technician history entry structure - made compatible with Json
export interface TechnicianHistoryEntry {
  technician_id: string;
  technician_name: string;
  actions: string;
  parts_used: UsedPart[];
  date_start: string; // YYYY-MM-DD
  date_end?: string; // YYYY-MM-DD
  timestamp?: string; // ISO timestamp pour l'ordre chronologique précis
  [key: string]: Json; // This makes it compatible with Json type
}

// Main Intervention interface - temporary compatibility layer
export interface Intervention {
  id: string;
  equipment_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
  // Legacy properties for backward compatibility
  maintenance_id?: string;
  type?: string;
  actions?: string;
  scheduled_date?: string;
  completed_date?: string;
  technicians?: string[];
  parts?: any[];
  technician_history?: TechnicianHistoryEntry[];
  created_by?: string;
}

// UI-friendly intervention interface
export interface InterventionUI {
  id: string;
  equipment_id?: string;
  maintenance_id?: string;
  equipment_name?: string;
  type: string;
  title?: string;
  description?: string;
  actions?: string;
  scheduled_date: string;
  start_date?: string;
  end_date?: string;
  completed_date?: string;
  status?: string;
  technicians?: string[];
  parts?: UsedPart[];
  technician_history?: TechnicianHistoryEntry[];
  created_at?: string; // Make optional to fix errors
  created_by?: string;
  // Champs additionnels utilisés par l'UI
  priority?: string; // 'low' | 'medium' | 'high' | autre
  duration?: number; // durée en minutes
  notes?: string;
  // Legacy properties for backward compatibility
  equipmentId?: string;
  equipmentName?: string;
  completedDate?: string;
  createdAt?: string;
  buildingName?: string;
}

// Form data interface for creating/updating interventions
export interface InterventionFormData {
  equipment_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  // Legacy properties for backward compatibility
  maintenance_id?: string;
  type?: string;
  actions?: string;
  scheduled_date?: string;
  completed_date?: string;
  technicians?: string[];
  parts?: UsedPart[];
  technician_history?: TechnicianHistoryEntry[];
}
