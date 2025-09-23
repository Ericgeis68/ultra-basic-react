import { ExportOptions } from './PDFExportService';
import { HTML2PDFService } from './HTML2PDFService';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { InterventionUI } from '@/types/intervention';

export interface ElectronPrintOptions extends ExportOptions {
  // Options spécifiques à Electron
  printerName?: string;
  copies?: number;
  color?: boolean;
  duplex?: 'simplex' | 'long-edge' | 'short-edge';
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export class ElectronPrintService {
  private static isElectron(): boolean {
    return typeof window !== 'undefined' && (window as any).electronAPI;
  }

  private static getElectronAPI() {
    if (!this.isElectron()) {
      throw new Error('Electron API non disponible');
    }
    return (window as any).electronAPI;
  }

  /**
   * Imprimer directement via Electron
   */
  static async print(elementId: string, options: ElectronPrintOptions = {}): Promise<boolean> {
    if (!this.isElectron()) {
      console.warn('Electron non disponible, fallback vers impression navigateur');
      return this.fallbackPrint(elementId, options);
    }

    try {
      const electronAPI = this.getElectronAPI();
      
      // Préparer les options d'impression
      const printOptions = {
        orientation: options.orientation || 'portrait',
        pageSize: options.pageSize || 'a4',
        title: options.title || 'Document',
        showHeaders: options.showHeaders !== false,
        showFooters: options.showFooters !== false,
        printerName: options.printerName,
        copies: options.copies || 1,
        color: options.color !== false,
        duplex: options.duplex || 'simplex'
      };

      const result = await electronAPI.printContent(printOptions);
      
      if (result.success) {
        console.log('Impression réussie');
        return true;
      } else {
        console.error('Erreur d\'impression:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression Electron:', error);
      return this.fallbackPrint(elementId, options);
    }
  }

  /**
   * Exporter en PDF via React PDF Service
   */
  static async exportPDF(
    elementId: string, 
    options: ElectronPrintOptions = {},
    data?: {
      equipments?: Equipment[];
      groups?: EquipmentGroup[];
      buildings?: Building[];
      services?: Service[];
      locations?: Location[];
      interventions?: InterventionUI[];
    }
  ): Promise<string | null> {
    try {
      // Utiliser HTML2PDF Service pour la génération
      if (HTML2PDFService.isAvailable()) {
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Élément à exporter non trouvé');
        }

        const filename = `${options.title || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
        const formatValue = options.pageSize === 'custom' ? 'a4' : options.pageSize;
        
        await HTML2PDFService.downloadPDF(element, {
          filename,
          orientation: options.orientation,
          format: formatValue,
          title: options.title
        });
        
        return filename;
      }

      // Fallback vers Electron si disponible
      if (this.isElectron()) {
        const electronAPI = this.getElectronAPI();
        
        const pdfOptions = {
          orientation: options.orientation || 'portrait',
          pageSize: options.pageSize || 'a4',
          title: options.title || 'Document',
          showHeaders: options.showHeaders !== false,
          showFooters: options.showFooters !== false
        };

        const result = await electronAPI.printToPDF(pdfOptions);
        
        if (result.success) {
          console.log('PDF exporté avec succès:', result.filePath);
          return result.filePath;
        } else if (result.canceled) {
          console.log('Export PDF annulé par l\'utilisateur');
          return null;
        } else {
          console.error('Erreur d\'export PDF:', result.error);
          return null;
        }
      }

      // Fallback vers l'ancien système
      return this.fallbackExportPDF(elementId, options);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      return this.fallbackExportPDF(elementId, options);
    }
  }

  /**
   * Récupérer la liste des imprimantes disponibles
   */
  static async getPrinters(): Promise<PrinterInfo[]> {
    if (!this.isElectron()) {
      return [];
    }

    try {
      const electronAPI = this.getElectronAPI();
      const result = await electronAPI.getPrinters();
      
      if (result.success) {
        return result.printers.map((printer: any) => ({
          name: printer.name,
          displayName: printer.displayName || printer.name,
          description: printer.description || '',
          status: printer.status || 0,
          isDefault: printer.isDefault || false
        }));
      } else {
        console.error('Erreur lors de la récupération des imprimantes:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes:', error);
      return [];
    }
  }

  /**
   * Vérifier si l'application fonctionne dans Electron
   */
  static isRunningInElectron(): boolean {
    return this.isElectron();
  }

  /**
   * Obtenir les informations de la plateforme
   */
  static getPlatformInfo() {
    if (!this.isElectron()) {
      return {
        platform: 'web',
        isElectron: false,
        isDesktop: false
      };
    }

    const electronAPI = this.getElectronAPI();
    return {
      platform: electronAPI.platform || 'unknown',
      isElectron: true,
      isDesktop: true
    };
  }

  /**
   * Fallback vers l'impression navigateur standard
   */
  private static async fallbackPrint(elementId: string, options: ElectronPrintOptions): Promise<boolean> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Élément avec l'ID ${elementId} non trouvé`);
      }

      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir une nouvelle fenêtre');
      }

      // Copier le contenu et les styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.title || 'Document'}</title>
          <style>
            @page {
              size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
              margin: 1cm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
            }
            .print-content {
              width: 100%;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'impression fallback:', error);
      return false;
    }
  }

  /**
   * Fallback vers l'export PDF navigateur
   */
  private static async fallbackExportPDF(elementId: string, options: ElectronPrintOptions): Promise<string | null> {
    try {
      // Utiliser html2pdf.js ou une alternative pour l'export PDF
      console.warn('Export PDF fallback non implémenté');
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'export PDF fallback:', error);
      return null;
    }
  }
}
