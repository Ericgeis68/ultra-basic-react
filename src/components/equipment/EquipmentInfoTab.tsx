import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Equipment } from '@/types/equipment';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { EquipmentGroup } from '@/types/equipmentGroup';
import EquipmentInfoGroups from './EquipmentInfoGroups';
import EquipmentQRCodeSection from './EquipmentQRCodeSection';
import EquipmentActionsButtons from './EquipmentActionsButtons';

interface EquipmentInfoTabProps {
  equipment: Equipment;
  buildings: Building[];
  services: Service[];
  locations: Location[];
  equipmentGroups: EquipmentGroup[];
  loading: boolean;
  error: any;
  showQrCode: boolean;
  isMobile: boolean;
  onToggleQrCode: () => void;
  onPrintQRCode: () => void;
  onDownloadQRCode: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetCurrentTab: (tab: string) => void;
}

const EquipmentInfoTab: React.FC<EquipmentInfoTabProps> = ({
  equipment,
  buildings,
  services,
  locations,
  equipmentGroups,
  loading,
  error,
  showQrCode,
  isMobile,
  onToggleQrCode,
  onPrintQRCode,
  onDownloadQRCode,
  onEdit,
  onDelete,
  onSetCurrentTab
}) => {
  return (
    <TabsContent value="info" className="mt-4 space-y-4">
      <EquipmentInfoGroups
        equipment={equipment}
        buildings={buildings}
        services={services}
        locations={locations}
        equipmentGroups={equipmentGroups}
      />

      <EquipmentQRCodeSection
        equipment={equipment}
        showQrCode={showQrCode}
        onToggleQrCode={onToggleQrCode}
        onPrint={onPrintQRCode}
        onDownload={onDownloadQRCode}
      />

      <EquipmentActionsButtons
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateIntervention={() => onSetCurrentTab('actions')}
        isMobile={isMobile}
        showCreateIntervention={true}
      />
    </TabsContent>
  );
};

export default EquipmentInfoTab;
