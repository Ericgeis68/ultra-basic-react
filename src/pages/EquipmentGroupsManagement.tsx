import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { useCollection } from '@/hooks/use-supabase-collection';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Equipment } from '@/types/equipment';
import { Plus, PencilIcon, TrashIcon, Search, Filter, Image as ImageIcon, WrenchIcon, X, Tag, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const initialFormData: Partial<EquipmentGroup> = {
  name: '',
  description: '',
  shared_image_url: null,
  equipment_ids: [],
};

const EquipmentGroupsManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EquipmentGroup>>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);

  const groups = useCollection<EquipmentGroup>({ tableName: 'equipment_groups' });
  const equipments = useCollection<Equipment>({ tableName: 'equipments' });
  const { toast } = useToast();

  const handleEquipmentMultiSelected = (selectedEquipments: Equipment[]) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: selectedEquipments.map(eq => eq.id)
    }));
    setIsEquipmentSelectorOpen(false);
  };

  useEffect(() => {
    if (groups.error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes d'équipements",
        variant: "destructive",
      });
    }
  }, [groups.error, toast]);

  useEffect(() => {
    if (equipments.error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les équipements",
        variant: "destructive",
      });
    }
  }, [equipments.error, toast]);

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.shared_image_url;

      if (selectedFile) {
        if (formData.shared_image_url) {
          await deleteFileFromSupabase('equipment_group_photos', formData.shared_image_url);
        }

        const filePath = `${uuidv4()}-${selectedFile.name}`;
        imageUrl = await uploadFileToSupabase('equipment_group_photos', selectedFile, filePath);
      }

      if (isEditing) {
        await supabase
          .from('equipment_groups')
          .update({ ...formData, shared_image_url: imageUrl, equipment_ids: formData.equipment_ids || [] })
          .eq('id', formData.id);
        toast({
          title: "Succès",
          description: "Groupe d'équipement mis à jour avec succès.",
        });
      } else {
        const { id, ...newGroupData } = formData;
        await supabase
          .from('equipment_groups')
          .insert([{ 
            ...newGroupData, 
            name: formData.name, // Ensure name is passed
            description: formData.description, // Ensure description is passed
            shared_image_url: imageUrl, 
            equipment_ids: formData.equipment_ids || [] 
          }]);
        toast({
          title: "Succès",
          description: "Nouveau groupe d'équipement créé avec succès.",
        });
      }

      groups.refetch();
      equipments.refetch(); // Rafraîchir les équipements après la propagation de la description
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedFile(null);
      setImagePreview(null);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error during save:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'enregistrement.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = async () => {
    try {
      if (formData.shared_image_url) {
        await deleteFileFromSupabase('equipment_group_photos', formData.shared_image_url);
        await supabase
          .from('equipment_groups')
          .update({ shared_image_url: null })
          .eq('id', formData.id);

        setFormData({ ...formData, shared_image_url: null });
        setImagePreview(null);
        setSelectedFile(null);
        groups.refetch();
        toast({
          title: "Succès",
          description: "Image supprimée avec succès.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression de l'image.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (groupId: string, imageUrl: string | null) => {
    try {
      if (imageUrl) {
        await deleteFileFromSupabase('equipment_group_photos', imageUrl);
      }

      await supabase.from('equipment_groups').delete().eq('id', groupId);
      groups.refetch();
      toast({
        title: "Succès",
        description: "Groupe d'équipement supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression du groupe.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (group: EquipmentGroup) => {
    setIsEditing(true);
    setFormData(group);
    setIsDialogOpen(true);
    setImagePreview(group.shared_image_url || null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectEquipment = (equipment: Equipment) => {
    setFormData(prev => {
      const currentIds = prev.equipment_ids || [];
      if (!currentIds.includes(equipment.id)) {
        return { ...prev, equipment_ids: [...currentIds, equipment.id] };
      }
      return prev;
    });
    // You may want to close the selector after each selection for better UX
    // setIsEquipmentSelectorOpen(false);
  };
  
  const handleRemoveEquipmentFromGroup = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: prev.equipment_ids?.filter(id => id !== equipmentId)
    }));
  };

  const filteredGroups = useMemo(() => {
    if (!groups.data) return [];
    return groups.data.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups.data, searchTerm]);

  const getEquipmentNames = useCallback((equipmentIds: string[] | null) => {
    if (!equipmentIds || !equipments.data) return 'Aucun équipement sélectionné';
    const names = equipments.data
      .filter(eq => equipmentIds.includes(eq.id))
      .map(eq => eq.name);
    return names.length > 0 ? names.join(', ') : 'Aucun équipement sélectionné';
  }, [equipments.data]);

  return (
    <div className="container mx-auto p-4 pt-20 md:pl-72 lg:pl-80">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des groupes d'équipements</CardTitle>
          <CardDescription>
            Ici, vous pouvez gérer les différents groupes d'équipements.
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Input
              type="text"
              placeholder="Rechercher un groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setFormData(initialFormData);
                setSelectedFile(null);
                setImagePreview(null);
                setIsEditing(false);
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setIsEditing(false); setFormData(initialFormData); setSelectedFile(null); setImagePreview(null); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Modifier le groupe" : "Créer un nouveau groupe"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Modifiez les informations du groupe." : "Ajoutez un nouveau groupe pour organiser vos équipements."}
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
                    value={formData.name || ''}
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
                    value={formData.description || ''}
                    onChange={handleFormChange}
                    placeholder="Une brève description du rôle de ce groupe d'équipements."
                    rows={3}
                  />
                </div>

                 {/* Photo Upload Field */}
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
                  {imagePreview && <img src={imagePreview} alt="Aperçu" className="mt-2 h-20 object-contain rounded-md" />}
                  {!imagePreview && formData.shared_image_url && (
                     <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Photo actuelle :</p>
                        <img src={formData.shared_image_url} alt="Current Group Photo" className="mt-1 h-20 object-contain rounded-md" />
                     </div>
                  )}
                </div>

                {/* Equipment Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <WrenchIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    Équipements dans le groupe
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEquipmentSelectorOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Sélectionner des équipements
                  </Button>
                  
                  { (formData.equipment_ids || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {formData.equipment_ids?.map(id => {
                            const equipment = equipments.data?.find(e => e.id === id);
                            return (
                                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                    {equipment?.name || 'Chargement...'}
                                    <button onClick={() => handleRemoveEquipmentFromGroup(id)} className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground pt-1">
                    {(formData.equipment_ids || []).length} équipement(s) sélectionné(s).
                  </p>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleSave}>
                  {isEditing ? "Enregistrer les modifications" : "Créer le groupe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Équipements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>{getEquipmentNames(group.equipment_ids)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id, group.shared_image_url)}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Equipment Selector Modal */}
      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        equipments={equipments.data || []}
        multiSelect={true}
        onMultiSelect={handleEquipmentMultiSelected}
        initialSelectedEquipmentIds={formData.equipment_ids || []}
        title="Sélectionner les équipements pour ce groupe"
        placeholder="Rechercher un équipement à ajouter au groupe..."
      />
    </div>
  );
};

export default EquipmentGroupsManagement;
