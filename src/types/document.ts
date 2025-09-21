export interface Document {
  id: string;
  title: string;
  description: string | null;
  equipment_ids: string[] | null;
  // group_ids est géré via la table de jonction, mais on le garde optionnel pour l'UI
  group_ids?: string[] | null;
  category: string; // Relaxed to string to match DB
  fileurl: string; // URL of the stored file
  filename: string; // Original name of the file
  size: number; // Size of the file in bytes
  createdat?: string;
  updatedat?: string;
  // Ajout de filetype pour la cohérence
  filetype?: string | null;
  tags?: string[] | null;
  uploadDate?: string | null; // Optional UI field
}
