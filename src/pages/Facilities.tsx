import React, { useState } from 'react';
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

// Données d'exemple
const initialFacilities: Facility[] = [
  {
    id: "1",
    name: "Usine Principale Nord",
    address: "123 Rue de l'Industrie, 75001 Paris",
    type: "factory",
    size: 5000,
    equipmentCount: 48,
    equipmentStatus: {
      operational: 42,
      maintenance: 4,
      outOfOrder: 2
    },
    yearBuilt: 2010,
    lastInspection: "2023-12-10",
    image: "https://images.unsplash.com/photo-1565939572349-07d65074069c?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3"
  },
  {
    id: "2",
    name: "Entrepôt Central",
    address: "45 Avenue du Stockage, 69002 Lyon",
    type: "warehouse",
    size: 8000,
    equipmentCount: 26,
    equipmentStatus: {
      operational: 22,
      maintenance: 2,
      outOfOrder: 2
    },
    yearBuilt: 2015,
    lastInspection: "2024-01-15"
  },
  {
    id: "3",
    name: "Bureaux Administratifs",
    address: "78 Boulevard Haussmann, 75008 Paris",
    type: "office",
    size: 1200,
    equipmentCount: 12,
    equipmentStatus: {
      operational: 11,
      maintenance: 1,
      outOfOrder: 0
    },
    yearBuilt: 2018,
    lastInspection: "2024-02-28"
  },
  {
    id: "4",
    name: "Usine Secondaire Sud",
    address: "56 Chemin des Manufactures, 13008 Marseille",
    type: "factory",
    size: 3500,
    equipmentCount: 35,
    equipmentStatus: {
      operational: 30,
      maintenance: 3,
      outOfOrder: 2
    },
    yearBuilt: 2012,
    lastInspection: "2023-11-05"
  }
];

const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
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

  const handleAddFacility = () => {
    if (!newFacility.name || !newFacility.address || !newFacility.size || !newFacility.yearBuilt) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const facility: Facility = {
      id: Date.now().toString(),
      name: newFacility.name,
      address: newFacility.address,
      type: newFacility.type,
      size: parseInt(newFacility.size),
      equipmentCount: 0,
      equipmentStatus: {
        operational: 0,
        maintenance: 0,
        outOfOrder: 0
      },
      yearBuilt: parseInt(newFacility.yearBuilt),
      lastInspection: newFacility.lastInspection
    };

    setFacilities(prev => [...prev, facility]);
    setNewFacility({
      name: '',
      address: '',
      type: 'factory',
      size: '',
      yearBuilt: '',
      lastInspection: new Date().toISOString().split('T')[0]
    });
    setIsAddDialogOpen(false);
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
                  <div className="px-2 py-1 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center">
                    {getFacilityTypeIcon(facility.type)}
                    <span className="ml-1">{getFacilityTypeName(facility.type)}</span>
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
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
    </div>
  );
};

export default Facilities;
