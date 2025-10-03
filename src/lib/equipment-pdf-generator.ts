import jsPDF from 'jspdf';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { ExportOptions } from '@/services/PDFExportService';

interface EquipmentPrintData {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  exportOptions: ExportOptions;
}

export const generateEquipmentsPDF = (data: EquipmentPrintData) => {
  const { equipments, groups, buildings, services, locations, exportOptions } = data;
  
  const doc = new jsPDF({
    orientation: exportOptions.orientation || 'portrait',
    unit: 'mm',
    format: exportOptions.pageSize === 'a3' ? 'a3' : 'a4'
  });

  // Configuration
  const margin = 10;
  let yPosition = margin;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - 2 * margin;

  // Helper functions
  const getBuildingName = (buildingId: string | null) => {
    if (!buildingId) return 'Non spécifié';
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || 'Non spécifié';
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'Non spécifié';
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Non spécifié';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'En maintenance';
      case 'faulty': return 'En panne';
      default: return status;
    }
  };

  const getGroupNames = (equipment: Equipment) => {
    const groupIds = (equipment as any).associated_group_ids || [];
    if (!groupIds || groupIds.length === 0) {
      return 'Aucun groupe';
    }
    const groupNames = groups
      .filter(group => groupIds.includes(group.id))
      .map(group => group.name);
    return groupNames.length > 0 ? groupNames.join(', ') : 'Aucun groupe';
  };

  const splitTextToFit = (text: string, maxWidth: number, fontSize: number) => {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Header
  if (exportOptions.showHeaders) {
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(exportOptions.title || 'Liste des équipements', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${(() => { const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}`, margin, yPosition);
    yPosition += 8;

    doc.setTextColor(0, 0, 0);
    doc.text(`Total: ${equipments.length} équipement${equipments.length > 1 ? 's' : ''}`, margin, yPosition);
    yPosition += 15;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  }

  // Content
  if (exportOptions.format === 'list') {
    renderListFormat();
  } else {
    renderGridFormat();
  }

  function renderListFormat() {
    // Headers
    const headers = ['Nom'];
    const columnWidths = [40];
    let xPos = margin;

    if (exportOptions.includeDetails) {
      headers.push('Modèle', 'Fabricant');
      columnWidths.push(30, 30);
    }
    if (exportOptions.includeSupplier) {
      headers.push('Fournisseur');
      columnWidths.push(25);
    }
    if (exportOptions.includeSerialNumber) {
      headers.push('N° série');
      columnWidths.push(25);
    }
    if (exportOptions.includeLocation) {
      headers.push('Localisation');
      columnWidths.push(40);
    }
    headers.push('Statut');
    columnWidths.push(20);
    
    if (exportOptions.includeLoanStatus) {
      headers.push('En prêt');
      columnWidths.push(15);
    }

    if (exportOptions.includeHealth) {
      headers.push('Santé');
      columnWidths.push(15);
    }
    if (exportOptions.includeGroups) {
      headers.push('Groupes');
      columnWidths.push(30);
    }

    // Adjust column widths to fit page
    const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
    const adjustedWidths = columnWidths.map(w => (w / totalWidth) * contentWidth);

    // Draw headers
    checkNewPage(20);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 8, contentWidth, 10, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    xPos = margin;
    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPosition - 2);
      xPos += adjustedWidths[index];
    });
    yPosition += 5;

    // Draw equipment rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    equipments.forEach((equipment) => {
      checkNewPage(10);
      
      let colIndex = 0;
      xPos = margin;

      // Name
      const nameText = splitTextToFit(equipment.name, adjustedWidths[colIndex] - 4, 8);
      doc.text(nameText[0] || equipment.name, xPos + 2, yPosition + 6);
      xPos += adjustedWidths[colIndex++];

      if (exportOptions.includeDetails) {
        // Model
        doc.text(equipment.model || '', xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
        
        // Manufacturer
        doc.text(equipment.manufacturer || '', xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      if (exportOptions.includeSupplier) {
        doc.text(equipment.supplier || '', xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      if (exportOptions.includeSerialNumber) {
        doc.text(equipment.serial_number || '', xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      if (exportOptions.includeLocation) {
        const location = `${getBuildingName(equipment.building_id)} - ${getServiceName(equipment.service_id)}`;
        const locationText = splitTextToFit(location, adjustedWidths[colIndex] - 4, 8);
        doc.text(locationText[0] || location, xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      // Status
      doc.text(getStatusText(equipment.status), xPos + 2, yPosition + 6);
      xPos += adjustedWidths[colIndex++];

      // Loan Status
      if (exportOptions.includeLoanStatus) {
        doc.text(equipment.loan_status ? 'Oui' : 'Non', xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      if (exportOptions.includeHealth && equipment.health_percentage !== null) {
        doc.text(`${equipment.health_percentage}%`, xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      if (exportOptions.includeGroups) {
        const groupText = splitTextToFit(getGroupNames(equipment), adjustedWidths[colIndex] - 4, 8);
        doc.text(groupText[0] || getGroupNames(equipment), xPos + 2, yPosition + 6);
        xPos += adjustedWidths[colIndex++];
      }

      yPosition += 10;
    });
  }

  function renderGridFormat() {
    const cardsPerRow = exportOptions.gridSize === 'small' ? 3 : 
                       exportOptions.gridSize === 'large' ? 1 : 2;
    const cardWidth = (contentWidth - (cardsPerRow - 1) * 10) / cardsPerRow;
    const cardHeight = 80;

    let currentRow = 0;
    let currentCol = 0;

    equipments.forEach((equipment) => {
      if (currentCol === 0) {
        checkNewPage(cardHeight + 10);
      }

      const xPos = margin + currentCol * (cardWidth + 10);
      const cardYStart = yPosition;

      // Card border
      doc.setDrawColor(200, 200, 200);
      doc.rect(xPos, cardYStart, cardWidth, cardHeight);

      // Equipment name
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      const nameText = splitTextToFit(equipment.name, cardWidth - 10, 10);
      doc.text(nameText[0] || equipment.name, xPos + 5, cardYStart + 12);

      // Content
      let cardY = cardYStart + 20;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);

      // Status
      doc.text(`Statut: ${getStatusText(equipment.status)}`, xPos + 5, cardY);
      cardY += 6;

      if (exportOptions.includeDetails && equipment.model) {
        doc.text(`Modèle: ${equipment.model}`, xPos + 5, cardY);
        cardY += 6;
      }

      if (exportOptions.includeLocation) {
        const location = `${getBuildingName(equipment.building_id)}`;
        const locationText = splitTextToFit(location, cardWidth - 10, 8);
        doc.text(`Lieu: ${locationText[0] || location}`, xPos + 5, cardY);
        cardY += 6;
      }

      if (exportOptions.includeHealth && equipment.health_percentage !== null) {
        doc.text(`Santé: ${equipment.health_percentage}%`, xPos + 5, cardY);
        cardY += 6;
      }

      if (exportOptions.includeGroups) {
        const groupText = splitTextToFit(getGroupNames(equipment), cardWidth - 10, 8);
        doc.text(`Groupes: ${groupText[0] || getGroupNames(equipment)}`, xPos + 5, cardY);
        cardY += 6;
      }

      // Move to next position
      currentCol++;
      if (currentCol >= cardsPerRow) {
        currentCol = 0;
        currentRow++;
        yPosition += cardHeight + 10;
      }
    });

    if (currentCol > 0) {
      yPosition += cardHeight + 10;
    }
  }

  // Footer
  if (exportOptions.showFooters) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin - 20, pageHeight - 5);
      doc.text(`${exportOptions.title || 'Liste des équipements'}`, margin, pageHeight - 5);
    }
  }

  // Save
  const fileName = `equipements_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
