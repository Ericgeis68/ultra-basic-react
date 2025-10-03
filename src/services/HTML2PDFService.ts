import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter' | 'legal';
  quality?: number;
  scale?: number;
}

export class HTML2PDFService {
  /**
   * Générer un PDF à partir d'un élément HTML
   */
  static async generatePDF(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<Blob> {
    try {
      const {
        orientation = 'portrait',
        format = 'a4',
        quality = 0.98,
        scale = 3
      } = options;

      // Créer le PDF avec jsPDF dès le départ
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format,
        compress: true
      });

      const onclone = (clonedDoc: Document) => {
        const printStyles = `
          * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .print-preview { background: white !important; padding: 0 !important; }
          .print-content { background: white !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important; line-height: 1.4 !important; }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            /* CRITICAL: Allow content to overflow the page boundary during capture */
            overflow: visible !important; 
            position: relative !important; /* Ensure positioning context for children */
          }
          /* Ensure all children within a print-page also allow overflow and auto height */
          .print-page * {
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
          }
        `;
        const styleSheet = clonedDoc.createElement('style');
        styleSheet.textContent = printStyles;
        clonedDoc.head.appendChild(styleSheet);

        // Spécifique pour les wrappers de cartes d'équipement qui ont des styles inline
        // pour la hauteur fixe et l'overflow: hidden.
        // Nous ciblons les divs qui sont des enfants de la grille de cartes et qui ont ces styles.
        const cardWrappers = clonedDoc.querySelectorAll('.print-page > div > div > div[style*="height"][style*="overflow: hidden"]');
        cardWrappers.forEach(wrapper => {
          const el = wrapper as HTMLElement;
          el.style.overflow = 'visible';
          el.style.height = 'auto'; // Permettre à l'élément de prendre sa hauteur naturelle
          el.style.maxHeight = 'none';
          el.style.minHeight = 'auto';
        });
      };

      // Chercher les pages dédiées
      const pageNodes = element.querySelectorAll('.print-page');
      const pages = pageNodes.length ? Array.from(pageNodes) : [element];

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const rect = pageEl.getBoundingClientRect();
        const canvas = await html2canvas(pageEl, {
          scale: 3, // Haute résolution, poids raisonnable
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          // html2canvas devrait capturer la hauteur réelle après avoir rendu overflow: visible
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height), 
          scrollX: 0,
          scrollY: 0,
          removeContainer: true,
          imageTimeout: 0,
          onclone,
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgData = canvas.toDataURL('image/png', 1.0);

        // Convertir les dimensions du canvas (px) en mm
        const PX_TO_MM = 0.264583; // 96 DPI → mm
        const canvasWidthMm = canvas.width * PX_TO_MM;
        const canvasHeightMm = canvas.height * PX_TO_MM;

        // Conserver le ratio en s'ajustant à la page
        const fitRatio = Math.min(pageWidth / canvasWidthMm, pageHeight / canvasHeightMm);
        const renderWidth = canvasWidthMm * fitRatio;
        const renderHeight = canvasHeightMm * fitRatio;

        // Centrer pour éviter bande blanche asymétrique
        const offsetX = (pageWidth - renderWidth) / 2;
        const offsetY = (pageHeight - renderHeight) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Impossible de générer le PDF');
    }
  }

  /**
   * Télécharger un PDF généré
   */
  static async downloadPDF(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<void> {
    try {
      const blob = await this.generatePDF(element, options);
      const filename = options.filename || `${options.title || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      throw error;
    }
  }

  /**
   * Ouvrir un PDF dans un nouvel onglet
   */
  static async openPDFInNewTab(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<void> {
    try {
      const blob = await this.generatePDF(element, options);
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          URL.revokeObjectURL(url);
        };
      } else {
        console.warn('Impossible d\'ouvrir le PDF dans un nouvel onglet');
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du PDF:', error);
      throw error;
    }
  }

  /**
   * Vérifier si le service est disponible
   */
  static isAvailable(): boolean {
    return typeof html2canvas === 'function';
  }

  /**
   * Obtenir les informations sur le service
   */
  static getServiceInfo() {
    return {
      name: 'HTML2PDF Service',
      version: '1.0.0',
      available: this.isAvailable(),
      features: [
        'Capture d\'écran HTML',
        'Génération PDF multi-pages',
        'Support des images',
        'Haute qualité',
        'Export direct',
        'Ouverture dans nouvel onglet'
      ]
    };
  }
}
