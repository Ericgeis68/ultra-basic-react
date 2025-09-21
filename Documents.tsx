import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileUp,
  Download,
  Search,
  Filter,
  FileText,
  Trash2,
  Plus,
  Eye,
  Link
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Document } from '@/types/document';
import { useIsMobile } from '@/hooks/use-mobile';

const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'Manuel d\'utilisation - Compresseur Atlas GA 15',
    description: 'Manuel d\'utilisation complet pour le compresseur Atlas GA 15',
    fileUrl: '/documents/manuel-compresseur-atlas.pdf',
    fileType: 'application/pdf',
    uploadDate: '2025-01-15',
    uploadedBy: 'Jean Dupont',
    category: 'Manuel',
    tags: ['compresseur', 'maintenance', 'atlas'],
    equipmentIds: ['1'],
    size: 2500000, // 2.5 MB
    type: 'Manuel',
    status: 'Actif',
    dateAdded: '2025-01-15'
  },
  {
    id: '2',
    title: 'Schéma électrique - Ventilateur industriel',
    description: 'Schéma de câblage électrique pour le ventilateur industriel',
    fileUrl: '/documents/schema-ventilateur.pdf',
    fileType: 'application/pdf',
    uploadDate: '2025-02-20',
    uploadedBy: 'Marie Martin',
    category: 'Schéma technique',
    tags: ['électrique', 'ventilateur', 'schéma'],
    equipmentIds: ['2'],
    size: 1500000, // 1.5 MB
    type: 'Schéma',
    status: 'Actif',
    dateAdded: '2025-02-20'
  },
  {
    id: '3',
    title: 'Procédure de maintenance - Climatiseur industriel',
    description: 'Procédure détaillée pour la maintenance annuelle du climatiseur',
    fileUrl: '/documents/procedure-maintenance-clim.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadDate: '2025-03-10',
    uploadedBy: 'Jean Dupont',
    category: 'Procédure',
    tags: ['climatiseur', 'maintenance', 'procédure'],
    equipmentIds: ['3'],
    size: 850000, // 850 KB
    type: 'Procédure',
    status: 'Actif',
    dateAdded: '2025-03-10'
  },
  {
    id: '4',
    title: 'Liste des pièces détachées - Compresseur Atlas GA 15',
    description: 'Catalogue des pièces détachées disponibles pour le compresseur',
    fileUrl: '/documents/pieces-compresseur-atlas.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadDate: '2025-02-05',
    uploadedBy: 'Paul Lefèvre',
    category: 'Catalogue',
    tags: ['compresseur', 'pièces', 'atlas'],
    equipmentIds: ['1'],
    size: 1200000, // 1.2 MB
    type: 'Catalogue',
    status: 'Actif',
    dateAdded: '2025-02-05'
  },
  {
    id: '5',
    title: 'Certificat de conformité - Groupe électrogène',
    description: 'Certificat de conformité aux normes européennes',
    fileUrl: '/documents/certificat-groupe-electrogene.pdf',
    fileType: 'application/pdf',
    uploadDate: '2025-01-30',
    uploadedBy: 'Sophie Dubois',
    category: 'Certificat',
    tags: ['certificat', 'conformité', 'électrogène'],
    equipmentIds: ['4'],
    size: 500000, // 500 KB
    type: 'Certificat',
    status: 'Actif',
    dateAdded: '2025-01-30'
  }
];

const MOCK_EQUIPMENT = [
  { id: '1', name: 'Compresseur Atlas GA 15' },
  { id: '2', name: 'Ventilateur industriel' },
  { id: '3', name: 'Climatiseur industriel' },
  { id: '4', name: 'Groupe électrogène' },
  { id: '5', name: 'Système de filtration' }
];

interface DocumentFormData {
  title: string;
  description: string;
  category: string;
  tags: string;
  equipmentIds: string[];
}

const Documents = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'grid'>('grid');
  const isMobile = useIsMobile();

  const initialFormState: DocumentFormData = {
    title: '',
    description: '',
    category: '',
    tags: '',
    equipmentIds: []
  };

  const [formData, setFormData] = useState<DocumentFormData>(initialFormState);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipmentChange = (equipmentId: string, isChecked: boolean) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        equipmentIds: [...prev.equipmentIds, equipmentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        equipmentIds: prev.equipmentIds.filter(id => id !== equipmentId)
      }));
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesEquipment = equipmentFilter === 'all' || doc.equipmentIds.includes(equipmentFilter);

    return matchesSearch && matchesCategory && matchesEquipment;
  });

  const uniqueCategories = Array.from(new Set(documents.map(doc => doc.category)));

  const handleSaveDocument = () => {
    if (!formData.title) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    const fileType = 'application/pdf';

    if (editingDocument) {
      const updatedDocuments = documents.map(doc =>
        doc.id === editingDocument.id
          ? {
            ...doc,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            tags: formData.tags.split(',').map(tag => tag.trim()),
            equipmentIds: formData.equipmentIds
          }
          : doc
      );
      setDocuments(updatedDocuments);
      toast({
        title: "Document mis à jour",
        description: `Le document ${formData.title} a été mis à jour avec succès.`
      });
    } else {
      const newDocument: Document = {
        id: (documents.length + 1).toString(),
        title: formData.title,
        description: formData.description,
        fileUrl: '/documents/nouveau-document.pdf',
        fileType: fileType,
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'Jean Dupont',
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        equipmentIds: formData.equipmentIds,
        size: 1000000,
        type: formData.category,
        status: 'Actif',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setDocuments([...documents, newDocument]);
      toast({
        title: "Document ajouté",
        description: `Le document ${formData.title} a été ajouté avec succès.`
      });
    }

    setFormData(initialFormState);
    setEditingDocument(null);
    setOpenDialog(false);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      tags: doc.tags.join(', '),
      equipmentIds: doc.equipmentIds
    });
    setOpenDialog(true);
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès."
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes('word')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileText className="h-8 w-8 text-green-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Documents</h1>
          <p className="text-sm text-muted-foreground">Gérez vos documents techniques</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button
            size={isMobile ? "sm" : "default"}
            onClick={() => {
              setEditingDocument(null);
              setFormData(initialFormState);
              setOpenDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isMobile ? "Ajouter" : "Ajouter un document"}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setCurrentView(currentView === 'list' ? 'grid' : 'list')}
          >
            {currentView === 'list' ? 'Vue grille' : 'Vue liste'}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Catégorie</label>
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
              <label className="text-sm font-medium mb-1 block">Équipement</label>
              <Select value={equipmentFilter} onValueChange={(value) => setEquipmentFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les équipements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les équipements</SelectItem>
                  {MOCK_EQUIPMENT.map(equipment => (
                    <SelectItem key={equipment.id} value={equipment.id}>{equipment.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {!isMobile && currentView === 'list' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Équipements</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {getFileIcon(doc.fileType)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="mb-1">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">{doc.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.equipmentIds.map(equipId => {
                            const equipment = MOCK_EQUIPMENT.find(e => e.id === equipId);
                            return equipment ? (
                              <Badge key={equipId} variant="secondary" className="whitespace-nowrap">
                                {equipment.name.length > 12 ? `${equipment.name.substring(0, 10)}...` : equipment.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{doc.uploadDate}</TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditDocument(doc)}>
                            Éditer
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Aucun document trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {(isMobile || currentView === 'grid') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                  {getFileIcon(doc.fileType)}
                  <div className="space-y-1 overflow-hidden">
                    <CardTitle className="line-clamp-1 text-base">{doc.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{doc.category}</Badge>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{doc.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="whitespace-nowrap text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 3 && (
                      <Badge variant="secondary" className="whitespace-nowrap text-xs">
                        +{doc.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div>Ajouté le: {doc.uploadDate}</div>
                    <div>Taille: {formatFileSize(doc.size)}</div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    {!isMobile && "Télécharger"}
                  </Button>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEditDocument(doc)}>
                      {isMobile ? "Edit" : "Éditer"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-white border rounded-lg">
              Aucun document trouvé.
            </div>
          )}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Modifier le document" : "Ajouter un document"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Titre du document"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleFormChange}
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
            {!editingDocument && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fichier</label>
                <Input
                  type="file"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Équipements associés</label>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                {MOCK_EQUIPMENT.map(equipment => (
                  <div key={equipment.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`equipment-${equipment.id}`}
                      checked={formData.equipmentIds.includes(equipment.id)}
                      onCheckedChange={(checked) => handleEquipmentChange(equipment.id, checked === true)}
                    />
                    <label htmlFor={`equipment-${equipment.id}`} className="text-sm cursor-pointer">
                      {equipment.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveDocument}>{editingDocument ? "Mettre à jour" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
