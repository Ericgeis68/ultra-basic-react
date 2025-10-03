// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Intervention, UsedPart, TechnicianHistoryEntry } from '@/types/intervention';
import { Json } from '@/integrations/supabase/types';

/**
 * Hook to fetch interventions for a specific equipment
 * @param equipmentId - The ID of the equipment to fetch interventions for
 */
export function useInterventionsForEquipment(equipmentId: string | null) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInterventions = useCallback(async () => {
    if (!equipmentId) {
      setInterventions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching interventions for equipment: ${equipmentId}`);
      
      // Fetch interventions for this equipment
      const { data: interventionsData, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('scheduled_date', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching interventions:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${interventionsData?.length || 0} interventions for equipment ${equipmentId}`);

      // Fetch user data to get technician names from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      const userMap = new Map();
      if (usersData) {
        usersData.forEach(user => {
          userMap.set(user.id, user.full_name);
        });
      }
      
      // Convert the data to Intervention type with technician names
      const typedInterventions: Intervention[] = (interventionsData || []).map(item => {
        // Handle parts conversion from Json to UsedPart[] if needed
        let typedParts: UsedPart[] | null = null;
        if (item.parts && Array.isArray(item.parts)) {
          typedParts = item.parts.map(part => {
            if (typeof part === 'object' && part !== null) {
              return {
                name: (part as any).name || 'Unknown',
                quantity: (part as any).quantity || 0
              };
            }
            return { name: 'Unknown', quantity: 0 };
          });
        }

        // Handle technician history conversion
        let typedTechnicianHistory: TechnicianHistoryEntry[] | null = null;
        if (item.technician_history && Array.isArray(item.technician_history)) {
          typedTechnicianHistory = item.technician_history.map(entry => {
            if (typeof entry === 'object' && entry !== null) {
              const typedEntry = entry as any;
              return {
                technician_id: typedEntry.technician_id || '',
                technician_name: typedEntry.technician_name || userMap.get(typedEntry.technician_id) || 'Technicien inconnu',
                actions: typedEntry.actions || '',
                parts_used: Array.isArray(typedEntry.parts_used) ? typedEntry.parts_used : [],
                date_start: typedEntry.date_start || '',
                date_end: typedEntry.date_end
              };
            }
            return {
              technician_id: '',
              technician_name: 'Technicien inconnu',
              actions: '',
              parts_used: [],
              date_start: ''
            };
          });
        }

        // Convert technician IDs to names using the users table
        let technicianNames: string[] = [];
        if (item.technicians && Array.isArray(item.technicians)) {
          technicianNames = item.technicians.map(techId => 
            userMap.get(techId) || `ID: ${techId}`
          );
        }

        // Ensure type is properly cast to the expected union type
        const validType = ['preventive', 'corrective', 'improvement', 'regulatory'].includes(item.type) 
          ? item.type as 'preventive' | 'corrective' | 'improvement' | 'regulatory'
          : 'corrective' as const;

        // Ensure status is properly cast to the expected union type - removed 'planned' status
        const validStatus = ['in-progress', 'completed'].includes(item.status) 
          ? item.status as 'in-progress' | 'completed'
          : 'in-progress' as const;
        
        return {
          ...item,
          type: validType,
          status: validStatus,
          parts: typedParts,
          technicians: technicianNames, // Override with actual names
          technician_history: typedTechnicianHistory,
        };
      });
      
      setInterventions(typedInterventions);
    } catch (err) {
      console.error("Error fetching interventions for equipment:", err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching interventions'));
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  return {
    data: interventions,
    loading,
    error,
    refetch: fetchInterventions
  };
}
