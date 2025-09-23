import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GroupName {
  id: string;
  name: string;
}

export function useEquipmentGroupNames() {
  const [groupNames, setGroupNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupNames = async () => {
      try {
        const { data: groups, error } = await supabase
          .from('equipment_groups')
          .select('id, name');

        if (error) {
          console.error('Error fetching group names:', error);
          return;
        }

        const nameMap = new Map<string, string>();
        groups?.forEach((group) => {
          nameMap.set(group.id, group.name);
        });
        
        setGroupNames(nameMap);
      } catch (error) {
        console.error('Error fetching group names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupNames();
  }, []);

  const getGroupName = (groupId: string): string => {
    return groupNames.get(groupId) || `Groupe ${groupId.substring(0, 8)}...`;
  };

  return {
    groupNames,
    getGroupName,
    loading
  };
}
