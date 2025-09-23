import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, FileText, Plus, Trash } from 'lucide-react';
import CustomCard from '@/components/ui/CustomCard';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Document } from '@/types/document';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/use-documents';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentFormData {
  title: string;
  description: string;
  category: string;
  tags: string;
  equipment_ids: string[];
  group_ids: string[];
  file: File | null;
}

const EquipmentDocumentsPage = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const { documents, loading, error, uploadDocumentWithFile, deleteDocument: deleteDocumentService } = useDocuments();
  const { data: equipments, loading: equipmentsLoading } = useCollection<Equipment>({ tableName: 'equipments' });
  const { data: groups, loading: groupsLoading } = useCollection<EquipmentGroup>({ tableName: 'equipmentGroups' });
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    description: '',
    category: '',
    tags: '',
    equipment_ids: [equipmentId || ''],
    group_ids: [],
    file: null,
  });

  const currentEquipment = equipments?.find(eq => eq.id === equipmentId);
  const equipmentDocuments = documents?.filter(doc => doc.equipment_ids?.includes(equipmentId || '')) || [];

  const relatedGroups = groups?.filter(group => 
    group.equipment_ids?.includes(equipmentId || '')
  ) || [];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`[handleFormChange] name: ${name}, value: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`[handleTextareaChange] name: ${name}, value: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`[handleSelectChange] name: ${name}, value: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log(`[handleFileChange] file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleEquipmentChange = (equipmentId: string, isChecked: boolean) => {
    console.log(`[handleEquipmentChange] equipmentId: ${equipmentId}, isChecked: ${isChecked}`);
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        equipment_ids: [...prev.equipment_ids, equipmentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        equipment_ids: prev.equipment_ids.filter(id => id !== equipmentId)
      }));
    }
  };

  const handleGroupChange = (groupId: string, isChecked: boolean) => {
    console.log(`[handleGroupChange] groupId: ${groupId}, isChecked: ${isChecked}`);
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        group_ids: [...prev.group_ids, groupId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        group_ids: prev.group_ids.filter(id => id !== groupId)
      }));
    }
  };

  const handleSaveDocument = async () => {
    console.log("handleSaveDocument called", formData);

    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du document est obligatoire",
        variant: "destructive"
      });
      return;
    }

    if (!formData.file) {
      toast({
        title: "Erreur",
        description: "Vous devez sélectionner un fichier",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await uploadDocumentWithFile({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        equipment_ids: formData.equipment_ids,
        group_ids: formData.group_ids,
        filetype: formData.file.type,
        filename: formData.file.name
      }, formData.file);
      
      if (result.success) {
        setFormData({
          title: '',
          description: '',
          category: '',
          tags: '',
          equipment_ids: [equipmentId || ''],
          group_ids: [],
          file: null,
        });
        setOpenDialog(false);
      } else {
        toast({
          title: "Erreur",
          description: result.error?.message || "Une erreur s'est produite lors de l'enregistrement du document",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite: ${error.message}`,
        variant: "destructive"
      });
      console.error("Erreur lors de l'ajout du document:", error);
    }
  };

  const openDeleteConfirmation = (document: Document) => {
    console.log("Opening delete confirmation for document:", document);
    setDocumentToDelete(document);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !documentToDelete.id) {
      toast({
        title: "Erreur",
        description: "ID du document manquant.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Suppression du document:", documentToDelete.id, documentToDelete.title);
      setIsDeleting(true);
      
      const result = await deleteDocumentService(documentToDelete.id);
      
      if (result.success) {
        setIsDeleteAlertOpen(false);
        setDocumentToDelete(null);
        
        toast({
          title: "Document supprimé",
          description: `Le document ${documentToDelete.title} a été supprimé avec succès.`,
        });
      } else {
        throw new Error(result.error?.message || "Échec de la suppression");
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression du document:", error);
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du document: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div>Chargement des documents...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des documents.</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Button asChild variant="outline" size="sm">
          <Link to="/equipment">
            Retour à la liste des équipements
          </Link>
        </Button>
        <Button size="sm" onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Documents techniques</h1>
        {currentEquipment && (
          <p className="text-muted-foreground">Documents pour l'équipement: <b>{currentEquipment.name}</b></p>
        )}
        {relatedGroups.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Appartient aux groupes: {relatedGroups.map(group => group.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {equipmentDocuments.length > 0 ? (
        <div className="space-y-4">
          {equipmentDocuments.map(doc => (
            <CustomCard key={doc.id} className="p-3" variant="outline">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{doc.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {doc.uploadDate}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {doc.size ? formatFileSize(doc.size) : ''}
                    </span>
                    {doc.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {doc.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={doc.fileurl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => openDeleteConfirmation(doc)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CustomCard>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 border rounded-md">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Aucun document disponible pour cet équipement</p>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Titre du document"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleTextareaChange}
                placeholder="Description du document"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manuel">Manuel</SelectItem>
                  <SelectItem value="Schéma technique">Schéma technique</SelectItem>
                  <SelectItem value="Procédure">Procédure</SelectItem>
                  <SelectItem value="Certificat">Certificat</SelectItem>
                  <SelectItem value="Catalogue">Catalogue</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
              <Input
                name="tags"
                value={formData.tags}
                onChange={handleFormChange}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fichier </label>
              <Input
                type="file"
                className="cursor-pointer"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Groupes d'équipements</label>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                {groupsLoading ? (
                  <div>Chargement des groupes...</div>
                ) : groups ? (
                  groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={(formData.group_ids || []).includes(group.id)}
                        onCheckedChange={(checked) => handleGroupChange(group.id, checked === true)}
                      />
                      <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                        {group.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(group.equipment_ids || []).length} équipement(s))
                        </span>
                      </label>
                    </div>
                  ))
                ) : (
                  <div>Aucun groupe trouvé.</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Équipements associés</label>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                {equipmentsLoading ? (
                  <div>Chargement des équipements...</div>
                ) : equipments ? (
                  equipments.map(equipment => (
                    <div key={equipment.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`equipment-${equipment.id}`}
                        checked={formData.equipment_ids.includes(equipment.id)}
                        onCheckedChange={(checked) => handleEquipmentChange(equipment.id, checked === true)}
                      />
                      <label htmlFor={`equipment-${equipment.id}`} className="text-sm cursor-pointer">
                        {equipment.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div>Aucun équipement trouvé.</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveDocument} type="submit">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.title}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              <Trash className="h-4 w-4 mr-1" />
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EquipmentDocumentsPage;
