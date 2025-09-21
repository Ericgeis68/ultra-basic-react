// Custom Supabase types for our application
import { Json } from '@/integrations/supabase/types';

export interface SupabaseUserRow {
  id: string;
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'technician';
  avatar_url?: string | null;
  contact_info?: string | null;
  specialization?: string | null;
  dark_mode?: boolean | null;
  menu_preferences?: Json | null;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentHistoryRow {
  id: string;
  equipment_id: string;
  field_name: string;
  old_value: Json | null;
  new_value: Json | null;
  changed_at: string;
  changed_by: string | null;
}
