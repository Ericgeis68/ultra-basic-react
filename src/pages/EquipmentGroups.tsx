import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List, Edit, Trash, Search, WrenchIcon, X, ImageIcon, Tag, FileText, Settings, MapPin, Calendar, Package, Image, Upload, Download, Printer } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCollection } from '@/hooks/use-supabase-collection';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Equipment } from '@/types/equipment';
import { v4 as uuidv4 } from 'uuid';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { junctionTableManager } from '@/lib/junction-tables'; // Assurez-vous que c'est bien 'junctionTableManager'

const EquipmentGroupsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EquipmentGroup | null>(null); // Store full group object
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<EquipmentGroup | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<'detach' | 'cleanup'>('cleanup');

  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    addDocument,
    updateDocument,
    // deleteDocument // Not used in this component currently
  } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups'
  });

  const {
    data: equipments,
    loading: equipmentsLoading
  } = useCollection<Equipment>({
    tableName: 'equipments'
  });

  // State to hold groups with their associated equipment IDs
  const [augmentedGroups, setAugmentedGroups] = useState<EquipmentGroup[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    equipment_ids: [] as string[], // These are the IDs selected for the current group being edited/created
    shared_image_url: null as string | null
  });

  // Effect to fetch associated equipment IDs for each group
  useEffect(() => {
    const fetchAssociatedEquipments = async () => {
      if (groups && groups.length > 0) {
        const groupsWithEquipments = await Promise.all(
          groups.map(async (group) => {
            const associated_equipment_ids = await junctionTableManager.getEquipmentsForGroup(group.id);
            return { ...group, associated_equipment_ids };
          })
        );
        setAugmentedGroups(groupsWithEquipments);
      } else {
        setAugmentedGroups([]);
      }
    };

    fetchAssociatedEquipments();
  }, [groups]); // Re-run when groups data changes

  const getEquipmentName = useCallback((equipmentId: string) => {
    const equipment = equipments?.find(e => e.id === equipmentId);
    return equipment?.name || 'Équipement inconnu';
  }, [equipments]);

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      equipment_ids: [],
      shared_image_url: null
    });
    setEditingGroup(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleOpenAddDialog = () => {
    resetFormData();
    setOpenDialog(true);
  };

  const handleOpenEditDialog = async (group: EquipmentGroup) => {
    // Fetch associated equipment IDs for the group being edited
    const associatedEquipmentIds = await junctionTableManager.getEquipmentsForGroup(group.id);

    setFormData({
      name: group.name,
      description: group.description || '',
      equipment_ids: associatedEquipmentIds, // Populate with fetched IDs
      shared_image_url: group.shared_image_url || null
    });
    setEditingGroup(group); // Store the full group object
    setImagePreview(group.shared_image_url || null);
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEquipmentMultiSelected = (selectedEquipments: Equipment[]) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: selectedEquipments.map(eq => eq.id)
    }));
    setIsEquipmentSelectorOpen(false);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: (prev.equipment_ids || []).filter(id => id !== equipmentId)
    }));
  };

  const handleSaveGroup = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est obligatoire",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl = formData.shared_image_url;

      if (selectedFile) {
        if (editingGroup && formData.shared_image_url) {
          // Delete old image if it exists and a new one is being uploaded
          await deleteFileFromSupabase('group_images', formData.shared_image_url);
        }

        const filePath = `${uuidv4()}-${selectedFile.name}`;
        imageUrl = await uploadFileToSupabase('group_images', selectedFile, filePath);
      } else if (editingGroup && !imagePreview && editingGroup.shared_image_url) {
        // If no new file selected and image preview is cleared, and there was an old image, delete it
        await deleteFileFromSupabase('group_images', editingGroup.shared_image_url);
        imageUrl = null;
      }
      
      const now = new Date().toISOString();
      const groupDataToSave = {
        name: formData.name,
        description: formData.description,
        shared_image_url: imageUrl,
        updated_at: now
      };

      let groupId: string;

      if (editingGroup) {
        await updateDocument(editingGroup.id, groupDataToSave);
        groupId = editingGroup.id;
      } else {
        const newGroupId = uuidv4();
        const newGroup = {
          id: newGroupId,
          ...groupDataToSave,
          created_at: now,
        };
        await addDocument(newGroup);
        groupId = newGroupId;
      }

      // Gérer les relations avec la table de jonction
      if (groupId) {
        await junctionTableManager.updateGroupEquipmentMembers(groupId, formData.equipment_ids);
        // Propager la description du groupe vers les équipements associés si pertinent
        try {
          const result: any = await junctionTableManager.propagateGroupDescriptionToEquipments(groupId);
          if (result && typeof result === 'object') {
            if (result.updated > 0 && result.skipped > 0) {
              toast({
                title: "Description mise à jour",
                description: `Description propagée vers ${result.updated} équipement(s). ${result.skipped} équipement(s) avec description personnalisée ont été préservés.`,
              });
            } else if (result.updated > 0) {
              toast({
                title: "Description mise à jour",
                description: `Description propagée vers ${result.updated} équipement(s).`,
              });
            } else if (result.skipped > 0) {
              toast({
                title: "Description du groupe mise à jour",
                description: `Tous les équipements associés (${result.skipped}) ont déjà une description personnalisée qui a été préservée.`,
              });
            }
          }
        } catch (e) {
          console.warn('Propagation de la description du groupe échouée (ignorée):', e);
        }
      }

      toast({
        title: editingGroup ? "Groupe mis à jour" : "Groupe créé",
        description: `Le groupe ${formData.name} a été ${editingGroup ? 'mis à jour' : 'créé'} avec succès.`
      });

      resetFormData();
      setOpenDialog(false);
    } catch (error: any) {
      console.error("Error saving group:", error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la sauvegarde: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (groupsLoading || equipmentsLoading) {
    return <div>Chargement des groupes et équipements...</div>;
  }

  if (groupsError) {
    return <div>Erreur lors du chargement des groupes.</div>;
  }

  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {augmentedGroups && augmentedGroups.length > 0 ? (
        augmentedGroups.map(group => (
          <CustomCard key={group.id} className="p-4">
            {group.shared_image_url && (
              <div className="mb-3">
                <img
                  src={group.shared_image_url}
                  alt={group.name}
                  className="w-full h-40 object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              </div>
            )}
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="text-xs text-muted-foreground mt-2">
              {group.associated_equipment_ids ? group.associated_equipment_ids.length : 0} équipements
            </p>
            <div className="mt-4 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenEditDialog(group)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => { setGroupToDelete(group); setIsDeleteAlertOpen(true); }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CustomCard>
        ))
      ) : (
        <div className="col-span-full text-center p-6 border rounded-md">
          <p className="text-muted-foreground">Aucun groupe d'équipement trouvé.</p>
        </div>
      )}
    </div>
  );

  const ListView = () => (
    <Table>
      <TableCaption>Liste des groupes d'équipements</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Nom</TableHead>
          
          <TableHead>Nombre d'équipements</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {augmentedGroups && augmentedGroups.length > 0 ? (
          augmentedGroups.map(group => (
            <TableRow key={group.id}>
              <TableCell>
                {group.shared_image_url ? (
                  <img
                    src={group.shared_image_url}
                    alt={`Photo du groupe ${group.name}`}
                    className="h-10 w-10 object-contain rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/40?text=N/A';
                      e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                    N/A
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell>{group.associated_equipment_ids?.length || 0}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => { setGroupToDelete(group); setIsDeleteAlertOpen(true); }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
              Aucun groupe d'équipement trouvé.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Groupes d'équipements</h1>
        <div className="flex gap-2">
          {/* View toggle buttons */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau groupe
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? <GridView /> : <ListView />}

      {/* Dialog for creating/editing groups */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        if (!open) resetFormData();
        setOpenDialog(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Modifier le groupe" : "Créer un nouveau groupe"}
            </DialogTitle>
            <DialogDescription id="dialog-description">
              {editingGroup ? "Modifiez les détails du groupe d'équipement." : "Remplissez les informations pour créer un nouveau groupe d'équipement."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center text-sm font-medium">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                Nom du groupe
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ex: Équipements de la cafétéria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center text-sm font-medium">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Une brève description du rôle de ce groupe d'équipements."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-photo" className="flex items-center text-sm font-medium">
                <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Photo du groupe (optionnel)
              </Label>
              <Input
                id="group-photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Aperçu :</p>
                  <img src={imagePreview} alt="Aperçu de l'image" className="mt-1 h-20 object-contain rounded-md" />
                </div>
              )}
            </div>

            {/* Equipment Selection Section */}
            <div className="space-y-4 border rounded-md p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <WrenchIcon className="h-4 w-4" />
                  Équipements associés
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEquipmentSelectorOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Sélectionner des équipements
                </Button>
              </div>

              {formData.equipment_ids.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun équipement sélectionné</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.equipment_ids.map((equipmentId) => (
                    <Badge key={equipmentId} variant="outline" className="bg-green-50 text-green-700 border-green-200 pr-1">
                      <WrenchIcon className="w-3 h-3 mr-1" />
                      {getEquipmentName(equipmentId)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEquipment(equipmentId)}
                        className="ml-1 p-0 h-auto hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveGroup}>
              {editingGroup ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Selector Modal for multi-selection */}
      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        equipments={equipments || []}
        groups={augmentedGroups} // Pass augmented groups for filtering within selector if needed
        multiSelect={true}
        onMultiSelect={handleEquipmentMultiSelected}
        initialSelectedEquipmentIds={formData.equipment_ids}
        title="Sélectionner les équipements pour ce groupe"
        placeholder="Rechercher un équipement à ajouter au groupe..."
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe "{groupToDelete?.name}" ?</AlertDialogTitle>
            <AlertDialogDescription>
              Choisissez la politique pour les relations: détacher seulement, ou détacher et supprimer les documents/pièces orphelins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" className="h-4 w-4" checked={deletePolicy === 'cleanup'} onChange={() => setDeletePolicy('cleanup')} />
              Supprimer le groupe, puis supprimer les documents/pièces orphelins
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" className="h-4 w-4" checked={deletePolicy === 'detach'} onChange={() => setDeletePolicy('detach')} />
              Supprimer uniquement le groupe (ne supprime pas les documents/pièces)
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                if (!groupToDelete) { setIsDeleteAlertOpen(false); return; }
                try {
                  // Detach equipments
                  await supabase.from('equipment_group_members').delete().eq('group_id', groupToDelete.id);
                  // Detach documents and optionally cleanup
                  const { data: docMembers } = await supabase
                    .from('document_group_members')
                    .select('document_id')
                    .eq('group_id', groupToDelete.id);
                  const documentIds = (docMembers || []).map(m => m.document_id);
                  if (documentIds.length > 0) {
                    await supabase.from('document_group_members').delete().eq('group_id', groupToDelete.id);
                    if (deletePolicy === 'cleanup') {
                      for (const docId of documentIds) {
                        const [{ data: otherGroups }, { data: docRow }] = await Promise.all([
                          supabase.from('document_group_members').select('group_id').eq('document_id', docId),
                          supabase.from('documents').select('id, equipment_ids').eq('id', docId).single()
                        ]);
                        const hasOtherGroups = (otherGroups || []).length > 0;
                        const hasEquipmentIds = Array.isArray(docRow?.equipment_ids) && (docRow?.equipment_ids?.length || 0) > 0;
                        if (!hasOtherGroups && !hasEquipmentIds) {
                          await supabase.from('documents').delete().eq('id', docId);
                        }
                      }
                    }
                  }
                  // Detach parts and optionally cleanup
                  const { data: partMembers } = await supabase
                    .from('part_group_members')
                    .select('part_id')
                    .eq('group_id', groupToDelete.id);
                  const partIds = (partMembers || []).map(m => m.part_id);
                  if (partIds.length > 0) {
                    await supabase.from('part_group_members').delete().eq('group_id', groupToDelete.id);
                    if (deletePolicy === 'cleanup') {
                      for (const partId of partIds) {
                        const [{ data: otherGroups }, { data: partRow }] = await Promise.all([
                          supabase.from('part_group_members').select('group_id').eq('part_id', partId),
                          supabase.from('parts').select('id, equipment_ids').eq('id', partId).single()
                        ]);
                        const hasOtherGroups = (otherGroups || []).length > 0;
                        const hasEquipmentIds = Array.isArray(partRow?.equipment_ids) && (partRow?.equipment_ids?.length || 0) > 0;
                        if (!hasOtherGroups && !hasEquipmentIds) {
                          await supabase.from('parts').delete().eq('id', partId);
                        }
                      }
                    }
                  }
                  // Delete shared image
                  if (groupToDelete.shared_image_url) {
                    await deleteFileFromSupabase('group_images', groupToDelete.shared_image_url);
                  }
                  // Delete group
                  await supabase.from('equipment_groups').delete().eq('id', groupToDelete.id);
                  setIsDeleteAlertOpen(false);
                  setGroupToDelete(null);
                  setDeletePolicy('cleanup');
                  toast({ title: 'Groupe supprimé', description: 'Relations détachées et suppression effectuée.' });
                } catch (e: any) {
                  toast({ title: 'Erreur', description: e.message || 'Suppression impossible', variant: 'destructive' });
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EquipmentGroupsPage;
