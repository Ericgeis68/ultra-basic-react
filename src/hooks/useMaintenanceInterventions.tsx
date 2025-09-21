import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceIntervention {
  maintenance_id: string;
  intervention_id: string;
  intervention_status: string;
}

export function useMaintenanceInterventions(maintenanceIds: string[]) {
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInterventions = useCallback(async () => {
    if (maintenanceIds.length === 0) {
      setInterventions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('id, maintenance_id, status')
        .in('maintenance_id', maintenanceIds)
        .neq('status', 'completed');

      if (error) throw error;

      const mapped = data.map(item => ({
        maintenance_id: item.maintenance_id!,
        intervention_id: item.id,
        intervention_status: item.status!
      }));

      setInterventions(mapped);
    } catch (error) {
      console.error('Error fetching maintenance interventions:', error);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  }, [maintenanceIds]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const hasIntervention = useCallback((maintenanceId: string) => {
    return interventions.some(i => i.maintenance_id === maintenanceId);
  }, [interventions]);

  const getIntervention = useCallback((maintenanceId: string) => {
    return interventions.find(i => i.maintenance_id === maintenanceId);
  }, [interventions]);

  return {
    interventions,
    loading,
    hasIntervention,
    getIntervention,
    refetch: fetchInterventions
  };
}