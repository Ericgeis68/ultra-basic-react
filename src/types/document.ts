export interface Document {
  id: string;
  title: string;
  description?: string | null;
  equipment_ids: string[];
  category: 'maintenance' | 'manual' | 'warranty' | 'certification' | 'procedure' | 'other';
  fileurl?: string | null;
  updatedat: string;
  created_at: string;
}
