import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/types/document';
import EquipmentSelector from './EquipmentSelector';
import GroupSelector from '../equipment-groups/GroupSelector';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { uploadDocumentWithFile, updateDocumentFile } from '@/lib/documents';
import { Package, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { junctionTableManager } from '@/lib/junction-tables'; // Import junctionTableManager

interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  document?: Document & { associatedGroupIds?: string[] }; // Add associatedGroupIds for pre-filling
  onDocumentCreated?: (document: Document) => void;
  onDocumentUpdated?: (document: Document) => void;
  equipmentGroups: EquipmentGroup[];
}

interface FormData {
  title: string;
  description?: string | null;
  equipment_ids?: string[] | null;
  group_ids?: string[] | null; // Kept in FormData for local state management
  category: 'manual' | 'maintenance' | 'warranty' | 'certification' | 'procedure' | 'other';
  file: File | null;
}

const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  open,
  onClose,
  document,
  onDocumentCreated,
  onDocumentUpdated,
  equipmentGroups,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: null,
    equipment_ids: null,
    group_ids: null,
    category: 'manual',
    file: null,
  });
  const [associationMode, setAssociationMode] = useState<'equipment' | 'group'>('equipment');
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        description: document.description || null,
        equipment_ids: document.equipment_ids || null,
        group_ids: document.associatedGroupIds || null, // Use associatedGroupIds from prop
        category: document.category as any,
        file: null,
      });
      setAssociationMode((document.associatedGroupIds && document.associatedGroupIds.length > 0) ? 'group' : 'equipment');
    } else {
      setFormData({
        title: '',
        description: null,
        equipment_ids: null,
        group_ids: null,
        category: 'manual',
        file: null,
      });
      setAssociationMode('equipment');
    }
  }, [document]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file: file });
    }
  };

  const handleEquipmentSelected = (equipment: any) => {
    setFormData(prev => {
      const currentIds = prev.equipment_ids || [];
      if (!currentIds.includes(equipment.id)) {
        return {
          ...prev,
          equipment_ids: [...currentIds, equipment.id]
        };
      }
      return prev;
    });
    setIsEquipmentSelectorOpen(false);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: (prev.equipment_ids || []).filter(id => id !== equipmentId)
    }));
  };

  const handleGroupSelected = (groupId: string, isChecked: boolean) => {
    setFormData(prev => {
      const currentIds = prev.group_ids || [];
      if (isChecked) {
        return {
          ...prev,
          group_ids: [...currentIds, groupId]
        };
      } else {
        return {
          ...prev,
          group_ids: currentIds.filter(id => id !== groupId)
        };
      }
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      group_ids: (prev.group_ids || []).filter(id => id !== groupId)
    }));
  };

  const getGroupName = (groupId: string) => {
    const group = equipmentGroups?.find(g => g.id === groupId);
    return group?.name || 'Groupe inconnu';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let updatedOrCreatedDocument: Document | null = null;
      const selectedGroupIds = formData.group_ids || [];

      // Combine equipment IDs from groups for the document data (denormalization for easier filtering)
      let allEquipmentIds = [...(formData.equipment_ids || [])];
      if (selectedGroupIds.length > 0 && equipmentGroups) {
        selectedGroupIds.forEach(groupId => {
          const group = equipmentGroups.find(g => g.id === groupId);
          if (group && group.equipment_ids) {
            group.equipment_ids.forEach(eqId => {
              if (!allEquipmentIds.includes(eqId)) {
                allEquipmentIds.push(eqId);
              }
            });
          }
        });
      }

      if (document) {
        // --- Update existing document ---
        // 1. Update document metadata
        const { data: docMetadataUpdate, error: metadataError } = await supabase
          .from('documents')
          .update({
            title: formData.title,
            description: formData.description,
            equipment_ids: allEquipmentIds, // Use combined IDs
            category: formData.category,
            updatedat: new Date().toISOString(),
          })
          .eq('id', document.id)
          .select()
          .single();

        if (metadataError) {
          throw new Error(metadataError.message);
        }
        updatedOrCreatedDocument = docMetadataUpdate as Document;

        // 2. If a new file is selected, update the file in storage
        if (formData.file) {
          const { success: fileUpdateSuccess, newFileUrl, error: fileUpdateError } = await updateDocumentFile(
            document.id,
            document.fileurl,
            formData.file
          );

          if (!fileUpdateSuccess) {
            throw new Error(fileUpdateError || "Erreur lors de la mise à jour du fichier.");
          }
          if (updatedOrCreatedDocument && newFileUrl) {
            updatedOrCreatedDocument = { ...updatedOrCreatedDocument, fileurl: newFileUrl, filename: formData.file.name, size: formData.file.size };
          }
        }

        // 3. Update document_group_members table
        if (updatedOrCreatedDocument) {
          await junctionTableManager.updateDocumentGroupMembers(updatedOrCreatedDocument.id, selectedGroupIds);
        }

        toast({
          title: "Succès",
          description: "Document mis à jour avec succès.",
        });

        if (onDocumentUpdated && updatedOrCreatedDocument) {
          onDocumentUpdated(updatedOrCreatedDocument);
        }

      } else {
        // --- Create new document ---
        if (!formData.file) {
          toast({
            title: "Erreur",
            description: "Un fichier est obligatoire pour la création d'un nouveau document.",
            variant: "destructive"
          });
          return;
        }

        const { success, document: newDoc, error: uploadDocError } = await uploadDocumentWithFile(
          {
            title: formData.title,
            description: formData.description,
            equipment_ids: allEquipmentIds, // Use combined IDs
            category: formData.category,
          },
          formData.file,
          selectedGroupIds // Pass groupIds separately
        );

        if (!success || !newDoc) {
          throw new Error(uploadDocError || "Erreur lors de la création du document.");
        }
        updatedOrCreatedDocument = newDoc;

        toast({
          title: "Succès",
          description: "Document créé avec succès.",
        });

        if (onDocumentCreated && updatedOrCreatedDocument) {
          onDocumentCreated(updatedOrCreatedDocument);
        }
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document ? 'Modifier le document' : 'Nouveau document'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nom du document</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="warranty">Garantie</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="procedure">Procédure</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            {formData.file && (
              <p className="text-sm text-gray-600">
                Fichier sélectionné: {formData.file.name}
              </p>
            )}
            {document?.fileurl && !formData.file && (
              <p className="text-sm text-gray-600">
                Fichier actuel: <a href={document.fileurl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{document.filename || 'Voir le fichier'}</a>
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4 mb-2">
            <label className="text-sm font-medium mb-2 block">Mode d'association</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() => setAssociationMode('equipment')}
                variant={associationMode === 'equipment' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Package className="mr-2 h-4 w-4" />
                Équipements individuels
              </Button>
              <Button
                type="button"
                onClick={() => setAssociationMode('group')}
                variant={associationMode === 'group' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" />
                Groupes d'équipements
              </Button>
            </div>
          </div>

          {associationMode === 'equipment' ? (
            <div className="space-y-2">
              <Label htmlFor="equipment">Équipement (optionnel)</Label>
              <EquipmentSelector
                onSelect={(equipment) => setFormData({
                  ...formData,
                  equipment_ids: equipment ? [equipment.id] : null
                })}
                selectedEquipmentId={formData.equipment_ids?.[0] || null}
              />
              {formData.equipment_ids && formData.equipment_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.equipment_ids.map((eqId) => (
                    <Badge key={eqId} variant="secondary" className="pr-1">
                      {eqId} {/* Replace with actual equipment name if available */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEquipment(eqId)}
                        className="ml-1 p-0 h-auto hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="groups">Groupes d'équipements (optionnel)</Label>
              <GroupSelector
                isOpen={isGroupSelectorOpen}
                onClose={() => setIsGroupSelectorOpen(false)}
                onSelect={handleGroupSelected}
                selectedGroupIds={formData.group_ids || []}
                groups={equipmentGroups}
              />
              {formData.group_ids && formData.group_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.group_ids.map((groupId) => (
                    <Badge key={groupId} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 pr-1">
                      {getGroupName(groupId)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGroup(groupId)}
                        className="ml-1 p-0 h-auto hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : document ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentFormModal;
