import { useState, useEffect } from 'react';
import { PDFExportService, ExportOptions } from '@/services/PDFExportService';
import { ElectronPrintService, ElectronPrintOptions } from '@/services/ElectronPrintService';
import { HTML2PDFService } from '@/services/HTML2PDFService';
import { useToast } from '@/hooks/use-toast';

export function useSmartPrint() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    title: 'Liste des équipements',
    orientation: 'portrait',
    includeImages: true,
    includeDetails: true,
    includeHistory: true, // Activé par défaut
    includeHealth: true,
    includeGroups: true,
    includeLocation: true,
    includeSupplier: true,
    includeInventoryNumber: true,
    includeSerialNumber: true,
    includeDescription: false,
    includeUF: true,
    includePurchaseDate: true,
    includeDateMiseEnService: true,
    includeWarranty: true,
    includeManufacturer: true,
    includeModel: true,
    includeTagNumber: false,
    includeBuilding: true,
    includeService: true,
    includeStatus: true,
    includeLoanStatus: true,
    includeRelationships: false,
    format: 'grid',
    pageSize: 'a4',
    customPageWidth: 210,
    customPageHeight: 297,
    fontSize: 'medium',
    gridSize: 'medium',
    itemsPerPage: 9,
    showHeaders: true,
    showFooters: true,
    previewScale: 'auto',
  });
  const { toast } = useToast();

  // Détecter Electron au chargement
  useEffect(() => {
    const checkElectron = () => {
      const electronAvailable = ElectronPrintService.isRunningInElectron();
      setIsElectron(electronAvailable);
      
      if (electronAvailable) {
        // Charger la liste des imprimantes disponibles
        ElectronPrintService.getPrinters().then(printers => {
          setAvailablePrinters(printers);
        }).catch(error => {
          console.warn('Impossible de charger les imprimantes:', error);
        });
      }
    };

    checkElectron();
  }, []);

  const openExportPreview = () => {
    setExportPreviewOpen(true);
  };

  const closeExportPreview = () => {
    setExportPreviewOpen(false);
  };

  const updateExportOptions = (newOptions: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...newOptions }));
  };

  const handleDirectExport = async (elementId: string): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: "Erreur",
        description: "Élément à exporter non trouvé",
        variant: "destructive"
      });
      return null;
    }

    setIsExporting(true);
    try {
      const filename = `${exportOptions.title || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await PDFExportService.downloadPDF(element, {
        ...exportOptions,
        filename
      });
      
      toast({
        title: "PDF exporté",
        description: `Fichier téléchargé: ${filename}`
      });
      
      return filename;
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export PDF",
        description: error.message || "Impossible d'exporter le PDF",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExporting(false);
      setExportPreviewOpen(false);
    }
  };

  const handleExportPDF = async (
    elementId: string, 
    data?: {
      equipments?: any[];
      groups?: any[];
      buildings?: any[];
      services?: any[];
      locations?: any[];
      interventions?: any[];
    }
  ): Promise<string | null> => {
    return handleDirectExport(elementId);
  };

  return {
    isExporting,
    exportPreviewOpen,
    exportOptions,
    openExportPreview,
    closeExportPreview,
    updateExportOptions,
    handleDirectExport,
    handleExportPDF,
    isElectron,
    availablePrinters,
    isDesktop: false,
    isMobile: true,
    // Compatibility
    isPrinting: isExporting,
    printPreviewOpen: exportPreviewOpen,
    printOptions: exportOptions,
    openPrintPreview: openExportPreview,
    closePrintPreview: closeExportPreview,
    updatePrintOptions: updateExportOptions,
    handlePrint: handleDirectExport,
  };
}