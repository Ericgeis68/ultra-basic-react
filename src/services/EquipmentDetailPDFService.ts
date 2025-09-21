import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface EquipmentDetailPDFOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
  quality?: number;
  scale?: number;
  includeQRCode?: boolean;
  includeActions?: boolean;
}

export class EquipmentDetailPDFService {
  /**
   * Exporter la fiche d'équipement complète en PDF
   */
  static async exportEquipmentDetailToPDF(
    elementId: string,
    options: EquipmentDetailPDFOptions = {}
  ): Promise<void> {
    try {
      const {
        orientation = 'portrait',
        format = 'a4',
        quality = 0.98,
        scale = 2,
        filename,
        title = 'Fiche Équipement'
      } = options;

      // Trouver l'élément à exporter
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Élément avec l'ID ${elementId} non trouvé`);
      }

      // Préparer l'élément pour l'export
      const originalOverflow = element.style.overflow;
      element.style.overflow = 'visible';

      // Masquer les éléments non imprimables
      const nonPrintElements = element.querySelectorAll('.no-print');
      const originalDisplays: string[] = [];
      nonPrintElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        originalDisplays[index] = htmlEl.style.display;
        htmlEl.style.display = 'none';
      });

      // (Pas de rasterisation de badges)

      // Créer le canvas avec html2canvas
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Appliquer des styles spécifiques pour l'export
          const printStyles = `
            * { 
              box-sizing: border-box !important; 
              -webkit-print-color-adjust: exact !important; 
              color-adjust: exact !important; 
            }
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background: white !important; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            /* Espacement fiable entre l'en-tête et l'image pour éviter tout chevauchement */
            .equipment-header { 
              margin-bottom: 16px !important; 
              position: relative !important; 
              z-index: 1 !important;
            }
            .equipment-header .equipment-title {
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: clip !important;
              display: inline !important;
            }
            .equipment-image-container { margin-top: 8px !important; }
            /* Forcer l'image à garder ses proportions naturelles */
            img { 
              object-fit: contain !important; 
              max-width: 100% !important; 
              max-height: 100% !important; 
              width: auto !important; 
              height: auto !important; 
            }
            /* Centrer l'image dans son cadre */
            .equipment-image-container [data-radix-aspect-ratio-wrapper] {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .equipment-image-container img {
              margin: 0 auto !important;
              display: block !important;
            }
          `;
          const styleSheet = clonedDoc.createElement('style');
          styleSheet.textContent = printStyles;
          clonedDoc.head.appendChild(styleSheet);
        },
      });

      // Restaurer les éléments masqués
      nonPrintElements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplays[index];
      });
      element.style.overflow = originalOverflow;

      // (Rien à restaurer)

      // Créer le PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png', quality);

      // Calculer les dimensions pour ajuster l'image au PDF
      const PX_TO_MM = 0.264583; // 96 DPI → mm
      const canvasWidthMm = canvas.width * PX_TO_MM;
      const canvasHeightMm = canvas.height * PX_TO_MM;

      // Ajuster à la page en conservant le ratio
      const fitRatio = Math.min(
        (pageWidth - 20) / canvasWidthMm, // 10mm de marge de chaque côté
        (pageHeight - 20) / canvasHeightMm // 10mm de marge en haut et en bas
      );
      
      const renderWidth = canvasWidthMm * fitRatio;
      const renderHeight = canvasHeightMm * fitRatio;

      // Centrer sur la page
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

      // Télécharger le PDF
      const finalFilename = filename || `fiche_equipement_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(finalFilename);

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      throw new Error('Impossible de générer le PDF de la fiche équipement');
    }
  }

  /**
   * Préparer l'élément pour l'export (masquer les éléments non nécessaires)
   */
  static prepareElementForExport(element: HTMLElement): () => void {
    const elementsToHide = [
      '.no-print',
      '[data-radix-popper-content-wrapper]',
      '[data-radix-portal]',
      '.tooltip',
      '.popover'
    ];

    const hiddenElements: { element: HTMLElement; originalDisplay: string }[] = [];

    elementsToHide.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        hiddenElements.push({
          element: htmlEl,
          originalDisplay: htmlEl.style.display
        });
        htmlEl.style.display = 'none';
      });
    });

    // Retourner une fonction de nettoyage
    return () => {
      hiddenElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay;
      });
    };
  }

  /**
   * Vérifier si le service est disponible
   */
  static isAvailable(): boolean {
    return typeof html2canvas === 'function' && typeof jsPDF === 'function';
  }
}