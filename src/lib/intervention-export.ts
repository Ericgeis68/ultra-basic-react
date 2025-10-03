import { InterventionUI } from '@/pages/Interventions';
import { Equipment } from '@/types/equipment';

interface ExportData {
  equipments: Equipment[];
  printOptions: {
    includeDetails: boolean;
    includeTechnicians: boolean;
    includeParts: boolean;
    includeHistory: boolean;
    format: 'list' | 'grid';
    selectedColumns?: string[];
  };
  filters: any;
}

export const exportInterventionsToCSV = (interventions: InterventionUI[], data: ExportData) => {
  const { printOptions, equipments } = data;
  
  const formatDateDMY = (value?: string | Date | null) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  
  // Helper functions
  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment?.name || '';
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'preventive': return 'Préventive';
      case 'corrective': return 'Corrective';
      case 'improvement': return 'Amélioration';
      case 'regulatory': return 'Réglementaire';
      default: return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Haute';
      default: return '';
    }
  };

  // Define columns based on format
  const allColumns = [
    { key: 'title', label: 'Titre' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Statut' },
    { key: 'equipment', label: 'Équipement' },
    { key: 'scheduled_date', label: 'Date prévue' },
    { key: 'completed_date', label: 'Date fin' },
    { key: 'technicians', label: 'Techniciens' },
    { key: 'priority', label: 'Priorité' },
    { key: 'actions', label: 'Actions' },
    { key: 'parts', label: 'Pièces' }
  ];

  // Filter columns based on options
  let columnsToExport = allColumns;
  
  if (printOptions.format === 'grid') {
    columnsToExport = allColumns.filter(col => 
      ['title', 'type', 'status', 'equipment'].includes(col.key)
    );
  } else {
    // Remove columns based on options
    if (!printOptions.includeTechnicians) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'technicians');
    }
    if (!printOptions.includeDetails) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'actions');
    }
    if (!printOptions.includeParts) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'parts');
    }
  }

  // Create CSV content with UTF-8 BOM
  const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
  const headers = columnsToExport.map(col => col.label);
  let csvContent = BOM + headers.join(';') + '\n';

  interventions.forEach(intervention => {
    const row = columnsToExport.map(col => {
      let value = '';
      
      switch (col.key) {
        case 'title':
          value = intervention.title || '';
          break;
        case 'type':
          value = getTypeText(intervention.type);
          break;
        case 'status':
          value = getStatusText(intervention.status);
          break;
        case 'equipment':
          value = getEquipmentName(intervention.equipmentId);
          break;
        case 'scheduled_date':
          value = formatDateDMY(intervention.scheduled_date);
          break;
        case 'completed_date':
          value = formatDateDMY(intervention.completedDate || '');
          break;
        case 'technicians':
          value = intervention.technicians.join(', ');
          break;
        case 'actions':
          value = intervention.actions || '';
          break;
        case 'parts':
          if (!intervention.parts || intervention.parts.length === 0) {
            value = '';
          } else {
            value = intervention.parts.map(part => `${part.name} (${part.quantity})`).join(', ');
          }
          break;
        default:
          value = '';
      }
      
      // Escape quotes and wrap in quotes if contains semicolon or quotes
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    });
    
    csvContent += row.join(';') + '\n';
  });

  // Create and download the file with proper UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `listing_interventions_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
