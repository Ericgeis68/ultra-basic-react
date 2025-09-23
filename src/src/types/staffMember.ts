export interface StaffMember {
  id: string;
  name: string;
  role?: string | null;
  specialization?: string | null;
  contact_info?: string | null;
  avatar_url?: string | null;
  certifications?: any | null; // Use a more specific type if schema is known
  created_at?: string;
  updated_at?: string;
}
