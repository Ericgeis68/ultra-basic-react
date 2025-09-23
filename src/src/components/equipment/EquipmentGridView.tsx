import React from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import EquipmentCard from './EquipmentCard';

interface EquipmentGridViewProps {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  onEquipmentClick: (equipment: Equipment) => void;
}

const EquipmentGridView: React.FC<EquipmentGridViewProps> = ({ 
  equipments, 
  groups, 
  buildings = [],
  services = [],
  locations = [],
  onEquipmentClick 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {equipments.map((equipment) => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          groups={groups}
          buildings={buildings}
          services={services}
          locations={locations}
          onClick={onEquipmentClick}
        />
      ))}
    </div>
  );
};

export default EquipmentGridView;
