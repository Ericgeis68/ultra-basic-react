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
  fadingIds?: Set<string>;
}

const EquipmentGridView: React.FC<EquipmentGridViewProps> = ({ 
  equipments, 
  groups, 
  buildings = [],
  services = [],
  locations = [],
  onEquipmentClick,
  fadingIds 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {equipments.map((equipment) => (
        <div key={equipment.id} className={fadingIds?.has(equipment.id) ? 'transition-opacity duration-300 opacity-0' : ''}>
          <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          groups={groups}
          buildings={buildings}
          services={services}
          locations={locations}
          onClick={onEquipmentClick}
          />
        </div>
      ))}
    </div>
  );
};

export default EquipmentGridView;
