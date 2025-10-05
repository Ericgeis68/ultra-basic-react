import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Building, 
  MapPin, 
  Factory, 
  PlusCircle,
  Plus,
  Search,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Facility {
  id: string;
  name: string;
  address: string;
  type: 'factory' | 'office' | 'warehouse' | 'other';
  size: number; // en m²
  equipmentCount: number;
  equipmentStatus: {
    operational: number;
    maintenance: number;
    outOfOrder: number;
  };
  yearBuilt: number;
  lastInspection: string;
  image?: string;
}

// Cette page affiche désormais les bâtiments depuis Supabase (table `buildings`).

const Facilities = () => {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  // Charger les installations depuis la table `buildings`
  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name, address, image_url, type, size, year_built, last_inspection, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erreur chargement bâtiments:', error);
        toast({ title: 'Erreur', description: "Impossible de charger les installations.", variant: 'destructive' });
        return;
      }

      const mapped: Facility[] = (data || []).map((b: any) => {
        const img: string | undefined = b.image_url || undefined; // store public URL like equipments
        return {
          id: b.id,
          name: b.name,
          address: b.address || '',
          type: (b.type as Facility['type']) || 'other',
          size: (b.size as number) || 0,
          equipmentCount: 0,
          equipmentStatus: { operational: 0, maintenance: 0, outOfOrder: 0 },
          yearBuilt: (b.year_built as number) || new Date(b.created_at).getFullYear(),
          lastInspection: (b.last_inspection as string) || new Date(b.updated_at || b.created_at).toISOString().split('T')[0],
          image: img,
        };
      });

      setFacilities(mapped);
    };

    fetchBuildings();
  }, [toast]);

  // Charger les stats équipements par bâtiment pour refléter l'application
  useEffect(() => {
    const fetchEquipmentStats = async () => {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, building_id, status');

      if (error) {
        console.error('Erreur chargement équipements:', error);
        return;
      }

      const byBuilding: Record<string, { total: number; operational: number; maintenance: number; outOfOrder: number; }> = {};
      (data || []).forEach((e: any) => {
        const bId = e.building_id as string | null;
        if (!bId) return;
        if (!byBuilding[bId]) {
          byBuilding[bId] = { total: 0, operational: 0, maintenance: 0, outOfOrder: 0 };
        }
        byBuilding[bId].total += 1;
        const status = (e.status || '').toString().toLowerCase();
        if (status.includes('oper') || status === 'operational' || status === 'ok') byBuilding[bId].operational += 1;
        else if (status.includes('maint') || status === 'maintenance' || status === 'in_maintenance') byBuilding[bId].maintenance += 1;
        else byBuilding[bId].outOfOrder += 1;
      });

      setFacilities(prev => prev.map(f => {
        const agg = byBuilding[f.id];
        if (!agg) return { ...f, equipmentCount: 0, equipmentStatus: { operational: 0, maintenance: 0, outOfOrder: 0 } };
        return { ...f, equipmentCount: agg.total, equipmentStatus: { operational: agg.operational, maintenance: agg.maintenance, outOfOrder: agg.outOfOrder } };
      }));
    };

    fetchEquipmentStats();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    address: '',
    type: 'factory' as Facility['type'],
    size: '',
    yearBuilt: '',
    lastInspection: new Date().toISOString().split('T')[0]
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  
  const filteredFacilities = facilities.filter(facility => 
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    facility.address.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(facility => activeTab === 'all' || facility.type === activeTab);
  
  const getFacilityTypeIcon = (type: Facility['type']) => {
    switch (type) {
      case 'factory':
        return <Factory className="h-5 w-5 text-blue-500" />;
      case 'warehouse':
        return <Building className="h-5 w-5 text-amber-500" />;
      case 'office':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Building className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getFacilityTypeName = (type: Facility['type']) => {
    switch (type) {
      case 'factory':
        return 'Usine';
      case 'warehouse':
        return 'Entrepôt';
      case 'office':
        return 'Bureaux';
      default:
        return 'Autre';
    }
  };

  const handleSelectImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
  };

  const uploadFacilityImage = async (file: File, buildingId: string): Promise<{ publicUrl: string; objectPath: string } | null> => {
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const objectPath = `${buildingId}.${ext}`; // chemin déterministe
      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(objectPath, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('equipment-images').getPublicUrl(objectPath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) return null;
      return { publicUrl, objectPath };
    } catch (err: any) {
      console.error('Facility image upload failed:', err);
      toast({ title: 'Téléversement image échoué', description: "L'image n'a pas pu être envoyée. Elle ne sera pas enregistrée.", variant: 'destructive' });
      return null;
    }
  };

  const handleAddFacility = async () => {
    if (!newFacility.name.trim() || !newFacility.address.trim() || !newFacility.size || !newFacility.yearBuilt) {
      toast({ title: 'Champs requis', description: 'Veuillez compléter les champs obligatoires.', variant: 'destructive' });
      return;
    }

    // 1) Créer le building pour obtenir l'ID
    const { data: inserted, error } = await supabase
      .from('buildings')
      .insert([{ 
        name: newFacility.name.trim(), 
        address: newFacility.address.trim(),
        type: newFacility.type,
        size: Number(newFacility.size) || null,
        year_built: Number(newFacility.yearBuilt) || null,
        last_inspection: newFacility.lastInspection || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création installation:', error);
      toast({ title: 'Erreur', description: "Impossible de créer l'installation.", variant: 'destructive' });
      return;
    }

    // 2) Uploader l'image avec chemin déterministe et mettre à jour la ligne avec le chemin objet
    let createdImagePublicUrl: string | undefined;
    if (selectedImageFile) {
      const uploaded = await uploadFacilityImage(selectedImageFile, inserted.id);
      if (uploaded) {
        await supabase
          .from('buildings')
          .update({ image_url: uploaded.publicUrl })
          .eq('id', inserted.id);
        createdImagePublicUrl = uploaded.publicUrl;
      }
    }

    const created: Facility = {
      id: inserted.id,
      name: inserted.name,
      address: inserted.address || '',
      type: newFacility.type,
      size: Number(newFacility.size),
      equipmentCount: 0,
      equipmentStatus: { operational: 0, maintenance: 0, outOfOrder: 0 },
      yearBuilt: Number(newFacility.yearBuilt),
      lastInspection: newFacility.lastInspection,
      image: createdImagePublicUrl,
    };

    setFacilities(prev => [created, ...prev]);
    setIsAddDialogOpen(false);
    setNewFacility({ name: '', address: '', type: 'factory', size: '', yearBuilt: '', lastInspection: new Date().toISOString().split('T')[0] });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    toast({ title: 'Installation ajoutée', description: `${created.name} a été ajoutée.` });
  };
  
  const handleOpenEdit = (facility: Facility) => {
    setEditingFacility({ ...facility });
    setImagePreviewUrl(facility.image || null);
    setSelectedImageFile(null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateFacility = async () => {
    if (!editingFacility) return;
    const { id, name, address, type, size, yearBuilt, lastInspection } = editingFacility;
    if (!name.trim()) {
      toast({ title: 'Nom requis', description: 'Veuillez saisir un nom.', variant: 'destructive' });
      return;
    }

    // Upload image sur chemin déterministe (remplace l'existante)
    let imagePublicUrl: string | null = editingFacility.image || null;
    if (selectedImageFile) {
      const uploaded = await uploadFacilityImage(selectedImageFile, id);
      if (uploaded) { imagePublicUrl = uploaded.publicUrl; }
    }

    const { error } = await supabase
      .from('buildings')
      .update({ 
        name: name.trim(), 
        address: (address || '').trim(),
        image_url: imagePublicUrl ?? undefined,
        type,
        size: Number(size) || null,
        year_built: Number(yearBuilt) || null,
        last_inspection: lastInspection || null
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour installation:', error);
      toast({ title: 'Erreur', description: "Impossible de mettre à jour l'installation.", variant: 'destructive' });
      return;
    }

    setFacilities(prev => prev.map(f => f.id === id ? { ...f, name, address, type, size, yearBuilt, lastInspection, image: imagePublicUrl || undefined } : f));
    setIsEditDialogOpen(false);
    setEditingFacility(null);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    toast({ title: 'Installation mise à jour' });
  };

  const handleDeleteFacility = async (facility: Facility) => {
    const confirmed = window.confirm(`Supprimer l'installation "${facility.name}" ?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', facility.id);

    if (error) {
      console.error('Erreur suppression installation:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'installation.", variant: 'destructive' });
      return;
    }

    setFacilities(prev => prev.filter(f => f.id !== facility.id));
    toast({ title: 'Installation supprimée' });
  };
  
  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Installations</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Ajouter une installation</span>
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par nom ou adresse..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="factory">Usines</TabsTrigger>
          <TabsTrigger value="warehouse">Entrepôts</TabsTrigger>
          <TabsTrigger value="office">Bureaux</TabsTrigger>
          <TabsTrigger value="other">Autres</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            Aucune installation trouvée
          </div>
        ) : (
          filteredFacilities.map((facility) => (
            <Card key={facility.id} className="overflow-hidden">
              <div className="h-40 overflow-hidden bg-muted">
                {facility.image ? (
                  <img 
                    src={facility.image}
                    alt={facility.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image chargée invalide pour installation:', facility.name, facility.image);
                      e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Building className="h-16 w-16 text-primary/30" />
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center">
                      {getFacilityTypeIcon(facility.type)}
                      <span className="ml-1">{getFacilityTypeName(facility.type)}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(facility)}>Modifier</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteFacility(facility)}>Supprimer</Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                    <span>{facility.address}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Superficie</p>
                      <p className="font-medium">{facility.size.toLocaleString()} m²</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Année construction</p>
                      <p className="font-medium">{facility.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dernière inspection</p>
                      <p className="font-medium">
                        {new Date(facility.lastInspection).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Équipements</p>
                      <p className="font-medium">{facility.equipmentCount}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">État des équipements</p>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
                        {facility.equipmentStatus.operational} opérationnels
                      </div>
                      <div className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs">
                        {facility.equipmentStatus.maintenance} en maintenance
                      </div>
                      <div className="px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs">
                        {facility.equipmentStatus.outOfOrder} hors service
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        <Card className="border-dashed border-2 flex items-center justify-center h-[400px]">
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-8 px-4" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="h-12 w-12 text-muted-foreground" />
            <span className="text-lg font-medium">Ajouter une installation</span>
          </Button>
        </Card>
      </div>

      {/* Modal d'ajout d'installation */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) { setSelectedImageFile(null); setImagePreviewUrl(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Ajouter une installation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'installation *</Label>
              <Input
                id="name"
                placeholder="Ex: Usine Principale"
                value={newFacility.name}
                onChange={(e) => setNewFacility(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Textarea
                id="address"
                placeholder="Ex: 123 Rue de l'Industrie, 75001 Paris"
                value={newFacility.address}
                onChange={(e) => setNewFacility(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'installation</Label>
              <Select value={newFacility.type} onValueChange={(value: Facility['type']) => setNewFacility(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factory">Usine</SelectItem>
                  <SelectItem value="warehouse">Entrepôt</SelectItem>
                  <SelectItem value="office">Bureaux</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Superficie (m²) *</Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="Ex: 5000"
                  value={newFacility.size}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, size: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Année de construction *</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="Ex: 2010"
                  value={newFacility.yearBuilt}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, yearBuilt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastInspection">Dernière inspection</Label>
              <Input
                id="lastInspection"
                type="date"
                value={newFacility.lastInspection}
                onChange={(e) => setNewFacility(prev => ({ ...prev, lastInspection: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (optionnel)</Label>
              <div className="border rounded-md p-2 flex items-center gap-3">
                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="Aperçu" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Aperçu</span>
                  )}
                </div>
                <div className="flex-1">
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <Button type="button" variant="outline" onClick={handleSelectImage} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {imagePreviewUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddFacility}>
                Ajouter l'installation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal d'édition d'installation */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingFacility(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Modifier l'installation
            </DialogTitle>
          </DialogHeader>

          {editingFacility && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom de l'installation *</Label>
                <Input
                  id="edit-name"
                  value={editingFacility.name}
                  onChange={(e) => setEditingFacility(prev => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse *</Label>
                <Textarea
                  id="edit-address"
                  rows={2}
                  value={editingFacility.address}
                  onChange={(e) => setEditingFacility(prev => prev ? { ...prev, address: e.target.value } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Type d'installation</Label>
                <Select value={editingFacility.type} onValueChange={(value: Facility['type']) => setEditingFacility(prev => prev ? { ...prev, type: value } : prev)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factory">Usine</SelectItem>
                    <SelectItem value="warehouse">Entrepôt</SelectItem>
                    <SelectItem value="office">Bureaux</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-size">Superficie (m²) *</Label>
                  <Input
                    id="edit-size"
                    type="number"
                    value={editingFacility.size}
                    onChange={(e) => setEditingFacility(prev => prev ? { ...prev, size: Number(e.target.value || 0) } : prev)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-yearBuilt">Année de construction *</Label>
                  <Input
                    id="edit-yearBuilt"
                    type="number"
                    value={editingFacility.yearBuilt}
                    onChange={(e) => setEditingFacility(prev => prev ? { ...prev, yearBuilt: Number(e.target.value || 0) } : prev)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-lastInspection">Dernière inspection</Label>
                <Input
                  id="edit-lastInspection"
                  type="date"
                  value={editingFacility.lastInspection}
                  onChange={(e) => setEditingFacility(prev => prev ? { ...prev, lastInspection: e.target.value } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="border rounded-md p-2 flex items-center gap-3">
                  <div className="w-24 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Aperçu" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Aperçu</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <Button type="button" variant="outline" onClick={handleSelectImage} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {imagePreviewUrl ? 'Changer la photo' : 'Ajouter une photo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingFacility(null); setSelectedImageFile(null); setImagePreviewUrl(null); }}>Annuler</Button>
                <Button onClick={handleUpdateFacility}>Enregistrer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Facilities;
