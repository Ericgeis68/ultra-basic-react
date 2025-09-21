import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, FileText, Wrench, Users } from 'lucide-react';
import { Document } from '@/types/document';
import { Part } from '@/types/part';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { supabase } from '@/integrations/supabase/client';
import { junctionTableManager } from '@/lib/junction-tables';
import { useToast } from '@/hooks/use-toast';

interface DeletionAnalysis {
  itemName: string;
  itemType: 'document' | 'part';
  linkedEquipments: Array<{
    equipmentId: string;
    equipmentName: string;
  }>;
  linkedGroups: Array<{
    groupId: string;
    groupName: string;
    equipmentCount: number;
  }>;
  canDelete: boolean;
  reason: string;
}

interface DocumentPartDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Document | Part | null;
  itemType: 'document' | 'part';
  equipments: Equipment[];
  equipmentGroups: EquipmentGroup[];
  onConfirmDelete?: () => Promise<void>;
}

const DocumentPartDeletionDialog: React.FC<DocumentPartDeletionDialogProps> = ({
  isOpen,
  onClose,
  item,
  itemType,
  equipments,
  equipmentGroups,
  onConfirmDelete
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<DeletionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      analyzeDeletion();
    }
  }, [isOpen, item]);

  const analyzeDeletion = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const linkedEquipments: Array<{ equipmentId: string; equipmentName: string }> = [];
      const linkedGroups: Array<{ groupId: string; groupName: string; equipmentCount: number }> = [];

      // Find direct equipment links
      if ('equipment_id' in item && item.equipment_id) {
        const equipment = equipments.find(eq => eq.id === item.equipment_id);
        if (equipment) {
          linkedEquipments.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name
          });
        }
      }

      // Find group links
      const junctionTable = itemType === 'document' ? 'document_group_members' : 'part_group_members';
      const itemIdField = itemType === 'document' ? 'document_id' : 'part_id';
      
      const { data: groupMembers } = await (supabase as any)
        .from(junctionTable)
        .select('group_id')
        .eq(itemIdField, item.id);

      if (groupMembers && groupMembers.length > 0) {
        for (const member of groupMembers) {
          const group = equipmentGroups.find(g => g.id === member.group_id);
          if (group) {
            // Count equipments in this group
            const { data: equipmentMembers } = await (supabase as any)
              .from('equipment_group_members')
              .select('equipment_id')
              .eq('group_id', group.id);

            linkedGroups.push({
              groupId: group.id,
              groupName: group.name,
              equipmentCount: equipmentMembers?.length || 0
            });
          }
        }
      }

      const canDelete = linkedEquipments.length === 0 && linkedGroups.length === 0;
      let reason = '';

      if (!canDelete) {
        const reasons = [];
        if (linkedEquipments.length > 0) {
          reasons.push(`${linkedEquipments.length} équipement(s)`);
        }
        if (linkedGroups.length > 0) {
          const totalEquipmentsInGroups = linkedGroups.reduce((sum, g) => sum + g.equipmentCount, 0);
          reasons.push(`${linkedGroups.length} groupe(s) avec ${totalEquipmentsInGroups} équipements`);
        }
        reason = `Ce ${itemType === 'document' ? 'document' : 'pièce'} est encore utilisé par : ${reasons.join(', ')}`;
      }

      setAnalysis({
        itemName: 'name' in item ? item.name : `${itemType} ${item.id.substring(0, 8)}...`,
        itemType,
        linkedEquipments,
        linkedGroups,
        canDelete,
        reason
      });

    } catch (error) {
      console.error('Error analyzing deletion:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser les dépendances.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!item || !analysis || !analysis.canDelete || !onConfirmDelete) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete();
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

  if (!item) return null;

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
            <span className="ml-2">Analyse des dépendances...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <Alert variant={analysis.canDelete ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {analysis.canDelete ? (
                  <>
                    Vous êtes sur le point de supprimer définitivement{' '}
                    <strong>"{analysis.itemName}"</strong>. Cette action est irréversible.
                  </>
                ) : (
                  <>
                    <strong>Suppression impossible !</strong><br />
                    {analysis.reason}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Direct equipment links */}
            {analysis.linkedEquipments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Équipements utilisant ce {analysis.itemType === 'document' ? 'document' : 'pièce'}
                </h4>
                <div className="space-y-2">
                  {analysis.linkedEquipments.map((equipment) => (
                    <div key={equipment.equipmentId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{equipment.equipmentName}</span>
                        <Badge variant="secondary">
                          Lien direct
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group links */}
            {analysis.linkedGroups.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groupes utilisant ce {analysis.itemType === 'document' ? 'document' : 'pièce'}
                </h4>
                <div className="space-y-2">
                  {analysis.linkedGroups.map((group) => (
                    <div key={group.groupId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{group.groupName}</span>
                        <Badge variant="secondary">
                          {group.equipmentCount} équipement(s)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.canDelete && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Confirmation de suppression</h4>
                <p className="text-sm text-muted-foreground">
                  Ce {analysis.itemType === 'document' ? 'document' : 'pièce'} n'est utilisé par aucun équipement ou groupe.
                  Il peut être supprimé en toute sécurité.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            {analysis?.canDelete ? 'Annuler' : 'Fermer'}
          </Button>
          {analysis?.canDelete && onConfirmDelete && (
            <Button
              variant="destructive"
              onClick={handleConfirmDeletion}
              disabled={loading || isDeleting || !analysis.canDelete}
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPartDeletionDialog;
