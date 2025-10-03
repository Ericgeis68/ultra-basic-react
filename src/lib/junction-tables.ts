/**
 * Utility functions for managing junction tables (many-to-many relationships)
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Document } from "@/types/document"; // Import Document type for join queries

type EquipmentGroupMemberInsert = Database['public']['Tables']['equipment_group_members']['Insert'];
type DocumentGroupMemberInsert = Database['public']['Tables']['document_group_members']['Insert'];
type PartGroupMemberInsert = Database['public']['Tables']['part_group_members']['Insert'];

export const junctionTableManager = {
  /**
   * Récupère tous les IDs de groupe associés à un équipement donné.
   * @param equipmentId L'ID de l'équipement.
   * @returns Un tableau d'IDs de groupe.
   */
  async getGroupsForEquipment(equipmentId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('equipment_group_members')
      .select('group_id')
      .eq('equipment_id', equipmentId);

    if (error) {
      console.error('Erreur lors de la récupération des groupes pour l\'équipement:', error);
      return [];
    }
    return data.map(item => item.group_id);
  },

  /**
   * Récupère tous les IDs d'équipement associés à un groupe donné.
   * @param groupId L'ID du groupe.
   * @returns Un tableau d'IDs d'équipement.
   */
  async getEquipmentsForGroup(groupId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('equipment_group_members')
      .select('equipment_id')
      .eq('group_id', groupId);

    if (error) {
      console.error('Erreur lors de la récupération des équipements pour le groupe:', error);
      return [];
    }
    return data.map(item => item.equipment_id);
  },

  /**
   * Met à jour les relations entre un équipement et ses groupes.
   * Supprime les anciennes relations et insère les nouvelles.
   * @param equipmentId L'ID de l'équipement.
   * @param newGroupIds Les nouveaux IDs de groupe à associer.
   */
  async updateEquipmentGroupMembers(equipmentId: string, newGroupIds: string[]): Promise<void> {
    // Supprimer les relations existantes pour cet équipement
    const { error: deleteError } = await supabase
      .from('equipment_group_members')
      .delete()
      .eq('equipment_id', equipmentId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes relations équipement-groupe:', deleteError);
      throw deleteError;
    }

    // Insérer les nouvelles relations
    if (newGroupIds.length > 0) {
      const inserts: EquipmentGroupMemberInsert[] = newGroupIds.map(groupId => ({
        equipment_id: equipmentId,
        group_id: groupId,
      }));
      const { error: insertError } = await supabase
        .from('equipment_group_members')
        .insert(inserts);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouvelles relations équipement-groupe:', insertError);
        throw insertError;
      }

      // Propager le descriptif du groupe vers l'équipement si vide
      try {
        const { data: eqData } = await supabase
          .from('equipments')
          .select('id, description')
          .eq('id', equipmentId)
          .single();

        const currentDescription = (eqData as any)?.description as string | null | undefined;
        if (!currentDescription || String(currentDescription).trim().length === 0) {
          if (newGroupIds.length > 0) {
            const { data: groups } = await supabase
              .from('equipment_groups')
              .select('id, description')
              .in('id', newGroupIds);

            const groupWithDescription = (groups || []).find(g => g.description && String(g.description).trim().length > 0);
            if (groupWithDescription) {
              await supabase
                .from('equipments')
                .update({ description: groupWithDescription.description })
                .eq('id', equipmentId);
            }
          }
        }
      } catch (e) {
        console.warn('Propagation du descriptif depuis le groupe ignorée:', e);
      }
    }
  },

  /**
   * Met à jour les relations entre un groupe et ses équipements.
   * Supprime les anciennes relations et insère les nouvelles.
   * @param groupId L'ID du groupe.
   * @param newEquipmentIds Les nouveaux IDs d'équipement à associer.
   */
  async updateGroupEquipmentMembers(groupId: string, newEquipmentIds: string[]): Promise<void> {
    // Supprimer les relations existantes pour ce groupe
    const { error: deleteError } = await supabase
      .from('equipment_group_members')
      .delete()
      .eq('group_id', groupId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes relations groupe-équipement:', deleteError);
      throw deleteError;
    }

    // Insérer les nouvelles relations
    if (newEquipmentIds.length > 0) {
      const inserts: EquipmentGroupMemberInsert[] = newEquipmentIds.map(equipmentId => ({
        group_id: groupId,
        equipment_id: equipmentId,
      }));
      const { error: insertError } = await supabase
        .from('equipment_group_members')
        .insert(inserts);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouvelles relations groupe-équipement:', insertError);
        throw insertError;
      }

      // Propager le descriptif du groupe vers les équipements sans descriptif
      try {
        // Récupérer la description du groupe
        const { data: groupData } = await supabase
          .from('equipment_groups')
          .select('id, description')
          .eq('id', groupId)
          .single();

        const groupDescription = (groupData as any)?.description as string | null | undefined;
        if (groupDescription && String(groupDescription).trim().length > 0) {
          // Récupérer les équipements pour connaître ceux à mettre à jour
          const { data: equipmentsData } = await supabase
            .from('equipments')
            .select('id, description')
            .in('id', newEquipmentIds);

          const equipmentsToUpdate = (equipmentsData || [])
            .filter(eq => !eq.description || String(eq.description).trim().length === 0)
            .map(eq => eq.id);

          if (equipmentsToUpdate.length > 0) {
            await supabase
              .from('equipments')
              .update({ description: groupDescription })
              .in('id', equipmentsToUpdate);
          }
        }
      } catch (e) {
        console.warn('Propagation du descriptif depuis le groupe (côté groupe) ignorée:', e);
      }
    }
  },

  /**
   * Propage la description d'un groupe vers tous ses équipements associés
   * qui n'ont pas déjà une description personnalisée.
   * @param groupId L'ID du groupe.
   */
  async propagateGroupDescriptionToEquipments(groupId: string): Promise<void> {
    try {
      // Récupérer la description du groupe
      const { data: groupData } = await supabase
        .from('equipment_groups')
        .select('id, description')
        .eq('id', groupId)
        .single();

      const groupDescription = (groupData as any)?.description as string | null | undefined;
      if (!groupDescription || String(groupDescription).trim().length === 0) {
        console.log('Aucune description à propager pour le groupe:', groupId);
        return;
      }

      // Récupérer tous les équipements associés à ce groupe
      const { data: relations } = await supabase
        .from('equipment_group_members')
        .select('equipment_id')
        .eq('group_id', groupId);

      if (!relations || relations.length === 0) {
        console.log('Aucun équipement associé au groupe:', groupId);
        return;
      }

      const equipmentIds = relations.map(r => r.equipment_id);

      // Récupérer les équipements pour connaître ceux à mettre à jour
      const { data: equipmentsData } = await supabase
        .from('equipments')
        .select('id, description')
        .in('id', equipmentIds);

      // Récupérer toutes les descriptions de groupes existantes pour comparaison
      const { data: allGroups } = await supabase
        .from('equipment_groups')
        .select('id, description');
      
      const groupDescriptions = (allGroups || [])
        .filter(g => g.description && String(g.description).trim().length > 0)
        .map(g => String(g.description).trim());

      // Séparer les équipements selon leur statut de description
      const equipmentsWithPersonalDesc = [];
      const equipmentsToUpdate = [];
      
      for (const eq of equipmentsData || []) {
        const currentDesc = eq.description ? String(eq.description).trim() : '';
        if (!currentDesc || groupDescriptions.includes(currentDesc)) {
          // Pas de description OU description qui correspond à une description de groupe existante
          equipmentsToUpdate.push(eq.id);
        } else {
          // Description personnalisée qui ne correspond à aucun groupe
          equipmentsWithPersonalDesc.push(eq);
        }
      }

      // Mettre à jour les équipements appropriés
      if (equipmentsToUpdate.length > 0) {
        const { error } = await supabase
          .from('equipments')
          .update({ description: groupDescription })
          .in('id', equipmentsToUpdate);

        if (error) {
          console.error('Erreur lors de la propagation de la description:', error);
          throw error;
        }

        console.log(`Description propagée vers ${equipmentsToUpdate.length} équipements du groupe ${groupId}`);
      }

      // Retourner les statistiques pour informer l'utilisateur
      return {
        updated: equipmentsToUpdate.length,
        skipped: equipmentsWithPersonalDesc.length,
        skippedEquipments: equipmentsWithPersonalDesc
      };
    } catch (error) {
      console.error('Erreur lors de la propagation de la description du groupe:', error);
      throw error;
    }
  },

  /**
   * Récupère tous les IDs de groupe associés à un document donné.
   * @param documentId L'ID du document.
   * @returns Un tableau d'IDs de groupe.
   */
  async getGroupsForDocument(documentId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('document_group_members')
      .select('group_id')
      .eq('document_id', documentId);

    if (error) {
      console.error('Erreur lors de la récupération des groupes pour le document:', error);
      return [];
    }
    return data.map(item => item.group_id);
  },

  /**
   * Met à jour les relations entre un document et ses groupes.
   * Supprime les anciennes relations et insère les nouvelles.
   * @param documentId L'ID du document.
   * @param newGroupIds Les nouveaux IDs de groupe à associer.
   */
  async updateDocumentGroupMembers(documentId: string, newGroupIds: string[]): Promise<void> {
    // Supprimer les relations existantes pour ce document
    const { error: deleteError } = await supabase
      .from('document_group_members')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes relations document-groupe:', deleteError);
      throw deleteError;
    }

    // Insérer les nouvelles relations
    if (newGroupIds.length > 0) {
      const inserts: DocumentGroupMemberInsert[] = newGroupIds.map(groupId => ({
        document_id: documentId,
        group_id: groupId,
      }));
      const { error: insertError } = await supabase
        .from('document_group_members')
        .insert(inserts);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouvelles relations document-groupe:', insertError);
        throw insertError;
      }
    }
  },

  /**
   * Récupère tous les IDs de groupe associés à une pièce donnée.
   * @param partId L'ID de la pièce.
   * @returns Un tableau d'IDs de groupe.
   */
  async getGroupsForPart(partId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('part_group_members')
      .select('group_id')
      .eq('part_id', partId);

    if (error) {
      console.error('Erreur lors de la récupération des groupes pour la pièce:', error);
      return [];
    }
    return data.map(item => item.group_id);
  },

  /**
   * Met à jour les relations entre une pièce et ses groupes.
   * Supprime les anciennes relations et insère les nouvelles.
   * @param partId L'ID de la pièce.
   * @param newGroupIds Les nouveaux IDs de groupe à associer.
   */
  async updatePartGroupMembers(partId: string, newGroupIds: string[]): Promise<void> {
    // Supprimer les relations existantes pour cette pièce
    const { error: deleteError } = await supabase
      .from('part_group_members')
      .delete()
      .eq('part_id', partId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes relations pièce-groupe:', deleteError);
      throw deleteError;
    }

    // Insérer les nouvelles relations
    if (newGroupIds.length > 0) {
      const inserts: PartGroupMemberInsert[] = newGroupIds.map(groupId => ({
        part_id: partId,
        group_id: groupId,
      }));
      const { error: insertError } = await supabase
        .from('part_group_members')
        .insert(inserts);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouvelles relations pièce-groupe:', insertError);
        throw insertError;
      }
    }
  }
};

// La fonction `attachGroupIdsToEquipments` est obsolète et peut être supprimée.
export const attachGroupIdsToEquipments = async (equipments: any[]): Promise<any[]> => {
  console.warn("attachGroupIdsToEquipments est obsolète. Utilisez junctionTableManager.getGroupsForEquipment à la place.");
  return equipments.map(eq => ({
    ...eq,
    associated_group_ids: []
  }));
};

export const groupBasedQueries = {
  /**
   * Récupère les documents associés à un équipement donné ou aux groupes auxquels cet équipement appartient.
   * Utilise la table de jonction `document_group_members`.
   * @param equipmentId L'ID de l'équipement.
   * @param groupIds Les IDs des groupes auxquels l'équipement appartient.
   * @returns Un tableau de documents.
   */
  async getDocumentsForEquipmentAndGroups(equipmentId: string, groupIds: string[]): Promise<Document[]> {
    try {
      // 1. Récupérer les documents directement liés à l'équipement
      const { data: directDocs, error: directError } = await supabase
        .from('documents')
        .select('*')
        .contains('equipment_ids', [equipmentId]);

      if (directError) {
        console.error('Error fetching direct documents:', directError);
        throw directError;
      }

      let allDocs: Document[] = directDocs || [];

      // 2. Si l'équipement appartient à des groupes, récupérer les documents liés à ces groupes
      if (groupIds.length > 0) {
        const { data: groupLinkedMembers, error: groupError } = await supabase
          .from('document_group_members')
          .select('document_id, documents(*)') // Sélectionne les détails du document via la jointure
          .in('group_id', groupIds);

        if (groupError) {
          console.error('Error fetching group-linked documents:', groupError);
          throw groupError;
        }

        if (groupLinkedMembers) {
          const groupDocs = groupLinkedMembers.map(member => member.documents).filter(Boolean) as Document[];
          allDocs = [...allDocs, ...groupDocs];
        }
      }

      // Dédupliquer les documents (un document peut être lié directement et via un groupe)
      const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.id, doc])).values());
      return uniqueDocs;

    } catch (error) {
      console.error('Error in getDocumentsForEquipmentAndGroups:', error);
      throw error;
    }
  },

  async getPartsForEquipmentAndGroups(equipmentId: string, groupIds: string[]): Promise<any[]> {
    try {
      // 1. Récupérer les pièces directement liées à l'équipement
      const { data: directParts, error: directError } = await supabase
        .from('parts')
        .select('*')
        .contains('equipment_ids', [equipmentId]);

      if (directError) {
        console.error('Error fetching direct parts:', directError);
        throw directError;
      }

      let allParts: any[] = directParts || [];

      // 2. Si l'équipement appartient à des groupes, récupérer les pièces liées à ces groupes
      if (groupIds.length > 0) {
        const { data: groupLinkedMembers, error: groupError } = await supabase
          .from('part_group_members')
          .select('part_id, parts(*)') // Sélectionne les détails de la pièce via la jointure
          .in('group_id', groupIds);

        if (groupError) {
          console.error('Error fetching group-linked parts:', groupError);
          throw groupError;
        }

        if (groupLinkedMembers) {
          const groupParts = groupLinkedMembers.map(member => member.parts).filter(Boolean) as any[];
          allParts = [...allParts, ...groupParts];
        }
      }

      // Dédupliquer les pièces
      const uniqueParts = Array.from(new Map(allParts.map(part => [part.id, part])).values());
      return uniqueParts;
    } catch (error) {
      console.error('Error in getPartsForEquipmentAndGroups:', error);
      return [];
    }
  }
};
