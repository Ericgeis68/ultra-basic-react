import React from 'react';
import { Card } from '@/components/ui/card';
import { Equipment } from '@/types/equipment';
import EquipmentGroupManager from './EquipmentGroupManager';
import { Package } from 'lucide-react';

interface EquipmentGroupSectionProps {
  equipment: Equipment;
  onUpdate?: () => void;
}

const EquipmentGroupSection: React.FC<EquipmentGroupSectionProps> = ({ 
  equipment, 
  onUpdate 
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Gestion des groupes d'équipement</h3>
      </div>
      <EquipmentGroupManager equipment={equipment} onUpdate={onUpdate} />
    </Card>
  );
};

export default EquipmentGroupSection;
