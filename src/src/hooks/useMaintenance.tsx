import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InterventionFormData } from '@/types/intervention'; // Assuming this type is defined or will be defined

export type MaintenanceTask = {
  id: string;
  title: string;
  description?: string;
  type: 'preventive' | 'corrective' | 'regulatory' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  next_due_date: string; // ISO date string
  last_completed_date?: string; // ISO date string
  equipment_id?: string;
  equipment_name?: string;
  assigned_technicians?: string[]; // Array of user IDs
  created_at: string;
  updated_at?: string;
  frequency_type?: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  frequency_value?: number;
  estimated_duration?: number;
  custom_frequency_pattern?: string;
  notification_enabled?: boolean;
  notification_time_before_value?: number;
  notification_time_before_unit?: 'hours' | 'days' | 'weeks';
};

export function useMaintenance() {
  const [maintenances, setMaintenances] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMaintenances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      // Fetch equipment names for display
      const equipmentIds = [...new Set(data.map(m => m.equipment_id).filter(Boolean))] as string[];
      const { data: equipmentsData, error: equipmentError } = await supabase
        .from('equipments')
        .select('id, name')
        .in('id', equipmentIds);

      if (equipmentError) throw equipmentError;

      const equipmentMap = new Map(equipmentsData.map(eq => [eq.id, eq.name]));

      const typedMaintenances: MaintenanceTask[] = data.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || undefined,
        type: m.type as 'preventive' | 'corrective' | 'regulatory' | 'improvement',
        priority: m.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: m.status as 'scheduled' | 'in-progress' | 'completed' | 'overdue',
        next_due_date: m.next_due_date,
        last_completed_date: m.last_completed_date || undefined,
        equipment_id: m.equipment_id || undefined,
        equipment_name: m.equipment_id ? equipmentMap.get(m.equipment_id) : undefined,
        assigned_technicians: m.assigned_technicians || undefined,
        created_at: m.created_at,
        updated_at: m.updated_at || undefined,
        frequency_type: m.frequency_type as 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | undefined,
        frequency_value: m.frequency_value || undefined,
        notification_enabled: m.notification_enabled ?? false,
        notification_time_before_value: m.notification_time_before_value || 1,
        notification_time_before_unit: (m.notification_time_before_unit as 'hours' | 'days' | 'weeks') || 'days',
        // estimated_duration: m.estimated_duration || undefined, // REMOVED
      }));

      setMaintenances(typedMaintenances);
    } catch (err) {
      console.error("Error fetching maintenances:", err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching maintenances'));
      toast({
        title: "Erreur",
        description: "Impossible de charger les maintenances.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  const addMaintenance = async (newMaintenance: Omit<MaintenanceTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .insert({
          ...newMaintenance,
          created_at: new Date().toISOString(),
          // estimated_duration: newMaintenance.estimated_duration || null, // REMOVED
        })
        .select()
        .single();

      if (error) throw error;
      toast({
        title: "Maintenance créée",
        description: "La nouvelle maintenance a été ajoutée avec succès.",
      });
      fetchMaintenances(); // Refetch to update the list
      return data;
    } catch (err) {
      console.error("Error adding maintenance:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la maintenance.",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateMaintenance = async (id: string, updatedFields: Partial<Omit<MaintenanceTask, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
          // estimated_duration: updatedFields.estimated_duration === undefined ? undefined : updatedFields.estimated_duration || null, // REMOVED
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({
        title: "Maintenance mise à jour",
        description: "La maintenance a été modifiée avec succès.",
      });
      fetchMaintenances(); // Refetch to update the list
      return data;
    } catch (err) {
      console.error("Error updating maintenance:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la maintenance.",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteMaintenance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Maintenance supprimée",
        description: "La maintenance a été supprimée avec succès.",
      });
      fetchMaintenances(); // Refetch to update the list
    } catch (err) {
      console.error("Error deleting maintenance:", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la maintenance.",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Function to find or create intervention from maintenance task
  const findOrCreateInterventionFromMaintenance = async (maintenanceId: string, interventionData: InterventionFormData) => {
    try {
      // First check if an intervention already exists for this maintenance
      const { data: existingIntervention, error: searchError } = await supabase
        .from('interventions')
        .select('*')
        .eq('maintenance_id', maintenanceId)
        .neq('status', 'completed')
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingIntervention) {
        // Update the existing intervention with new data instead of just returning it
        const { data: updatedIntervention, error: updateError } = await supabase
          .from('interventions')
          .update({
            ...interventionData,
            maintenance_id: maintenanceId,
            parts: interventionData.parts || null,
            technician_history: interventionData.technician_history || null,
            status: interventionData.status || 'in-progress',
          })
          .eq('id', existingIntervention.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        toast({
          title: "Intervention mise à jour",
          description: "L'intervention a été mise à jour avec succès.",
        });
        return updatedIntervention;
      }

      // Create new intervention if none exists
      const { data, error } = await supabase
        .from('interventions')
        .insert({
          ...interventionData,
          maintenance_id: maintenanceId,
          created_at: new Date().toISOString(),
          parts: interventionData.parts || null,
          technician_history: interventionData.technician_history || null,
          status: interventionData.status || 'in-progress',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update maintenance status to 'in-progress'
      await updateMaintenance(maintenanceId, { status: 'in-progress' });

      toast({
        title: "Intervention créée",
        description: "L'intervention a été créée avec succès.",
      });
      return data;
    } catch (err) {
      console.error("Error creating intervention from maintenance:", err);
      toast({
        title: "Erreur",
        description: `Impossible de créer l'intervention: ${err.message}`,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Function to sync intervention status with maintenance
  const syncInterventionWithMaintenance = async (interventionId: string, status: string) => {
    try {
      // Get the intervention to find its maintenance_id
      const { data: intervention, error: getError } = await supabase
        .from('interventions')
        .select('maintenance_id')
        .eq('id', interventionId)
        .single();

      if (getError || !intervention.maintenance_id) {
        return; // No maintenance linked, nothing to sync
      }

      if (status === 'completed') {
        // If intervention is completed, update maintenance and mark as completed
        await updateMaintenance(intervention.maintenance_id, { 
          status: 'completed',
          last_completed_date: new Date().toISOString().split('T')[0]
        });
        
        toast({
          title: "Maintenance terminée",
          description: "La maintenance planifiée a été marquée comme terminée.",
        });
        
        // Optionally delete the maintenance if it's a one-time task
        // Or update next_due_date if it's recurring
        // This can be enhanced later based on frequency_type
      } else {
        // Sync other statuses
        const maintenanceStatus = status === 'in-progress' ? 'in-progress' : 'scheduled';
        await updateMaintenance(intervention.maintenance_id, { status: maintenanceStatus });
      }
    } catch (err) {
      console.error("Error syncing intervention with maintenance:", err);
    }
  };

  return {
    maintenances,
    loading,
    error,
    createMaintenance: addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    findOrCreateInterventionFromMaintenance,
    syncInterventionWithMaintenance,
    refetchMaintenances: fetchMaintenances,
  };
}
