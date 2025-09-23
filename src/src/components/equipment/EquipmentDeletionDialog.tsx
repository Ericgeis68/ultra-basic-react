import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, FileText, Wrench, Image, Users, Database } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { supabase } from '@/integrations/supabase/client';
import { junctionTableManager } from '@/lib/junction-tables';
import { useToast } from '@/hooks/use-toast';

interface DeletionAnalysis {
  equipmentName: string;
  directlyLinkedData: {
    documents: number;
    parts: number;
    interventions: number;
    hasImage: boolean;
  };
  groupsInfo: Array<{
    groupId: string;
    groupName: string;
    remainingEquipment: number;
    sharedDocuments: number;
    sharedParts: number;
    willBecomeEmpty: boolean;
  }>;
  totalToDelete: {
    documents: number;
    parts: number;
    interventions: number;
    groups: number;
  };
}

interface EquipmentDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  equipmentGroups: EquipmentGroup[];
  onConfirmDelete: (equipment: Equipment, shouldDeleteEmptyGroups: boolean) => Promise<void>;
}

const EquipmentDeletionDialog: React.FC<EquipmentDeletionDialogProps> = ({
  isOpen,
  onClose,
  equipment,
  equipmentGroups,
  onConfirmDelete
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<DeletionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteEmptyGroups, setDeleteEmptyGroups] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && equipment) {
      analyzeDeletion();
    }
  }, [isOpen, equipment]);

  const analyzeDeletion = async () => {
    if (!equipment) return;

    setLoading(true);
    try {
      // Get equipment groups
      const equipmentGroupIds = await junctionTableManager.getGroupsForEquipment(equipment.id);
      
      // Count directly linked data using simple approach
      let documentsCount = 0, partsCount = 0, interventionsCount = 0;
      
      try {
        const { data: docsData } = await supabase.from('documents').select('id').contains('equipment_ids', [equipment.id]);
        documentsCount = docsData?.length || 0;
      } catch (e) {
        console.warn('Error counting documents:', e);
      }
      
      try {
        const { data: partsData } = await supabase.from('parts').select('id').contains('equipment_ids', [equipment.id]);
        partsCount = partsData?.length || 0;
      } catch (e) {
        console.warn('Error counting parts:', e);
      }
      
      try {
        const interventionsResponse = await supabase.from('interventions').select('id').eq('equipment_id', equipment.id);
        interventionsCount = interventionsResponse.data?.length || 0;
      } catch (e) {
        console.warn('Error counting interventions:', e);
      }

      const directlyLinkedData = {
        documents: documentsCount,
        parts: partsCount,
        interventions: interventionsCount,
        hasImage: !!equipment.image_url
      };

      // Analyze groups
      const groupsInfo = await Promise.all(
        equipmentGroupIds.map(async (groupId) => {
          const group = equipmentGroups.find(g => g.id === groupId);
          
          // Count remaining equipment in this group (excluding current equipment)
          let remainingCount = 0;
          try {
            const remainingResponse = await supabase
              .from('equipment_group_members')
              .select('equipment_id')
              .eq('group_id', groupId)
              .neq('equipment_id', equipment.id);
            remainingCount = remainingResponse.data?.length || 0;
          } catch (e) {
            console.warn('Error counting remaining equipment:', e);
          }

          // Count shared documents and parts for this group
          let sharedDocumentsCount = 0, sharedPartsCount = 0;
          
          try {
            const docsResponse = await supabase.from('document_group_members').select('document_id').eq('group_id', groupId);
            sharedDocumentsCount = docsResponse.data?.length || 0;
          } catch (e) {
            console.warn('Error counting shared documents:', e);
          }
          
          try {
            const partsResponse = await supabase.from('part_group_members').select('part_id').eq('group_id', groupId);
            sharedPartsCount = partsResponse.data?.length || 0;
          } catch (e) {
            console.warn('Error counting shared parts:', e);
          }

          const willBecomeEmpty = remainingCount === 0;

          return {
            groupId,
            groupName: group?.name || `Groupe ${groupId.substring(0, 8)}...`,
            remainingEquipment: remainingCount,
            sharedDocuments: sharedDocumentsCount,
            sharedParts: sharedPartsCount,
            willBecomeEmpty
          };
        })
      );

      // Calculate totals
      const emptyGroups = groupsInfo.filter(g => g.willBecomeEmpty);
      const totalSharedDocsFromEmptyGroups = emptyGroups.reduce((sum, g) => sum + g.sharedDocuments, 0);
      const totalSharedPartsFromEmptyGroups = emptyGroups.reduce((sum, g) => sum + g.sharedParts, 0);

      const totalToDelete = {
        documents: directlyLinkedData.documents + totalSharedDocsFromEmptyGroups,
        parts: directlyLinkedData.parts + totalSharedPartsFromEmptyGroups,
        interventions: directlyLinkedData.interventions,
        groups: emptyGroups.length
      };

      setAnalysis({
        equipmentName: equipment.name,
        directlyLinkedData,
        groupsInfo,
        totalToDelete
      });

    } catch (error) {
      console.error('Error analyzing deletion:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser les données à supprimer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!equipment || !analysis) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(equipment, deleteEmptyGroups);
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setAnalysis(null);
      onClose();
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmer la suppression
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyse des données à supprimer...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous êtes sur le point de supprimer définitivement l'équipement{' '}
                <strong>"{analysis.equipmentName}"</strong>. Cette action est irréversible.
              </AlertDescription>
            </Alert>

            {/* Direct data to delete */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Données directement liées à cet équipement
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Documents: {analysis.directlyLinkedData.documents}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span>Pièces: {analysis.directlyLinkedData.parts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-500" />
                  <span>Interventions: {analysis.directlyLinkedData.interventions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-orange-500" />
                  <span>Image: {analysis.directlyLinkedData.hasImage ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>

            {/* Groups analysis */}
            {analysis.groupsInfo.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groupes d'équipements affectés
                </h4>
                <div className="space-y-2">
                  {analysis.groupsInfo.map((group) => (
                    <div key={group.groupId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{group.groupName}</span>
                        <Badge variant={group.willBecomeEmpty ? "destructive" : "secondary"}>
                          {group.willBecomeEmpty ? "Deviendra vide" : `${group.remainingEquipment} équipement(s) restant(s)`}
                        </Badge>
                      </div>
                      {group.willBecomeEmpty && (
                        <div className="text-sm text-muted-foreground">
                          Documents partagés: {group.sharedDocuments} | Pièces partagées: {group.sharedParts}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty groups warning */}
            {analysis.totalToDelete.groups > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Supprimer aussi les groupes vides et leurs données partagées ?
                  </label>
                  <input
                    type="checkbox"
                    checked={deleteEmptyGroups}
                    onChange={(e) => setDeleteEmptyGroups(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Si vous cochez cette option, {analysis.totalToDelete.groups} groupe(s) vide(s) seront supprimés
                  avec leurs documents et pièces partagés.
                </p>
              </div>
            )}

            <Separator />

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Récapitulatif de la suppression</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <strong>Documents:</strong> {deleteEmptyGroups ? analysis.totalToDelete.documents : analysis.directlyLinkedData.documents}
                </div>
                <div>
                  <strong>Pièces:</strong> {deleteEmptyGroups ? analysis.totalToDelete.parts : analysis.directlyLinkedData.parts}
                </div>
                <div>
                  <strong>Interventions:</strong> {analysis.totalToDelete.interventions}
                </div>
                <div>
                  <strong>Groupes:</strong> {deleteEmptyGroups ? analysis.totalToDelete.groups : 0}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDeletion}
            disabled={loading || isDeleting || !analysis}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDeletionDialog;
