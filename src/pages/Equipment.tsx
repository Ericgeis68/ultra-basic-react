import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Search, List, Grid, QrCode, FileDown, ListFilter, ArrowUp, ArrowDown, FileSpreadsheet } from 'lucide-react';
import EquipmentDetailModal from '@/components/equipment/EquipmentDetailModal';
import EquipmentDetailView from '@/components/equipment/EquipmentDetailView';
import InterventionFormModal from '@/components/interventions/InterventionFormModal';
import MaintenanceFormModal from '@/components/maintenance/MaintenanceFormModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchDocumentsForEquipment } from '@/lib/documents';
import EquipmentListView from '@/components/equipment/EquipmentListView';
import EquipmentGridView from '@/components/equipment/EquipmentGridView';
import { useSimplePrint } from '@/hooks/use-simple-print';
import QrScanner from '@/components/equipment/QrScanner';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Equipment, EquipmentUI, EquipmentSortColumn } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { deleteEquipment, logEquipmentChange } from '@/lib/equipment';
import { junctionTableManager } from '@/lib/junction-tables';
import { useAuth } from '@/contexts/AuthContext';
import EquipmentFilter from '@/components/equipment/EquipmentFilter';
import { useEquipmentGroupData } from '@/hooks/useEquipmentGroupData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EquipmentPrintModal from '@/components/print/EquipmentPrintModal';
import { exportEquipmentsToExcel } from '@/lib/equipment-export';

const EquipmentPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { handlePrint } = useSimplePrint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterUF, setFilterUF] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterInventory, setFilterInventory] = useState('');
  const [filterPurchaseDateFrom, setFilterPurchaseDateFrom] = useState('');
  const [filterPurchaseDateTo, setFilterPurchaseDateTo] = useState('');
  const [filterServiceDateFrom, setFilterServiceDateFrom] = useState('');
  const [filterServiceDateTo, setFilterServiceDateTo] = useState('');
  const [filterWarrantyFrom, setFilterWarrantyFrom] = useState('');
  const [filterWarrantyTo, setFilterWarrantyTo] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterHealthMin, setFilterHealthMin] = useState('');
  const [filterHealthMax, setFilterHealthMax] = useState('');
  const [filterLoanStatus, setFilterLoanStatus] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [optimisticallyDeletedIds, setOptimisticallyDeletedIds] = useState<Set<string>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  // Ouvrir automatiquement le scanner si le paramètre 'scan' est présent
  useEffect(() => {
    if (searchParams.get('scan') === 'true') {
      setIsScanning(true);
      // Nettoyer l'URL après avoir ouvert le scanner
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('scan');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Sorting states
  // Tri par défaut: nom d'équipement en ordre alphabétique
  const [sortColumn, setSortColumn] = useState<EquipmentSortColumn | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch Equipments
  const {
    data: equipments,
    loading: equipmentsLoading,
    error: equipmentsError,
    refetch: refetchEquipments,
    updateDocument: updateEquipment,
    addDocument: addEquipment,
  } = useCollection<Equipment>({
    tableName: 'equipments',
  });

  // Fetch Equipment Groups
  const {
    data: equipmentGroups,
    loading: groupsLoading,
    error: groupsError,
  } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups',
  });

  // Fetch Buildings
  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useCollection<Building>({
    tableName: 'buildings',
  });

  // Fetch Services
  const {
    data: services,
    loading: servicesLoading,
    error: servicesError,
  } = useCollection<Service>({
    tableName: 'services',
  });

  // Fetch Locations
  const {
    data: locations,
    loading: locationsLoading,
    error: locationsError,
  } = useCollection<Location>({
    tableName: 'locations',
  });

  // Enrich equipments and groups with their relationships
  const {
    enrichedEquipments,
    enrichedGroups,
    loadingRelations
  } = useEquipmentGroupData(equipments || [], equipmentGroups || []);

  const hasActiveFilters = useMemo(() =>
    filterStatus !== 'all' ||
    filterGroup !== 'all' ||
    filterBuilding !== 'all' ||
    filterService !== 'all' ||
    filterLocation !== 'all' ||
    filterSupplier !== 'all' ||
    filterManufacturer !== 'all' ||
    filterUF !== 'all' ||
    filterType !== 'all' ||
    filterLoanStatus !== 'all' ||
    filterName !== '' ||
    filterModel !== '' ||
    filterInventory !== '' ||
    filterPurchaseDateFrom !== '' ||
    filterPurchaseDateTo !== '' ||
    filterServiceDateFrom !== '' ||
    filterServiceDateTo !== '' ||
    filterWarrantyFrom !== '' ||
    filterWarrantyTo !== '' ||
    filterPriceMin !== '' ||
    filterPriceMax !== '' ||
    filterHealthMin !== '' ||
    filterHealthMax !== '',
    [filterStatus, filterGroup, filterBuilding, filterService, filterLocation, filterSupplier, filterManufacturer, filterUF, filterType, filterLoanStatus, filterName, filterModel, filterInventory, filterPurchaseDateFrom, filterPurchaseDateTo, filterServiceDateFrom, filterServiceDateTo, filterWarrantyFrom, filterWarrantyTo, filterPriceMin, filterPriceMax, filterHealthMin, filterHealthMax]
  );

  const uniqueSuppliers = useMemo(() => {
    if (!enrichedEquipments) return [];
    const suppliers = enrichedEquipments.map(e => e.supplier).filter((s): s is string => !!s);
    return [...new Set(suppliers)].sort();
  }, [enrichedEquipments]);

  const uniqueManufacturers = useMemo(() => {
    if (!enrichedEquipments) return [];
    const manufacturers = enrichedEquipments.map(e => e.manufacturer).filter((m): m is string => !!m);
    return [...new Set(manufacturers)].sort();
  }, [enrichedEquipments]);

  const [allUFs, setAllUFs] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const loadUFs = async () => {
      try {
        const { data, error } = await supabase.from('ufs').select('name').order('name');
        if (error) throw error;
        const names = (data || []).map((u: any) => u.name).filter((n: any) => !!n);
        if (active) setAllUFs(names);
      } catch (e) {
        // En cas d'erreur, ne pas bloquer l'écran; garder allUFs vide
        console.warn('Chargement des UF échoué (non bloquant):', e);
      }
    };
    loadUFs();
    return () => { active = false; };
  }, []);

  const uniqueUFs = useMemo(() => {
    const fromEquipments = (enrichedEquipments || [])
      .map(e => e.uf)
      .filter((uf): uf is string => !!uf);
    // Union des UF venant de la table et de celles présentes sur les équipements
    return [...new Set([...(allUFs || []), ...fromEquipments])].sort();
  }, [enrichedEquipments, allUFs]);

  const uniqueNames = useMemo(() => {
    if (!enrichedEquipments) return [];
    const names = enrichedEquipments.map(e => e.name).filter((n): n is string => !!n);
    return [...new Set(names)].sort();
  }, [enrichedEquipments]);

  const uniqueModels = useMemo(() => {
    if (!enrichedEquipments) return [];
    const models = enrichedEquipments.map(e => e.model).filter((m): m is string => !!m);
    return [...new Set(models)].sort();
  }, [enrichedEquipments]);

  const uniqueInventoryNumbers = useMemo(() => {
    if (!enrichedEquipments) return [];
    const inventoryNumbers = enrichedEquipments.map(e => e.inventory_number).filter((n): n is string => !!n);
    return [...new Set(inventoryNumbers)].sort();
  }, [enrichedEquipments]);

  // Maintenir selectedEquipment synchronisé lorsque les données des équipements changent
  useEffect(() => {
    if (!selectedEquipment || !enrichedEquipments) return;
    const updated = enrichedEquipments.find(e => e.id === selectedEquipment.id);
    if (updated) {
      setSelectedEquipment(updated as any);
    }
  }, [enrichedEquipments]);

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterGroup('all');
    setFilterBuilding('all');
    setFilterService('all');
    setFilterLocation('all');
    setFilterSupplier('all');
    setFilterManufacturer('all');
    setFilterUF('all');
    setFilterType('all');
    setFilterLoanStatus('all');
    setFilterName('');
    setFilterModel('');
    setFilterInventory('');
    setFilterPurchaseDateFrom('');
    setFilterPurchaseDateTo('');
    setFilterServiceDateFrom('');
    setFilterServiceDateTo('');
    setFilterWarrantyFrom('');
    setFilterWarrantyTo('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterHealthMin('');
    setFilterHealthMax('');
  };

  // Enrichment, Filter and Sort logic
  const enrichedAndFilteredEquipments = useMemo(() => {
    if (!enrichedEquipments) return [];

    const buildingMap = new Map(buildings?.map(b => [b.id, b.name]));
    const serviceMap = new Map(services?.map(s => [s.id, s.name]));
    const locationMap = new Map(locations?.map(l => [l.id, l.name]));
    const groupMap = new Map(equipmentGroups?.map(g => [g.id, g.name]));

    const enriched: EquipmentUI[] = enrichedEquipments
      .filter(e => !optimisticallyDeletedIds.has(e.id))
      .map(equipment => ({
      ...equipment,
      buildingName: equipment.building_id ? buildingMap.get(equipment.building_id) : null,
      serviceName: equipment.service_id ? serviceMap.get(equipment.service_id) : null,
      locationName: equipment.location_id ? locationMap.get(equipment.location_id) : null,
      groupNames: equipment.associated_group_ids?.map(id => groupMap.get(id)).filter((name): name is string => !!name) || [],
    }));

    const filtered = enriched.filter(equipment => {
      const matchesSearch = searchTerm === '' ||
        equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.inventory_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesName = filterName === '' || equipment.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesModel = filterModel === '' || (equipment.model && equipment.model.toLowerCase().includes(filterModel.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || equipment.status === filterStatus;

      const matchesGroup = filterGroup === 'all' ||
        (equipment.associated_group_ids && equipment.associated_group_ids.includes(filterGroup));

      const matchesBuilding = filterBuilding === 'all' || equipment.building_id === filterBuilding;
      const matchesService = filterService === 'all' || equipment.service_id === filterService;
      const matchesLocation = filterLocation === 'all' || equipment.location_id === filterLocation;
      const matchesSupplier = filterSupplier === 'all' || equipment.supplier === filterSupplier;
      const matchesManufacturer = filterManufacturer === 'all' || equipment.manufacturer === filterManufacturer;
      const matchesUF = filterUF === 'all' || equipment.uf === filterUF;
      const matchesType = filterType === 'all' || (equipment.equipment_type && equipment.equipment_type.toString().trim().toLowerCase() === String(filterType).trim().toLowerCase());
      const matchesInventory = filterInventory === '' || (equipment.inventory_number && equipment.inventory_number.toLowerCase().includes(filterInventory.toLowerCase()));
      const matchesLoanStatus = filterLoanStatus === 'all' || (filterLoanStatus === 'loaned' && equipment.loan_status) || (filterLoanStatus === 'available' && !equipment.loan_status);

      // Date filters
      const matchesPurchaseDate = () => {
        if (!equipment.purchase_date) return filterPurchaseDateFrom === '' && filterPurchaseDateTo === '';
        const purchaseDate = new Date(equipment.purchase_date);
        const fromDate = filterPurchaseDateFrom ? new Date(filterPurchaseDateFrom) : null;
        const toDate = filterPurchaseDateTo ? new Date(filterPurchaseDateTo) : null;
        return (!fromDate || purchaseDate >= fromDate) && (!toDate || purchaseDate <= toDate);
      };

      const matchesServiceDate = () => {
        if (!equipment.date_mise_en_service) return filterServiceDateFrom === '' && filterServiceDateTo === '';
        const serviceDate = new Date(equipment.date_mise_en_service);
        const fromDate = filterServiceDateFrom ? new Date(filterServiceDateFrom) : null;
        const toDate = filterServiceDateTo ? new Date(filterServiceDateTo) : null;
        return (!fromDate || serviceDate >= fromDate) && (!toDate || serviceDate <= toDate);
      };

      const matchesWarrantyDate = () => {
        if (!equipment.warranty_expiry) return filterWarrantyFrom === '' && filterWarrantyTo === '';
        const warrantyDate = new Date(equipment.warranty_expiry);
        const fromDate = filterWarrantyFrom ? new Date(filterWarrantyFrom) : null;
        const toDate = filterWarrantyTo ? new Date(filterWarrantyTo) : null;
        return (!fromDate || warrantyDate >= fromDate) && (!toDate || warrantyDate <= toDate);
      };

      // Price filters
      const matchesPrice = () => {
        if (!equipment.purchase_price) return filterPriceMin === '' && filterPriceMax === '';
        const price = equipment.purchase_price;
        const minPrice = filterPriceMin ? parseFloat(filterPriceMin) : null;
        const maxPrice = filterPriceMax ? parseFloat(filterPriceMax) : null;
        return (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);
      };

      // Health filters
      const matchesHealth = () => {
        if (equipment.health_percentage === null) return filterHealthMin === '' && filterHealthMax === '';
        const health = equipment.health_percentage;
        const minHealth = filterHealthMin ? parseFloat(filterHealthMin) : null;
        const maxHealth = filterHealthMax ? parseFloat(filterHealthMax) : null;
        return (!minHealth || health >= minHealth) && (!maxHealth || health <= maxHealth);
      };

      return matchesSearch && matchesName && matchesModel && matchesStatus && matchesGroup && matchesBuilding && matchesService && matchesLocation && matchesSupplier && matchesManufacturer && matchesUF && matchesType && matchesInventory && matchesLoanStatus && matchesPurchaseDate() && matchesServiceDate() && matchesWarrantyDate() && matchesPrice() && matchesHealth();
    });


    return filtered;
  }, [
    enrichedEquipments, searchTerm, filterName, filterModel, filterStatus, filterGroup,
    filterBuilding, filterService, filterLocation, filterSupplier, filterManufacturer, filterUF,
    filterType, filterInventory, filterLoanStatus, filterPurchaseDateFrom, filterPurchaseDateTo,
    filterServiceDateFrom, filterServiceDateTo, filterWarrantyFrom, filterWarrantyTo,
    filterPriceMin, filterPriceMax, filterHealthMin, filterHealthMax,
    buildings, services, locations, equipmentGroups, optimisticallyDeletedIds
  ]);

  const sortedEquipments = useMemo(() => {
    if (!sortColumn) return enrichedAndFilteredEquipments;

    const sorted = [...enrichedAndFilteredEquipments].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'model':
          valA = a.model?.toLowerCase() || '';
          valB = b.model?.toLowerCase() || '';
          break;
        case 'manufacturer':
          valA = a.manufacturer?.toLowerCase() || '';
          valB = b.manufacturer?.toLowerCase() || '';
          break;
        case 'status':
          valA = a.status?.toLowerCase() || '';
          valB = b.status?.toLowerCase() || '';
          break;
        case 'health_percentage':
          valA = a.health_percentage || 0;
          valB = b.health_percentage || 0;
          break;
        case 'inventory_number':
          valA = a.inventory_number?.toLowerCase() || '';
          valB = b.inventory_number?.toLowerCase() || '';
          break;
        case 'serial_number':
          valA = a.serial_number?.toLowerCase() || '';
          valB = b.serial_number?.toLowerCase() || '';
          break;
        case 'uf':
          valA = a.uf?.toLowerCase() || '';
          valB = b.uf?.toLowerCase() || '';
          break;
        case 'buildingName':
          valA = a.buildingName?.toLowerCase() || '';
          valB = b.buildingName?.toLowerCase() || '';
          break;
        case 'serviceName':
          valA = a.serviceName?.toLowerCase() || '';
          valB = b.serviceName?.toLowerCase() || '';
          break;
        case 'locationName':
          valA = a.locationName?.toLowerCase() || '';
          valB = b.locationName?.toLowerCase() || '';
          break;
        case 'created_at':
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
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
  }, [enrichedAndFilteredEquipments, sortColumn, sortDirection]);

  const filteredCount = sortedEquipments.length;
  const totalCount = enrichedEquipments?.length || 0;

  const handleSortChange = (column: EquipmentSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddEquipment = () => {
    setSelectedEquipment(null); 
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleViewEquipment = (equipment: any) => {
    // Support optional __initialAction injected by list actions
    setSelectedEquipment(equipment);
    setIsDetailViewOpen(true);
  };

  const handlePrintEquipments = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleExportToExcel = () => {
    try {
      const exportData = {
        groups: equipmentGroups || [],
        buildings: buildings || [],
        services: services || [],
        locations: locations || [],
        printOptions: {
          includeImage: false,
          includeDetails: true,
          includeHealth: true,
          includeGroups: true,
          includeLocation: true,
          format: 'list' as const,
        },
        filters: {
          searchTerm,
          filterName,
          filterModel,
          filterStatus,
          filterGroup,
          filterBuilding,
          filterService,
          filterLocation,
          filterSupplier,
          filterManufacturer,
          filterUF,
        }
      };

      exportEquipmentsToExcel(sortedEquipments, exportData);
      
      toast({
        title: "Export Excel réussi",
        description: `Les équipements ont été exportés vers Excel avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les équipements vers Excel.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setSelectedEquipment(null);
  };

  const handleSaveEquipment = async (equipmentData: Equipment, imageFile?: File | null) => {
    console.log("handleSaveEquipment (Page): Fonction appelée.");
    console.log("handleSaveEquipment (Page): Données reçues:", equipmentData);
    console.log("handleSaveEquipment (Page): Fichier image reçu:", imageFile);

    const isNew = !equipments?.find(eq => eq.id === equipmentData.id);
    let updatedEquipmentData = { ...equipmentData };

    // Find the original equipment data if it's an existing item
    const originalEquipment = !isNew ? equipments?.find(eq => eq.id === equipmentData.id) : null;

    // Handle image upload if a file is selected
    if (imageFile) {
      // Simplified file path - directly in the bucket with equipment ID and file extension
      const fileExtension = imageFile.name.split('.').pop();
      const filePath = `${equipmentData.id}.${fileExtension}`;
      
      console.log(`Uploading image to equipment-images bucket: ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('equipment-images') // Use the correct bucket name
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file exists
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast({
          title: "Erreur de téléchargement d'image",
          description: `Impossible de télécharger l'image: ${uploadError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('equipment-images') // Use the correct bucket name
        .getPublicUrl(filePath);

      if (publicUrlData) {
        console.log("Image public URL:", publicUrlData.publicUrl);
        updatedEquipmentData.image_url = publicUrlData.publicUrl;
      } else {
         console.warn("Could not get public URL for image.");
      }
    } else if (equipmentData.image_url === '') {
       if (equipmentData.id && originalEquipment?.image_url) {
          console.log(`Removing image for equipment ${equipmentData.id}`);
          updatedEquipmentData.image_url = null;
       }
    } else {
       if (!isNew && originalEquipment?.image_url && !updatedEquipmentData.image_url) {
           updatedEquipmentData.image_url = null;
       }
    }

      try {
      // Extraire les propriétés calculées pour les gérer séparément
      const { 
        associated_group_ids, 
        ...equipmentDataWithoutGroups 
      } = updatedEquipmentData;
      
      // Nettoyer les champs non stockés en base
      const sanitized: any = { ...equipmentDataWithoutGroups };
      delete sanitized.buildingName;
      delete sanitized.serviceName;
      delete sanitized.locationName;
      delete sanitized.groupNames;
      delete sanitized.associated_group_ids;
      
      const groupIds = associated_group_ids || [];
      
      if (isNew) {
        console.log("Creating new equipment:", sanitized);
        console.log("Equipment ID for creation:", sanitized.id);
        console.log("Groups to assign:", groupIds);
        
        const { id, ...equipmentWithoutId } = sanitized;
        
        // Créer l'équipement d'abord
        const createdEquipment = await addEquipment(equipmentWithoutId as Omit<Equipment, "id">);
        console.log("Created equipment result:", createdEquipment);
        
        // Attendre que l'équipement soit visible dans la base avec une requête
        let actualEquipmentId = id;
        if (Array.isArray(createdEquipment) && createdEquipment.length > 0) {
          actualEquipmentId = createdEquipment[0].id;
        } else if (createdEquipment && typeof createdEquipment === 'object' && 'id' in createdEquipment) {
          actualEquipmentId = (createdEquipment as any).id;
        }
        
        console.log("Actual equipment ID:", actualEquipmentId);
        
        // Vérifier que l'équipement existe vraiment dans la base
        const { data: verifyEquipment } = await supabase
          .from('equipments')
          .select('id')
          .eq('id', actualEquipmentId)
          .single();
          
        console.log("Equipment exists in DB:", verifyEquipment);
        
        // Gérer les groupes SEULEMENT après confirmation que l'équipement existe
        if (verifyEquipment && groupIds && groupIds.length > 0) {
          console.log("Managing equipment groups after creation:", groupIds);
          try {
            console.log("Calling updateEquipmentGroupMembers with:", actualEquipmentId, groupIds);
            await junctionTableManager.updateEquipmentGroupMembers(actualEquipmentId, groupIds);
            console.log("Successfully added equipment to groups via junction tables:", groupIds);
            
            // Vérifier que les relations ont été créées
            const verifyGroups = await junctionTableManager.getGroupsForEquipment(actualEquipmentId);
            console.log("Verification - Groups assigned to equipment:", verifyGroups);
          } catch (error) {
            console.error("Error adding equipment to groups:", error);
          }
        } else {
          if (!verifyEquipment) {
            console.error("Equipment not found in database after creation!");
          } else {
            console.log("No groups to assign to new equipment");
          }
        }
        
        toast({
          title: "Équipement ajouté",
          description: `${equipmentDataWithoutGroups.name} a été ajouté avec succès.`,
        });
      } else {
        console.log("Updating equipment:", sanitized);
        
        // Récupérer les données existantes pour l'historique
        const { data: existingEquipment } = await supabase
          .from('equipments')
          .select('*')
          .eq('id', sanitized.id)
          .single();
          
        await updateEquipment(sanitized.id, sanitized as Partial<Equipment>);

        // Gérer les groupes après mise à jour de l'équipement via les tables de jonction
        if (groupIds) {
          console.log("Managing equipment groups after update:", groupIds);
          try {
            await junctionTableManager.updateEquipmentGroupMembers(sanitized.id, groupIds);
            console.log("Successfully updated equipment groups via junction tables:", groupIds);
          } catch (error) {
            console.error("Error updating equipment groups:", error);
          }
        }

        // Enregistrer les modifications dans l'historique
        if (existingEquipment) {
          const equipmentForHistory = {
            ...sanitized,
            status: sanitized.status as any,
          } as Equipment;
          
          await logEquipmentChangesInPage(existingEquipment as any, equipmentForHistory);
        }

        toast({
          title: "Équipement mis à jour", 
          description: `${sanitized.name} a été mis à jour avec succès.`,
        });
      }
      
      // Attendre le refetch AVANT de fermer la modal
      await refetchEquipments();
      handleCloseModal();
      return true;
    } catch (error: any) {
      console.error("Error saving equipment:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer l'équipement: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const logEquipmentChangesInPage = async (oldEquipment: Equipment, newEquipment: Equipment) => {
    console.log('[logEquipmentChangesInPage] Starting to log changes...');
    console.log('[logEquipmentChangesInPage] Current user:', user);
    
    const fieldsToTrack = [
      'name', 'model', 'manufacturer', 'serial_number', 'inventory_number',
      'uf', 'building_id', 'service_id', 'location_id',
      'status', 'health_percentage', 'purchase_date', 'date_mise_en_service',
      'warranty_expiry', 'equipment_group_ids'
    ];

    // Determine the user identifier for logging
    const userIdentifier = user ? (user.full_name || user.username || user.id) : 'Anonymous';
    console.log('[logEquipmentChangesInPage] Using user identifier:', userIdentifier);

    for (const field of fieldsToTrack) {
      const oldValue = oldEquipment[field as keyof Equipment];
      const newValue = newEquipment[field as keyof Equipment];

      // Normaliser les valeurs pour la comparaison
      const normalizedOldValue = oldValue === null || oldValue === undefined || oldValue === '' ? null : oldValue;
      const normalizedNewValue = newValue === null || newValue === undefined || newValue === '' ? null : newValue;

      const hasChanged = JSON.stringify(normalizedOldValue) !== JSON.stringify(normalizedNewValue);

      if (hasChanged) {
        console.log(`[logEquipmentChangesInPage] Field "${field}" changed from:`, normalizedOldValue, 'to:', normalizedNewValue);
        try {
          await logEquipmentChange(
            newEquipment.id,
            field,
            normalizedOldValue as any,
            normalizedNewValue as any,
            userIdentifier
          );
          console.log(`[logEquipmentChangesInPage] Successfully logged change for field: ${field} by ${userIdentifier}`);
        } catch (error) {
          console.error(`[logEquipmentChangesInPage] Failed to log change for field ${field}:`, error);
        }
      }
    }
  };

  const handleDeleteEquipment = async (equipment: Equipment, shouldDeleteEmptyGroups: boolean = true) => {
    try {
      // Trigger fade-out first
      setFadingIds(prev => {
        const next = new Set(prev);
        next.add(equipment.id);
        return next;
      });
      // After 300ms, hide from list optimistically
      setTimeout(() => {
        setOptimisticallyDeletedIds(prev => {
          const next = new Set(prev);
          next.add(equipment.id);
          return next;
        });
      }, 300);

      // Close the detail view immediately for better UX
      handleCloseDetailView();

      await deleteEquipment(equipment.id, shouldDeleteEmptyGroups);
      await refetchEquipments();
      // Cleanup optimistic set after refetch
      setOptimisticallyDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(equipment.id);
        return next;
      });
      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(equipment.id);
        return next;
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      // Revert optimistic removal on failure
      setOptimisticallyDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(equipment.id);
        return next;
      });
      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(equipment.id);
        return next;
      });
    }
  };

  const handleScanButtonClick = () => {
    setIsScanning(true);
  };

  const handleQrCodeDetected = (qrData: string) => {
    console.log("QR Code detected:", qrData);
    
    let equipmentId = qrData;
    try {
      const url = new URL(qrData);
      const pathSegments = url.pathname.split('/').filter(segment => segment !== '');
      
      if (pathSegments.length >= 2 && pathSegments[pathSegments.length - 2] === 'equipment') {
        equipmentId = pathSegments[pathSegments.length - 1];
      }
    } catch (e) {
      console.log("Detected data is not a URL, treating as raw ID");
    }
    
    const foundEquipment = enrichedEquipments?.find(eq => eq.id === equipmentId);
    
    if (foundEquipment) {
      toast({
        title: "Équipement trouvé",
        description: `Ouverture de la fiche de ${foundEquipment.name}`,
      });
      handleViewEquipment(foundEquipment);
    } else {
      toast({
        title: "Équipement non trouvé",
        description: `Aucun équipement trouvé avec l'identifiant: ${equipmentId}`,
        variant: "destructive",
      });
    }
  };

  if (equipmentsLoading || groupsLoading || buildingsLoading || servicesLoading || locationsLoading || loadingRelations) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (equipmentsError || groupsError || buildingsError || servicesError || locationsError) {
    return (
      <div className="text-center text-destructive p-8">
        <p>Erreur lors du chargement des données :</p>
        {equipmentsError && <p>Équipements: {equipmentsError.message}</p>}
        {groupsError && <p>Groupes: {groupsError.message}</p>}
        {buildingsError && <p>Bâtiments: {buildingsError.message}</p>}
        {servicesError && <p>Services: {servicesError.message}</p>}
        {locationsError && <p>Locaux: {locationsError.message}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Gestion des Équipements</h1>
        <Badge variant="outline" className="whitespace-nowrap">
          {hasActiveFilters || searchTerm ? filteredCount : totalCount}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-3">
        <div className="flex items-center gap-2 flex-grow w-full lg:w-auto min-w-0">
          <div className="relative flex-grow min-w-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                minWidth: '150px',
                maxWidth: '300px',
                height: '32px',
                paddingLeft: '32px',
                paddingRight: '8px',
                paddingTop: '4px',
                paddingBottom: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: 'black',
                fontSize: '14px',
                borderRadius: '6px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <EquipmentFilter
            filterName={filterName}
            setFilterName={setFilterName}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterGroup={filterGroup}
            setFilterGroup={setFilterGroup}
            equipmentGroups={equipmentGroups || []}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            filterBuilding={filterBuilding}
            setFilterBuilding={setFilterBuilding}
            filterService={filterService}
            setFilterService={setFilterService}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            filterSupplier={filterSupplier}
            setFilterSupplier={setFilterSupplier}
            filterManufacturer={filterManufacturer}
            setFilterManufacturer={setFilterManufacturer}
            filterUF={filterUF}
            setFilterUF={setFilterUF}
            filterType={filterType}
            setFilterType={setFilterType}
            filterInventory={filterInventory}
            setFilterInventory={setFilterInventory}
            filterPurchaseDateFrom={filterPurchaseDateFrom}
            setFilterPurchaseDateFrom={setFilterPurchaseDateFrom}
            filterPurchaseDateTo={filterPurchaseDateTo}
            setFilterPurchaseDateTo={setFilterPurchaseDateTo}
            filterServiceDateFrom={filterServiceDateFrom}
            setFilterServiceDateFrom={setFilterServiceDateFrom}
            filterServiceDateTo={filterServiceDateTo}
            setFilterServiceDateTo={setFilterServiceDateTo}
            filterWarrantyFrom={filterWarrantyFrom}
            setFilterWarrantyFrom={setFilterWarrantyFrom}
            filterWarrantyTo={filterWarrantyTo}
            setFilterWarrantyTo={setFilterWarrantyTo}
            filterPriceMin={filterPriceMin}
            setFilterPriceMin={setFilterPriceMin}
            filterPriceMax={filterPriceMax}
            setFilterPriceMax={setFilterPriceMax}
            filterHealthMin={filterHealthMin}
            setFilterHealthMin={setFilterHealthMin}
            filterHealthMax={filterHealthMax}
            setFilterHealthMax={setFilterHealthMax}
            filterLoanStatus={filterLoanStatus}
            setFilterLoanStatus={setFilterLoanStatus}
            buildings={buildings || []}
            services={services || []}
            locations={locations || []}
            suppliers={uniqueSuppliers}
            manufacturers={uniqueManufacturers}
            ufs={uniqueUFs}
            uniqueNames={uniqueNames}
            uniqueModels={uniqueModels}
            uniqueInventoryNumbers={uniqueInventoryNumbers}
            isOpen={isFilterModalOpen}
            onOpenChange={setIsFilterModalOpen}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-1 w-full lg:w-auto flex-shrink-0 items-stretch">
           <div className="flex w-full sm:w-auto">
             <Button
               variant={viewMode === 'list' ? 'secondary' : 'outline'}
               onClick={() => setViewMode('list')}
               className="rounded-r-none flex-1 sm:flex-none"
               size="sm"
             >
               <List className="h-4 w-4" />
             </Button>
             <Button
               variant={viewMode === 'grid' ? 'secondary' : 'outline'}
               onClick={() => setViewMode('grid')}
               className="rounded-l-none flex-1 sm:flex-none"
               size="sm"
             >
               <Grid className="h-4 w-4" />
             </Button>
           </div>

           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" size="sm">
                <ListFilter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Trier</span>
                {sortColumn && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value: EquipmentSortColumn) => handleSortChange(value)}>
                <DropdownMenuRadioItem value="name">Nom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="model">Modèle</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="manufacturer">Fabricant</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Statut</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="health_percentage">Santé (%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="inventory_number">N° Inventaire</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="serial_number">N° Série</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="uf">UF</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="buildingName">Bâtiment</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="serviceName">Service</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="locationName">Localisation</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_at">Date de création</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

           <Button onClick={handlePrintEquipments} variant="outline" className="w-full sm:w-auto" size="sm">
             <FileDown className="mr-1 h-3 w-3" />
             <span className="hidden lg:inline">Exporter PDF</span>
             <span className="lg:hidden">PDF</span>
           </Button>

           <Button onClick={handleExportToExcel} variant="outline" className="w-full sm:w-auto" size="sm">
             <FileSpreadsheet className="mr-1 h-3 w-3" />
             <span className="hidden lg:inline">Exporter Excel</span>
             <span className="lg:hidden">Excel</span>
           </Button>

           <Button onClick={handleScanButtonClick} className="w-full sm:w-auto" size="sm">
             <QrCode className="mr-1 h-3 w-3" />
             <span className="hidden lg:inline">Scanner QR</span>
             <span className="lg:hidden">Scanner</span>
           </Button>

           <Button onClick={handleAddEquipment} className="w-full sm:w-auto" size="sm">
             <PlusCircle className="mr-1 h-3 w-3" />
             <span className="hidden lg:inline">Ajouter Équipement</span>
             <span className="lg:hidden">Ajouter</span>
           </Button>
        </div>
      </div>

      {sortedEquipments.length === 0 && searchTerm === '' && filterStatus === 'all' && filterGroup === 'all' ? (
         <div className="text-center py-20 text-muted-foreground">
           <p>Aucun équipement trouvé.</p>
           <Button onClick={handleAddEquipment} className="mt-4">
             <PlusCircle className="mr-2 h-4 w-4" />
             Ajouter un équipement
           </Button>
         </div>
      ) : sortedEquipments.length === 0 ? (
         <div className="text-center py-20 text-muted-foreground">
           <p>Aucun équipement ne correspond à vos critères de recherche ou de filtre.</p>
         </div>
      ) : (
        viewMode === 'list' ? (
          <EquipmentListView
            equipments={sortedEquipments}
            groups={enrichedGroups || []}
            buildings={buildings || []}
            services={services || []}
            locations={locations || []}
            onEquipmentClick={handleViewEquipment}
            onCreateInterventionFromList={(eq) => {
              setSelectedEquipment(eq);
              setShowInterventionModal(true);
            }}
            onOpenDocumentsFromList={async (eq) => {
              try {
                setSelectedEquipment(eq);
                setDocumentsLoading(true);
                const docs = await fetchDocumentsForEquipment(eq.id);
                setDocuments(docs || []);
                setShowDocumentsModal(true);
              } finally {
                setDocumentsLoading(false);
              }
            }}
            onOpenMaintenanceFromList={(eq) => {
              setSelectedEquipment(eq);
              setShowMaintenanceModal(true);
            }}
            onEditEquipment={handleEditEquipment}
            onDeleteEquipment={(eq) => handleDeleteEquipment(eq, true)}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            fadingIds={fadingIds}
          />
        ) : (
          <EquipmentGridView
            equipments={sortedEquipments}
            groups={enrichedGroups || []}
            buildings={buildings || []}
            services={services || []}
            locations={locations || []}
            onEquipmentClick={handleViewEquipment}
            fadingIds={fadingIds}
          />
        )
      )}

      <EquipmentDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEquipment}
        equipment={selectedEquipment}
        equipmentGroups={enrichedGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
      />

      <EquipmentDetailView
        isOpen={isDetailViewOpen}
        onClose={handleCloseDetailView}
        equipment={selectedEquipment}
        initialAction={(selectedEquipment as any)?.__initialAction || null}
        onEdit={handleEditEquipment}
        onDelete={() => handleDeleteEquipment(selectedEquipment!, true)}
        groups={enrichedGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
      />

      {/* Direct Intervention Modal from list */}
      {selectedEquipment && (
        <InterventionFormModal
          isOpen={showInterventionModal}
          onClose={() => setShowInterventionModal(false)}
          onSave={async () => { setShowInterventionModal(false); await refetchEquipments(); }}
          equipmentId={selectedEquipment.id}
          currentUser={user}
        />
      )}

      {/* Direct Maintenance Modal from list */}
      {selectedEquipment && (
        <MaintenanceFormModal
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          onSave={() => setShowMaintenanceModal(false)}
          prefillEquipment={{ equipment_id: selectedEquipment.id, equipment_name: selectedEquipment.name }}
          currentUser={user}
        />
      )}

      {/* Direct Documents Modal from list */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents techniques {selectedEquipment ? `- ${selectedEquipment.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {documentsLoading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : documents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun document trouvé.</div>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="border rounded p-2">
                    <div className="font-medium">{doc.title || doc.filename}</div>
                    {doc.description && (
                      <div className="text-xs text-muted-foreground">{doc.description}</div>
                    )}
                    {doc.fileurl && (
                      <a href={doc.fileurl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Ouvrir</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QrScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onDetected={handleQrCodeDetected}
      />

      <EquipmentPrintModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        equipments={sortedEquipments}
        groups={enrichedGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
      />
    </div>
  );
};

export default EquipmentPage;
