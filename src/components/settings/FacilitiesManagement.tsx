import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Building, MapPin, Users, Upload, Download, AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // Progress UI for long-running imports
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');

  // File input refs
  const buildingFileRef = useRef<HTMLInputElement>(null);
  const serviceFileRef = useRef<HTMLInputElement>(null);
  const locationFileRef = useRef<HTMLInputElement>(null);
  const combinedFileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newBuilding, setNewBuilding] = useState({ name: '' });
  const [newService, setNewService] = useState({ name: '', building_id: '' });
  const [newLocation, setNewLocation] = useState({ name: '', service_id: '' });

  // Inline edit states
  const [editingBuildingId, setEditingBuildingId] = useState<string>('');
  const [editingBuildingName, setEditingBuildingName] = useState<string>('');
  const [editingServiceId, setEditingServiceId] = useState<string>('');
  const [editingServiceName, setEditingServiceName] = useState<string>('');
  const [editingLocationId, setEditingLocationId] = useState<string>('');
  const [editingLocationName, setEditingLocationName] = useState<string>('');

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

  const bulkDeleteFacilities = async () => {
    setResetLoading(true);
    try {
      // Détacher tous les équipements des installations pour éviter les erreurs de contraintes
      const { error: eqUpdateError } = await supabase
        .from('equipments')
        .update({ building_id: null, service_id: null, location_id: null })
        .not('id', 'is', null);
      if (eqUpdateError) throw eqUpdateError;

      // Détacher les locaux de leurs services (ne toucher qu'aux lignes concernées)
      const { error: locDetachError } = await supabase
        .from('locations')
        .update({ service_id: null })
        .not('service_id', 'is', null);
      if (locDetachError) throw locDetachError;

      // Supprimer d'abord tous les locaux (sans lister les IDs pour éviter des URLs trop longues)
      const { error: locDelError } = await supabase
        .from('locations')
        .delete()
        .not('id', 'is', null);
      if (locDelError) throw locDelError;

      // Vérifier qu'il ne reste plus de locaux (sécurité RLS)
      const { data: remainingLocs, error: locCheckErr } = await supabase
        .from('locations')
        .select('id')
        .limit(1);
      if (locCheckErr) throw locCheckErr;
      if ((remainingLocs || []).length > 0) {
        throw new Error('Impossible de supprimer certains locaux (vérifiez les règles d’accès/RLS).');
      }

      // Détacher les services de leurs bâtiments (sécurité supplémentaires)
      const { error: svcDetachError } = await supabase
        .from('services')
        .update({ building_id: null })
        .not('building_id', 'is', null);
      if (svcDetachError) throw svcDetachError;

      // Supprimer ensuite tous les services (sécurisé: il ne reste plus de locaux)
      const { error: svcDelError } = await supabase
        .from('services')
        .delete()
        .not('id', 'is', null);
      if (svcDelError) throw svcDelError;

      // Supprimer enfin tous les bâtiments (sans lister les IDs)
      const { error: bldDelError } = await supabase
        .from('buildings')
        .delete()
        .not('id', 'is', null);
      if (bldDelError) throw bldDelError;

      // Mettre à jour l'état local
      setBuildings([]);
      setServices([]);
      setLocations([]);

      toast({
        title: 'Succès',
        description: 'Tous les bâtiments, services et locaux ont été supprimés.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'La suppression en masse a échoué.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
      setResetDialogOpen(false);
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
    try {
      const { count, error: cntErr } = await supabase
        .from('equipments')
        .select('id', { count: 'exact', head: true })
        .eq('building_id', id);
      if (cntErr) throw cntErr;

      const confirmMsg = (count || 0) > 0
        ? `Attention: ${count} équipement(s) sont encore rattaché(s) à ce bâtiment. Voulez-vous vraiment le supprimer ?`
        : "Êtes-vous sûr de vouloir supprimer ce bâtiment ?";
      if (!window.confirm(confirmMsg)) return;

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

  const startEditBuilding = (id: string, currentName: string) => {
    setEditingBuildingId(id);
    setEditingBuildingName(currentName);
  };

  const saveEditBuilding = async () => {
    const id = editingBuildingId;
    const name = editingBuildingName.trim();
    if (!id || !name) {
      setEditingBuildingId('');
      setEditingBuildingName('');
      return;
    }
    try {
      const { error } = await supabase
        .from('buildings')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
      setBuildings(buildings.map(b => (b.id === id ? { ...b, name } : b)));
      toast({ title: 'Succès', description: 'Nom du bâtiment mis à jour.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setEditingBuildingId('');
      setEditingBuildingName('');
    }
  };

  const cancelEditBuilding = () => {
    setEditingBuildingId('');
    setEditingBuildingName('');
  };

  const deleteService = async (id: string) => {
    try {
      const { count, error: cntErr } = await supabase
        .from('equipments')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id);
      if (cntErr) throw cntErr;

      const confirmMsg = (count || 0) > 0
        ? `Attention: ${count} équipement(s) sont encore rattaché(s) à ce service. Voulez-vous vraiment le supprimer ?`
        : "Êtes-vous sûr de vouloir supprimer ce service ?";
      if (!window.confirm(confirmMsg)) return;

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

  const startEditService = (id: string, currentName: string) => {
    setEditingServiceId(id);
    setEditingServiceName(currentName);
  };

  const saveEditService = async () => {
    const id = editingServiceId;
    const name = editingServiceName.trim();
    if (!id || !name) {
      setEditingServiceId('');
      setEditingServiceName('');
      return;
    }
    try {
      const { error } = await supabase
        .from('services')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
      setServices(services.map(s => (s.id === id ? { ...s, name } : s)));
      toast({ title: 'Succès', description: 'Nom du service mis à jour.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setEditingServiceId('');
      setEditingServiceName('');
    }
  };

  const cancelEditService = () => {
    setEditingServiceId('');
    setEditingServiceName('');
  };

  const deleteLocation = async (id: string) => {
    try {
      const { count, error: cntErr } = await supabase
        .from('equipments')
        .select('id', { count: 'exact', head: true })
        .eq('location_id', id);
      if (cntErr) throw cntErr;

      const confirmMsg = (count || 0) > 0
        ? `Attention: ${count} équipement(s) sont encore rattaché(s) à ce local. Voulez-vous vraiment le supprimer ?`
        : "Êtes-vous sûr de vouloir supprimer ce local ?";
      if (!window.confirm(confirmMsg)) return;

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

  const startEditLocation = (id: string, currentName: string) => {
    setEditingLocationId(id);
    setEditingLocationName(currentName);
  };

  const saveEditLocation = async () => {
    const id = editingLocationId;
    const name = editingLocationName.trim();
    if (!id || !name) {
      setEditingLocationId('');
      setEditingLocationName('');
      return;
    }
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
      setLocations(locations.map(l => (l.id === id ? { ...l, name } : l)));
      toast({ title: 'Succès', description: 'Nom du local mis à jour.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setEditingLocationId('');
      setEditingLocationName('');
    }
  };

  const cancelEditLocation = () => {
    setEditingLocationId('');
    setEditingLocationName('');
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

  const getBuildingNameByServiceId = (serviceId: string | null) => {
    if (!serviceId) return 'Aucun bâtiment';
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Bâtiment inconnu';
    return getBuildingName(service.building_id ?? null);
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

  // Import combiné depuis une seule feuille Excel (colonnes: Bâtiment | Service | Local)
  const handleCombinedExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setProgressPercent(0);
      setProgressMessage("Préparation de l'import...");
      toast({ title: 'Import combiné', description: 'Démarrage de l\'import...', });
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      // Utilise la 1ère feuille. Attend colonnes: [Bâtiment, Service, Local]
      const firstSheet = workbook.SheetNames[0];
      const ws = workbook.Sheets[firstSheet];
      const aoa: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const rows: string[][] = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      if (rows.length <= 1) {
        toast({ title: 'Erreur', description: 'La feuille est vide ou ne contient pas d’en-tête.', variant: 'destructive' });
        return;
      }

      // Indices colonnes tolérants (FR/EN)
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const idxBuilding = headers.findIndex(h => ['bâtiment','batiment','building'].includes(h));
      const idxService = headers.findIndex(h => ['service'].includes(h));
      const idxLocation = headers.findIndex(h => ['local','location','locaux','locations'].includes(h));

      if (idxBuilding === -1 && idxService === -1 && idxLocation === -1) {
        toast({ title: 'Erreur', description: 'En-têtes attendus: Bâtiment | Service | Local.', variant: 'destructive' });
        return;
      }

      const dataRows = rows.slice(1);

      // 1) Bâtiments distincts
      const buildingNames = new Set<string>();
      for (const row of dataRows) {
        const name = (row[idxBuilding] || '').trim();
        if (name) buildingNames.add(name);
      }
      let currentBuildings: BuildingType[] = buildings;
      if (buildingNames.size > 0) {
        toast({ title: 'Étape 1/3', description: 'Import des bâtiments...', });
        setProgressMessage('Import des bâtiments...');
        const buildingsToInsert = Array.from(buildingNames).map(name => ({ name }));
        await performImport('buildings', buildingsToInsert, true);
        // Récupérer immédiatement la liste depuis la base pour éviter la latence de setState
        const { data: bNow, error: bErr } = await supabase.from('buildings').select('*');
        if (bErr) throw bErr;
        currentBuildings = bNow || [];
        toast({ title: 'Étape 1/3', description: `${currentBuildings.length} bâtiment(s) prêt(s)`, });
        setProgressPercent(33);
        setProgressMessage(`${currentBuildings.length} bâtiment(s) prêt(s)`);
      }

      // 2) Services (avec association par nom de bâtiment)
      const servicesToInsert: { name: string; building_id: string | null }[] = [];
      for (const row of dataRows) {
        const sName = (row[idxService] || '').trim();
        if (!sName) continue;
        const bName = (row[idxBuilding] || '').trim();
        let building_id: string | null = null;
        if (bName) {
          const b = currentBuildings.find(x => (x.name || '').toLowerCase() === bName.toLowerCase());
          building_id = b?.id || null;
        }
        // éviter doublons exacts dans le lot
        if (!servicesToInsert.some(s => s.name.toLowerCase() === sName.toLowerCase() && s.building_id === building_id)) {
          servicesToInsert.push({ name: sName, building_id });
        }
      }
      let currentServices: Service[] = services;
      if (servicesToInsert.length > 0) {
        toast({ title: 'Étape 2/3', description: `Création/liaison de ${servicesToInsert.length} service(s)...`, });
        setProgressMessage(`Création/liaison de ${servicesToInsert.length} service(s)...`);
        // Upsert par nom: créer/attacher sans déplacer entre bâtiments
        for (let i = 0; i < servicesToInsert.length; i++) {
          const svc = servicesToInsert[i];
          await ensureServiceWithBuilding(svc.name, svc.building_id || null);
          if ((i + 1) % 5 === 0 || i === servicesToInsert.length - 1) {
            setProgressPercent(33 + Math.floor(((i + 1) / servicesToInsert.length) * 33));
          }
        }
        // Récupérer immédiatement la liste depuis la base
        const { data: sNow, error: sErr } = await supabase.from('services').select('*');
        if (sErr) throw sErr;
        currentServices = sNow || [];
        toast({ title: 'Étape 2/3', description: `${currentServices.length} service(s) prêt(s)`, });
        setProgressMessage(`${currentServices.length} service(s) prêt(s)`);
      }

      // 3) Locaux (avec association par nom de service ET par bâtiment pour lever les ambiguïtés)
      const locationsToInsert: { name: string; service_id: string | null }[] = [];
      for (const row of dataRows) {
        const lName = (row[idxLocation] || '').trim();
        if (!lName) continue;
        const sName = (row[idxService] || '').trim();
        const bName = (row[idxBuilding] || '').trim();
        let service_id: string | null = null;
        if (sName) {
          // Si un bâtiment est précisé, on cherche le service correspondant à ce bâtiment
          let targetBuildingId: string | null = null;
          if (bName) {
            const b = currentBuildings.find(x => (x.name || '').toLowerCase() === bName.toLowerCase());
            targetBuildingId = b?.id || null;
          }
          const candidateServices = currentServices.filter(x => (x.name || '').toLowerCase() === sName.toLowerCase());
          const matchedByBuilding = candidateServices.find(x => (x.building_id || null) === (targetBuildingId || null));
          const chosenService = matchedByBuilding || candidateServices[0];
          service_id = chosenService?.id || null;
        }
        if (!locationsToInsert.some(l => l.name.toLowerCase() === lName.toLowerCase() && l.service_id === service_id)) {
          locationsToInsert.push({ name: lName, service_id });
        }
      }
      if (locationsToInsert.length > 0) {
        toast({ title: 'Étape 3/3', description: `Création/liaison de ${locationsToInsert.length} local(aux)...`, });
        setProgressMessage(`Création/liaison de ${locationsToInsert.length} local(aux)...`);
        // Upsert par nom: créer/attacher sans déplacer entre services
        for (let i = 0; i < locationsToInsert.length; i++) {
          const loc = locationsToInsert[i];
          await ensureLocationWithService(loc.name, loc.service_id || null);
          if ((i + 1) % 10 === 0 || i === locationsToInsert.length - 1) {
            setProgressPercent(66 + Math.floor(((i + 1) / locationsToInsert.length) * 34));
          }
        }
      }

      // Rafraîchir l'ensemble des données à la fin pour afficher les bonnes informations
      await fetchData();
      setProgressPercent(100);
      setProgressMessage('Terminé');
      toast({ title: 'Succès', description: 'Import combiné terminé. Données rafraîchies.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (combinedFileRef.current) combinedFileRef.current.value = '';
    }
  };

  const downloadCombinedTemplateExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Bâtiment', 'Service', 'Local'],
        ['Bâtiment A', 'Service A', 'Local A'],
        ['Bâtiment B', 'Service B', 'Local B'],
      ]);
      ws['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Installations');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_installations_combine.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la génération du modèle combiné:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le modèle combiné', variant: 'destructive' });
    }
  };
  
  // Garantit qu'un service existe pour (name, building_id) sans déplacer un service existant d'un autre bâtiment
  const ensureServiceWithBuilding = async (name: string, building_id: string | null) => {
    const normalized = name.trim();
    if (!normalized) return null;

    // 1) Chercher un service correspondant EXACTEMENT au couple (name, building_id)
    const sameParentQuery = supabase
      .from('services')
      .select('*')
      .ilike('name', normalized);
    const { data: sameParent, error: sameParentErr } = await (
      building_id == null
        ? sameParentQuery.is('building_id', null)
        : sameParentQuery.eq('building_id', building_id)
    );
    if (sameParentErr) throw sameParentErr;
    const exact = (sameParent || []).find(s => (s.name || '').trim().toLowerCase() === normalized.toLowerCase());
    if (exact) return exact;

    // 2) Chercher un service du même nom mais sans parent défini (building_id null) pour l'attacher
    const { data: noParent, error: noParentErr } = await supabase
      .from('services')
      .select('*')
      .ilike('name', normalized)
      .is('building_id', null);
    if (noParentErr) throw noParentErr;
    const dangling = (noParent || []).find(s => (s.name || '').trim().toLowerCase() === normalized.toLowerCase());
    if (dangling) {
      const { data: updated, error: updErr } = await supabase
        .from('services')
        .update({ building_id })
        .eq('id', dangling.id)
        .select()
        .single();
      if (updErr) throw updErr;
      return updated;
    }

    // 3) Sinon, créer un nouveau service pour ce bâtiment
    const { data: inserted, error: insErr } = await supabase
      .from('services')
      .insert([{ name: normalized, building_id }])
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
  };

  // Garantit qu'un local existe pour (name, service_id) sans déplacer un local d'un autre service
  const ensureLocationWithService = async (name: string, service_id: string | null) => {
    const normalized = name.trim();
    if (!normalized) return null;

    // 1) Chercher un local correspondant EXACTEMENT au couple (name, service_id)
    const sameLocParentQuery = supabase
      .from('locations')
      .select('*')
      .ilike('name', normalized);
    const { data: sameParent, error: sameParentErr } = await (
      service_id == null
        ? sameLocParentQuery.is('service_id', null)
        : sameLocParentQuery.eq('service_id', service_id)
    );
    if (sameParentErr) throw sameParentErr;
    const exact = (sameParent || []).find(l => (l.name || '').trim().toLowerCase() === normalized.toLowerCase());
    if (exact) return exact;

    // 2) Chercher un local du même nom mais sans service défini (service_id null) pour l'attacher
    const { data: noParent, error: noParentErr } = await supabase
      .from('locations')
      .select('*')
      .ilike('name', normalized)
      .is('service_id', null);
    if (noParentErr) throw noParentErr;
    const dangling = (noParent || []).find(l => (l.name || '').trim().toLowerCase() === normalized.toLowerCase());
    if (dangling) {
      const { data: updated, error: updErr } = await supabase
        .from('locations')
        .update({ service_id })
        .eq('id', dangling.id)
        .select()
        .single();
      if (updErr) throw updErr;
      return updated;
    }

    // 3) Sinon, créer un nouveau local pour ce service
    const { data: inserted, error: insErr } = await supabase
      .from('locations')
      .insert([{ name: normalized, service_id }])
      .select()
      .single();
    if (insErr) throw insErr;
    return inserted;
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

  // Affichage en overlay léger pendant les opérations longues

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
          {loading && (
            <div className="mb-4 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">{progressMessage || 'Traitement en cours...'}</div>
                <Progress value={progressPercent} />
              </div>
              <div className="text-xs w-10 text-right tabular-nums">{progressPercent}%</div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4 w-full">
            <Button
              variant="outline"
              onClick={() => combinedFileRef.current?.click()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              Importer Excel combiné (une feuille: Bâtiment | Service | Local)
            </Button>
            <Button
              variant="outline"
              onClick={downloadCombinedTemplateExcel}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Modèle Excel combiné
            </Button>
            <input
              ref={combinedFileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleCombinedExcelImport}
              className="hidden"
            />
          </div>
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
                {buildings
                  .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                  .map((building) => (
                  <div key={building.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {editingBuildingId === building.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editingBuildingName} onChange={(e) => setEditingBuildingName(e.target.value)} />
                          <Button size="sm" onClick={saveEditBuilding}>Enregistrer</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditBuilding}>Annuler</Button>
                        </div>
                      ) : (
                        <span>{building.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingBuildingId !== building.id && (
                        <Button variant="outline" size="sm" onClick={() => startEditBuilding(building.id, building.name)}>Modifier</Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBuilding(building.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                        {buildings
                          .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                          .map((building) => (
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
                {services
                  .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                  .map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        {editingServiceId === service.id ? (
                          <div className="flex items-center gap-2">
                            <Input value={editingServiceName} onChange={(e) => setEditingServiceName(e.target.value)} />
                            <Button size="sm" onClick={saveEditService}>Enregistrer</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditService}>Annuler</Button>
                          </div>
                        ) : (
                          <span className="font-medium">{service.name}</span>
                        )}
                        <p className="text-sm text-gray-500">{getBuildingName(service.building_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingServiceId !== service.id && (
                        <Button variant="outline" size="sm" onClick={() => startEditService(service.id, service.name)}>Modifier</Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                        {services
                          .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                          .map((service) => (
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
                {locations
                  .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                  .map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        {editingLocationId === location.id ? (
                          <div className="flex items-center gap-2">
                            <Input value={editingLocationName} onChange={(e) => setEditingLocationName(e.target.value)} />
                            <Button size="sm" onClick={saveEditLocation}>Enregistrer</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditLocation}>Annuler</Button>
                          </div>
                        ) : (
                          <span className="font-medium">{location.name}</span>
                        )}
                        <p className="text-sm text-gray-500">{getServiceName(location.service_id)}</p>
                        <p className="text-sm text-gray-500">{getBuildingNameByServiceId(location.service_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingLocationId !== location.id && (
                        <Button variant="outline" size="sm" onClick={() => startEditLocation(location.id, location.name)}>Modifier</Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Zone de danger - action pour ouvrir la suppression en masse */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Zone de danger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-red-800">
                Supprime tous les <b>bâtiments</b>, <b>services</b> et <b>locaux</b>.
                Les équipements ne seront pas supprimés, mais leurs liens d’emplacement seront remis à zéro.
              </div>
              <Button
                onClick={() => setResetDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer toutes les installations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger zone: bulk delete all facilities */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Supprimer toutes les installations
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer définitivement tous les <b>bâtiments</b>, <b>services</b> et <b>locaux</b>.
              Les équipements resteront, mais leurs liens d’emplacement seront réinitialisés.
              Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={resetLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDeleteFacilities}
              className="bg-red-600 hover:bg-red-700"
              disabled={resetLoading}
            >
              {resetLoading ? 'Suppression…' : 'Supprimer tout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FacilitiesManagement;
