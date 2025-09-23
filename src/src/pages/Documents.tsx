import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/hooks/use-supabase-collection';
import { useEquipmentContext } from '@/contexts/EquipmentContext';
import { Document } from '@/types/document';
import { Equipment } from '@/types/equipment';
import { Plus, Search, FilePlus, FileText, File, Package, Users, Trash, Grid, List, Upload, Pencil, WrenchIcon, X, AlignLeft, Tag, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
import { EquipmentGroup } from '@/types/equipmentGroup';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { supabase } from '@/lib/supabase';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import GroupSelector from '@/components/equipment-groups/GroupSelector';
import { uploadDocumentWithFile, updateDocumentFile } from '@/lib/documents';
import { junctionTableManager } from '@/lib/junction-tables'; // Import junctionTableManager
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeviceType } from '@/hooks/use-mobile';


type DocumentSortColumn = 'title' | 'category' | 'createdat' | 'equipment_names' | 'group_names';

const Documents = () => {
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [associationMode, setAssociationMode] = useState<'equipment' | 'group'>('equipment');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [isFilterEquipmentSelectorOpen, setIsFilterEquipmentSelectorOpen] = useState(false);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<DocumentSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { equipments } = useEquipmentContext();

  const {
    data: fetchedDocuments,
    loading,
    error,
    addDocument: addSupabaseDocument,
    updateDocument: updateSupabaseDocument,
    deleteDocument: deleteSupabaseDocument,
    refetch: refetchDocuments
  } = useCollection<Document>({
    tableName: 'documents'
  });

  const {
    data: equipmentGroups,
    loading: groupsLoading,
  } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups'
  });

  const { data: buildings } = useCollection<BuildingType>({ tableName: 'buildings' });
  const { data: services } = useCollection<Service>({ tableName: 'services' });
  const { data: locations } = useCollection<Location>({ tableName: 'locations' });

  // FormData now includes group_ids for local state, but not for direct DB insertion into 'documents' table
  const [formData, setFormData] = useState<Omit<Document, 'id' | 'group_ids'> & { file: File | null, group_ids: string[] }>({
    title: '',
    description: '',
    fileurl: '',
    filetype: '',
    category: 'manual', // Changed to 'manual' to match Document type
    tags: [],
    equipment_ids: [],
    group_ids: [], // Managed locally for form, then via join table
    filename: '',
    size: 0,
    createdat: new Date().toISOString(),
    file: null
  });

  useEffect(() => {
    console.log("[Documents] useEffect triggered. Loading:", loading, "Fetched Documents:", fetchedDocuments);
    if (!loading && fetchedDocuments) {
      console.log("[Documents] Setting documents state with fetched data.");
      // When documents are fetched, we need to enrich them with associated group IDs
      const fetchAndSetDocuments = async () => {
        const documentsWithGroups = await Promise.all(fetchedDocuments.map(async (doc) => {
          const associatedGroupIds = await junctionTableManager.getGroupsForDocument(doc.id);
          return { ...doc, associatedGroupIds };
        }));
        setDocuments(documentsWithGroups);
      };
      fetchAndSetDocuments();
    } else if (!loading && !fetchedDocuments) {
       console.log("[Documents] Fetching finished, but no documents returned.");
       setDocuments([]);
    }
  }, [fetchedDocuments, loading]);

  useEffect(() => {
    if (!isAddDialogOpen) {
      setFormData(prev => ({ ...prev, file: null }));
    }
  }, [isAddDialogOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log("[Documents] File selected:", file);
    setFormData(prev => ({
      ...prev,
      file: file,
      filename: file?.name || '',
      size: file?.size || 0,
      filetype: file?.type.split('/')[1] || 'other'
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value as any // Cast to any for category
    }));
  };

  const handleEquipmentSelected = (equipment: Equipment) => {
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

  const handleFilterEquipmentSelect = (equipment: Equipment) => {
    setEquipmentFilter(equipment.id);
    setIsFilterEquipmentSelectorOpen(false);
  };

  const handleSubmit = async () => {
    console.log("[Documents] Submit button clicked. FormData:", formData);
    try {
      if (!formData.title || (!formData.file && !isEditMode && !formData.fileurl)) {
        toast({
          title: "Erreur de validation",
          description: "Le titre et le fichier (pour un nouveau document) sont obligatoires.",
          variant: "destructive"
        });
        console.warn("[Documents] Validation failed: Title or file missing for new document.");
        return;
      }

      setUploading(true);
      console.log("[Documents] Uploading state set to true.");

      let finalFileUrl: string | null = formData.fileurl;
      let finalFilename: string | null = formData.filename;
      let finalFileSize: number = formData.size;
      let finalFileType: string | null = formData.filetype;
      const selectedGroupIds = formData.group_ids || [];

      // Combine equipment IDs from groups for the document data (denormalization for documents.equipment_ids)
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
      console.log("[Documents] Combined equipment_ids (for documents.equipment_ids):", allEquipmentIds);

      if (formData.file) { // A new file has been selected (either new doc or editing existing)
        if (isEditMode && selectedDocument) {
          // Update existing document's file
          const { success, error: updateFileError, newFileUrl } = await updateDocumentFile(
            selectedDocument.id,
            selectedDocument.fileurl,
            formData.file
          );

          if (!success) {
            toast({
              title: "Erreur de mise à jour du fichier",
              description: `Échec de la mise à jour du fichier: ${updateFileError}`,
              variant: "destructive"
            });
            setUploading(false);
            return;
          }
          finalFileUrl = newFileUrl || null;
          finalFilename = formData.file.name;
          finalFileSize = formData.file.size;
          finalFileType = formData.file.type.split('/')[1] || 'other';
        } else {
          // Add new document with file using the helper function
          const { success, error: uploadError, document: uploadedDoc } = await uploadDocumentWithFile(
            {
              title: formData.title,
              description: formData.description,
              category: formData.category as any,
              equipment_ids: allEquipmentIds,
            },
            formData.file,
            selectedGroupIds // Pass groupIds for join table
          );

          if (!success) {
            toast({
              title: "Erreur d'upload",
              description: `Échec de l'upload du fichier: ${uploadError}`,
              variant: "destructive"
            });
            setUploading(false);
            return;
          }
          toast({
            title: "Document ajouté",
            description: "Le document a été ajouté avec succès."
          });
          setFormData({
            title: '', description: '', fileurl: '', filetype: '', category: 'manual', tags: [],
            equipment_ids: [], group_ids: [], filename: '', size: 0, createdat: new Date().toISOString(), file: null
          });
          setSelectedDocument(null);
          setIsAddDialogOpen(false);
          setIsEditMode(false);
          refetchDocuments();
          setUploading(false);
          return;
        }
      } else if (isEditMode && selectedDocument) {
        if (!formData.fileurl) {
          finalFileUrl = null;
          finalFilename = null;
          finalFileSize = 0;
          finalFileType = null;
        } else {
          finalFileUrl = selectedDocument.fileurl || null;
          finalFilename = selectedDocument.filename || null;
          finalFileSize = selectedDocument.size || 0;
          finalFileType = selectedDocument.filetype || null;
        }
      } else if (!isEditMode && !formData.file) {
         console.warn("[Documents] No file selected for new document, and not in edit mode.");
         setUploading(false);
         return;
      }

      const documentData: Omit<Document, 'id'> = {
        title: formData.title,
        description: formData.description || null,
        fileurl: finalFileUrl,
        filetype: finalFileType,
        category: formData.category || 'manual',
        tags: formData.tags || [],
        equipment_ids: allEquipmentIds, // This column still holds combined IDs
        filename: finalFilename,
        size: finalFileSize,
        createdat: formData.createdat || new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      console.log("[Documents] Document data prepared for save/update:", documentData);

      if (selectedDocument && isEditMode) {
        console.log(`[Documents] Updating document with ID: ${selectedDocument.id}`);
        const updatedDoc = await updateSupabaseDocument(selectedDocument.id, documentData);
        if (!updatedDoc) {
           console.error("[Documents] Supabase update error: failed to update document.");
           toast({
             title: "Erreur de mise à jour",
             description: `Échec de la mise à jour du document.`,
             variant: "destructive"
           });
           setUploading(false);
           return;
        }
        // Update document_group_members table for existing document
        await junctionTableManager.updateDocumentGroupMembers(selectedDocument.id, selectedGroupIds);
        console.log(`[Documents] Document ${selectedDocument.id} associations updated with groups:`, selectedGroupIds);

        toast({
          title: "Document mis à jour",
          description: "Le document a été modifié avec succès."
        });
      } else {
        // This branch should ideally not be hit for new documents with files, as uploadDocumentWithFile handles it.
        // It would only be hit if a new document is added WITHOUT a file (which is validated against).
        console.log("[Documents] Adding new document (no file or file handled by helper).");
        const success = await addSupabaseDocument(documentData);
         if (!success) {
           console.error("[Documents] Supabase add error: failed to add document.");
           toast({
             title: "Erreur d'ajout",
             description: `Échec de l'ajout du document.`,
             variant: "destructive"
           });
           setUploading(false);
           return;
         }
         // If document was added successfully here (without file), then update group members
         // Note: This path is less likely if file is required for new docs.
         // If `addSupabaseDocument` returns the new document, we can use its ID.
         // For now, assuming `addSupabaseDocument` handles the return or refetch is sufficient.
         console.log("[Documents] New document added successfully.");
        toast({
          title: "Document ajouté",
          description: "Le document a été ajouté avec succès."
        });
      }

      console.log("[Documents] Resetting form and closing dialog.");
      setFormData({
        title: '',
        description: '',
        fileurl: '',
        filetype: '',
        category: 'manual',
        tags: [],
        equipment_ids: [],
        group_ids: [],
        filename: '',
        size: 0,
        createdat: new Date().toISOString(),
        file: null
      });
      setSelectedDocument(null);
      setIsAddDialogOpen(false);
      setIsEditMode(false);

      refetchDocuments();
      console.log("[Documents] refetchDocuments called.");
    } catch (error: any) {
      console.error("[Documents] Error saving document:", error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de l'enregistrement du document: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      console.log("[Documents] Uploading state set to false.");
    }
  };

  const handleEditDocument = async (doc: Document & { associatedGroupIds?: string[] }) => {
    console.log("[Documents] Editing document:", doc);

    // Fetch associated group IDs for the document
    const associatedGroupIds = await junctionTableManager.getGroupsForDocument(doc.id);

    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description || '',
      fileurl: doc.fileurl || '',
      filetype: doc.filetype || '',
      category: doc.category || 'manual',
      tags: doc.tags || [],
      equipment_ids: doc.equipment_ids || [],
      group_ids: associatedGroupIds, // Set from fetched join table data
      filename: doc.filename || '',
      size: doc.size || 0,
      createdat: doc.createdat || new Date().toISOString(),
      file: null
    });
    setIsEditMode(true);
    setAssociationMode((associatedGroupIds && associatedGroupIds.length > 0) ? 'group' : 'equipment');
    setIsAddDialogOpen(true);
  };

  const openDeleteConfirmation = (doc: Document) => {
    console.log("[Documents] Opening delete confirmation for document:", doc);
    setDocumentToDelete(doc);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteDocument = async () => {
    console.log("[Documents] Deleting document:", documentToDelete);
    if (!documentToDelete || !documentToDelete.id) {
      toast({
        title: "Erreur",
        description: "ID du document manquant.",
        variant: "destructive"
      });
      console.warn("[Documents] Delete failed: Document or ID missing.");
      return;
    }

    try {
      // 1. Delete associations from document_group_members
      await junctionTableManager.updateDocumentGroupMembers(documentToDelete.id, []); // Pass empty array to delete all
      console.log(`[Documents] Deleted group associations for document ${documentToDelete.id}.`);

      // 2. Delete file from storage
      if (documentToDelete.fileurl) {
        const urlParts = documentToDelete.fileurl.split('/storage/v1/object/public/documents/');
        const filePath = urlParts.length > 1 ? urlParts[1] : null;

        if (filePath) {
           console.log(`[Documents] Attempting to delete file from storage: ${filePath}`);
           const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath]);

           if (storageError) {
             console.error("[Documents] Error deleting file from storage:", storageError);
           } else {
             console.log(`[Documents] File ${filePath} deleted from storage.`);
           }
        } else {
           console.warn("[Documents] Could not extract file path from URL for deletion:", documentToDelete.fileurl);
        }
      }

      // 3. Delete document record from database
      console.log(`[Documents] Deleting document record from database: ${documentToDelete.id}`);
      const success = await deleteSupabaseDocument(documentToDelete.id);

      if (success === null) {
         console.error("[Documents] Error deleting document from database");
         toast({
           title: "Erreur de suppression",
           description: `Échec de la suppression du document.`,
           variant: "destructive"
         });
         setIsDeleteAlertOpen(false);
         setDocumentToDelete(null);
         return;
      }

      console.log("[Documents] Document record deleted successfully.");
      setIsDeleteAlertOpen(false);
      setDocumentToDelete(null);

      await refetchDocuments();
      console.log("[Documents] refetchDocuments called after deletion.");

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès."
      });
    } catch (error) {
      console.error("[Documents] Error deleting document:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression du document.",
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    // Filter by equipment: check if equipment_ids (which includes group-derived equipment) contains the filter
    const matchesEquipment = equipmentFilter === 'all' || (doc.equipment_ids && doc.equipment_ids.includes(equipmentFilter));

    return matchesSearch && matchesCategory && matchesEquipment;
  });

  const getEquipmentName = useCallback((equipmentId: string) => {
    const equipment = equipments?.find(e => e.id === equipmentId);
    return equipment?.name;
  }, [equipments]);

  // Helper function to get valid equipment IDs (filter out deleted equipment)
  const getValidEquipmentIds = useCallback((equipmentIds: string[] | null | undefined) => {
    if (!equipmentIds || !equipments) return [];
    return equipmentIds.filter(id => equipments.some(eq => eq.id === id));
  }, [equipments]);

  const getGroupName = useCallback((groupId: string) => {
    const group = equipmentGroups?.find(g => g.id === groupId);
    return group?.name || 'Groupe inconnu';
  }, [equipmentGroups]);

  const sortedDocuments = useMemo(() => {
    if (!sortColumn) return filteredDocuments;

    const sorted = [...filteredDocuments].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'title':
          valA = a.title?.toLowerCase() || '';
          valB = b.title?.toLowerCase() || '';
          break;
        case 'category':
          valA = a.category?.toLowerCase() || '';
          valB = b.category?.toLowerCase() || '';
          break;
        case 'createdat':
          valA = new Date(a.createdat || 0).getTime();
          valB = new Date(b.createdat || 0).getTime();
          break;
        case 'equipment_names':
          valA = getValidEquipmentIds(a.equipment_ids)[0] ? getEquipmentName(getValidEquipmentIds(a.equipment_ids)[0])?.toLowerCase() || '' : '';
          valB = getValidEquipmentIds(b.equipment_ids)[0] ? getEquipmentName(getValidEquipmentIds(b.equipment_ids)[0])?.toLowerCase() || '' : '';
          break;
        case 'group_names':
          valA = (a as any).associatedGroupIds?.[0] ? getGroupName((a as any).associatedGroupIds[0])?.toLowerCase() || '' : '';
          valB = (b as any).associatedGroupIds?.[0] ? getGroupName((b as any).associatedGroupIds[0])?.toLowerCase() || '' : '';
          break;
        default:
          return 0;
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredDocuments, sortColumn, sortDirection, getEquipmentName, getValidEquipmentIds, getGroupName]);

  const handleSortChange = (column: DocumentSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const uniqueCategories = Array.from(new Set(documents.map(doc => doc.category).filter(Boolean)));

  const selectedFilterEquipment = equipments?.find(e => e.id === equipmentFilter);

  return (
    <div className="container mx-auto py-20 px-4">

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documentations</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-secondary' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-secondary' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  {!isMobile && "Trier"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value) => handleSortChange(value as DocumentSortColumn)}>
                  <DropdownMenuRadioItem value="title">
                    Titre
                    {sortColumn === 'title' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="category">
                    Catégorie
                    {sortColumn === 'category' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdat">
                    Date
                    {sortColumn === 'createdat' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="equipment_names">
                    Équipements
                    {sortColumn === 'equipment_names' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="group_names">
                    Groupes
                    {sortColumn === 'group_names' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => {
              setIsEditMode(false);
              setFormData({
                title: '',
                description: '',
                fileurl: '',
                filetype: '',
                category: 'manual',
                tags: [],
                equipment_ids: [],
                group_ids: [],
                filename: '',
                size: 0,
                createdat: new Date().toISOString(),
                file: null
              });
              setAssociationMode('equipment');
              setIsAddDialogOpen(true);
            }}>
              <FilePlus className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div>
            <Label className="text-sm font-medium mb-1 block">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1 block">Catégorie</Label>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1 block">Équipement</Label>
            <div className="relative">
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-start text-left font-normal"
                onClick={() => setIsFilterEquipmentSelectorOpen(true)}
              >
                <span className="truncate pr-5">
                  {selectedFilterEquipment ? selectedFilterEquipment.name : "Tous les équipements"}
                </span>
              </Button>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {equipmentFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                    onClick={() => setEquipmentFilter('all')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                 <Search className="h-4 w-4 ml-1 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p>Chargement des documents...</p>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="text-red-500">Erreur lors du chargement des documents.</p>
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      ) : sortedDocuments.length === 0 ? (
         <div className="p-4 text-center text-muted-foreground">
           {searchTerm || categoryFilter !== 'all' || equipmentFilter !== 'all'
             ? "Aucun document ne correspond à vos critères de recherche."
             : "Aucun document n'a encore été ajouté."}
         </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {sortedDocuments.map(doc => (
            <Card key={doc.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2 flex-1">{doc.title}</CardTitle>
                  {doc.category && (
                    <Badge variant="outline" className="whitespace-nowrap">
                      {doc.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="text-sm line-clamp-2 mb-4">
                    {doc.description}
                  </p>
                )}

                {getValidEquipmentIds(doc.equipment_ids).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Équipements associés</p>
                    <div className="flex flex-wrap gap-1">
                      {getValidEquipmentIds(doc.equipment_ids).slice(0, 3).map(eqId => (
                        <Badge key={eqId} variant="secondary" className="text-xs">
                          {getEquipmentName(eqId)}
                        </Badge>
                      ))}
                      {getValidEquipmentIds(doc.equipment_ids).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{getValidEquipmentIds(doc.equipment_ids).length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {(doc as any).associatedGroupIds && (doc as any).associatedGroupIds.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Groupes associés</p>
                    <div className="flex flex-wrap gap-1">
                      {(doc as any).associatedGroupIds.slice(0, 3).map((groupId: string) => (
                        <Badge key={groupId} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {getGroupName(groupId)}
                        </Badge>
                      ))}
                      {(doc as any).associatedGroupIds.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          +{(doc as any).associatedGroupIds.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {doc.fileurl ? (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="mb-1 text-xs font-medium text-muted-foreground">Fichier</h3>
                    <a
                      href={doc.fileurl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center text-sm"
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      {doc.filename || 'Voir le document'}
                      {doc.size && doc.size > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({Math.round(doc.size / 1024)} KB)
                        </span>
                      )}
                    </a>
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">Aucun fichier attaché.</p>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-end">
                <div className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDeleteConfirmation(doc)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('title')}
                >
                  <div className="flex items-center">
                    Titre
                    {sortColumn === 'title' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('category')}
                >
                  <div className="flex items-center">
                    Catégorie
                    {sortColumn === 'category' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('createdat')}
                >
                  <div className="flex items-center">
                    Date
                    {sortColumn === 'createdat' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('equipment_names')}
                >
                  <div className="flex items-center">
                    Équipements
                    {sortColumn === 'equipment_names' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSortChange('group_names')}
                >
                  <div className="flex items-center">
                    Groupes
                    {sortColumn === 'group_names' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>
                    {doc.category && <Badge variant="outline">{doc.category}</Badge>}
                  </TableCell>
                  <TableCell>
                    {doc.createdat ? new Date(doc.createdat).toLocaleDateString() : "Date inconnue"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getValidEquipmentIds(doc.equipment_ids).length > 0 ? (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {getEquipmentName(getValidEquipmentIds(doc.equipment_ids)[0])}
                          </Badge>
                          {getValidEquipmentIds(doc.equipment_ids).length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              +{getValidEquipmentIds(doc.equipment_ids).length - 1}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(doc as any).associatedGroupIds && (doc as any).associatedGroupIds.length > 0 ? (
                        <>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {getGroupName((doc as any).associatedGroupIds[0])}
                          </Badge>
                          {(doc as any).associatedGroupIds.length > 1 && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              +{(doc as any).associatedGroupIds.length - 1}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteConfirmation(doc)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Modifier le document" : "Ajouter un nouveau document"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  Nom du document *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nom du document"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Description du document"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Catégorie
                </Label>
                <Select
                  value={formData.category || 'manual'} // Default to 'manual'
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
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
                <Label htmlFor="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  Choisir un fichier
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="flex-1"
                    required={!isEditMode || !formData.fileurl}
                  />
                  {formData.file && formData.filename && (
                    <span className="text-sm text-muted-foreground">{formData.filename}</span>
                  )}
                </div>
                {isEditMode && formData.fileurl && !formData.file && (
                  <p className="text-sm text-muted-foreground">Fichier actuel: <a href={formData.fileurl} target="_blank" rel="noopener noreferrer" className="underline">{formData.filename || 'Lien existant'}</a></p>
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
                      disabled={!equipments || equipments.length === 0}
                    >
                      <Search className="h-4 w-4" />
                      Sélectionner
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
              ) : (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Groupes associés
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGroupSelectorOpen(true)}
                      className="flex items-center gap-2"
                      disabled={equipmentGroups?.length === 0}
                    >
                      <Search className="h-4 w-4" />
                      Sélectionner
                    </Button>
                  </div>

                  {formData.group_ids.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun groupe sélectionné</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.group_ids.map((groupId) => (
                        <Badge key={groupId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 pr-1">
                          <Users className="w-3 h-3 mr-1" />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : isEditMode ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le document "{documentToDelete?.title}" et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Equipment Selector Modal for Filter */}
      <EquipmentSelector
        isOpen={isFilterEquipmentSelectorOpen}
        onClose={() => setIsFilterEquipmentSelectorOpen(false)}
        onSelect={handleFilterEquipmentSelect}
        equipments={equipments}
        groups={equipmentGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        title="Sélectionner un équipement pour filtrer"
        placeholder="Rechercher un équipement..."
      />

      {/* Equipment Selector Modal */}
      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onSelect={handleEquipmentSelected}
        equipments={equipments}
        groups={equipmentGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        title="Sélectionner un équipement pour le document"
        placeholder="Rechercher un équipement à associer..."
      />

      {/* Group Selector Modal */}
      <GroupSelector
        isOpen={isGroupSelectorOpen}
        onClose={() => setIsGroupSelectorOpen(false)}
        onSelect={handleGroupSelected}
        selectedGroupIds={formData.group_ids || []}
        groups={equipmentGroups || []}
        title="Sélectionner des groupes pour le document"
        placeholder="Rechercher un groupe à associer..."
      />
    </div>
  );
};

export default Documents;
