import { useState } from 'react';
import { EquipmentDetailPDFService, EquipmentDetailPDFOptions } from '@/services/EquipmentDetailPDFService';
import { useToast } from '@/hooks/use-toast';

export function useEquipmentDetailPDF() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async (
    elementId: string,
    equipmentName: string,
    options: EquipmentDetailPDFOptions = {}
  ): Promise<void> => {
    if (!EquipmentDetailPDFService.isAvailable()) {
      toast({
        title: "Service indisponible",
        description: "L'export PDF n'est pas disponible sur cette plateforme.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const defaultOptions: EquipmentDetailPDFOptions = {
        title: `Fiche Équipement - ${equipmentName}`,
        filename: `fiche_${equipmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'portrait',
        format: 'a4',
        quality: 0.98,
        scale: 2,
        includeQRCode: true,
        includeActions: false,
        ...options
      };

      await EquipmentDetailPDFService.exportEquipmentDetailToPDF(elementId, defaultOptions);
      
      toast({
        title: "PDF exporté",
        description: `La fiche de ${equipmentName} a été téléchargée en PDF.`,
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: error.message || "Impossible d'exporter la fiche en PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    isExporting
  };
}