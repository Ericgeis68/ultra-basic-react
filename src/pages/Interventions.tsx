import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import CustomCard from '@/components/ui/CustomCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Search, Plus, Filter, Calendar, CheckCircle2, Clock, Users, WrenchIcon, AlertTriangle, LayoutGrid, List, Trash2, FileText, Printer, ChevronDown, ChevronRight, ChevronUp, User, Tag, ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import InterventionFormModal from '@/components/interventions/InterventionFormModal';
import InterventionListView from '@/components/interventions/InterventionListView';
import InterventionPrintPreview from '@/components/print/InterventionPrintPreview';
import EquipmentDetailModal from '@/components/equipment/EquipmentDetailModal';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Equipment } from '@/types/equipment';
import { TechnicianHistoryEntry } from '@/types/intervention';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateInterventionPDF, PDFInterventionData } from '@/lib/pdfGenerator';
import { Combobox } from '@/components/equipment/Combobox';
import { useMaintenance } from '@/hooks/useMaintenance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the UI type for Intervention, matching what is displayed
export type InterventionUI = {
  id: string;
  title: string;
  type: 'corrective' | 'preventive' | 'improvement' | 'regulatory';
  status: 'in-progress' | 'completed';
  equipmentId: string;
  equipmentName: string;
  buildingName?: string;
  scheduled_date: string;
  completedDate?: string;
  technicians: string[];
  actions: string;
  parts?: {
    name: string;
    quantity: number;
  }[];
  createdAt: string;
  technician_history?: TechnicianHistoryEntry[];
};

// Define filters interface
interface Filters {
  type: string;
  technician: string;
  building: string;
  equipment: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const Interventions = () => {
  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionUI | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  const [isEquipmentDetailOpen, setIsEquipmentDetailOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    technician: 'all',
    building: 'all',
    equipment: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [buildingNames, setBuildingNames] = useState<Record<string, string>>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { user } = useAuth();
  const { syncInterventionWithMaintenance } = useMaintenance();

  // Sorting states
  const [sortColumn, setSortColumn] = useState<keyof InterventionUI | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch interventions from Supabase
  const {
    data: interventions,
    loading: interventionsLoading,
    error: interventionsError,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch: refetchInterventions
  } = useCollection<any>({
    tableName: 'interventions',
  });

  // Fetch equipments from Supabase
  const {
    data: equipments,
    loading: equipmentsLoading,
    error: equipmentsError,
  } = useCollection<any>({
    tableName: 'equipments',
  });

  // Fetch other related data for equipment modal
  const { data: equipmentGroups } = useCollection<any>({ tableName: 'equipment_groups' });
  const { data: buildingsData } = useCollection<any>({ tableName: 'buildings' });
  const { data: services } = useCollection<any>({ tableName: 'services' });
  const { data: locations } = useCollection<any>({ tableName: 'locations' });

  // Fetch buildings from Supabase
  const {
    data: buildings,
    loading: buildingsLoading,
    error: buildingsError,
  } = useCollection<any>({
    tableName: 'buildings',
  });

  // Fetch all users for technician names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name');

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        setAllUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Function to get technician name by ID
  const getTechnicianName = (userId: string): string => {
    const foundUser = allUsers.find(u => u.id === userId);
    return foundUser?.full_name || `ID: ${userId}`;
  };

  // Function to get equipment name by ID
  const getEquipmentName = (equipmentId: string | null | undefined): string => {
    if (!equipmentId) {
      return 'Aucun équipement assigné';
    }

    const equipment = equipments?.find(eq => eq.id === equipmentId);
    if (!equipment) {
      return 'Équipement non trouvé';
    }

    return equipment.name;
  };

  // Function to get building name by equipment ID
  const getBuildingNameByEquipment = (equipmentId: string | null | undefined): string => {
    if (!equipmentId) return 'Bâtiment non spécifié';
    
    const equipment = equipments?.find(eq => eq.id === equipmentId);
    if (!equipment || !equipment.building_id) return 'Bâtiment non spécifié';
    
    if (buildingNames[equipment.building_id]) {
      return buildingNames[equipment.building_id];
    }
    
    return 'Bâtiment inconnu';
  };

  // Fetch locations and buildings for equipment display
  useEffect(() => {
    const fetchLocationNames = async () => {
      if (!equipments || equipments.length === 0) return;

      try {
        const locationIds = equipments
          .map(eq => eq.location_id)
          .filter(id => id !== null && id !== undefined) as string[];

        if (locationIds.length === 0) return;

        const { data, error } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', locationIds);

        if (error) {
          console.error('Error fetching location names:', error);
          return;
        }

        const locationMap: Record<string, string> = {};
        data.forEach(location => {
          locationMap[location.id] = location.name;
        });

        setLocationNames(locationMap);
      } catch (error) {
        console.error('Error fetching location names:', error);
      }
    };

    fetchLocationNames();
  }, [equipments]);

  // Fetch building names
  useEffect(() => {
    const fetchBuildingNames = async () => {
      if (!equipments || equipments.length === 0) return;

      try {
        const buildingIds = equipments
          .map(eq => eq.building_id)
          .filter(id => id !== null && id !== undefined) as string[];

        if (buildingIds.length === 0) return;

        const { data, error } = await supabase
          .from('buildings')
          .select('id, name')
          .in('id', buildingIds);

        if (error) {
          console.error('Error fetching building names:', error);
          return;
        }

        const buildingMap: Record<string, string> = {};
        data.forEach(building => {
          buildingMap[building.id] = building.name;
        });

        setBuildingNames(buildingMap);
      } catch (error) {
        console.error('Error fetching building names:', error);
      }
    };

    fetchBuildingNames();
  }, [equipments]);

  const getLocationName = (equipmentId: string | null | undefined): string => {
    if (!equipmentId) return 'Non spécifiée';
    const equipment = equipments?.find(eq => eq.id === equipmentId);
    if (!equipment) return 'Localisation inconnue';

    if (equipment.location_id && locationNames[equipment.location_id]) {
      return locationNames[equipment.location_id];
    }
    return '';
  };

  // Get unique values for filter dropdowns
  const uniqueTechnicians = useMemo(() => {
    const technicianSet = new Set<string>();
    interventions?.forEach(intervention => {
      if (intervention.technicians && Array.isArray(intervention.technicians)) {
        intervention.technicians.forEach(techId => {
          const techName = getTechnicianName(techId);
          technicianSet.add(`${techId}|${techName}`);
        });
      }
      if (intervention.technician_history && Array.isArray(intervention.technician_history)) {
        intervention.technician_history.forEach((entry: any) => {
          if (entry.technician_id && entry.technician_name) {
            technicianSet.add(`${entry.technician_id}|${entry.technician_name}`);
          }
        });
      }
    });
    return Array.from(technicianSet).map(tech => {
      const [id, name] = tech.split('|');
      return { id, name };
    });
  }, [interventions, allUsers]);

  const uniqueBuildings = useMemo(() => {
    const buildingSet = new Set<string>();
    interventions?.forEach(intervention => {
      const buildingName = getBuildingNameByEquipment(intervention.equipment_id);
      if (buildingName && buildingName !== 'Bâtiment non spécifié' && buildingName !== 'Bâtiment inconnu') {
        buildingSet.add(buildingName);
      }
    });
    return Array.from(buildingSet);
  }, [interventions, equipments, buildingNames]);

  const uniqueEquipments = useMemo(() => {
    const equipmentSet = new Set<string>();
    interventions?.forEach(intervention => {
      if (intervention.equipment_id) {
        const equipmentName = getEquipmentName(intervention.equipment_id);
        if (equipmentName && equipmentName !== 'Aucun équipement assigné' && equipmentName !== 'Équipement non trouvé') {
          equipmentSet.add(`${intervention.equipment_id}|${equipmentName}`);
        }
      }
    });
    return Array.from(equipmentSet).map(eq => {
      const [id, name] = eq.split('|');
      return { id, name };
    });
  }, [interventions, equipments]);


  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'preventive', label: 'Préventive' },
    { value: 'corrective', label: 'Corrective' },
    { value: 'improvement', label: 'Amélioration' },
    { value: 'regulatory', label: 'Réglementaire' },
  ];
  
  const technicianOptions = useMemo(() => ([
    { value: 'all', label: 'Tous les techniciens' },
    ...uniqueTechnicians.map(tech => ({ value: tech.id, label: tech.name }))
  ]), [uniqueTechnicians]);

  const buildingOptions = useMemo(() => ([
    { value: 'all', label: 'Tous les bâtiments' },
    ...uniqueBuildings.map(b => ({ value: b, label: b }))
  ]), [uniqueBuildings]);

  const equipmentOptions = useMemo(() => ([
    { value: 'all', label: 'Tous les équipements' },
    ...uniqueEquipments.map(eq => ({ value: eq.id, label: eq.name }))
  ]), [uniqueEquipments]);

  const openNewInterventionForm = () => {
    setSelectedIntervention(null);
    setIsFormOpen(true);
  };

  const openEditInterventionForm = (intervention: InterventionUI) => {
    setSelectedIntervention(intervention);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (interventionId: string) => {
    setInterventionToDelete(interventionId);
    setDeleteDialogOpen(true);
  };

  const handleEquipmentClick = (equipmentId: string) => {
    const equipment = equipments?.find(eq => eq.id === equipmentId);
    if (equipment) {
      setSelectedEquipment(equipment);
      setIsEquipmentDetailOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (interventionToDelete) {
      try {
        await deleteDocument(interventionToDelete);
        toast({
          title: "Intervention supprimée",
          description: "L'intervention a été supprimée avec succès",
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Une erreur s'est produite lors de la suppression: ${error.message}`,
          variant: "destructive"
        });
      }
      setDeleteDialogOpen(false);
      setInterventionToDelete(null);
    }
  };

  const handlePrintIntervention = async (intervention: InterventionUI) => {
    try {
      const equipmentName = getEquipmentName(intervention.equipmentId);
      const equipment = equipments?.find(eq => eq.id === intervention.equipmentId);

      const enrichedIntervention: PDFInterventionData = {
        ...intervention,
        equipmentName: equipmentName,
        equipmentModel: equipment?.model,
        equipmentLocation: getLocationName(intervention.equipmentId),
        equipmentSerialNumber: equipment?.serial_number,
      };

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Fiche d'intervention - ${intervention.title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: Arial, sans-serif;
                  font-size: 11px;
                  line-height: 1.3;
                  background: white;
                }
                
                .intervention-page {
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  padding: 10mm;
                }
                
                .header {
                  display: flex;
                  border: 2px solid #000;
                  margin-bottom: 15px;
                }
                
                .logo-section {
                  width: 60mm;
                  padding: 10px;
                  border-right: 1px solid #000;
                  display: flex;
                  align-items: center;
                }
                
                .logo-placeholder {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                
                .logo-circle {
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #0066cc, #004499);
                  border: 2px solid #fff;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                
                .company-name {
                  font-weight: bold;
                }
                
                .company-title {
                  font-size: 14px;
                  color: #0066cc;
                }
                
                .company-subtitle {
                  font-size: 10px;
                  color: #666;
                }
                
                .title-section {
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #0066cc;
                  color: white;
                }
                
                .title-section h1 {
                  font-size: 16px;
                  font-weight: bold;
                  text-align: center;
                }
                
                .section-header {
                  background: #0066cc;
                  color: white;
                  padding: 8px 12px;
                  font-weight: bold;
                  font-size: 12px;
                  margin-top: 15px;
                  margin-bottom: 0;
                }
                
                .section-content {
                  border: 1px solid #0066cc;
                  border-top: none;
                  min-height: 60px;
                  padding: 10px;
                }
                
                .form-row {
                  display: flex;
                  gap: 20px;
                  margin-bottom: 10px;
                }
                
                .form-group {
                  flex: 1;
                }
                
                .form-field {
                  display: flex;
                  margin-bottom: 8px;
                  align-items: center;
                }
                
                .field-label {
                  font-weight: bold;
                  min-width: 100px;
                  margin-right: 10px;
                }
                
                .field-value {
                  flex: 1;
                  border-bottom: 1px solid #000;
                  min-height: 18px;
                  padding: 2px 5px;
                }
                
                .description-field, .report-field {
                  min-height: 80px;
                  border: 1px solid #ccc;
                  padding: 8px;
                  width: 100%;
                }
                
                .operations-header {
                  display: flex;
                  gap: 20px;
                  align-items: flex-start;
                  padding: 8px 12px;
                  background: #0066cc;
                  color: white;
                }
                
                .operation-group {
                  flex: 1;
                }
                
                .operation-title {
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                
                .checkboxes {
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
                }
                
                .checkbox-item {
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  font-size: 10px;
                }
                
                .checkbox {
                  font-size: 14px;
                  font-weight: bold;
                }
                
                .checkbox.checked {
                  color: #00ff00;
                }
                
                .time-section {
                  margin-top: 15px;
                }
                
                .time-field {
                  border: 1px solid #0066cc;
                  border-top: none;
                  height: 60px;
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  padding: 10px;
                }
                
                .parts-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                
                .parts-table th,
                .parts-table td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                
                .parts-table th {
                  background: #f0f0f0;
                  font-weight: bold;
                }
                
                @media print {
                  body { margin: 0; }
                  .intervention-page { 
                    border: none; 
                    margin: 0; 
                    padding: 15mm;
                  }
                }
              </style>
            </head>
            <body>
              <div class="intervention-page">
                <!-- Header -->
                <div class="header">
                  <div class="logo-section">
                    <div class="logo-placeholder">
                      <div class="logo-circle"></div>
                      <div class="company-name">
                        <div class="company-title">MAINTENANCE</div>
                        <div class="company-subtitle">TECHNOLOGIES</div>
                      </div>
                    </div>
                  </div>
                  <div class="title-section">
                    <h1>FICHE D'INTERVENTION MAINTENANCE</h1>
                  </div>
                </div>

                <!-- Main content -->
                <div class="content">
                  <!-- Compte-rendu section -->
                  <div class="section-header">Compte-rendu d'intervention</div>
                  <div class="section-content">
                    <div class="form-row">
                      <div class="form-group">
                        <label>Émetteur:</label>
                        <div class="form-field">
                          <div class="field-label">Nom:</div>
                          <div class="field-value">${enrichedIntervention.technicians.join(', ')}</div>
                        </div>
                        <div class="form-field">
                          <div class="field-label">Secteur Maintenance:</div>
                          <div class="field-value">${getInterventionTypeText(enrichedIntervention.type)}</div>
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Demandeur:</label>
                        <div class="form-field">
                          <div class="field-label">Nom:</div>
                          <div class="field-value"></div>
                        </div>
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-field">
                        <div class="field-label">Intervenant(s):</div>
                        <div class="field-value">${enrichedIntervention.technicians.join(', ')}</div>
                      </div>
                      <div class="form-field">
                        <div class="field-label">Système:</div>
                        <div class="field-value">${enrichedIntervention.equipmentName}</div>
                      </div>
                      <div class="form-field">
                        <div class="field-label">Compteur machine:</div>
                        <div class="field-value"></div>
                      </div>
                      <div class="form-field">
                        <div class="field-label">Date:</div>
                        <div class="field-value">${enrichedIntervention.scheduled_date}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Description section -->
                  <div class="section-header">Description du dysfonctionnement</div>
                  <div class="section-content">
                    <div class="description-field">
                      ${enrichedIntervention.title}
                    </div>
                  </div>

                  <!-- Operations section -->
                  <div class="operations-header">
                    <div class="operation-group">
                      <div class="operation-title">Opérations</div>
                      <div class="checkboxes">
                        <div class="checkbox-item">
                          <span class="checkbox ${enrichedIntervention.type === 'corrective' ? 'checked' : ''}">☐</span>
                          <span>Remplacement</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox">☐</span>
                          <span>Diagnostic</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox ${enrichedIntervention.type === 'improvement' ? 'checked' : ''}">☐</span>
                          <span>Amélioration</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox ${enrichedIntervention.type === 'regulatory' ? 'checked' : ''}">☐</span>
                          <span>Contrôle</span>
                        </div>
                      </div>
                    </div>
                    <div class="operation-group">
                      <div class="operation-title">Type de maintenance</div>
                      <div class="checkboxes">
                        <div class="checkbox-item">
                          <span class="checkbox ${enrichedIntervention.type === 'corrective' ? 'checked' : ''}">☐</span>
                          <span>Corrective</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox ${enrichedIntervention.type === 'preventive' ? 'checked' : ''}">☐</span>
                          <span>Préventive</span>
                        </div>
                      </div>
                    </div>
                    <div class="operation-group">
                      <div class="operation-title">Cause de défaillance</div>
                      <div class="checkboxes">
                        <div class="checkbox-item">
                          <span class="checkbox">☐</span>
                          <span>Usure normale</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox">☐</span>
                          <span>Défaut utilisateur</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox">☐</span>
                          <span>Défaut produit</span>
                        </div>
                        <div class="checkbox-item">
                          <span class="checkbox">☐</span>
                          <span>Autre</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Time section -->
                  <div class="time-section">
                    <div class="section-header">Temps d'intervention</div>
                    <div class="time-field"></div>
                  </div>

                  <!-- Report section -->
                  <div class="section-header">Rapport d'intervention</div>
                  <div class="section-content">
                    <div class="report-field">
                      ${enrichedIntervention.actions || ''}
                    </div>
                  </div>

                  <!-- Parts section -->
                  <div class="section-header">Pièces de rechange et consommables</div>
                  <div class="section-content">
                    <table class="parts-table">
                      <thead>
                        <tr>
                          <th>Désignation</th>
                          <th>Marque / Référence</th>
                          <th>Quantité</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${enrichedIntervention.parts && Array.isArray(enrichedIntervention.parts) ? enrichedIntervention.parts.map((part) => `
                          <tr>
                            <td>${part.name || ''}</td>
                            <td></td>
                            <td>${part.quantity || ''}</td>
                          </tr>
                        `).join('') : ''}
                        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }

      toast({
        title: "Impression lancée",
        description: "Le dialogue d'impression a été ouvert.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le dialogue d'impression.",
        variant: "destructive",
      });
    }
  };

  // Helper functions for text conversion
  const getInterventionTypeText = (type: string) => {
    switch (type) {
      case 'preventive': return 'Maintenance Préventive';
      case 'corrective': return 'Maintenance Corrective';
      case 'improvement': return 'Amélioration';
      case 'regulatory': return 'Contrôle Réglementaire';
      default: return type;
    }
  };

  const getInterventionStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'En cours d\'exécution';
      case 'completed': return 'Terminée avec succès';
      default: return status;
    }
  };

  const cleanTechnicianNames = (technicians: string[]) => {
    if (!technicians || technicians.length === 0) return 'Aucun technicien assigné';
    return technicians.join(', ');
  };

  // Fonction pour l'export PDF au format carte (vert)
  const generateInterventionPDFCard = async (intervention: InterventionUI) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '4px 20px 20px 20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      document.body.appendChild(tempDiv);

      const equipment = equipments?.find(eq => eq.id === intervention.equipmentId);
      const equipmentName = equipment?.name || 'Équipement inconnu';
      
      tempDiv.innerHTML = `
        <div class="print-content" style="min-height: auto; height: auto;">
          <div class="mt-0 mb-6">
            <div class="print-header border-b-2 border-gray-300 mb-6 pb-4" style="margin-top: 0;">
              <h1 class="text-4xl font-black text-center text-black mb-2">Rapport d'intervention</h1>
            </div>
            <div style="break-inside: avoid; height: auto; max-height: 100%; overflow: visible;">
              <div class="flex justify-center items-center gap-4" style="break-inside: avoid;">
                <div class="" style="break-inside: avoid; break-after: auto; break-before: auto; overflow: visible; width: 100%; height: auto; display: flex; flex-direction: column;">
                  <div class="h-[85vh] pt-2 pb-2 px-3 overflow-auto flex items-start justify-center" style="height: 85vh;">
                  <div class="intervention-card border rounded-lg bg-white shadow-sm" style="width: 100%; max-width: 100%; height: auto; min-height: calc(-1rem + 85vh); overflow: visible; display: flex; flex-direction: column;">
                    <div class="p-4 pb-3">
                      <div class="flex items-start justify-between mb-3" style="width: 100%;">
                        <h3 class="font-extrabold text-xl text-black" style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; max-width: 70%;">${intervention.title || 'Sans titre'}</h3>
                          <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">${getInterventionStatusText(intervention.status)}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-sm px-3 py-1">${getInterventionTypeText(intervention.type)}</div>
                        </div>
                      </div>
                      <div class="px-4 pb-4 space-y-3 flex-1" style="min-height: 0px;">
                        <div>
                          <h4 class="font-semibold text-sm text-gray-800 mb-2">Informations générales</h4>
                          <div class="space-y-1 text-sm">
                            <p><strong>Équipement:</strong> ${equipmentName}</p>
                            <p><strong>Date d'intervention:</strong> ${intervention.scheduled_date ? new Date(intervention.scheduled_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                          </div>
                        </div>
                        <div>
                          <h4 class="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user h-4 w-4">
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Techniciens
                          </h4>
                          <div class="text-sm">
                            <p>${cleanTechnicianNames(intervention.technicians)}</p>
                          </div>
                        </div>
                        <div>
                          <h4 class="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar h-4 w-4">
                              <path d="M8 2v4"></path>
                              <path d="M16 2v4"></path>
                              <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                              <path d="M3 10h18"></path>
                            </svg>
                            Historique des actions
                          </h4>
                          <div class="text-sm space-y-3">
                            ${intervention.technician_history && intervention.technician_history.length > 0 ? 
                              intervention.technician_history.map((entry: any, index: number) => `
                                <div class="border-l-4 border-blue-200 pl-3">
                                  <div class="font-medium text-gray-800 break-words">${entry.technician_name || 'Technicien inconnu'}</div>
                                  <div class="text-gray-600 break-words whitespace-pre-wrap" style="font-size: 14px; line-height: 1.4; word-break: break-word; white-space: pre-wrap; overflow-wrap: break-word;">${entry.actions || ''}</div>
                                  <div class="text-gray-500 text-xs">${entry.date_start ? new Date(entry.date_start).toLocaleDateString('fr-FR') : 'Date inconnue'}</div>
                                </div>
                              `).join('') : 
                              '<div class="border-l-4 border-blue-200 pl-3"><div class="font-medium text-gray-800 break-words">Aucun historique</div></div>'
                            }
                          </div>
                        </div>
                        <div>
                          <h4 class="font-semibold text-sm text-gray-800 mb-2">Pièces utilisées</h4>
                          <div class="text-sm">
                            <p>${intervention.parts && intervention.parts.length > 0 ? 
                              intervention.parts.map(part => `${part.name} (${part.quantity})`).join(', ') : 
                              'Aucune pièce utilisée'
                            }</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 print:block">1 / 1</div>
            </div>
          </div>
        </div>
      `;

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const adjustedWidth = imgWidth * 0.264583 * ratio;
      const adjustedHeight = imgHeight * 0.264583 * ratio;
      
      const xOffset = (pdfWidth - adjustedWidth) / 2;
      const yOffset = (pdfHeight - adjustedHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, adjustedWidth, adjustedHeight);
      
      const fileName = `intervention_card_${intervention.id}_${(intervention.title || 'sans_titre').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF généré",
        description: "La fiche d'intervention au format carte a été téléchargée en PDF.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF de l'intervention.",
        variant: "destructive"
      });
    }
  };

  const handleExportToPDF = async (intervention: InterventionUI) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // Créer un élément temporaire pour l'aperçu
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '4px 20px 20px 20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      document.body.appendChild(tempDiv);

      // Générer le contenu HTML de l'intervention
      const equipment = equipments?.find(eq => eq.id === intervention.equipmentId);
      const equipmentName = equipment?.name || 'Équipement inconnu';
      
      tempDiv.innerHTML = `
        <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 0 20px 20px 20px; margin: 0;">
          <!-- Titre principal -->
          <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 20px; margin-top: 0;">
            <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #000; letter-spacing: 1px;">Rapport d'intervention</h1>
          </div>
          <!-- En-tête de la carte -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; width: 100%;">
            <div style="flex: 1; max-width: 70%; word-wrap: break-word;">
              <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 8px 0; color: #000; word-wrap: break-word; overflow-wrap: break-word;">${intervention.title || 'Sans titre'}</h1>
              <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                ${getInterventionTypeText(intervention.type)}
              </span>
            </div>
            <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              ${getInterventionStatusText(intervention.status)}
            </span>
          </div>

          <!-- Section Informations générales -->
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #6b7280; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">📅</span>
              </div>
              <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: #000;">Informations générales</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
              <div><strong>Équipement:</strong> ${equipmentName}</div>
              <div><strong>Modèle:</strong> ${equipment?.model || 'Non défini'}</div>
              <div><strong>N° de série:</strong> ${equipment?.serial_number || 'Non défini'}</div>
              <div style="text-align: right;"><strong>Date planifiée:</strong> ${intervention.scheduled_date ? new Date(intervention.scheduled_date).toLocaleDateString('fr-FR') : 'Non définie'}</div>
            </div>
          </div>

          <!-- Section Techniciens assignés -->
          <div style="background: #eff6ff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">👤</span>
              </div>
              <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: #000;">Techniciens assignés</h3>
            </div>
            <div style="font-size: 12px;">
              ${intervention.technicians && intervention.technicians.length > 0 
                ? intervention.technicians.map(tech => `<div>• ${tech}</div>`).join('')
                : '<div>Aucun technicien assigné</div>'
              }
            </div>
          </div>


          <!-- Section Actions réalisées -->
          <div style="background: #fef3c7; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #f59e0b; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">🔧</span>
              </div>
              <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: #000;">Actions réalisées</h3>
            </div>
            <div style="font-size: 12px;">
              ${intervention.actions || 'Aucune action réalisée'}
            </div>
          </div>

          <!-- Section Pièces utilisées -->
          <div style="background: #f3e8ff; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #8b5cf6; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">🏷️</span>
              </div>
              <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: #000;">Pièces utilisées</h3>
            </div>
            <div style="font-size: 12px;">
              ${intervention.parts && intervention.parts.length > 0 
                ? intervention.parts.map(part => `<div>• ${part.name} (Quantité: ${part.quantity})</div>`).join('')
                : 'Aucune pièce utilisée'
              }
            </div>
          </div>

          <!-- Historique des techniciens si disponible -->
          ${intervention.technician_history && intervention.technician_history.length > 0 ? `
          <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #64748b; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 12px;">🕒</span>
              </div>
              <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: #000;">Historique des interventions</h3>
            </div>
            <div style="font-size: 12px;">
              ${intervention.technician_history.map((entry, index) => `
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; margin-bottom: 8px; background: white;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${index + 1}. ${entry.technician_name || 'Technicien inconnu'}</div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
                    ${entry.date_start ? new Date(entry.date_start).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    ${entry.date_end ? ` → ${new Date(entry.date_end).toLocaleDateString('fr-FR')}` : ' (En cours)'}
                  </div>
                  ${entry.actions ? `<div style="margin: 4px 0;"><strong>Actions:</strong> ${entry.actions}</div>` : ''}
                  ${entry.parts_used && entry.parts_used.length > 0 ? `
                    <div style="margin: 4px 0;"><strong>Pièces utilisées:</strong></div>
                    ${entry.parts_used.map(part => `<div style="margin-left: 10px;">• ${part.name} (Quantité: ${part.quantity})</div>`).join('')}
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Pied de page -->
          <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px;">
            Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      `;

      // Capturer l'élément avec html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      // Nettoyer l'élément temporaire
      document.body.removeChild(tempDiv);

      // Créer le PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculer les dimensions pour ajuster l'image au PDF
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const adjustedWidth = imgWidth * 0.264583 * ratio;
      const adjustedHeight = imgHeight * 0.264583 * ratio;
      
      // Centrer l'image sur la page
      const xOffset = (pdfWidth - adjustedWidth) / 2;
      const yOffset = (pdfHeight - adjustedHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, adjustedWidth, adjustedHeight);
      
      // Télécharger le PDF
      const fileName = `intervention_${intervention.id}_${(intervention.title || 'sans_titre').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF généré",
        description: "La fiche d'intervention a été téléchargée en PDF.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF de l'intervention.",
        variant: "destructive"
      });
    }
  };

  const handleSaveIntervention = async (interventionData: any) => {
    try {
      const partsForSupabase = interventionData.parts && interventionData.parts.length > 0 ? interventionData.parts : null;
      
      let technicianHistoryForSupabase = interventionData.technician_history || [];
      
      if (interventionData.id && interventionData.current_technician_id) {
        const currentTechnicianName = getTechnicianName(interventionData.current_technician_id);
        const newHistoryEntry: TechnicianHistoryEntry = {
          technician_id: interventionData.current_technician_id,
          technician_name: currentTechnicianName,
          actions: interventionData.actions || '',
          parts_used: interventionData.parts || [],
          date_start: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        };
        
        technicianHistoryForSupabase = [...technicianHistoryForSupabase, newHistoryEntry];
      }

      let completedDate = interventionData.completed_date;
      if (interventionData.status === 'completed' && !completedDate) {
        completedDate = new Date().toISOString().split('T')[0];
      }

      const payload = {
         equipment_id: interventionData.equipment_id || null,
         scheduled_date: interventionData.scheduled_date,
         completed_date: completedDate || null,
         start_date: interventionData.start_date || null,
         end_date: interventionData.end_date || null,
         type: interventionData.type,
         technicians: interventionData.technicians && interventionData.technicians.length > 0 ? interventionData.technicians : null,
         parts: partsForSupabase,
         technician_history: technicianHistoryForSupabase.length > 0 ? technicianHistoryForSupabase : null,
         title: interventionData.title || null,
         actions: interventionData.actions || null,
         status: interventionData.status || 'in-progress',
         created_at: new Date().toISOString(),
      };

      if (interventionData.id) {
        await updateDocument(interventionData.id, payload);
        
        // Sync with maintenance if this intervention is linked to a maintenance task
        if (payload.status) {
          await syncInterventionWithMaintenance(interventionData.id, payload.status);
        }
        
        toast({
          title: "Intervention mise à jour",
          description: "L'intervention a été modifiée avec succès",
        });
      } else {
        const newIntervention = await addDocument(payload);
        
        // Sync with maintenance for new interventions too (if they have maintenance_id)
        if (newIntervention && payload.status) {
          await syncInterventionWithMaintenance(newIntervention.id, payload.status);
        }
        
        toast({
          title: "Intervention créée",
          description: "La nouvelle intervention a été créée avec succès",
        });
      }
      setIsFormOpen(false);
      refetchInterventions();
    } catch (error: any) {
      console.error("Error saving intervention:", error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la sauvegarde: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      type: 'all',
      technician: 'all',
      building: 'all',
      equipment: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.type !== 'all' || filters.technician !== 'all' || filters.building !== 'all' || filters.equipment !== 'all' || filters.dateFrom || filters.dateTo;

  const filteredInterventions = useMemo(() => {
    if (!interventions) return [];

    return interventions.filter(intervention => {
      const equipmentName = getEquipmentName(intervention.equipment_id);
      const equipmentLocation = getLocationName(intervention.equipment_id);
      const buildingName = getBuildingNameByEquipment(intervention.equipment_id);

      // Search filter
      const matchesSearch =
        (intervention.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (equipmentName.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (equipmentLocation.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (buildingName.toLowerCase()).includes(searchTerm.toLowerCase());

      // Status filter (tab)
      let matchesStatus = true;
      if (activeTab !== 'all') {
        matchesStatus = intervention.status === activeTab;
      }

      // Type filter
      let matchesType = true;
      if (filters.type !== 'all') {
        matchesType = intervention.type === filters.type;
      }

      // Technician filter
      let matchesTechnician = true;
      if (filters.technician !== 'all') {
        const technicianInMain = intervention.technicians && Array.isArray(intervention.technicians) && intervention.technicians.includes(filters.technician);
        const technicianInHistory = intervention.technician_history && Array.isArray(intervention.technician_history) && 
          intervention.technician_history.some((entry: any) => entry.technician_id === filters.technician);
        matchesTechnician = technicianInMain || technicianInHistory;
      }

      // Building filter
      let matchesBuilding = true;
      if (filters.building !== 'all') {
        matchesBuilding = buildingName === filters.building;
      }

      // Equipment filter
      let matchesEquipment = true;
      if (filters.equipment !== 'all') {
        matchesEquipment = intervention.equipment_id === filters.equipment;
      }

      // Date range filter
      let matchesDateRange = true;
      if (filters.dateFrom || filters.dateTo) {
        const interventionDate = new Date(intervention.scheduled_date);
        if (filters.dateFrom && interventionDate < filters.dateFrom) {
          matchesDateRange = false;
        }
        if (filters.dateTo && interventionDate > filters.dateTo) {
          matchesDateRange = false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesTechnician && matchesBuilding && matchesEquipment && matchesDateRange;
    }).map(intervention => {
       const equipmentName = getEquipmentName(intervention.equipment_id);
       const buildingName = getBuildingNameByEquipment(intervention.equipment_id);

       const technicianNames: string[] = [];
       if (Array.isArray(intervention.technicians)) {
           intervention.technicians.forEach(userId => {
               technicianNames.push(getTechnicianName(userId));
           });
       }

       let technicianHistory: TechnicianHistoryEntry[] = [];
       if (Array.isArray(intervention.technician_history)) {
         technicianHistory = intervention.technician_history;
       }

       return {
         id: intervention.id,
         title: intervention.title || 'Sans titre',
         type: intervention.type || 'corrective',
         status: intervention.status || 'in-progress',
         equipmentId: intervention.equipment_id || '',
         equipmentName: equipmentName,
         buildingName: buildingName,
         scheduled_date: intervention.scheduled_date || '',
         completedDate: intervention.completed_date ? format(new Date(intervention.completed_date), 'dd/MM/yyyy') : undefined,
         technicians: technicianNames,
         actions: intervention.actions || '',
         parts: Array.isArray(intervention.parts) ? intervention.parts.map((p: any) => ({ name: p.name, quantity: p.quantity })) : [],
         createdAt: intervention.created_at ? format(new Date(intervention.created_at), 'dd/MM/yyyy') : 'Date inconnue',
         created_at: intervention.created_at || new Date().toISOString(),
         technician_history: technicianHistory,
       };
    });
  }, [interventions, searchTerm, activeTab, filters, equipments, allUsers, locationNames, buildingNames]);

  // Sorting logic
  const sortedAndFilteredInterventions = useMemo(() => {
    if (!sortColumn) return filteredInterventions;

    const sorted = [...filteredInterventions].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'title':
          valA = a.title?.toLowerCase() || '';
          valB = b.title?.toLowerCase() || '';
          break;
        case 'equipmentName':
          valA = a.equipmentName?.toLowerCase() || '';
          valB = b.equipmentName?.toLowerCase() || '';
          break;
        case 'type':
          valA = a.type?.toLowerCase() || '';
          valB = b.type?.toLowerCase() || '';
          break;
        case 'status':
          valA = a.status?.toLowerCase() || '';
          valB = b.status?.toLowerCase() || '';
          break;
        case 'scheduled_date':
          valA = new Date(a.scheduled_date || 0).getTime();
          valB = new Date(b.scheduled_date || 0).getTime();
          break;
        case 'completedDate':
          valA = a.completedDate ? new Date(a.completedDate.split('/').reverse().join('-')).getTime() : 0;
          valB = b.completedDate ? new Date(b.completedDate.split('/').reverse().join('-')).getTime() : 0;
          break;
        case 'createdAt':
          valA = new Date(a.createdAt.split('/').reverse().join('-')).getTime();
          valB = new Date(b.createdAt.split('/').reverse().join('-')).getTime();
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
  }, [filteredInterventions, sortColumn, sortDirection]);

  const handleSortChange = (column: keyof InterventionUI) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'preventive':
        return (
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
            <WrenchIcon className="h-3 w-3 mr-1" />
            Préventive
          </Badge>
        );
      case 'corrective':
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Corrective
          </Badge>
        );
      case 'improvement':
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs">
            <Tag className="h-3 w-3 mr-1" />
            Amélioration
          </Badge>
        );
      case 'regulatory':
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Réglementaire
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return null;
    }
  };

  const toggleHistoryExpansion = (interventionId: string) => {
    setExpandedHistories(prev => {
      const newExpandedHistories = new Set(prev);
      if (newExpandedHistories.has(interventionId)) {
        newExpandedHistories.delete(interventionId);
      } else {
        newExpandedHistories.add(interventionId);
      }
      return newExpandedHistories;
    });
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      console.error("Failed to parse date string:", dateString, e);
      return dateString;
    }
  };

  const loading = interventionsLoading || equipmentsLoading || buildingsLoading;
  const error = interventionsError || equipmentsError || buildingsError;

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Interventions</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les interventions sur vos équipements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {date ? format(date, 'P', { locale: fr }) : 'Sélectionner'}
                </span>
                <span className="sm:hidden">
                  {date ? format(date, 'dd/MM', { locale: fr }) : 'Date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-2 text-xs sm:text-sm ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrer</span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                    {[
                      filters.type !== 'all' ? '1' : '',
                      filters.technician !== 'all' ? '1' : '',
                      filters.building !== 'all' ? '1' : '',
                      filters.equipment !== 'all' ? '1' : '',
                      filters.dateFrom || filters.dateTo ? '1' : ''
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtres</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Effacer
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="priority-filter" className="text-sm font-medium">Priorité</Label>
                    <Combobox
                      options={typeOptions}
                      value={filters.type}
                      onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      placeholder="Tous les types"
                      searchPlaceholder="Rechercher priorité..."
                      emptyPlaceholder="Aucune priorité trouvée."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type-filter" className="text-sm font-medium">Type d'intervention</Label>
                    <Combobox
                      options={typeOptions}
                      value={filters.type}
                      onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      placeholder="Tous les types"
                      searchPlaceholder="Rechercher type..."
                      emptyPlaceholder="Aucun type trouvé."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="technician-filter" className="text-sm font-medium">Technicien</Label>
                    <Combobox
                      options={technicianOptions}
                      value={filters.technician}
                      onChange={(value) => setFilters(prev => ({ ...prev, technician: value }))}
                      placeholder="Tous les techniciens"
                      searchPlaceholder="Rechercher technicien..."
                      emptyPlaceholder="Aucun technicien trouvé."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="building-filter" className="text-sm font-medium">Bâtiment</Label>
                    <Combobox
                      options={buildingOptions}
                      value={filters.building}
                      onChange={(value) => setFilters(prev => ({ ...prev, building: value }))}
                      placeholder="Tous les bâtiments"
                      searchPlaceholder="Rechercher bâtiment..."
                      emptyPlaceholder="Aucun bâtiment trouvé."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="equipment-filter" className="text-sm font-medium">Équipement</Label>
                    <Combobox
                      options={equipmentOptions}
                      value={filters.equipment}
                      onChange={(value) => setFilters(prev => ({ ...prev, equipment: value }))}
                      placeholder="Tous les équipements"
                      searchPlaceholder="Rechercher équipement..."
                      emptyPlaceholder="Aucun équipement trouvé."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Période</Label>
                    <div className="mt-1 space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Date de début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Date de fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-xs sm:text-sm"
            onClick={handlePrintPreview}
            disabled={loading || filteredInterventions.length === 0}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter PDF</span>
          </Button>

          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Vue grille" size="sm">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue liste" size="sm">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                <ListFilter className="h-4 w-4" />
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
              <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value: keyof InterventionUI) => handleSortChange(value)}>
                <DropdownMenuRadioItem value="title">Titre</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="equipmentName">Équipement</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Statut</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="scheduled_date">Date prévue</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completedDate">Date de fin</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="createdAt">Date de création</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="flex items-center gap-2 text-xs sm:text-sm"
            onClick={openNewInterventionForm}
            disabled={equipmentsLoading || !!equipmentsError || !equipments || equipments.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle intervention</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une intervention..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Toutes</TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs sm:text-sm">En cours</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Terminées</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
         <div>Chargement des interventions...</div>
      ) : error ? (
         <div className="p-4 border border-destructive text-destructive rounded-md">
          Erreur lors du chargement des interventions: {error.message || 'Erreur inconnue'}
        </div>
      ) : sortedAndFilteredInterventions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {searchTerm || activeTab !== 'all' || hasActiveFilters ? "Aucune intervention ne correspond à votre recherche ou filtre" : "Aucune intervention trouvée"}
        </div>
      ) : viewMode === 'list' ? (
        <InterventionListView
          interventions={sortedAndFilteredInterventions}
          equipments={equipments || []}
          onEditIntervention={openEditInterventionForm}
          onDeleteIntervention={handleDeleteClick}
          onExportToPDF={handleExportToPDF}
          onEquipmentClick={handleEquipmentClick}
          getStatusBadge={getStatusBadge}
          getTypeBadge={getTypeBadge}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {sortedAndFilteredInterventions.map((intervention) => {
            const technicianHistory = intervention.technician_history || [];
            const isExpanded = expandedHistories.has(intervention.id);
            const displayEntries = isExpanded ? technicianHistory : technicianHistory.slice(0, 1);
            const remainingEntriesCount = technicianHistory.length - displayEntries.length;

            return (
              <CustomCard
                key={intervention.id}
                variant="default"
                hover
                clickable
                onClick={() => openEditInterventionForm(intervention)}
                className="border"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg truncate">{intervention.title}</h3>
                      
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <WrenchIcon className="h-3 w-3" />
                          Équipement
                        </p>
                         <p 
                           className="font-medium text-sm text-primary cursor-pointer hover:underline"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleEquipmentClick(intervention.equipmentId);
                           }}
                         >
                           {intervention.equipmentName}
                         </p>
                      </div>

                      {intervention.buildingName && intervention.buildingName !== 'Bâtiment non spécifié' && intervention.buildingName !== 'Bâtiment inconnu' && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Bâtiment</p>
                          <p className="font-medium text-sm">
                            {intervention.buildingName}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                      {getStatusBadge(intervention.status)}
                      {getTypeBadge(intervention.type)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date d'intervention
                      </p>
                      <p className="font-medium">
                        {intervention.scheduled_date ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy') : 'Non renseignée'}
                      </p>
                    </div>
                    {intervention.status === 'completed' && intervention.completedDate && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Date de fin d'intervention
                        </p>
                        <p className="font-medium">{intervention.completedDate}</p>
                      </div>
                    )}
                  </div>

                  {technicianHistory.length > 0 && (
                    <div className="text-sm">
                      <h5 className="font-semibold text-base flex items-center gap-2 mb-3 mt-4">
                        <Clock className="h-4 w-4 text-primary" />
                        Historique des interventions
                      </h5>
                      <div className="space-y-2">
                        {displayEntries.map((entry, index) => {
                          const formattedDate = formatDateOnly(entry.date_start);

                          return (
                            <div key={`${intervention.id}-history-${index}`} className="border-l-2 border-blue-200 pl-3 py-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {entry.technician_name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  ({formattedDate})
                                </span>
                              </div>
                              {entry.actions && (
                                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary/30">
                                  {entry.actions}
                                </p>
                              )}
                              {entry.parts_used && entry.parts_used.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {entry.parts_used.map((part, partIndex) => (
                                    <Badge key={partIndex} variant="outline" className="bg-gray-50 border-gray-200 text-gray-600 text-xs">
                                      {part.name} ({part.quantity})
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {technicianHistory.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 w-full justify-center text-muted-foreground hover:text-primary text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHistoryExpansion(intervention.id);
                          }}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Moins d'interventions
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Voir les {remainingEntriesCount} autre{remainingEntriesCount > 1 ? 's' : ''} intervention{remainingEntriesCount > 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportToPDF(intervention);
                        }}
                        title="Exporter en PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateInterventionPDFCard(intervention);
                        }}
                        title="Exporter PDF Carte"
                        className="text-green-600 hover:bg-green-100"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(intervention.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CustomCard>
            );
          })}
        </div>
      )}

      <InterventionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveIntervention}
        intervention={selectedIntervention}
        currentUser={user}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. L'intervention sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EquipmentDetailModal
        isOpen={isEquipmentDetailOpen}
        onClose={() => {
          setIsEquipmentDetailOpen(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment || undefined}
        buildings={buildingsData || []}
        services={services || []}
        locations={locations || []}
        equipmentGroups={equipmentGroups || []}
        allEquipments={equipments || []}
      />

      <InterventionPrintPreview
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        interventions={filteredInterventions}
        equipments={equipments || []}
      />
    </div>
  );
};

export default Interventions;
