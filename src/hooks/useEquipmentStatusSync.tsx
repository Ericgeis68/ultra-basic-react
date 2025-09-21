import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EquipmentStatusSyncState {
  isDialogOpen: boolean;
  equipmentId: string | null;
  equipmentName: string;
  currentEquipmentStatus: string;
  interventionStatus: 'in-progress' | 'completed';
}

export const useEquipmentStatusSync = () => {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<EquipmentStatusSyncState>({
    isDialogOpen: false,
    equipmentId: null,
    equipmentName: '',
    currentEquipmentStatus: '',
    interventionStatus: 'in-progress'
  });

  const showSyncDialog = (
    equipmentId: string,
    equipmentName: string,
    currentEquipmentStatus: string,
    interventionStatus: 'in-progress' | 'completed'
  ) => {
    setSyncState({
      isDialogOpen: true,
      equipmentId,
      equipmentName,
      currentEquipmentStatus,
      interventionStatus
    });
  };

  const closeSyncDialog = () => {
    setSyncState(prev => ({ ...prev, isDialogOpen: false }));
  };

  const updateEquipmentStatus = async (newStatus: 'operational' | 'faulty') => {
    if (!syncState.equipmentId) return;

    try {
      const { error } = await supabase
        .from('equipments')
        .update({ status: newStatus })
        .eq('id', syncState.equipmentId);

      if (error) {
        console.error('Error updating equipment status:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut de l'équipement",
          variant: "destructive"
        });
        return;
      }

      const statusText = newStatus === 'operational' ? 'opérationnel' : 'en panne';
      toast({
        title: "Statut mis à jour",
        description: `L'équipement "${syncState.equipmentName}" est maintenant ${statusText}.`
      });

      console.log(`Equipment ${syncState.equipmentId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Exception updating equipment status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    }
  };

  const checkAndPromptStatusSync = async (
    equipmentId: string,
    newInterventionStatus: 'in-progress' | 'completed',
    previousInterventionStatus?: string
  ) => {
    try {
      // Récupérer les informations de l'équipement
      const { data: equipment, error } = await supabase
        .from('equipments')
        .select('id, name, status')
        .eq('id', equipmentId)
        .single();

      if (error || !equipment) {
        console.error('Error fetching equipment:', error);
        return;
      }

      const shouldPrompt = 
        // Cas 1: Intervention passe à "en cours" (peu importe le statut précédent)
        (newInterventionStatus === 'in-progress') ||
        // Cas 2: Intervention passe à "terminée" ET l'équipement était en panne
        (newInterventionStatus === 'completed' && equipment.status === 'faulty');

      if (shouldPrompt) {
        showSyncDialog(
          equipment.id,
          equipment.name,
          equipment.status,
          newInterventionStatus
        );
      }
    } catch (error) {
      console.error('Error in checkAndPromptStatusSync:', error);
    }
  };

  return {
    syncState,
    showSyncDialog,
    closeSyncDialog,
    updateEquipmentStatus,
    checkAndPromptStatusSync
  };
};
