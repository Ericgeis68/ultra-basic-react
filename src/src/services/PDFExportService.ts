import { HTML2PDFService, PDFOptions } from './HTML2PDFService';

export interface ExportOptions {
  // Options PDF de base
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
  
  // Options spécifiques à l'export
  includeImages?: boolean;
  includeDetails?: boolean;
  includeHistory?: boolean;
  includeHealth?: boolean;
  includeGroups?: boolean;
  includeLocation?: boolean;
  includeSupplier?: boolean;
  includeInventoryNumber?: boolean;
  includeSerialNumber?: boolean;
  includeDescription?: boolean;
  includeUF?: boolean;
  includePurchaseDate?: boolean;
  includeDateMiseEnService?: boolean;
  includeWarranty?: boolean;
  includeManufacturer?: boolean;
  includeModel?: boolean;
  includeTagNumber?: boolean;
  includeBuilding?: boolean;
  includeService?: boolean;
  includeStatus?: boolean;
  includeLoanStatus?: boolean;
  includeRelationships?: boolean;
  format?: 'list' | 'grid' | 'cards';
  pageSize?: 'a4' | 'a3' | 'letter' | 'legal' | 'custom';
  customPageWidth?: number;
  customPageHeight?: number;
  fontSize?: 'small' | 'medium' | 'large';
  gridSize?: 'single' | 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
  itemsPerPage?: number;
  showHeaders?: boolean;
  showFooters?: boolean;
  previewScale?: 'auto' | 'small' | 'medium' | 'large';
  printerName?: string;
  // Personnalisation du titre
  titleFontSize?: 'small' | 'medium' | 'large';
  // Style d'impression
  printStyle?: 'professional' | 'classic' | 'minimal';
}

export class PDFExportService {
  /**
   * Exporter un élément HTML vers PDF
   */
  static async exportToPDF(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<Blob> {
    const pdfOptions: PDFOptions = {
      title: options.title,
      filename: options.filename,
      orientation: options.orientation,
      format: options.pageSize === 'custom' ? 'a4' : (options.pageSize as any),
      quality: 0.98,
      scale: 4 // Haute résolution
    };

    return await HTML2PDFService.generatePDF(element, pdfOptions);
  }

  /**
   * Télécharger un PDF
   */
  static async downloadPDF(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const pdfOptions: PDFOptions = {
      title: options.title,
      filename: options.filename || `${options.title || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: options.orientation,
      format: options.pageSize === 'custom' ? 'a4' : (options.pageSize as any),
      quality: 0.98,
      scale: 4 // Haute résolution
    };

    return await HTML2PDFService.downloadPDF(element, pdfOptions);
  }

  /**
   * Ouvrir un PDF dans un nouvel onglet
   */
  static async openPDFInNewTab(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const pdfOptions: PDFOptions = {
      title: options.title,
      filename: options.filename,
      orientation: options.orientation,
      format: options.pageSize === 'custom' ? 'a4' : (options.pageSize as any),
      quality: 0.98,
      scale: 4 // Haute résolution
    };

    return await HTML2PDFService.openPDFInNewTab(element, pdfOptions);
  }

  /**
   * Vérifier si le service est disponible
   */
  static isAvailable(): boolean {
    return HTML2PDFService.isAvailable();
  }
}