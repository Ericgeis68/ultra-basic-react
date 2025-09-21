import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wrench, CalendarClock, Calendar, FileText, Loader2 } from 'lucide-react';
import EquipmentDocumentsSection from './EquipmentDocumentsSection';
import { Document } from '@/types/document';

interface EquipmentActionsTabProps {
  onCreateIntervention: () => void;
  checkingOngoingIntervention: boolean;
  showDocuments: boolean;
  onToggleDocuments: (show: boolean) => void;
  documentsLoading: boolean;
  documentsError: Error | null;
  equipmentDocuments: Document[];
}

const EquipmentActionsTab: React.FC<EquipmentActionsTabProps> = ({
  onCreateIntervention,
  checkingOngoingIntervention,
  showDocuments,
  onToggleDocuments,
  documentsLoading,
  documentsError,
  equipmentDocuments
}) => {
  return (
    <TabsContent value="actions" className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm"
          onClick={onCreateIntervention}
          disabled={checkingOngoingIntervention}
        >
          {checkingOngoingIntervention ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 mb-1 animate-spin" />
          ) : (
            <Wrench className="h-4 w-4 md:h-5 md:w-5 mb-1" />
          )}
          <span>Créer une intervention</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm"
        >
          <CalendarClock className="h-4 w-4 md:h-5 md:w-5 mb-1" />
          <span>Programmer maintenance</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm"
        >
          <Calendar className="h-4 w-4 md:h-5 md:w-5 mb-1" />
          <span>Consulter le planning</span>
        </Button>
        <Button
          variant="outline"
          className="h-16 md:h-20 flex flex-col items-center justify-center text-xs md:text-sm"
          onClick={() => onToggleDocuments(true)}
        >
          <FileText className="h-4 w-4 md:h-5 md:w-5 mb-1" />
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
    </TabsContent>
  );
};

export default EquipmentActionsTab;
