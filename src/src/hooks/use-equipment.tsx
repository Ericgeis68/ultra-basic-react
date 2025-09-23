import { useState, useRef, useEffect } from 'react';
import { Equipment, EquipmentStatus } from '@/types/equipment';
import { useCollection } from '@/hooks/use-supabase-collection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logEquipmentChange, deleteEquipment } from '@/lib/equipment';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { junctionTableManager } from '@/lib/junction-tables'; // Import junctionTableManager

export function useEquipment() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const equipmentUpdateInProgress = useRef(false);
  const [enrichedEquipmentData, setEnrichedEquipmentData] = useState<Equipment[] | null>(null); // New state for enriched data

  const {
    data: rawEquipmentData, // Renamed to rawEquipmentData
    loading: collectionLoading,
    error: collectionError,
    addDocument,
    updateDocument,
    refetch
  } = useCollection<Equipment>({
    tableName: 'equipments',
  });

  // Effect to enrich equipment data with associated_group_ids
  useEffect(() => {
    const enrichData = async () => {
      if (rawEquipmentData && rawEquipmentData.length > 0) {
        const enriched = await Promise.all(rawEquipmentData.map(async (eq) => {
          const associatedGroupIds = await junctionTableManager.getGroupsForEquipment(eq.id);
          return { ...eq, associated_group_ids: associatedGroupIds };
        }));
        setEnrichedEquipmentData(enriched);
      } else {
        setEnrichedEquipmentData(rawEquipmentData); // Handle empty or null case
      }
    };

    enrichData();
  }, [rawEquipmentData]); // Re-run when rawEquipmentData changes

  const handleSaveEquipment = async (equipment: Equipment): Promise<boolean> => {
    if (equipmentUpdateInProgress.current) {
      console.log("Une opération d'update est déjà en cours, ignorée");
      return false;
    }
    
    equipmentUpdateInProgress.current = true;
    setLoading(true);
    
    try {
      const isNew = !equipment.id || equipment.id.startsWith('new-');
      let success = false;
      
      const connectionTest = await supabase.from('equipments').select('count(*)', { count: 'exact', head: true });
      if (connectionTest.error) {
        console.error("Erreur de connexion Supabase:", connectionTest.error);
        throw new Error(`Erreur de connexion à la base de données: ${connectionTest.error.message}`);
      }
      
      console.log(`[useEquipment] Saving equipment (${isNew ? 'new' : 'update'}):`, equipment);
      
      const validEquipment: Equipment = {
        ...equipment,
        status: equipment.status as EquipmentStatus,
        relationships: Array.isArray(equipment.relationships) ? equipment.relationships : [],
      };
      
      // Retirer les champs calculés/non stockés en base avant mutation
      const dbEquipment: any = { ...validEquipment };
      delete dbEquipment.buildingName;
      delete dbEquipment.serviceName;
      delete dbEquipment.locationName;
      delete dbEquipment.groupNames;
      delete dbEquipment.associated_group_ids;
      
      if (isNew) {
        // Insert: retirer l'id pour laisser la DB le générer
        const insertPayload: any = { ...dbEquipment };
        delete insertPayload.id;
        const result = await addDocument(insertPayload as any);
        if (!result) throw new Error("Failed to insert equipment");
        success = true;

        // No group management needed here - handled by EquipmentGroupManager component
      } else {
        const { data: existingEquipment, error: fetchError } = await supabase
          .from('equipments')
          .select('*')
          .eq('id', validEquipment.id)
          .single();

        if (fetchError) {
          console.error('[useEquipment] Error fetching existing equipment:', fetchError);
          throw fetchError;
        }

        // Update equipment basic fields
        const { data: updated, error: updateErr } = await supabase
          .from('equipments' as any)
          .update(dbEquipment as any)
          .eq('id', dbEquipment.id)
          .select('*')
          .single();
        if (updateErr) throw updateErr;
        success = true;

        // No group management needed here - handled by EquipmentGroupManager component
      }
      
      if (success) {
        toast({
          title: isNew ? "Équipement créé" : "Équipement mis à jour",
          description: `${validEquipment.name} a été ${isNew ? 'créé' : 'mis à jour'} avec succès.`,
        });
        // Refetch to ensure associated_group_ids are updated
        await refetch(); 
      } else {
        throw new Error("Opération non réussie sans erreur spécifique");
      }
      
      return success;
    } catch (err: any) {
      console.error("[useEquipment] Error saving equipment:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Une erreur est survenue"));
      
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'enregistrement: ${err.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
      equipmentUpdateInProgress.current = false;
    }
  };

  const logEquipmentChanges = async (oldEquipment: Equipment, newEquipment: Equipment) => {
    console.log('[logEquipmentChanges] Starting to log changes...');
    console.log('[logEquipmentChanges] Old equipment:', oldEquipment);
    console.log('[logEquipmentChanges] New equipment:', newEquipment);
    console.log('[logEquipmentChanges] Current user:', user);

    const fieldsToTrack = [
      'name', 'model', 'manufacturer', 'supplier', 'serial_number', 'inventory_number',
      'description', 'uf', 'building_id', 'service_id', 'location_id',
      'status', 'health_percentage', 'purchase_date', 'date_mise_en_service',
      'warranty_expiry'
    ];

    // Determine the user identifier for logging
    const userIdentifier = user ? (user.full_name || user.username || user.id) : 'Anonymous';
    console.log('[logEquipmentChanges] Using user identifier:', userIdentifier);

    for (const field of fieldsToTrack) {
      const oldValue = oldEquipment[field as keyof Equipment];
      const newValue = newEquipment[field as keyof Equipment];

      // Normaliser les valeurs pour la comparaison
      const normalizedOldValue = oldValue === null || oldValue === undefined || oldValue === '' ? null : oldValue;
      const normalizedNewValue = newValue === null || newValue === undefined || newValue === '' ? null : newValue;

      const hasChanged = JSON.stringify(normalizedOldValue) !== JSON.stringify(normalizedNewValue);

      if (hasChanged) {
        console.log(`[logEquipmentChanges] Field "${field}" changed from:`, normalizedOldValue, 'to:', normalizedNewValue);
        try {
          await logEquipmentChange(
            newEquipment.id,
            field,
            normalizedOldValue as Json,
            normalizedNewValue as Json,
            userIdentifier
          );
          console.log(`[logEquipmentChanges] Successfully logged change for field: ${field} by ${userIdentifier}`);
        } catch (error) {
          console.error(`[logEquipmentChanges] Failed to log change for field ${field}:`, error);
        }
      }
    }
  };

  const handleDeleteEquipment = async (id: string): Promise<boolean> => {
    if (equipmentUpdateInProgress.current) {
      console.log("Une opération d'update est déjà en cours, ignorée");
      return false;
    }
    
    equipmentUpdateInProgress.current = true;
    setLoading(true);
    
    try {
      // Use our custom delete function that handles foreign key constraints
      await deleteEquipment(id);
      
      // Remove from local state
      if (rawEquipmentData) { // Use rawEquipmentData here
        // This will trigger a refetch to ensure consistency
        await refetch();
      }
      
      toast({
        title: "Équipement supprimé",
        description: "L'équipement a été supprimé avec succès.",
      });
      
      return true;
    } catch (err: any) {
      console.error("Error deleting equipment:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Une erreur est survenue"));
      
      toast({
        title: "Erreur de suppression",
        description: `Impossible de supprimer l'équipement: ${err.message}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
      equipmentUpdateInProgress.current = false;
    }
  };

  const handleUpdateHealthPercentage = async (equipmentId: string, newHealthValue: number): Promise<boolean> => {
    if (equipmentUpdateInProgress.current) {
      console.log("Une opération d'update est déjà en cours, ignorée");
      return false;
    }
    
    equipmentUpdateInProgress.current = true;
    setLoading(true);
    
    try {
      const { data: existingEquipment } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .single();

      const result = await updateDocument(equipmentId, { health_percentage: newHealthValue });
      
      if (result && existingEquipment) {
        const userIdentifier = user ? (user.full_name || user.username || user.id) : 'System';
        console.log('[handleUpdateHealthPercentage] Using user identifier:', userIdentifier);
        
        await logEquipmentChange(
          equipmentId,
          'health_percentage',
          existingEquipment.health_percentage as Json,
          newHealthValue as Json,
          userIdentifier
        );

        toast({
          title: "État de santé mis à jour",
          description: `L'état de santé est maintenant à ${newHealthValue}%.`,
        });
        await refetch(); // Refetch to ensure associated_group_ids are updated
        return true;
      } else {
        throw new Error("Mise à jour de l'état de santé échouée");
      }
    } catch (err: any) {
      console.error("[useEquipment] Error updating health percentage:", err);
      setError(err instanceof Error ? err : new Error(err.message || "Une erreur est survenue"));
      
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de la mise à jour: ${err.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
      equipmentUpdateInProgress.current = false;
    }
  };

  return {
    equipmentData: enrichedEquipmentData, // Return enriched data
    loading: loading || collectionLoading,
    error: error || collectionError,
    handleSaveEquipment,
    handleDeleteEquipment,
    handleUpdateHealthPercentage,
    refetchEquipment: refetch
  };
}
