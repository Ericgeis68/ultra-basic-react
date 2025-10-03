export interface Document {
  id: string;
  title: string;
  description?: string | null;
  equipment_ids?: string[] | null;
  // group_ids est géré via la table de jonction, mais on le garde optionnel pour l'UI
  group_ids?: string[] | null;
  category?: string | null;
  fileurl?: string | null;
  filename?: string | null;
  size?: number | null;
  createdat?: string;
  updatedat?: string;
  // Ajout de filetype pour la cohérence
  filetype?: string | null;
  uploadDate?: string | null; // Optional UI field
}
