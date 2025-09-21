import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Building, MapPin, Users, Upload, Download, AlertTriangle, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Building as BuildingType, Service, Location } from '@/types/facilities';

interface DuplicateInfo {
  type: 'buildings' | 'services' | 'locations';
  duplicates: string[];
  newItems: any[];
  allItems: any[];
}

const FacilitiesManagement = () => {
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateInfo | null>(null);

  // File input refs
  const buildingFileRef = useRef<HTMLInputElement>(null);
  const serviceFileRef = useRef<HTMLInputElement>(null);
  const locationFileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newBuilding, setNewBuilding] = useState({ name: '' });
  const [newService, setNewService] = useState({ name: '', building_id: '' });
  const [newLocation, setNewLocation] = useState({ name: '', service_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buildingsData, servicesData, locationsData] = await Promise.all([
        supabase.from('buildings').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('locations').select('*').order('name')
      ]);

      if (buildingsData.data) setBuildings(buildingsData.data);
      if (servicesData.data) setServices(servicesData.data);
      if (locationsData.data) setLocations(locationsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateName = (name: string, type: 'buildings' | 'services' | 'locations'): boolean => {
    const normalizedName = name.trim().toLowerCase();
    
    switch (type) {
      case 'buildings':
        return buildings.some(item => item.name.toLowerCase() === normalizedName);
      case 'services':
        return services.some(item => item.name.toLowerCase() === normalizedName);
      case 'locations':
        return locations.some(item => item.name.toLowerCase() === normalizedName);
      default:
        return false;
    }
  };

  const addBuilding = async () => {
    if (!newBuilding.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du bâtiment est requis",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (checkDuplicateName(newBuilding.name, 'buildings')) {
      toast({
        title: "Doublon détecté",
        description: `Un bâtiment avec le nom "${newBuilding.name}" existe déjà`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert([{ name: newBuilding.name.trim() }])
        .select()
        .single();

      if (error) throw error;

      setBuildings([...buildings, data]);
      setNewBuilding({ name: '' });
      toast({
        title: "Succès",
        description: "Bâtiment créé avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addService = async () => {
    if (!newService.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du service est requis",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (checkDuplicateName(newService.name, 'services')) {
      toast({
        title: "Doublon détecté",
        description: `Un service avec le nom "${newService.name}" existe déjà`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ 
          name: newService.name.trim(),
          building_id: newService.building_id === 'none' ? null : newService.building_id
        }])
        .select()
        .single();

      if (error) throw error;

      setServices([...services, data]);
      setNewService({ name: '', building_id: '' });
      toast({
        title: "Succès",
        description: "Service créé avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addLocation = async () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du local est requis",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (checkDuplicateName(newLocation.name, 'locations')) {
      toast({
        title: "Doublon détecté",
        description: `Un local avec le nom "${newLocation.name}" existe déjà`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([{ 
          name: newLocation.name.trim(),
          service_id: newLocation.service_id === 'none' ? null : newLocation.service_id
        }])
        .select()
        .single();

      if (error) throw error;

      setLocations([...locations, data]);
      setNewLocation({ name: '', service_id: '' });
      toast({
        title: "Succès",
        description: "Local créé avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteBuilding = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce bâtiment ?")) return;

    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBuildings(buildings.filter(b => b.id !== id));
      toast({
        title: "Succès",
        description: "Bâtiment supprimé"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(services.filter(s => s.id !== id));
      toast({
        title: "Succès",
        description: "Service supprimé"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteLocation = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce local ?")) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(locations.filter(l => l.id !== id));
      toast({
        title: "Succès",
        description: "Local supprimé"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getBuildingName = (buildingId: string | null) => {
    if (!buildingId) return 'Aucun bâtiment';
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : 'Bâtiment inconnu';
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'Aucun service';
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Service inconnu';
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }).filter(line => line.some(cell => cell.length > 0));
  };

  const checkForDuplicates = (type: 'buildings' | 'services' | 'locations', newItems: any[]) => {
    let existingItems: any[] = [];
    let duplicates: string[] = [];

    switch (type) {
      case 'buildings':
        existingItems = buildings;
        duplicates = newItems
          .filter(item => existingItems.some(existing => existing.name.toLowerCase() === item.name.toLowerCase()))
          .map(item => item.name);
        break;
      case 'services':
        existingItems = services;
        duplicates = newItems
          .filter(item => existingItems.some(existing => existing.name.toLowerCase() === item.name.toLowerCase()))
          .map(item => item.name);
        break;
      case 'locations':
        existingItems = locations;
        duplicates = newItems
          .filter(item => existingItems.some(existing => existing.name.toLowerCase() === item.name.toLowerCase()))
          .map(item => item.name);
        break;
    }

    return duplicates;
  };

  const performImport = async (type: 'buildings' | 'services' | 'locations', items: any[], ignoreDuplicates: boolean = false) => {
    let itemsToInsert = items;

    if (ignoreDuplicates) {
      const duplicates = checkForDuplicates(type, items);
      itemsToInsert = items.filter(item => !duplicates.includes(item.name));
    }

    if (itemsToInsert.length === 0) {
      toast({
        title: "Information",
        description: "Aucun élément à importer après filtrage des doublons",
      });
      return;
    }

    try {
      const tableName = type === 'buildings' ? 'buildings' : type === 'services' ? 'services' : 'locations';
      const { data, error } = await supabase
        .from(tableName)
        .insert(itemsToInsert)
        .select();

      if (error) throw error;

      switch (type) {
        case 'buildings':
          setBuildings([...buildings, ...data]);
          break;
        case 'services':
          setServices([...services, ...data.map(item => ({ ...item, building_id: (item as any).building_id || null }))]);
          break;
        case 'locations':
          setLocations([...locations, ...data.map(item => ({ ...item, service_id: (item as any).service_id || null }))]);
          break;
      }

      const typeLabel = type === 'buildings' ? 'bâtiments' : type === 'services' ? 'services' : 'locaux';
      toast({
        title: "Succès",
        description: `${data.length} ${typeLabel} importés avec succès`
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBuildingImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let rows: string[][] = [];
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        rows = parseCSV(text);
      }
      const dataRows = rows.slice(1);
      
      const buildingsToInsert = dataRows
        .map(row => ({ name: row[0]?.trim() }))
        .filter(building => building.name);

      if (buildingsToInsert.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun bâtiment valide trouvé dans le fichier",
          variant: "destructive"
        });
        return;
      }

      const duplicates = checkForDuplicates('buildings', buildingsToInsert);
      
      if (duplicates.length > 0) {
        setDuplicateDialog({
          type: 'buildings',
          duplicates,
          newItems: buildingsToInsert,
          allItems: buildingsToInsert
        });
      } else {
        await performImport('buildings', buildingsToInsert);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }

    if (buildingFileRef.current) {
      buildingFileRef.current.value = '';
    }
  };

  const handleServiceImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let rows: string[][] = [];
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        rows = parseCSV(text);
      }
      const dataRows = rows.slice(1);
      
      const servicesToInsert = dataRows
        .map(row => {
          const serviceName = row[0]?.trim();
          const buildingName = row[1]?.trim();
          
          if (!serviceName) return null;
          
          let building_id = null;
          if (buildingName) {
            const building = buildings.find(b => b.name.toLowerCase() === buildingName.toLowerCase());
            if (!building) {
              console.warn(`Bâtiment "${buildingName}" introuvable pour le service "${serviceName}". Bâtiments disponibles: ${buildings.map(b => b.name).join(', ')}`);
            }
            building_id = building?.id || null;
          }
          
          return { name: serviceName, building_id };
        })
        .filter(service => service !== null);

      if (servicesToInsert.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun service valide trouvé dans le fichier",
          variant: "destructive"
        });
        return;
      }

      const duplicates = checkForDuplicates('services', servicesToInsert);
      
      if (duplicates.length > 0) {
        setDuplicateDialog({
          type: 'services',
          duplicates,
          newItems: servicesToInsert,
          allItems: servicesToInsert
        });
      } else {
        await performImport('services', servicesToInsert);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }

    if (serviceFileRef.current) {
      serviceFileRef.current.value = '';
    }
  };

  const handleLocationImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let rows: string[][] = [];
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        rows = parseCSV(text);
      }
      const dataRows = rows.slice(1);
      
      const locationsToInsert = dataRows
        .map(row => {
          const locationName = row[0]?.trim();
          const serviceName = row[1]?.trim();
          
          if (!locationName) return null;
          
          let service_id = null;
          if (serviceName) {
            const service = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
            if (!service) {
              console.warn(`Service "${serviceName}" introuvable pour le local "${locationName}". Services disponibles: ${services.map(s => s.name).join(', ')}`);
            }
            service_id = service?.id || null;
          }
          
          return { name: locationName, service_id };
        })
        .filter(location => location !== null);

      if (locationsToInsert.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun local valide trouvé dans le fichier",
          variant: "destructive"
        });
        return;
      }

      const duplicates = checkForDuplicates('locations', locationsToInsert);
      
      if (duplicates.length > 0) {
        setDuplicateDialog({
          type: 'locations',
          duplicates,
          newItems: locationsToInsert,
          allItems: locationsToInsert
        });
      } else {
        await performImport('locations', locationsToInsert);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }

    if (locationFileRef.current) {
      locationFileRef.current.value = '';
    }
  };

  const downloadTemplate = (type: 'buildings' | 'services' | 'locations') => {
    let csvContent = '';
    let filename = '';
    
    switch (type) {
      case 'buildings':
        csvContent = '"Nom du bâtiment"\n"Bâtiment A"\n"Bâtiment B"';
        filename = 'template_batiments.csv';
        break;
      case 'services':
        csvContent = '"Nom du service","Nom du bâtiment"\n"Service A","Bâtiment A"\n"Service B",""';
        filename = 'template_services.csv';
        break;
      case 'locations':
        csvContent = '"Nom du local","Nom du service"\n"Local A","Service A"\n"Local B",""';
        filename = 'template_locaux.csv';
        break;
    }
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplateExcel = async (type: 'buildings' | 'services' | 'locations') => {
    try {
      let headers: string[] = [];
      let rows: string[][] = [];
      let sheet = '';
      let filename = '';
      
      switch (type) {
        case 'buildings':
          headers = ['Nom du bâtiment'];
          rows = [['Bâtiment A'], ['Bâtiment B']];
          sheet = 'Bâtiments';
          filename = 'template_batiments.xlsx';
          break;
        case 'services':
          // Récupérer les bâtiments pour les exemples
          const buildingsResult = await supabase.from('buildings').select('name').order('name');
          const buildings = buildingsResult.data?.map(b => b.name) || [];
          
          headers = ['Nom du service', 'Nom du bâtiment'];
          rows = [
            ['Service A', buildings[0] || 'Bâtiment A'],
            ['Service B', buildings[1] || buildings[0] || '']
          ];
          
          // Ajouter les commentaires
          const buildingComments = [`Bâtiments disponibles: ${buildings.join(', ') || 'Aucun'}`];
          rows.push(...buildingComments.map(comment => [comment]));
          
          sheet = 'Services';
          filename = 'template_services.xlsx';
          break;
        case 'locations':
          // Récupérer les services pour les exemples
          const servicesResult = await supabase.from('services').select('name').order('name');
          const services = servicesResult.data?.map(s => s.name) || [];
          
          headers = ['Nom du local', 'Nom du service'];
          rows = [
            ['Local A', services[0] || 'Service A'],
            ['Local B', services[1] || services[0] || '']
          ];
          
          // Ajouter les commentaires
          const serviceComments = [`Services disponibles: ${services.join(', ') || 'Aucun'}`];
          rows.push(...serviceComments.map(comment => [comment]));
          
          sheet = 'Locaux';
          filename = 'template_locaux.xlsx';
          break;
      }

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Définir les largeurs de colonnes optimisées selon le type
      let columnWidths: { wch: number }[] = [];
      switch (type) {
        case 'buildings':
          columnWidths = [{ wch: 25 }]; // Nom du bâtiment
          break;
        case 'services':
          columnWidths = [{ wch: 25 }, { wch: 25 }]; // Nom du service, Nom du bâtiment
          break;
        case 'locations':
          columnWidths = [{ wch: 25 }, { wch: 25 }]; // Nom du local, Nom du service
          break;
      }
      worksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la génération du modèle Excel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le modèle Excel",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateDialogAction = async (action: 'import-all' | 'skip-duplicates') => {
    if (!duplicateDialog) return;

    if (action === 'import-all') {
      await performImport(duplicateDialog.type, duplicateDialog.allItems, false);
    } else {
      await performImport(duplicateDialog.type, duplicateDialog.newItems, true);
    }

    setDuplicateDialog(null);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Gestion des Installations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buildings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="buildings">Bâtiments</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="locations">Locaux</TabsTrigger>
            </TabsList>

            <TabsContent value="buildings" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="building-name">Nom du bâtiment</Label>
                    <Input
                      id="building-name"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ name: e.target.value })}
                      placeholder="Nom du bâtiment"
                    />
                  </div>
                  <Button onClick={addBuilding} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => buildingFileRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Importer CSV/Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplate('buildings')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Modèle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplateExcel('buildings')}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Modèle Excel
                    </Button>
                  </div>
                  <input
                    ref={buildingFileRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleBuildingImport}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {buildings.map((building) => (
                  <div key={building.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{building.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBuilding(building.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Nom du service</Label>
                    <Input
                      id="service-name"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Nom du service"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-building">Bâtiment</Label>
                    <Select
                      value={newService.building_id}
                      onValueChange={(value) => setNewService({ ...newService, building_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un bâtiment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun bâtiment</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addService} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => serviceFileRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Importer CSV/Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplate('services')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Modèle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplateExcel('services')}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Modèle Excel
                    </Button>
                  </div>
                  <input
                    ref={serviceFileRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleServiceImport}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <p className="text-sm text-gray-500">{getBuildingName(service.building_id)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Nom du local</Label>
                    <Input
                      id="location-name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Nom du local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-service">Service</Label>
                    <Select
                      value={newLocation.service_id}
                      onValueChange={(value) => setNewLocation({ ...newLocation, service_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun service</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addLocation} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => locationFileRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Importer CSV/Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplate('locations')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Modèle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadTemplateExcel('locations')}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Modèle Excel
                    </Button>
                  </div>
                  <input
                    ref={locationFileRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleLocationImport}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <span className="font-medium">{location.name}</span>
                        <p className="text-sm text-gray-500">{getServiceName(location.service_id)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLocation(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Duplicate confirmation dialog */}
      <AlertDialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Doublons détectés
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Les éléments suivants existent déjà dans le système :</p>
              <div className="bg-amber-50 p-3 rounded-lg">
                <ul className="list-disc list-inside space-y-1">
                  {duplicateDialog?.duplicates.map((duplicate, index) => (
                    <li key={index} className="text-sm text-amber-800">{duplicate}</li>
                  ))}
                </ul>
              </div>
              <p>Que souhaitez-vous faire ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setDuplicateDialog(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDuplicateDialogAction('skip-duplicates')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ignorer les doublons
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleDuplicateDialogAction('import-all')}
            >
              Importer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FacilitiesManagement;
