import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EquipmentGroupRelation {
  equipment_id: string;
  group_id: string;
  created_at: string;
}

export const useEquipmentGroupRelations = () => {
  const [relations, setRelations] = useState<EquipmentGroupRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment_group_members')
        .select('*');
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setRelations(data || []);
    } catch (err) {
      setError('Failed to fetch equipment group relations');
    } finally {
      setLoading(false);
    }
  };

  const addRelation = async (equipmentId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('equipment_group_members')
        .insert({ equipment_id: equipmentId, group_id: groupId });
      
      if (error) throw error;
      await fetchRelations();
    } catch (err) {
      setError('Failed to add relation');
    }
  };

  const removeRelation = async (equipmentId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('equipment_group_members')
        .delete()
        .eq('equipment_id', equipmentId)
        .eq('group_id', groupId);
      
      if (error) throw error;
      await fetchRelations();
    } catch (err) {
      setError('Failed to remove relation');
    }
  };

  const getGroupsForEquipment = (equipmentId: string) => {
    return relations
      .filter(rel => rel.equipment_id === equipmentId)
      .map(rel => rel.group_id);
  };

  const addEquipmentToGroup = addRelation;
  const removeEquipmentFromGroup = removeRelation;

  useEffect(() => {
    fetchRelations();
  }, []);

  return {
    relations,
    loading,
    error,
    addRelation,
    removeRelation,
    getGroupsForEquipment,
    addEquipmentToGroup,
    removeEquipmentFromGroup,
    refresh: fetchRelations,
  };
};
