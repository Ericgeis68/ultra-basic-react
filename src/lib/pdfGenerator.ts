import jsPDF from 'jspdf';
import { TechnicianHistoryEntry } from '@/types/intervention';

export interface PDFInterventionData {
  id: string;
  title: string;
  type: string;
  status: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel?: string;
  equipmentLocation?: string;
  equipmentSerialNumber?: string;
  scheduled_date: string;
  completedDate?: string;
  technicians: string[];
  actions: string;
  parts?: {
    name: string;
    quantity: number;
  }[];
  technician_history?: TechnicianHistoryEntry[];
  createdAt: string;
  priority?: string;
}

// Helper function to safely split text
const splitText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text || text.trim() === '') return [''];
  
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  return Array.isArray(lines) ? lines : [text];
};

// Helper function to add a line with automatic page breaks
const addTextWithPageBreak = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number => {
  const pageHeight = doc.internal.pageSize.height;
  const lines = splitText(doc, text, maxWidth);
  let currentY = y;
  
  lines.forEach((line) => {
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, x, currentY);
    currentY += 6;
  });
  
  return currentY;
};

export const generateInterventionPDF = (intervention: PDFInterventionData) => {
  const doc = new jsPDF();
  
  // Configuration des couleurs et styles
  const primaryColor = '#1f2937';
  const secondaryColor = '#6b7280';
  const accentColor = '#3b82f6';
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  // En-tête du document
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('FICHE D\'INTERVENTION', leftMargin, yPosition);
  
  // Ligne de séparation
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
  yPosition += 15;
  
  // Section Informations générales
  doc.setFontSize(16);
  doc.setTextColor(accentColor);
  doc.text('INFORMATIONS GÉNÉRALES', leftMargin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  
  // ID et Titre
  doc.text(`ID : ${intervention.id}`, leftMargin, yPosition);
  yPosition += 6;
  
  const titleLines = splitText(doc, `Titre : ${intervention.title}`, contentWidth);
  titleLines.forEach(line => {
    doc.text(line, leftMargin, yPosition);
    yPosition += 6;
  });
  
  doc.text(`Type : ${getInterventionTypeText(intervention.type)}`, leftMargin, yPosition);
  yPosition += 6;
  
  doc.text(`Statut : ${getInterventionStatusText(intervention.status)}`, leftMargin, yPosition);
  yPosition += 6;
  
  if (intervention.priority) {
    doc.text(`Priorité : ${intervention.priority}`, leftMargin, yPosition);
    yPosition += 6;
  }
  
  doc.text(`Date d'intervention : ${intervention.scheduled_date}`, leftMargin, yPosition);
  yPosition += 6;
  
  if (intervention.completedDate) {
    doc.text(`Date de fin : ${intervention.completedDate}`, leftMargin, yPosition);
    yPosition += 6;
  }
  
  yPosition += 10;
  
  // Section Équipement
  doc.setFontSize(16);
  doc.setTextColor(accentColor);
  doc.text('ÉQUIPEMENT', leftMargin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  
  const equipmentNameLines = splitText(doc, `Nom : ${intervention.equipmentName}`, contentWidth);
  equipmentNameLines.forEach(line => {
    doc.text(line, leftMargin, yPosition);
    yPosition += 6;
  });
  
  if (intervention.equipmentModel) {
    doc.text(`Modèle : ${intervention.equipmentModel}`, leftMargin, yPosition);
    yPosition += 6;
  }
  
  if (intervention.equipmentSerialNumber) {
    doc.text(`N° de série : ${intervention.equipmentSerialNumber}`, leftMargin, yPosition);
    yPosition += 6;
  }
  
  if (intervention.equipmentLocation) {
    const locationLines = splitText(doc, `Localisation : ${intervention.equipmentLocation}`, contentWidth);
    locationLines.forEach(line => {
      doc.text(line, leftMargin, yPosition);
      yPosition += 6;
    });
  }
  
  yPosition += 10;
  
  // Section Techniciens
  doc.setFontSize(16);
  doc.setTextColor(accentColor);
  doc.text('TECHNICIEN(S)', leftMargin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  
  if (intervention.technicians && intervention.technicians.length > 0) {
    intervention.technicians.forEach((technician, index) => {
      doc.text(`${index + 1}. ${technician}`, leftMargin + 5, yPosition);
      yPosition += 6;
    });
  } else {
    doc.text('Aucun technicien assigné', leftMargin + 5, yPosition);
    yPosition += 6;
  }
  
  yPosition += 10;
  
  // Section Actions générales
  if (intervention.actions && intervention.actions.trim() !== '') {
    doc.setFontSize(16);
    doc.setTextColor(accentColor);
    doc.text('ACTIONS RÉALISÉES', leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    
    yPosition = addTextWithPageBreak(doc, intervention.actions, leftMargin, yPosition, contentWidth);
    yPosition += 10;
  }
  
  // Section Historique détaillé des techniciens
  if (intervention.technician_history && intervention.technician_history.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(accentColor);
    doc.text('HISTORIQUE DÉTAILLÉ', leftMargin, yPosition);
    yPosition += 10;
    
    intervention.technician_history.forEach((entry, index) => {
      // Vérification de saut de page
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(accentColor);
      doc.text(`${index + 1}. ${entry.technician_name}`, leftMargin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor);
      doc.text(`Période : ${entry.date_start}${entry.date_end ? ` → ${entry.date_end}` : ' (En cours)'}`, leftMargin + 5, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      
      if (entry.actions && entry.actions.trim() !== '') {
        doc.text('Actions :', leftMargin + 5, yPosition);
        yPosition += 5;
        
        yPosition = addTextWithPageBreak(doc, entry.actions, leftMargin + 10, yPosition, contentWidth - 10);
      }
      
      if (entry.parts_used && entry.parts_used.length > 0) {
        yPosition += 3;
        doc.text('Pièces utilisées :', leftMargin + 5, yPosition);
        yPosition += 5;
        
        entry.parts_used.forEach(part => {
          doc.text(`• ${part.name} (Quantité: ${part.quantity})`, leftMargin + 10, yPosition);
          yPosition += 5;
        });
      }
      
      yPosition += 8;
    });
  }
  
  // Section Pièces globales
  if (intervention.parts && intervention.parts.length > 0) {
    // Vérification de saut de page
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(accentColor);
    doc.text('PIÈCES UTILISÉES (GLOBAL)', leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    
    intervention.parts.forEach(part => {
      doc.text(`• ${part.name} (Quantité: ${part.quantity})`, leftMargin + 5, yPosition);
      yPosition += 6;
    });
  }
  
  // Pied de page avec date de génération
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text(
      `Généré le ${(() => { const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()} à ${new Date().toLocaleTimeString('fr-FR')}`,
      leftMargin,
      doc.internal.pageSize.height - 10
    );
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - rightMargin - 20, doc.internal.pageSize.height - 10);
  }
  
  // Téléchargement du PDF
  const fileName = `intervention_${intervention.id}_${intervention.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
};

// Fonctions utilitaires pour les libellés
const getInterventionTypeText = (type: string): string => {
  switch (type) {
    case 'preventive': return 'Maintenance Préventive';
    case 'corrective': return 'Maintenance Corrective';
    case 'improvement': return 'Amélioration';
    case 'regulatory': return 'Contrôle Réglementaire';
    default: return type;
  }
};

const getInterventionStatusText = (status: string): string => {
  switch (status) {
    
    case 'in-progress': return 'En cours d\'exécution';
    case 'completed': return 'Terminée avec succès';
    default: return status;
  }
};
