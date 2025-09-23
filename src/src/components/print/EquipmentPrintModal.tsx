import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import EquipmentPrintPreview from './EquipmentPrintPreview';
import EquipmentPrintConfigPanel from './EquipmentPrintConfigPanel';
import { useSmartPrint } from '@/hooks/useSmartPrint';

interface EquipmentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
}

const EquipmentPrintModal: React.FC<EquipmentPrintModalProps> = ({
  isOpen,
  onClose,
  equipments,
  groups,
  buildings,
  services,
  locations
}) => {
  const { exportOptions, handleDirectExport, isExporting, updateExportOptions } = useSmartPrint();

  const handleExport = () => {
    handleDirectExport('equipment-print-content');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>Aperçu PDF - Équipements</span>
              <span className="text-sm font-normal text-muted-foreground">
                Système d'optimisation automatique de disposition
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Export...' : 'Télécharger PDF'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose} className="md:hidden">
                Fermer
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="hidden md:inline-flex">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Panneau de configuration */}
          <EquipmentPrintConfigPanel
            options={exportOptions}
            onOptionsChange={updateExportOptions}
          />
          
          {/* Aperçu */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50">
            <div className="bg-white shadow-sm border">
              <div 
                id="equipment-print-content"
                key={JSON.stringify(exportOptions)} // Force re-render when options change
              >
                <EquipmentPrintPreview
                  equipments={equipments}
                  groups={groups}
                  buildings={buildings}
                  services={services}
                  locations={locations}
                  options={exportOptions}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Bouton fermer persistant en bas sur mobile */}
        <div className="md:hidden sticky bottom-0 bg-background border-t p-3">
          <Button onClick={onClose} className="w-full">Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentPrintModal;