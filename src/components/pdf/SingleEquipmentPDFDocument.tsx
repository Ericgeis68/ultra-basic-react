import React from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { ExportOptions } from '@/services/PDFExportService';

interface SingleEquipmentPDFDocumentProps {
  equipment: Equipment;
  groups?: EquipmentGroup[];
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  options?: ExportOptions;
}

// Temporarily disabled PDF component - @react-pdf/renderer not available
const SingleEquipmentPDFDocument: React.FC<SingleEquipmentPDFDocumentProps> = () => {
  return <div>PDF functionality disabled</div>;
};

export default SingleEquipmentPDFDocument;
