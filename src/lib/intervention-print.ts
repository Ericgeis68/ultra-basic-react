import jsPDF from 'jspdf';
import { InterventionUI } from '@/pages/Interventions';
import { Equipment } from '@/types/equipment';

interface PrintData {
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

export const generateInterventionsPDF = (interventions: InterventionUI[], data: PrintData) => {
  const { printOptions, equipments } = data;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Configuration
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

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

  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 5);
    } else {
      doc.text(text, x, y);
      return y + 5;
    }
  };

  const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
    if (!text || text.trim() === '') return y;
    
    const lines = doc.splitTextToSize(text, maxWidth);
    let currentY = y;
    
    lines.forEach((line: string) => {
      if (currentY + 5 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, x, currentY);
      currentY += 5;
    });
    
    return currentY;
  };

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title centered
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const title = 'Rapport d\'intervention';
  const titleWidth = doc.getTextWidth(title);
  const titleX = (pageWidth - titleWidth) / 2;
  doc.text(title, titleX, yPosition);
  yPosition += 10;

  // Date and count
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addText(`Généré le ${(() => { const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}`, margin, yPosition);
  yPosition = addText(`Nombre d'interventions: ${interventions.length}`, margin, yPosition);
  yPosition += 10;

  // Table headers
  const columnWidths = printOptions.format === 'grid' 
    ? [60, 40, 30, 80] // title, type, status, equipment
    : [50, 30, 25, 60, 25, 25, 50, 20]; // title, type, status, equipment, date, completed, technicians, priority

  const headers = printOptions.format === 'grid'
    ? ['Titre', 'Type', 'Statut', 'Équipement']
    : ['Titre', 'Type', 'Statut', 'Équipement', 'Date prévue', 'Date fin', 'Techniciens', 'Priorité'];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  let xPosition = margin;
  headers.forEach((header, index) => {
    doc.rect(xPosition, yPosition, columnWidths[index], 8);
    doc.text(header, xPosition + 2, yPosition + 6);
    xPosition += columnWidths[index];
  });
  yPosition += 8;

  // Table content
  doc.setFont('helvetica', 'normal');

  interventions.forEach((intervention, index) => {
    checkPageBreak(8);

    xPosition = margin;
    const rowData = printOptions.format === 'grid'
      ? [
          intervention.title,
          getTypeText(intervention.type),
          getStatusText(intervention.status),
          getEquipmentName(intervention.equipmentId)
        ]
      : [
          intervention.title,
          getTypeText(intervention.type),
          getStatusText(intervention.status),
          getEquipmentName(intervention.equipmentId),
          intervention.scheduled_date ? (() => { const d = new Date(intervention.scheduled_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : '',
          intervention.completedDate || '',
          intervention.technicians.join(', ')
        ];

    // Background color for alternating rows
    if (index % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
    }

    rowData.forEach((data, colIndex) => {
      doc.rect(xPosition, yPosition, columnWidths[colIndex], 8);
      
      // Pour le titre (première colonne), utiliser une police légèrement plus grosse et en gras
      if (colIndex === 0 && data) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      
      const cellText = doc.splitTextToSize(data || '', columnWidths[colIndex] - 4);
      doc.text(cellText[0] || '', xPosition + 2, yPosition + 6);
      xPosition += columnWidths[colIndex];
    });

    yPosition += 8;

    // Add detailed technician history if enabled and available
    if (printOptions.includeHistory && intervention.technician_history && intervention.technician_history.length > 0) {
      checkPageBreak(20);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Historique détaillé:', margin + 5, yPosition + 5);
      yPosition += 3;

      doc.setFont('helvetica', 'normal');
      
      intervention.technician_history.forEach((entry, historyIndex) => {
        checkPageBreak(15);
        
        // Technician name only (without dates)
        yPosition = addText(entry.technician_name, margin + 10, yPosition + 3);
        
        // Actions with proper wrapping
        if (entry.actions && entry.actions.trim() !== '') {
          yPosition = addWrappedText(`Actions: ${entry.actions}`, margin + 15, yPosition + 2, contentWidth - 25);
        }
        
        // Parts used
        if (entry.parts_used && entry.parts_used.length > 0) {
          const partsText = `Pièces: ${entry.parts_used.map(part => `${part.name} (${part.quantity})`).join(', ')}`;
          yPosition = addWrappedText(partsText, margin + 15, yPosition + 2, contentWidth - 25);
        }
        
        yPosition += 3;
      });
      
      yPosition += 5;
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin - 20, pageHeight - 5);
  }

  // Download
  const fileName = `listing_interventions_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
