import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import CustomCard from '@/components/ui/CustomCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Search, Plus, Filter, Calendar, CheckCircle2, Clock, Users, WrenchIcon, Settings, AlertTriangle, Edit, Trash2, List, Grid, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import MaintenanceFormModal from '@/components/maintenance/MaintenanceFormModal';
import MaintenanceCalendar from '@/components/maintenance/MaintenanceCalendar';
import MaintenanceListView from '@/components/maintenance/MaintenanceListView';
import MaintenanceCardView from '@/components/maintenance/MaintenanceCardView';
import { useMaintenance, MaintenanceTask } from '@/hooks/useMaintenance';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import InterventionFormModal from '@/components/interventions/InterventionFormModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { supabase } from '@/integrations/supabase/client';
import { UsedPart, TechnicianHistoryEntry } from '@/types/intervention';
import { useIntegratedMaintenanceNotifications } from '@/hooks/useIntegratedMaintenanceNotifications';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

const Maintenance = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [statusFilter, setStatusFilter] = useState('all'); // Keep 'all' as default if no specific status filters are present
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [selectedInterventionData, setSelectedInterventionData] = useState<any>(null);
  const [isCreatingNewIntervention, setIsCreatingNewIntervention] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast(); // Initialize useToast
  
  // Hook pour les notifications intégrées
  const { 
    notifyNewIntervention, 
    notifyUrgentMaintenance,
    autoScheduleForNewMaintenance 
  } = useIntegratedMaintenanceNotifications();
  
  // Hook pour gérer le bouton retour Android
  useAndroidBackButton({
    currentScreen: 'maintenance',
    onNavigateBack: () => navigate('/dashboard')
  });

  // Sorting states
  const [sortColumn, setSortColumn] = useState<keyof MaintenanceTask | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    maintenances,
    loading,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    findOrCreateInterventionFromMaintenance,
    syncInterventionWithMaintenance
  } = useMaintenance();

  const getTypeBadgeInfo = (type: string) => {
    switch (type) {
      case 'preventive':
        return {
          icon: Settings,
          label: 'Préventive',
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case 'corrective':
        return {
          icon: WrenchIcon,
          label: 'Corrective',
          className: "bg-red-100 text-red-800 border-red-800"
        };
      case 'regulatory':
        return {
          icon: AlertTriangle,
          label: 'Réglementaire',
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case 'improvement':
        return {
          icon: Plus,
          label: 'Amélioration',
          className: "bg-green-100 text-green-800 border-green-200"
        };
      default:
        return {
          icon: Settings,
          label: 'Préventive',
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
    }
  };

  const openNewMaintenanceForm = () => {
    setSelectedMaintenance(null);
    setIsFormOpen(true);
  };

  const editMaintenance = (maintenance: MaintenanceTask) => {
    setSelectedMaintenance(maintenance);
    setIsFormOpen(true);
  };

  const handleSaveMaintenance = async (maintenanceData: any) => {
    try {
      let savedMaintenance;
      if (selectedMaintenance) {
        savedMaintenance = await updateMaintenance(selectedMaintenance.id, maintenanceData);
      } else {
        savedMaintenance = await createMaintenance(maintenanceData);
        
        // Programmer automatiquement les notifications pour nouvelle maintenance
        if (savedMaintenance) {
          await autoScheduleForNewMaintenance(savedMaintenance);
        }
        
        // Notifier si maintenance urgente
        if (maintenanceData.priority === 'urgent') {
          await notifyUrgentMaintenance(
            savedMaintenance?.id || '',
            maintenanceData.title,
            maintenanceData.equipment_name
          );
        }
      }
      setIsFormOpen(false);
      setSelectedMaintenance(null);
    } catch (error) {
      console.error('Error saving maintenance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la maintenance.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    try {
      await deleteMaintenance(id);
      setMaintenanceToDelete(null);
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la maintenance.",
        variant: "destructive"
      });
    }
  };

  const handleContinueIntervention = async (maintenance: MaintenanceTask, interventionId: string) => {
    setSelectedMaintenance(maintenance);
    
    try {
      const { data: existingIntervention, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('id', interventionId)
        .maybeSingle();
      
      if (error || !existingIntervention) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer l'intervention.",
          variant: "destructive"
        });
        return;
      }
      
      const parsedTechnicianHistory = Array.isArray(existingIntervention.technician_history) ?
        existingIntervention.technician_history.map((entry: any) => ({
          technician_id: entry.technician_id || '',
          technician_name: entry.technician_name || '',
          actions: entry.actions || '',
          parts_used: Array.isArray(entry.parts_used) ? entry.parts_used : [],
          date_start: entry.date_start || '',
          date_end: entry.date_end,
          timestamp: entry.timestamp
        })) : [];

      const parsedParts = Array.isArray(existingIntervention.parts) ?
        existingIntervention.parts.map((p: any) => ({ name: p.name || '', quantity: p.quantity || 0 })) : [];

      setSelectedInterventionData({
        ...existingIntervention,
        equipmentId: existingIntervention.equipment_id,
        equipmentName: maintenance.equipment_name,
        technician_history: parsedTechnicianHistory,
        parts: parsedParts,
        createdAt: existingIntervention.created_at,
        completedDate: existingIntervention.completed_date
      });
      setIsCreatingNewIntervention(false);
      setShowInterventionForm(true);
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'intervention:', err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer l'intervention.",
        variant: "destructive"
      });
    }
  };

  const handleCreateIntervention = async (maintenance: MaintenanceTask) => {
    setSelectedMaintenance(maintenance);
    
    // Check if an intervention already exists for this maintenance
    const { data: existingIntervention } = await supabase
      .from('interventions')
      .select('*')
      .eq('maintenance_id', maintenance.id)
      .neq('status', 'completed')
      .single();

    if (existingIntervention) {
      // If intervention exists, pass it to continue
      const parsedTechnicianHistory = Array.isArray(existingIntervention.technician_history) ?
        existingIntervention.technician_history.map((entry: any) => ({
          technician_id: entry.technician_id || '',
          technician_name: entry.technician_name || '',
          actions: entry.actions || '',
          parts_used: Array.isArray(entry.parts_used) ? entry.parts_used : [],
          date_start: entry.date_start || '',
          date_end: entry.date_end,
          timestamp: entry.timestamp
        })) : [];

      const parsedParts = Array.isArray(existingIntervention.parts) ?
        existingIntervention.parts.map((p: any) => ({ name: p.name || '', quantity: p.quantity || 0 })) : [];

      setSelectedInterventionData({
        ...existingIntervention,
        equipmentId: existingIntervention.equipment_id,
        equipmentName: maintenance.equipment_name,
        technician_history: parsedTechnicianHistory,
        parts: parsedParts,
        createdAt: existingIntervention.created_at,
        completedDate: existingIntervention.completed_date
      });
      setIsCreatingNewIntervention(false);
    } else {
      setSelectedInterventionData(null);
      setIsCreatingNewIntervention(true);
    }
    
    setShowInterventionForm(true);
  };

  const handleSaveIntervention = async (interventionData: any) => {
    try {
      if (selectedMaintenance) {
        // Handle intervention creation/update from maintenance
        const result = await findOrCreateInterventionFromMaintenance(selectedMaintenance.id, interventionData);
        
        // Sync intervention status with maintenance when saving
        if (result && interventionData.status) {
          await syncInterventionWithMaintenance(result.id, interventionData.status);
        }
      }
      
      setShowInterventionForm(false);
      setSelectedMaintenance(null);
      setSelectedInterventionData(null);
      setIsCreatingNewIntervention(false);
      
      toast({
        title: "Intervention sauvegardée",
        description: "L'intervention a été mise à jour avec succès.",
      });
      
      // Notifier création d'intervention
      if (selectedMaintenance && isCreatingNewIntervention) {
        await notifyNewIntervention(
          interventionData.title || 'Nouvelle intervention',
          selectedMaintenance.equipment_name || 'Équipement non spécifié',
          selectedMaintenance.priority
        );
      }
    } catch (error) {
      console.error('Error saving intervention:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'intervention. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  // REMOVED formatDuration function

  // Filter maintenances based on active tab and search term
  const filteredMaintenances = useMemo(() => {
    let filtered = maintenances.filter(maintenance => {
      // Filter by search term
      const matchesSearch =
        maintenance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (maintenance.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter by tab
      switch (activeTab) {
        case 'all':
          return true;
        case 'in-progress':
          return maintenance.status === 'in-progress' || maintenance.status === 'overdue';
        case 'scheduled':
          return maintenance.status === 'scheduled';
        default:
          return true;
      }
    });

    return filtered;
  }, [maintenances, searchTerm, activeTab]);

  // Sorting logic for both list and grid views
  const sortedAndFilteredMaintenances = useMemo(() => {
    let currentMaintenances = [...filteredMaintenances];

    if (sortColumn) {
      currentMaintenances.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortColumn === 'next_due_date' || sortColumn === 'last_completed_date' || sortColumn === 'created_at' || sortColumn === 'updated_at') {
          aValue = a[sortColumn] ? new Date(a[sortColumn] as string).getTime() : (sortDirection === 'asc' ? -Infinity : Infinity);
          bValue = b[sortColumn] ? new Date(b[sortColumn] as string).getTime() : (sortDirection === 'asc' ? -Infinity : Infinity);
        } else if (sortColumn === 'priority') {
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a[sortColumn] as 'low' | 'medium' | 'high' | 'urgent'] || 0;
          bValue = priorityOrder[b[sortColumn] as 'low' | 'medium' | 'high' | 'urgent'] || 0;
        } else if (sortColumn === 'status') {
          const statusOrder = { 'overdue': 4, 'in-progress': 3, 'scheduled': 2, 'completed': 1 };
          aValue = statusOrder[a[sortColumn] as 'scheduled' | 'in-progress' | 'completed' | 'overdue'] || 0;
          bValue = statusOrder[b[sortColumn] as 'scheduled' | 'in-progress' | 'completed' | 'overdue'] || 0;
        }
        else {
          aValue = a[sortColumn];
          bValue = b[sortColumn];
        }

        // Handle null/undefined values for sorting, pushing them to the end
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return currentMaintenances;
  }, [filteredMaintenances, sortColumn, sortDirection]);


  const handleSortChange = (value: keyof MaintenanceTask) => {
    if (sortColumn === value) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
      setSortColumn(value);
      setSortDirection('asc');
    }
  };

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Maintenance Planifiée</h1>
          <p className="text-sm text-muted-foreground">
            Planifiez et suivez les maintenances préventives et correctives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={openNewMaintenanceForm}
          >
            <Plus className="h-4 w-4" />
            Nouvelle maintenance
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une maintenance..."
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Toutes
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            En cours
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planifiées
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {sortedAndFilteredMaintenances.length} maintenance{sortedAndFilteredMaintenances.length > 1 ? 's' : ''} au total
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden sm:inline">Trier</span>
                    {sortColumn && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value: keyof MaintenanceTask) => handleSortChange(value)}>
                    {[
                      { value: 'title', label: 'Titre' },
                      { value: 'equipment_name', label: 'Équipement' },
                      { value: 'type', label: 'Type' },
                      { value: 'priority', label: 'Priorité' },
                      { value: 'status', label: 'Statut' },
                      { value: 'next_due_date', label: 'Date prévue' },
                    ].map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                        {sortColumn === option.value && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />
                        )}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <MaintenanceListView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onNew={openNewMaintenanceForm}
            />
          ) : (
            <MaintenanceCardView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onContinueIntervention={handleContinueIntervention}
              onNew={openNewMaintenanceForm}
            />
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {sortedAndFilteredMaintenances.length} maintenance{sortedAndFilteredMaintenances.length > 1 ? 's' : ''} en cours
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden sm:inline">Trier</span>
                    {sortColumn && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value: keyof MaintenanceTask) => handleSortChange(value)}>
                    {[
                      { value: 'title', label: 'Titre' },
                      { value: 'equipment_name', label: 'Équipement' },
                      { value: 'type', label: 'Type' },
                      { value: 'priority', label: 'Priorité' },
                      { value: 'status', label: 'Statut' },
                      { value: 'next_due_date', label: 'Date prévue' },
                    ].map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                        {sortColumn === option.value && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />
                        )}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <MaintenanceListView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onNew={openNewMaintenanceForm}
            />
          ) : (
            <MaintenanceCardView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onContinueIntervention={handleContinueIntervention}
              onNew={openNewMaintenanceForm}
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {sortedAndFilteredMaintenances.length} maintenance{sortedAndFilteredMaintenances.length > 1 ? 's' : ''} planifiée{sortedAndFilteredMaintenances.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden sm:inline">Trier</span>
                    {sortColumn && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value: keyof MaintenanceTask) => handleSortChange(value)}>
                    {[
                      { value: 'title', label: 'Titre' },
                      { value: 'equipment_name', label: 'Équipement' },
                      { value: 'type', label: 'Type' },
                      { value: 'priority', label: 'Priorité' },
                      { value: 'status', label: 'Statut' },
                      { value: 'next_due_date', label: 'Date prévue' },
                    ].map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                        {sortColumn === option.value && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />
                        )}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <MaintenanceListView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onNew={openNewMaintenanceForm}
            />
          ) : (
            <MaintenanceCardView
              maintenances={sortedAndFilteredMaintenances}
              loading={loading}
              onEdit={editMaintenance}
              onDelete={handleDeleteMaintenance}
              onCreateIntervention={handleCreateIntervention}
              onContinueIntervention={handleContinueIntervention}
              onNew={openNewMaintenanceForm}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <MaintenanceCalendar 
            maintenances={sortedAndFilteredMaintenances}
            onMaintenanceClick={(maintenance) => {
              setSelectedMaintenance(maintenance);
              setShowInterventionForm(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Maintenance Form Modal */}
      <MaintenanceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMaintenance(null);
        }}
        onSave={handleSaveMaintenance}
        maintenance={selectedMaintenance}
        currentUser={currentUser}
      />

        <InterventionFormModal
          isOpen={showInterventionForm}
          onClose={() => {
            setShowInterventionForm(false);
            setSelectedMaintenance(null);
            setSelectedInterventionData(null);
            setIsCreatingNewIntervention(false);
          }}
          onSave={handleSaveIntervention}
          equipmentId={selectedMaintenance?.equipment_id}
          intervention={isCreatingNewIntervention ? null : selectedInterventionData}
          currentUser={currentUser}
          prefilledTitle={selectedMaintenance?.title}
          prefilledEquipmentId={selectedMaintenance?.equipment_id}
          prefilledEquipmentName={selectedMaintenance?.equipment_name}
          isFromMaintenance={true}
        />
    </div>
  );
};

export default Maintenance;
