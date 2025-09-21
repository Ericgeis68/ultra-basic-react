import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Equipment, EquipmentStatus, EquipmentRelationship } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment | null) => void;
  selectedEquipmentId?: string | null;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  onSelect,
  selectedEquipmentId
}) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Ensure proper typing of the data
      const typedEquipments: Equipment[] = (data || []).map(item => ({
        ...item,
        status: item.status as EquipmentStatus,
        relationships: (item.relationships as unknown as EquipmentRelationship[]) || [],
        equipment_group_ids: [],
        associated_group_ids: []
      }));
      
      setEquipments(typedEquipments);
    } catch (error) {
      console.error('Error fetching equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onSelect(null);
    } else {
      const equipment = equipments.find(eq => eq.id === value);
      onSelect(equipment || null);
    }
  };

  return (
    <Select 
      value={selectedEquipmentId || 'none'} 
      onValueChange={handleValueChange}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un équipement"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun équipement</SelectItem>
        {equipments.map(equipment => (
          <SelectItem key={equipment.id} value={equipment.id}>
            {equipment.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EquipmentSelector;
