// @ts-nocheck
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wrench, CalendarClock, Calendar, FileText, Loader2 } from 'lucide-react';
import EquipmentDocumentsSection from './EquipmentDocumentsSection';
import MaintenanceFormModal from '@/components/maintenance/MaintenanceFormModal';
import { Document } from '@/types/document';
import { Equipment } from '@/types/equipment';

interface EquipmentActionsTabProps {
  onCreateIntervention: () => void;
  checkingOngoingIntervention: boolean;
  showDocuments: boolean;
  onToggleDocuments: (show: boolean) => void;
  documentsLoading: boolean;
  documentsError: Error | null;
  equipmentDocuments: Document[];
  equipment: Equipment | null;
  currentUser?: any;
  autoOpenMaintenance?: boolean;
}

const EquipmentActionsTab: React.FC<EquipmentActionsTabProps> = ({
  onCreateIntervention,
  checkingOngoingIntervention,
  showDocuments,
  onToggleDocuments,
  documentsLoading,
  documentsError,
  equipmentDocuments,
  equipment,
  currentUser,
  autoOpenMaintenance = false
}) => {
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const handleCreateMaintenance = () => {
    setIsMaintenanceModalOpen(true);
  };

  const handleMaintenanceSave = (maintenanceData: any) => {
    // Ici vous pouvez ajouter la logique pour sauvegarder la maintenance
    console.log('Maintenance data:', maintenanceData);
    // Vous pouvez appeler une API ou une fonction de sauvegarde ici
  };

  React.useEffect(() => {
    if (autoOpenMaintenance) {
      setIsMaintenanceModalOpen(true);
    }
  }, [autoOpenMaintenance]);

  return (
    <TabsContent value="actions" className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm gap-2"
          onClick={onCreateIntervention}
          disabled={checkingOngoingIntervention}
        >
          {checkingOngoingIntervention ? (
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
          ) : (
            <Wrench className="h-5 w-5 md:h-6 md:w-6" />
          )}
          <span>Créer une intervention</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm gap-2"
          onClick={handleCreateMaintenance}
        >
          <CalendarClock className="h-5 w-5 md:h-6 md:w-6" />
          <span>Programmer maintenance</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm gap-2"
        >
          <Calendar className="h-5 w-5 md:h-6 md:w-6" />
          <span>Consulter le planning</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm gap-2"
          onClick={() => onToggleDocuments(true)}
        >
          <FileText className="h-5 w-5 md:h-6 md:w-6" />
          <span>Documents techniques</span>
        </Button>
      </div>

      <EquipmentDocumentsSection
        showDocuments={showDocuments}
        onToggleDocuments={onToggleDocuments}
        documentsLoading={documentsLoading}
        documentsError={documentsError}
        equipmentDocuments={equipmentDocuments}
      />

      {/* Modal de maintenance pré-rempli */}
      <MaintenanceFormModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSave={handleMaintenanceSave}
        prefillEquipment={equipment ? {
          equipment_id: equipment.id,
          equipment_name: equipment.name
        } : undefined}
        currentUser={currentUser}
      />
    </TabsContent>
  );
};

export default EquipmentActionsTab;
