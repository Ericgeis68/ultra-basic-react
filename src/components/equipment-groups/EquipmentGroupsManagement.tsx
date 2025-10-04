import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast'; // Corrected import path for useToast
import { useCollection } from '@/hooks/use-supabase-collection';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Equipment } from '@/types/equipment';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Plus, PencilIcon, TrashIcon, Search, WrenchIcon, X, ImageIcon, Tag, FileText } from 'lucide-react'; // Added Tag and FileText
import { v4 as uuidv4 } from 'uuid';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { syncEquipmentImagesWithGroup } from '@/lib/equipment-group-image-sync';
import { junctionTableManager } from '@/lib/junction-tables'; // Import junctionTableManager
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase'; // Import file upload/delete utilities
import { Label } from '@/components/ui/label'; // Import Label

const EquipmentGroupsManagement = () => {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EquipmentGroup | null>(null); // Store full group object
  const [searchTerm, setSearchTerm] = useState('');
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    addDocument,
    updateDocument,
    deleteDocument
  } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups'
  });

  const {
    data: equipments,
    loading: equipmentsLoading
  } = useCollection<Equipment>({
    tableName: 'equipments'
  });

  // State to hold groups with their associated equipment IDs for display
  const [augmentedGroups, setAugmentedGroups] = useState<EquipmentGroup[]>([]);

  // Effect to fetch associated equipment IDs for each group for display
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

  // Fetch related data for EquipmentSelector filters
  const { data: buildings } = useCollection<BuildingType>({ tableName: 'buildings' });
  const { data: services } = useCollection<Service>({ tableName: 'services' });
  const { data: locations } = useCollection<Location>({ tableName: 'locations' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    equipment_ids: [] as string[],
    shared_image_url: null as string | null
  });

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
    const equipmentIds = await junctionTableManager.getEquipmentsForGroup(group.id);
    setFormData({
      name: group.name,
      description: group.description || '',
      equipment_ids: equipmentIds,
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
          await deleteFileFromSupabase('equipment-images', formData.shared_image_url);
        }

        const filePath = `groups/${uuidv4()}-${selectedFile.name}`;
        imageUrl = await uploadFileToSupabase('equipment-images', selectedFile, filePath);
      } else if (editingGroup && !imagePreview && editingGroup.shared_image_url) {
        // If no new file selected and image preview is cleared, and there was an old image, delete it
        await deleteFileFromSupabase('equipment-images', editingGroup.shared_image_url);
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
        
        // Propager automatiquement la description du groupe vers les équipements associés
        if (formData.description && formData.description.trim().length > 0) {
          try {
            const result = await junctionTableManager.propagateGroupDescriptionToEquipments(groupId);
            
            // Afficher un message informatif sur la propagation
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
          } catch (error) {
            console.warn('Erreur lors de la propagation de la description:', error);
            // Ne pas bloquer la sauvegarde pour cette erreur
          }
        }
      }

      // Synchroniser les images d'équipement avec l'image du groupe
      if (groupId && imageUrl && formData.equipment_ids.length > 0) {
        try {
          await syncEquipmentImagesWithGroup(
            groupId,
            imageUrl, // Use the potentially new imageUrl
            formData.equipment_ids
          );
          console.log('Equipment images synchronized with group image');
        } catch (syncError) {
          console.error('Error synchronizing equipment images:', syncError);
          toast({
            title: "Avertissement",
            description: "Le groupe a été sauvegardé mais la synchronisation des images a échoué.",
            variant: "destructive"
          });
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

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${groupName}" ?`)) {
      return;
    }

    try {
      // First, remove all associations from the junction table
      await junctionTableManager.updateGroupEquipmentMembers(groupId, []);
      
      // Then, delete the group itself
      await deleteDocument(groupId);

      toast({
        title: "Groupe supprimé",
        description: `Le groupe ${groupName} a été supprimé avec succès.`
      });
    } catch (error: any) {
      console.error("Error deleting group:", error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la suppression: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const filteredGroups = augmentedGroups?.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  const getEquipmentName = useCallback((equipmentId: string) => {
    const equipment = equipments?.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Équipement inconnu';
  }, [equipments]);

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des groupes d'équipements</h1>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un groupe..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {groupsLoading || equipmentsLoading ? (
          <div>Chargement des groupes et équipements...</div>
        ) : groupsError ? (
          <div className="p-4 border border-destructive text-destructive rounded-md">
            Erreur lors du chargement des groupes: {groupsError.message || 'Erreur inconnue'}
          </div>
        ) : (
          <Table>
            <TableCaption>Liste des groupes d'équipements</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Nombre d'équipements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length > 0 ? (
                filteredGroups.map(group => (
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
                    <TableCell>{group.description}</TableCell>
                    <TableCell>{group.associated_equipment_ids?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(group)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id, group.name)}>
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? "Aucun groupe ne correspond à votre recherche" : "Aucun groupe créé"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

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
                    disabled={equipmentsLoading}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Sélectionner des équipements
                  </Button>
                </div>

                {equipmentsLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement des équipements...</div>
                ) : formData.equipment_ids.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucun équipement sélectionné</div>
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
      </div>

      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onMultiSelect={handleEquipmentMultiSelected} // Changed to onMultiSelect
        equipments={equipments || []}
        groups={augmentedGroups} // Pass augmented groups for filtering within selector if needed
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        multiSelect={true} // Ensure multi-select is enabled
        initialSelectedEquipmentIds={formData.equipment_ids} // Pass initial selected IDs
        title="Sélectionner les équipements pour ce groupe"
        placeholder="Rechercher un équipement à ajouter au groupe..."
      />
    </>
  );
};

export default EquipmentGroupsManagement;
