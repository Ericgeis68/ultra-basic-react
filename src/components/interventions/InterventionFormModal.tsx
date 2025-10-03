// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, X, User, WrenchIcon, Package, CheckCircle2, Tag, Clock, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { InterventionUI, TechnicianHistoryEntry, UsedPart } from '@/types/intervention';
import { Part } from '@/types/part';
import { fetchPartsForEquipmentAndGroups } from '@/lib/parts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import PartsSelectionModal from './PartsSelectionModal';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { useCollection } from '@/hooks/use-supabase-collection';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Equipment } from '@/types/equipment';
import { useEquipmentStatusUpdate } from '@/hooks/useEquipmentStatusUpdate';
import { useEquipmentStatusSync } from '@/hooks/useEquipmentStatusSync';
import EquipmentStatusSyncDialog from './EquipmentStatusSyncDialog';
// import { useInterventionsForEquipment } from '@/hooks/useInterventionsForEquipment'; // Not used directly here
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'; // Keep AlertDialog

interface SelectedPart {
  partId: string;
  quantity: number;
  name: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

export interface InterventionFormData {
  equipment_id?: string | null;
  scheduled_date: string;
  // Removed from DB usage; kept in technician_history only
  type: string;
  technicians?: string[] | null;
  title?: string | null;
  status?: string | null;
  actions?: string | null;
  parts?: { name: string; quantity: number; }[] | null;
  technician_history?: TechnicianHistoryEntry[] | null;
  id?: string;
}

interface InterventionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (intervention: InterventionFormData) => void;
  equipmentId?: string;
  intervention?: InterventionUI | null;
  currentUser: any;
  // Props pour pré-remplir depuis maintenance
  prefilledTitle?: string;
  prefilledEquipmentId?: string;
  prefilledEquipmentName?: string;
  isFromMaintenance?: boolean;
}

const interventionTypes = [
  { id: "preventive", name: "Préventive", icon: Clock, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "corrective", name: "Corrective", icon: WrenchIcon, color: "bg-red-100 text-red-800 border-red-200" },
  { id: "improvement", name: "Amélioration", icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-200" },
  { id: "regulatory", name: "Réglementaire", icon: Tag, color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
];

const interventionStatuses = [
  { id: "in-progress", name: "En cours", icon: WrenchIcon, color: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "completed", name: "Terminée", icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-200" }
];

const InterventionFormModal: React.FC<InterventionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipmentId,
  intervention: initialIntervention, // Renommer pour éviter le conflit avec l'état local
  currentUser,
  prefilledTitle,
  prefilledEquipmentId,
  prefilledEquipmentName,
  isFromMaintenance = false
}) => {
  const form = useForm<InterventionFormData>({
    mode: 'onChange',
    defaultValues: {
      equipment_id: prefilledEquipmentId || equipmentId || null, // Use prefilled first
      scheduled_date: format(new Date(), 'yyyy-MM-dd'), // Toujours la date du jour
      start_date: null,
      end_date: null,
      type: isFromMaintenance ? "preventive" : "corrective",
      technicians: currentUser ? [currentUser.id] : [],
      title: prefilledTitle || "", // Use prefilled title
      status: "completed",
      actions: "",
      parts: [],
      technician_history: [],
      id: undefined, // Ensure id is undefined for new interventions
    },
    resolver: async (values) => {
      const errors: any = {};
      
      // Validation du titre
      if (!values.title || values.title.trim() === '') {
        errors.title = { type: 'required', message: 'Le titre est obligatoire' };
      }
      
      // Validation des actions réalisées (OBLIGATOIRE)
      if (!values.actions || values.actions.trim() === '') {
        errors.actions = { type: 'required', message: 'Les actions réalisées sont obligatoires' };
      }
      
      // Validation de l'équipement
      if (!values.equipment_id) {
        errors.equipment_id = { type: 'required', message: 'Un équipement doit être sélectionné' };
      }
      
      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors
      };
    }
  });

  const [selectedEquipmentId, setSelectedEquipmentId] = useState(prefilledEquipmentId || equipmentId || "");
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  
  // État local pour l'intervention en cours d'édition/continuation
  const [currentIntervention, setCurrentIntervention] = useState<InterventionUI | null>(initialIntervention);

  // State for the continuation dialog
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const interventionToContinueRef = useRef<InterventionUI | null>(null); // Use ref to store intervention data for dialog

  // Derived state for continuation
  const isContinuation = !!currentIntervention && currentIntervention.status === 'in-progress';
  const [previousTechnicianHistory, setPreviousTechnicianHistory] = useState<TechnicianHistoryEntry[]>([]);

  // Technicians selection
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>(currentUser ? [currentUser.id] : []);
  const [showOtherUsers, setShowOtherUsers] = useState(false);

  // Fetch all necessary data using useCollection
  const { data: fetchedEquipments, loading: equipmentsLoading } = useCollection<Equipment>({ tableName: 'equipments' });
  const { data: groups, loading: groupsLoading } = useCollection<EquipmentGroup>({ tableName: 'equipment_groups' });
  const { data: buildings, loading: buildingsLoading } = useCollection<BuildingType>({ tableName: 'buildings' });
  const { data: services, loading: servicesLoading } = useCollection<Service>({ tableName: 'services' });
  const { data: locations, loading: locationsLoading } = useCollection<Location>({ tableName: 'locations' });

  // Equipment status update hook
  const { setEquipmentToFaulty, setEquipmentToOperational } = useEquipmentStatusUpdate();

  // Equipment status sync hook
  const { 
    syncState, 
    closeSyncDialog, 
    updateEquipmentStatus, 
    checkAndPromptStatusSync 
  } = useEquipmentStatusSync();

  // Watch form values
  const formStatus = form.watch('status');
  const formType = form.watch('type');

  // Check if user can edit
  const canEdit = !currentIntervention || currentUser?.role === 'admin' || isContinuation;
  const canEditMainDetails = (!currentIntervention || currentUser?.role === 'admin') && !isContinuation;

  // Initialize form - memoized to prevent infinite loops
  const initializeForm = useCallback(() => {
    if (!isOpen) return;

    console.log('Initializing form with initialIntervention:', initialIntervention);
    setCurrentIntervention(initialIntervention);

    if (initialIntervention) {
      setSelectedEquipmentId(initialIntervention.equipmentId || "");
      // Use initialIntervention.scheduled_date if available, otherwise current date
      const defaultScheduledDate = initialIntervention.scheduled_date 
        ? format(new Date(initialIntervention.scheduled_date), 'yyyy-MM-dd') 
        : format(new Date(), 'yyyy-MM-dd');

      form.reset({
        equipment_id: initialIntervention.equipmentId || null,
        scheduled_date: defaultScheduledDate, // <--- MODIFIED HERE
        start_date: null,
        end_date: null,
        type: initialIntervention.type || (isFromMaintenance ? "preventive" : "corrective"),
        technicians: initialIntervention.technicians || (currentUser ? [currentUser.id] : []),
        title: initialIntervention.title || prefilledTitle || "", // Use prefilled if available
        status: initialIntervention.status || "completed",
        actions: "",
        parts: [],
        technician_history: Array.isArray(initialIntervention.technician_history) ? initialIntervention.technician_history : [],
        id: initialIntervention.id
      });
      // Initialize selected technicians from existing intervention or default
      setSelectedTechnicians((initialIntervention.technicians && initialIntervention.technicians.length > 0)
        ? initialIntervention.technicians
        : (currentUser ? [currentUser.id] : []));

      if (initialIntervention.parts && Array.isArray(initialIntervention.parts) && !isContinuation) {
        // When editing, the 'parts' field in the DB is the *global* list of parts used.
        // When continuing, the 'parts' field in the form is for the *current* technician's entry.
        // We should not pre-fill the form's 'parts' field from the global list when continuing.
        // We should pre-fill the selectedParts state if editing, but not if continuing.
        const parts: SelectedPart[] = initialIntervention.parts.map(part => ({
          partId: part.name, // Assuming name is unique enough for keying, or use a proper part ID if available
          quantity: part.quantity,
          name: part.name
        }));
        setSelectedParts(parts);
      } else {
        setSelectedParts([]);
      }

      setPreviousTechnicianHistory(Array.isArray(initialIntervention.technician_history) ? initialIntervention.technician_history : []);

    } else {
      // Reset for new intervention
      setSelectedEquipmentId(prefilledEquipmentId || equipmentId || "");
      setCurrentIntervention(null); // Ensure local state is null for new intervention
      form.reset({
        equipment_id: prefilledEquipmentId || equipmentId || null, // Use prefilled first
        scheduled_date: format(new Date(), 'yyyy-MM-dd'), // Toujours la date du jour
        start_date: null,
        end_date: null,
        type: isFromMaintenance ? "preventive" : "corrective",
        technicians: currentUser ? [currentUser.id] : [],
        title: prefilledTitle || "", // Use prefilled title
        status: "completed", // Default to completed for new interventions
        actions: "",
        parts: [],
        technician_history: [],
        id: undefined, // Ensure id is undefined for new interventions
      });
      setSelectedTechnicians(currentUser ? [currentUser.id] : []);
      setSelectedParts([]);
      setAvailableParts([]);
      setPreviousTechnicianHistory([]);
    }
  }, [isOpen, initialIntervention, equipmentId, currentUser, form, isContinuation]);

  // Initialize form when modal opens or props change
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Load all users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, username, role')
          .order('full_name');
        if (!error) setUsers(data || []);
      } catch (e) {
        // silent
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const toggleTechnician = (userId: string) => {
    setSelectedTechnicians(prev => prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]);
  };

  // Fetch available parts - memoized to prevent infinite loops
  const fetchPartsForEquipment = useCallback(async () => {
    if (!selectedEquipmentId || !fetchedEquipments || partsLoading) {
      return;
    }

    setPartsLoading(true);
    try {
      const equipmentDetails = fetchedEquipments.find(eq => eq.id === selectedEquipmentId);

      if (!equipmentDetails) {
        console.error(`Equipment with ID ${selectedEquipmentId} not found in fetched equipments`);
        // Don't show error toast for deleted equipment, just clear parts silently
        setAvailableParts([]);
        return;
      }

      // Utiliser les tables de jonction pour récupérer les IDs des groupes
      const { junctionTableManager } = await import('@/lib/junction-tables');
      const groupIds = await junctionTableManager.getGroupsForEquipment(selectedEquipmentId);
      console.log(`Equipment ${selectedEquipmentId} belongs to groups:`, groupIds);
      
      const parts = await fetchPartsForEquipmentAndGroups(selectedEquipmentId, groupIds);
      console.log(`Found ${parts.length} parts for equipment ${selectedEquipmentId}:`, parts);
      setAvailableParts(parts);
    } catch (error) {
      console.error("Error fetching available parts:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les pièces associées à cet équipement",
        variant: "destructive"
      });
      setAvailableParts([]);
    } finally {
      setPartsLoading(false);
    }
  }, [selectedEquipmentId, fetchedEquipments]);

  // Fetch parts when equipment changes
  useEffect(() => {
    fetchPartsForEquipment();
  }, [fetchPartsForEquipment]);

  // Update equipment status - memoized and debounced
  const updateEquipmentStatusCallback = useCallback(
    async (equipmentId: string, status: string) => {
      if (!equipmentId) return;
      
      try {
        if (status === 'in-progress') {
          await setEquipmentToFaulty(equipmentId);
        } else if (status === 'completed') {
          await setEquipmentToOperational(equipmentId);
        }
      } catch (error) {
        console.error('Error updating equipment status:', error);
      }
    },
    [setEquipmentToFaulty, setEquipmentToOperational]
  );

  // Update equipment status when form status changes - debounced
  const enableAutoEquipmentStatusUpdate = false;
  useEffect(() => {
    if (!enableAutoEquipmentStatusUpdate) return;
    if (!selectedEquipmentId || !formStatus) return;
    const timeoutId = setTimeout(() => {
      updateEquipmentStatusCallback(selectedEquipmentId, formStatus);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [enableAutoEquipmentStatusUpdate, formStatus, selectedEquipmentId, updateEquipmentStatusCallback]);

  const getTypeBadgeInfo = (type: string) => {
    return interventionTypes.find(t => t.id === type) || interventionTypes[1];
  };

  const getStatusBadgeInfo = (status: string) => {
    return interventionStatuses.find(s => s.id === status) || interventionStatuses[0];
  };

  const handlePartsSelection = (newSelectedParts: SelectedPart[]) => {
    setSelectedParts(newSelectedParts);
  };

  const handleEquipmentSelected = async (equipment: Equipment) => {
    console.log('Equipment selected:', equipment);
    setSelectedEquipmentId(equipment.id);
    form.setValue('equipment_id', equipment.id);

    if (equipment.status === 'faulty') {
      console.log(`Selected equipment ${equipment.id} is faulty. Checking for ongoing intervention.`);
      try {
        const { data, error } = await supabase
          .from('interventions')
          .select('*')
          .eq('equipment_id', equipment.id)
          .eq('status', 'in-progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching ongoing intervention:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger l'intervention en cours.",
            variant: "destructive"
          });
        } else if (data) {
          console.log('Ongoing intervention found:', data);
          const ongoing = data;
          const parsedParts = Array.isArray(ongoing.parts) ?
            ongoing.parts.map((p: any) => ({ name: p.name || '', quantity: p.quantity || 0 })) : [];

          const parsedTechnicianHistory = Array.isArray(ongoing.technician_history) ?
            ongoing.technician_history.map((entry: any) => ({
              technician_id: entry.technician_id || '',
              technician_name: entry.technician_name || '',
              actions: entry.actions || '',
              parts_used: Array.isArray(entry.parts_used) ? entry.parts_used : [],
              date_start: entry.date_start || '',
              date_end: entry.date_end,
              timestamp: entry.timestamp
            })) : [];

          const interventionToContinue: InterventionUI = {
             id: ongoing.id,
             title: ongoing.title || 'Intervention sans titre',
             type: ongoing.type as 'preventive' | 'corrective' | 'improvement' | 'regulatory',
             scheduled_date: ongoing.scheduled_date || '',
          completedDate: ongoing.completed_date ? (() => {
            try {
              const date = new Date(ongoing.completed_date);
              return isNaN(date.getTime()) ? undefined : format(date, 'dd/MM/yyyy', { locale: fr });
            } catch {
              return undefined;
            }
          })() : undefined,
             technicians: ongoing.technicians || [],
             actions: ongoing.actions || '',
             parts: parsedParts,
             created_at: ongoing.created_at || new Date().toISOString(),
             technician_history: parsedTechnicianHistory,
             equipmentId: ongoing.equipment_id,
              equipmentName: equipment.name,
              status: (ongoing.status === 'planned' ? 'in-progress' : ongoing.status) as 'in-progress' | 'completed',
              createdAt: ongoing.created_at || new Date().toISOString(),
          };

          interventionToContinueRef.current = interventionToContinue;
          setShowContinueDialog(true);

        } else {
           console.warn(`Equipment ${equipment.id} is faulty but no in-progress intervention found.`);
           toast({
             title: "Attention",
             description: "L'équipement est marqué 'En panne' mais aucune intervention en cours n'a été trouvée. Création d'une nouvelle intervention.",
           });
           setCurrentIntervention(null);
           form.reset({
              ...form.getValues(),
              equipment_id: equipment.id,
              id: undefined,
              status: "completed",
              actions: "",
              parts: [],
               technician_history: [],
           });
           setSelectedParts([]);
           setPreviousTechnicianHistory([]);
        }
      } catch (error) {
        console.error('Exception fetching ongoing intervention:', error);
        toast({
          title: "Erreur",
          description: "Une erreur inattendue est survenue lors de la recherche d'intervention en cours.",
          variant: "destructive"
        });
        setCurrentIntervention(null);
      form.reset({
         ...form.getValues(),
         equipment_id: equipment.id,
         id: undefined,
         status: "completed", // Défaut à terminée pour nouvelle intervention
         actions: "",
         parts: [],
          technician_history: [],
      });
        setSelectedParts([]);
        setPreviousTechnicianHistory([]);
      }
    } else {
      console.log(`Selected equipment ${equipment.id} is not faulty. Starting a new intervention.`);
      setCurrentIntervention(null); // Ensure local state is null for new intervention
      form.reset({
         ...form.getValues(), // Keep current form values like scheduled_date if already set
         equipment_id: equipment.id,
         id: undefined,
         status: "completed", // Default to completed for new interventions
         actions: "",
         parts: [],
          technician_history: [],
      });
      setSelectedParts([]);
      setPreviousTechnicianHistory([]);
    }
  };

  const handleContinueIntervention = () => {
    const interventionToContinue = interventionToContinueRef.current;
    if (interventionToContinue) {
      setCurrentIntervention(interventionToContinue); // Set local state to trigger useEffect
      // The useEffect will then reset the form based on currentIntervention
      // We need to ensure the form resets correctly for continuation mode here too
      form.reset({
         equipment_id: interventionToContinue.equipmentId,
         scheduled_date: format(new Date(interventionToContinue.scheduled_date), 'yyyy-MM-dd'),
         start_date: null, // Start/End dates are per history entry
         end_date: null,
         type: interventionToContinue.type,
         technicians: currentUser ? [currentUser.id] : [], // Current technician is the one continuing
         title: interventionToContinue.title,
         status: "in-progress", // Status remains in-progress until completed
         actions: "", // Clear actions for the new history entry
         parts: [], // Clear parts for the new history entry
         technician_history: interventionToContinue.technician_history || [], // Load existing history
         id: interventionToContinue.id, // Keep the existing intervention ID
      });
      setSelectedParts([]); // Clear selected parts for the new entry
      setPreviousTechnicianHistory(interventionToContinue.technician_history || []); // Load existing history

      toast({
        title: "Intervention en cours chargée",
        description: `Vous poursuivez l'intervention "${interventionToContinue.title}" sur ${interventionToContinue.equipmentName}.`,
      });
    }
    setShowContinueDialog(false);
    interventionToContinueRef.current = null; // Clear ref
  };

  const handleCreateNewIntervention = () => {
    const equipmentIdForNew = selectedEquipmentId; // Use the equipment ID that triggered the dialog
    
    // Reset for new intervention on the selected equipment
    setCurrentIntervention(null); // Ensure local state is null for new intervention
    form.reset({
       equipment_id: equipmentIdForNew || null,
       scheduled_date: format(new Date(), 'yyyy-MM-dd'), // Toujours la date du jour
       start_date: null,
       end_date: null,
       type: "corrective",
       technicians: currentUser ? [currentUser.id] : [],
       title: "",
       status: "completed", // Default to completed for new interventions
       actions: "",
       parts: [],
       technician_history: [],
        id: undefined,
    });
    setSelectedParts([]);
    setAvailableParts([]); // Re-fetch parts for the newly selected equipment if needed (already done by useEffect)
    setPreviousTechnicianHistory([]);

    toast({
      title: "Nouvelle intervention créée",
      description: "Vous créez une nouvelle intervention pour cet équipement.",
    });

    setShowContinueDialog(false);
    interventionToContinueRef.current = null; // Clear ref
  };


  const handleRemovePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(part => part.partId !== partId));
  };

  const onSubmit = async (values: InterventionFormData) => {
    // Validation supplémentaire côté client
    if (!values.actions || values.actions.trim() === '') {
      toast({
        title: "Erreur de validation",
        description: "Les actions réalisées sont obligatoires pour enregistrer l'intervention.",
        variant: "destructive"
      });
      return;
    }

    if (!values.title || values.title.trim() === '') {
      toast({
        title: "Erreur de validation", 
        description: "Le titre de l'intervention est obligatoire.",
        variant: "destructive"
      });
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTimestamp = new Date().toISOString();
    // Technicians field in the DB is the list of technicians *assigned* to the intervention.
    // Technician history tracks *who* did *what* and *when*.
    // When continuing, we only add the current technician to the history, not necessarily replace the assigned technicians list.
    // For simplicity, let's keep the assigned technicians list as it was, and add the current user to history.
    // If creating a new intervention, the assigned technician is the current user.
    // Build assigned technicians from selection, ensure current user present
    let assignedTechnicians = selectedTechnicians.slice();
    if (currentUser && !assignedTechnicians.includes(currentUser.id)) {
      assignedTechnicians.push(currentUser.id);
    }


    const currentTechnicianParts = selectedParts.map(p => ({
      name: p.name,
      quantity: p.quantity,
    }));

    // Build display name for history: include all selected technicians (including current user)
    const techIdsForEntry = (() => {
      const base = (selectedTechnicians && selectedTechnicians.length > 0)
        ? selectedTechnicians.slice()
        : (currentIntervention?.technicians || []);
      const others = base.filter(id => id && id !== currentUser?.id);
      const ordered = currentUser?.id ? [currentUser.id, ...others] : others;
      return Array.from(new Set(ordered));
    })();
    const technicianNameDisplay = (() => {
      const names = techIdsForEntry
        .map(id => users.find(u => u.id === id)?.full_name)
        .filter((name): name is string => !!name && name.trim().length > 0);
      const seen = new Set<string>();
      const uniqueInOrder: string[] = [];
      for (const n of names) {
        if (!seen.has(n)) { seen.add(n); uniqueInOrder.push(n); }
      }
      return uniqueInOrder.join(' ; ');
    })();

    const currentTechnicianEntry: TechnicianHistoryEntry = {
      technician_id: currentUser?.id || 'unknown',
      technician_name: technicianNameDisplay || currentUser?.full_name || 'Technicien inconnu',
      actions: values.actions || '',
      parts_used: currentTechnicianParts,
      date_start: currentDate, // Date the current technician started their work (today)
      date_end: values.status === 'completed' ? currentDate : undefined, // Date the current technician finished their work (today if completed)
      timestamp: currentTimestamp // Timestamp for ordering history entries
    };

    let updatedTechnicianHistory: TechnicianHistoryEntry[] = [];

    if (currentIntervention?.technician_history) {
      // If continuing or editing an existing intervention with history, add the new entry
      updatedTechnicianHistory = [...currentIntervention.technician_history, currentTechnicianEntry];
    } else {
      // If creating a new intervention, the history starts with this entry
      updatedTechnicianHistory = [currentTechnicianEntry];
    }

    // Sort history by timestamp
    updatedTechnicianHistory.sort((a, b) => {
      const timestampA = a.timestamp || `${a.date_start}T00:00:00.000Z`; // Fallback if timestamp is missing
      const timestampB = b.timestamp || `${b.date_start}T00:00:00.000Z`; // Fallback if timestamp is missing
      return new Date(timestampA).getTime() - new Date(timestampB).getTime();
    });

    // Calculate overall parts used by summing up parts from all history entries
    const overallPartsUsedMap = new Map<string, number>();
    updatedTechnicianHistory.forEach(entry => {
      if (entry.parts_used) {
        entry.parts_used.forEach(part => {
          const currentQuantity = overallPartsUsedMap.get(part.name) || 0;
          overallPartsUsedMap.set(part.name, currentQuantity + part.quantity);
        });
      }
    });
    const overallPartsUsed = Array.from(overallPartsUsedMap.entries()).map(([name, quantity]) => ({ name, quantity }));

    const interventionData: InterventionFormData = {
      equipment_id: values.equipment_id,
      scheduled_date: values.scheduled_date,
      start_date: null,
      end_date: null,
      type: values.type,
      status: values.status, // Ajouter le statut ici
      technicians: assignedTechnicians.length > 0 ? assignedTechnicians : null, // Save the updated assigned technicians list
      title: values.title || null,
      actions: values.actions || null, // This field is now redundant if history is used, but keeping for compatibility
      parts: overallPartsUsed.length > 0 ? overallPartsUsed : null, // Save the overall parts used
      technician_history: updatedTechnicianHistory.length > 0 ? updatedTechnicianHistory : null, // Save the updated history
      id: currentIntervention?.id, // Use existing ID if editing/continuing, otherwise undefined
    };

    console.log('Submitting intervention data:', interventionData);
    
    // Sauvegarder l'intervention
    onSave(interventionData);
    
    // Vérifier si on doit proposer de synchroniser le statut de l'équipement
    if (selectedEquipmentId) {
      await checkAndPromptStatusSync(
        selectedEquipmentId,
        values.status as 'in-progress' | 'completed',
        currentIntervention?.status
      );
    }
  };

  // If the modal is open but no equipment is selected and it's a new intervention,
  // maybe we should force the user to select equipment first?
  // The EquipmentSelectorField handles opening the selector, so this check might not be strictly necessary here.
  // However, if the modal could be opened without an equipmentId prop, this would be relevant.
  // For now, assuming modal is opened either with equipmentId or user selects one via EquipmentSelectorField.

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Intervention en lecture seule
            </DialogTitle>
            <DialogDescription>
              Vous n'avez pas les droits pour modifier cette intervention. Seuls les administrateurs peuvent modifier les interventions existantes (sauf pour poursuivre une intervention en cours).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentTypeBadge = getTypeBadgeInfo(formType);
  const currentStatusBadge = getStatusBadgeInfo(formStatus);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              {isContinuation ? "Poursuivre l'intervention" :
               currentIntervention ? "Modifier l'intervention" : "Créer une intervention"}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {isContinuation ? "Ajoutez vos actions et pièces pour continuer cette intervention." :
                 currentIntervention ? "Modifiez les détails de l'intervention existante." :
                 "Remplissez les informations pour créer une nouvelle intervention."}
              </span>
              {formType && (
                <Badge variant="outline" className={cn("text-xs", currentTypeBadge.color)}>
                  <currentTypeBadge.icon className="w-3 h-3 mr-1" />
                  {currentTypeBadge.name}
                </Badge>
              )}
              {formStatus && (
                <Badge variant="outline" className={cn("text-xs", currentStatusBadge.color)}>
                  <currentStatusBadge.icon className="w-3 h-3 mr-1" />
                  {currentStatusBadge.name}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Titre
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Titre de l'intervention"
                        {...field}
                        disabled={!canEditMainDetails || isFromMaintenance} // Disable if from maintenance or not admin and not new
                        className={(!canEditMainDetails || isFromMaintenance) ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <WrenchIcon className="h-4 w-4" />
                  Équipement
                </FormLabel>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedEquipmentId && "text-muted-foreground",
                      (!canEditMainDetails || isFromMaintenance) && "bg-muted cursor-not-allowed"
                    )}
                    onClick={() => (!canEditMainDetails || isFromMaintenance) ? null : setIsEquipmentSelectorOpen(true)}
                    disabled={!canEditMainDetails || isFromMaintenance}
                  >
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    {selectedEquipmentId ? (
                      prefilledEquipmentName || fetchedEquipments?.find(eq => eq.id === selectedEquipmentId)?.name || "Équipement inconnu"
                    ) : (
                      "Sélectionner un équipment"
                    )}
                  </Button>
                </FormControl>
                <FormMessage />
              </FormItem>

            

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Date d'intervention
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!canEditMainDetails} // Disable if not admin and not new
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Completed Date Field Removed */}
                {/*
                <FormField
                  control={form.control}
                  name="completed_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Date de réalisation
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={formStatus !== 'completed'} // Only enable if status is completed
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Type d'intervention
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!canEditMainDetails} // Disable if not admin and not new
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interventionTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">
                                <t.icon className="w-4 h-4" />
                                <span>{t.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Statut
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interventionStatuses.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <s.icon className="w-4 h-4" />
                                <span>{s.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Technicien
                </FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      value={currentUser ? currentUser.full_name : 'Aucun utilisateur connecté'}
                      disabled
                      className="bg-muted flex-1"
                    />
                  </FormControl>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="w-3 h-3 mr-1" />
                    Actuel
                  </Badge>
                </div>
              </FormItem>

              {/* Additional technicians selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autres techniciens (optionnel)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOtherUsers(!showOtherUsers)}
                >
                  {showOtherUsers ? (
                    <>
                      <X className="h-4 w-4" />
                      Masquer les techniciens
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Ajouter des techniciens ({users.filter(u => u.id !== currentUser?.id).length})
                    </>
                  )}
                </Button>

                {showOtherUsers && (
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                    {users.filter(u => u.id !== currentUser?.id).map(u => (
                      <div
                        key={u.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          selectedTechnicians.includes(u.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleTechnician(u.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTechnicians.includes(u.id)}
                          onChange={() => toggleTechnician(u.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.full_name}</span>
                            <span className="text-sm text-muted-foreground">({u.username})</span>
                            <span className="text-xs bg-muted px-1 rounded">{u.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Display previous technician history if in continuation mode or editing */}
              {(isContinuation || (currentIntervention && previousTechnicianHistory.length > 0)) && (
                <div className="space-y-2 border rounded-md p-3 bg-muted/50">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Historique précédent (lecture seule)
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {[...previousTechnicianHistory]
                      .sort((a, b) => {
                        const timestampA = a.timestamp || `${a.date_start}T00:00:00.000Z`;
                        const timestampB = b.timestamp || `${b.date_start}T00:00:00.000Z`;
                        return new Date(timestampA).getTime() - new Date(timestampB).getTime();
                      })
                      .map((entry, index) => (
                      <div key={index} className="text-sm border-b last:border-b-0 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            <User className="w-3 h-3 mr-1" />
                            {entry.technician_name}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {entry.date_start}{entry.date_end ? ` → ${entry.date_end}` : ''}
                          </Badge>
                        </div>
                        <p className="text-sm">{entry.actions}</p>
                        {entry.parts_used && entry.parts_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.parts_used.map((part, partIndex) => (
                              <Badge key={partIndex} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <WrenchIcon className="w-3 h-3 mr-1" />
                                {part.name} ({part.quantity})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="actions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <WrenchIcon className="h-4 w-4" />
                      {isContinuation ? "Vos actions réalisées *" : "Actions réalisées *"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={isContinuation ? "Décrivez vos actions... (obligatoire)" : "Résumé des actions effectuées (obligatoire)"}
                        className="min-h-[100px]"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {isContinuation ? "Vos pièces utilisées" : "Pièces utilisées"}
                  </Label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPartsModalOpen(true)}
                    disabled={!selectedEquipmentId || partsLoading}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {partsLoading ? "Chargement..." : "Ajouter pièces"}
                  </Button>
                </div>

                {!selectedEquipmentId ? (
                  <p className="text-sm text-muted-foreground">Sélectionnez d'abord un équipement</p>
                ) : selectedParts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune pièce sélectionnée</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedParts.map((selectedPart) => (
                        <Badge key={selectedPart.partId} variant="outline" className="bg-green-50 text-green-700 border-green-200 pr-1">
                          <Package className="w-3 h-3 mr-1" />
                          <span>{selectedPart.name} (x{selectedPart.quantity})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemovePart(selectedPart.partId)}
                            className="ml-1 p-1 h-auto hover:bg-red-100 rounded-sm"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-shrink-0">
                <Button type="button" variant="outline" onClick={onClose} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button type="submit" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {isContinuation ? "Ajouter vos actions" :
                   currentIntervention ? "Ajouter une nouvelle entrée" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PartsSelectionModal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        onConfirm={handlePartsSelection}
        availableParts={availableParts}
        initialSelectedParts={selectedParts}
        isLoading={partsLoading}
      />

      {/* AlertDialog for ongoing intervention */}
      <AlertDialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Intervention en cours détectée
            </AlertDialogTitle>
            <AlertDialogDescription>
              Une intervention est actuellement en cours sur cet équipement :
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Tag className="w-3 h-3 mr-1" />
                    {interventionToContinueRef.current?.title || 'Sans titre'}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <CalendarIcon className="w-3 h-3 mr-1" /> {/* Use CalendarIcon for date/type */}
                    {interventionToContinueRef.current?.type || 'Type inconnu'}
                  </Badge>
                </div>
              </div>
              Souhaitez-vous continuer cette intervention ou en créer une nouvelle ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCreateNewIntervention}>
              Créer une nouvelle intervention
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueIntervention}>
              Continuer l'intervention existante
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de synchronisation du statut équipement */}
      <EquipmentStatusSyncDialog
        isOpen={syncState.isDialogOpen}
        onClose={closeSyncDialog}
        equipmentName={syncState.equipmentName}
        currentEquipmentStatus={syncState.currentEquipmentStatus}
        interventionStatus={syncState.interventionStatus}
        onConfirm={async (newStatus) => {
          if (!syncState.equipmentId) return closeSyncDialog();
          try {
            if (newStatus === 'operational') {
              await setEquipmentToOperational(syncState.equipmentId);
            } else if (newStatus === 'faulty') {
              await setEquipmentToFaulty(syncState.equipmentId);
            }
          } finally {
            closeSyncDialog();
          }
        }}
      />

      {/* EquipmentSelector Modal */}
      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onSelect={(equipment) => {
          if (equipment) {
            handleEquipmentSelected(equipment);
          }
          setIsEquipmentSelectorOpen(false);
        }}
        equipments={fetchedEquipments || []}
        groups={groups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
      />
    </>
  );
};

export default InterventionFormModal;
