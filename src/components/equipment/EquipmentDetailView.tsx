// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarClock,
  Loader2,
  Tag,
  Settings,
} from 'lucide-react';
import { Equipment, EquipmentHistoryEntry } from '@/types/equipment';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import InterventionFormModal from '../interventions/InterventionFormModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Document } from '@/types/document';
import { Intervention, InterventionUI, TechnicianHistoryEntry } from '@/types/intervention';
import { StaffMember } from '@/types/staffMember';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Label } from '@/components/ui/label';
import { fetchDocumentsForEquipment, deleteDocumentsByEquipmentId } from '@/lib/documents';
import { deleteEquipment, fetchEquipmentHistory } from '@/lib/equipment';
import { deletePartsByEquipmentId } from '@/lib/parts';
import { toast } from '@/components/ui/use-toast';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Slider } from '@/components/ui/slider';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { useEquipment } from '@/hooks/use-equipment';
import { useInterventionsForEquipment } from '@/hooks/useInterventionsForEquipment';
import { useAuth } from '@/contexts/AuthContext';
import { generateInterventionPDF, PDFInterventionData } from '@/lib/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEquipmentHistoryFilter } from '@/hooks/useEquipmentHistoryFilter';
import { useInterventionFilter } from '@/hooks/useInterventionFilter';
import EquipmentDetailTabs from './EquipmentDetailTabs';
import EquipmentInfoTab from './EquipmentInfoTab';
import EquipmentActionsTab from './EquipmentActionsTab';
import EquipmentHistoryView from './EquipmentHistoryView';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEquipmentDetailPDF } from '@/hooks/useEquipmentDetailPDF';
import { FileDown } from 'lucide-react';

// Define the structure for saving/updating interventions
interface InterventionFormData {
  equipment_id?: string | null;
  scheduled_date: string;
  completed_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  type: string;
  technicians?: string[] | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  actions?: string | null;
  parts?: { name: string; quantity: number; }[] | null;
  technician_history?: TechnicianHistoryEntry[] | null;
  id?: string;
}

interface EquipmentDetailViewProps {
  equipment: Equipment | null;
  groups?: EquipmentGroup[];
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (equipment: Equipment) => void;
  onDelete?: () => void;
  initialAction?: 'documents' | 'create-intervention' | 'maintenance' | null;
}

const fieldNameTranslations: { [key: string]: string } = {
  name: 'Nom',
  model: 'Modèle',
  manufacturer: 'Fabricant',
  supplier: 'Fournisseur',
  serial_number: 'Numéro de série',
  inventory_number: 'Inventaire',
  description: 'Description',
  uf: 'UF',
  building_id: 'Bâtiment',
  service_id: 'Service',
  location_id: 'Emplacement',
  status: 'Statut',
  health_percentage: 'État de santé',
  purchase_date: "Date d'achat",
  installation_date: 'Date de mise en service',
  warranty_expiry: 'Fin de garantie',
  image_url: 'URL de l\'image',
  relationships: 'Relations',
  equipment_group_ids: "Groupes d'équipement",
};

const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipment,
  groups = [],
  buildings = [],
  services = [],
  locations = [],
  isOpen,
  onClose,
  onEdit,
  onDelete,
  initialAction = null,
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [currentTab, setCurrentTab] = useState('info');
  const [historyViewMode, setHistoryViewMode] = useState<'interventions' | 'modifications'>('interventions');
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [equipmentDocuments, setEquipmentDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<Error | null>(null);
  const [equipmentHistory, setEquipmentHistory] = useState<EquipmentHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<Error | null>(null);
  const [currentHealthPercentage, setCurrentHealthPercentage] = useState<number>(0);
  const [isUpdatingHealth, setIsUpdatingHealth] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});
  const [showOngoingInterventionDialog, setShowOngoingInterventionDialog] = useState(false);
  const [ongoingInterventionData, setOngoingInterventionData] = useState<InterventionUI | null>(null);
  const [checkingOngoingIntervention, setCheckingOngoingIntervention] = useState(false);

  const equipmentRef = useRef<Equipment | null>(equipment);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { handleUpdateHealthPercentage } = useEquipment();
  const { exportToPDF, isExporting } = useEquipmentDetailPDF();

  // Hook for interventions data
  const {
    data: interventions,
    loading: interventionsLoading,
    error: interventionsError,
    refetch: refetchInterventions
  } = useInterventionsForEquipment(equipment?.id || null);

  // Collection hooks - remove duplicates and use props instead
  const {
    data: staffMembers,
    loading: staffMembersLoading,
    error: staffMembersError
  } = useCollection<StaffMember>({
    tableName: 'staff_members'
  });

  const {
    data: users,
    loading: usersLoading,
    error: usersError
  } = useCollection<any>({
    tableName: 'users'
  });

  // Filtering hooks
  const {
    filters: interventionFilters,
    filteredInterventions,
    isFilterOpen: isInterventionFilterOpen,
    setIsFilterOpen: setIsInterventionFilterOpen,
    updateFilter: updateInterventionFilter,
    clearFilters: clearInterventionFilters,
    hasActiveFilters: hasActiveInterventionFilters,
  } = useInterventionFilter(interventions);

  const {
    filters: modificationFilters,
    filteredHistory,
    isFilterOpen: isModificationFilterOpen,
    setIsFilterOpen: setIsModificationFilterOpen,
    updateFilter: updateModificationFilter,
    clearFilters: clearModificationFilters,
    hasActiveFilters: hasActiveModificationFilters,
  } = useEquipmentHistoryFilter(equipmentHistory);

  // Convert Intervention[] to InterventionUI[] for EquipmentHistoryView
  const convertInterventionsToUI = useCallback((interventions: Intervention[]): InterventionUI[] => {
    return interventions.map(intervention => ({
      id: intervention.id,
      title: intervention.title || 'Intervention sans titre',
      type: (['preventive', 'corrective', 'improvement', 'regulatory'].includes(intervention.type) 
        ? intervention.type 
        : 'corrective') as 'preventive' | 'corrective' | 'improvement' | 'regulatory',
      status: (['in-progress', 'completed'].includes(intervention.status || '')
        ? (intervention.status || 'in-progress') 
        : 'in-progress') as 'in-progress' | 'completed',
      equipmentId: intervention.equipment_id || equipment?.id || '',
      equipmentName: equipment?.name || 'Équipement inconnu',
      buildingName: equipment?.building_id ? buildings?.find(b => b.id === equipment.building_id)?.name : undefined,
      scheduled_date: intervention.scheduled_date || '',
      completedDate: intervention.completed_date ? (() => {
        try {
          const date = new Date(intervention.completed_date);
          return isNaN(date.getTime()) ? undefined : format(date, 'dd/MM/yyyy', { locale: fr });
        } catch {
          return undefined;
        }
      })() : undefined,
      technicians: Array.isArray(intervention.technicians) 
        ? intervention.technicians.map(id => users?.find(u => u.id === id)?.full_name || `ID: ${id}`)
        : [],
      actions: intervention.actions || '',
      parts: Array.isArray(intervention.parts) ? 
        intervention.parts.map((part: any) => ({
          name: part.name || 'Pièce inconnue',
          quantity: part.quantity ?? 0
        })) : [],
      createdAt: intervention.created_at || new Date().toISOString(),
      created_at: intervention.created_at || new Date().toISOString(),
      technician_history: Array.isArray(intervention.technician_history) ? 
        intervention.technician_history.map((entry: any) => ({
          technician_id: entry.technician_id || '',
          technician_name: entry.technician_name || 'Technicien inconnu',
          actions: entry.actions || '',
          parts_used: Array.isArray(entry.parts_used) ? entry.parts_used.map((part: any) => ({
            name: part.name || 'Pièce inconnue',
            quantity: part.quantity ?? 0
          })) : [],
          date_start: entry.date_start || '',
          date_end: entry.date_end,
          timestamp: entry.timestamp
        })) : []
    }));
  }, [equipment, buildings, users]);

  const convertedInterventions = convertInterventionsToUI(filteredInterventions);

  // Callback hooks
  const handleHealthChange = useCallback((value: number[]) => {
    setCurrentHealthPercentage(value[0]);
  }, []);

  const handleHealthCommit = useCallback(async (value: number[]) => {
    if (!equipmentRef.current || isUpdatingHealth) return;

    const currentEquipment = equipmentRef.current;
    const newHealth = value[0];

    if (newHealth === currentEquipment.health_percentage) return;

    setIsUpdatingHealth(true);

    try {
      const success = await handleUpdateHealthPercentage(currentEquipment.id, newHealth);

      if (success) {
        // Update both ref and state to ensure consistency
        equipmentRef.current = {
          ...currentEquipment,
          health_percentage: newHealth
        };
        // Keep the local state updated
        setCurrentHealthPercentage(newHealth);
      }
    } catch (error) {
      console.error("[EquipmentDetailView] Error updating health percentage:", error);
      // Reset to original value on error
      setCurrentHealthPercentage(currentEquipment.health_percentage ?? 0);
    } finally {
      setIsUpdatingHealth(false);
    }
  }, [isUpdatingHealth, handleUpdateHealthPercentage]);

  // Fonction pour obtenir l'image à afficher (groupe ou individuelle)
  const getDisplayImage = useCallback(() => {
    if (!equipment) return null;

    // Vérifier s'il y a une image de groupe partagée - utiliser associated_group_ids
    const groupIds = equipment.associated_group_ids || equipment.equipment_group_ids || [];
    if (groupIds.length > 0) {
      for (const groupId of groupIds) {
        const group = groups.find(g => g.id === groupId);
        if (group && group.shared_image_url) {
          return group.shared_image_url;
        }
      }
    }

    // Sinon, utiliser l'image individuelle
    return equipment.image_url;
  }, [equipment, groups]);

  // Effects
  useEffect(() => {
    if (equipment) {
      equipmentRef.current = equipment;
      setCurrentHealthPercentage(equipment.health_percentage ?? 0);
    }
  }, [equipment]);

  useEffect(() => {
    if (isOpen && initialAction) {
      if (initialAction === 'documents') {
        setShowDocuments(true);
        setCurrentTab('actions');
      } else if (initialAction === 'create-intervention') {
        setCurrentTab('actions');
        handleCreateIntervention();
      } else if (initialAction === 'maintenance') {
        setCurrentTab('actions');
      }
    }
  }, [isOpen, initialAction]);

  useEffect(() => {
    if (isOpen && equipment) {
      console.log("[EquipmentDetailView] Dialog opened for equipment:", equipment.id, equipment.name);

      const fetchDocs = async () => {
        setDocumentsLoading(true);
        setDocumentsError(null);
        try {
          const docs = await fetchDocumentsForEquipment(equipment.id);
          setEquipmentDocuments(docs);
        } catch (err: any) {
          setDocumentsError(err);
          console.error("Failed to fetch documents:", err);
        } finally {
          setDocumentsLoading(false);
        }
      };
      fetchDocs();
    } else {
      setEquipmentDocuments([]);
    }
  }, [isOpen, equipment]);

  useEffect(() => {
    if (isOpen && equipment && currentTab === 'history' && historyViewMode === 'modifications') {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
          console.log(`Fetching modification history for equipment ${equipment.id}`);
          const history = await fetchEquipmentHistory(equipment.id);
          console.log(`Retrieved ${history.length} modification entries`);
          setEquipmentHistory(history);
        } catch (err: any) {
          console.error("Failed to fetch equipment history:", err);
          setHistoryError(err);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchHistory();
    }
  }, [isOpen, equipment, currentTab, historyViewMode]);

  // NOW we can have conditional returns since all hooks are called
  if (!equipment) return null;

  const displayImage = getDisplayImage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Opérationnel
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            En maintenance
          </Badge>
        );
      case 'faulty':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            En panne
          </Badge>
        );
      case 'planned':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-800 border-blue-300 flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Planifiée
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-800 border-yellow-300 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            En cours
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500 text-green-800 border-green-300 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Terminée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-800 border-gray-300 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Annulée
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSaveIntervention = async (interventionData: InterventionFormData) => {
    try {
      let error;
      if (interventionData.id) {
        // Update existing intervention
        const { error: updateError } = await supabase
          .from('interventions')
          .update(interventionData)
          .eq('id', interventionData.id);
        error = updateError;
        if (!error) {
          toast({ title: "Intervention mise à jour", description: "L'intervention a été mise à jour avec succès." });
        }
      } else {
        // Create new intervention
        const { error: insertError } = await supabase
          .from('interventions')
          .insert({
            ...interventionData,
            equipment_id: equipment.id,
            created_at: new Date().toISOString(),
          });
        error = insertError;
        if (!error) {
          toast({ title: "Intervention créée", description: "Une nouvelle intervention a été créée avec succès." });
        }
      }

      if (error) {
        throw error;
      }

      refetchInterventions();
      setInterventionModalOpen(false);
      setOngoingInterventionData(null);
    } catch (err: any) {
      console.error("Error saving intervention:", err);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer l'intervention: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateIntervention = async () => {
    if (!equipment) return;

    setCheckingOngoingIntervention(true);
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('equipment_id', equipment.id)
        .eq('status', 'in-progress')
        .limit(1);

      if (error) {
        console.error('Error checking ongoing interventions:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier les interventions en cours.",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const ongoing = data[0];
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

        setOngoingInterventionData({
          id: ongoing.id,
          title: ongoing.title || 'Intervention sans titre',
          type: (['preventive', 'corrective', 'improvement', 'regulatory'].includes(ongoing.type) 
            ? ongoing.type 
            : 'corrective') as 'preventive' | 'corrective' | 'improvement' | 'regulatory',
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
          technician_history: parsedTechnicianHistory,
          equipmentId: ongoing.equipment_id,
          equipmentName: equipment?.name || 'Équipement inconnu',
          status: (['in-progress', 'completed'].includes(ongoing.status) 
            ? ongoing.status 
            : 'in-progress') as 'in-progress' | 'completed',
          createdAt: ongoing.created_at || new Date().toISOString(),
          created_at: ongoing.created_at || new Date().toISOString()
        });
        setShowOngoingInterventionDialog(true);
      } else {
        setOngoingInterventionData(null);
        setInterventionModalOpen(true);
      }
    } catch (error) {
      console.error('Error in handleCreateIntervention:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue lors de la création de l'intervention.",
        variant: "destructive"
      });
    } finally {
      setCheckingOngoingIntervention(false);
    }
  };

  const handleContinueExistingIntervention = () => {
    setInterventionModalOpen(true);
    setShowOngoingInterventionDialog(false);
  };

  const handleStartNewIntervention = () => {
    setOngoingInterventionData(null);
    setInterventionModalOpen(true);
    setShowOngoingInterventionDialog(false);
  };

  const handleEditEquipment = () => {
    if (onEdit && equipment) {
      onEdit({ ...equipment, health_percentage: currentHealthPercentage });
    }
  };

  const handlePrintQRCode = () => {
    const printWindow = window.open('', '', 'height=600,width=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>QR Code</title>');
      printWindow.document.write('<style>body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${equipment.name}</h2>`);
      printWindow.document.write(`<div style="margin: 20px auto;">`);
      const svgElement = document.querySelector('.qr-code-container svg');
      if (svgElement) {
         const svgData = new XMLSerializer().serializeToString(svgElement);
         printWindow.document.write(svgData);
      } else {
         printWindow.document.write('<p>QR Code not available</p>');
      }
      printWindow.document.write('</div>');
      printWindow.document.write(`<p>ID: ${equipment.id}</p>`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownloadQRCode = () => {
    const svg = document.querySelector('.qr-code-container svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `qrcode-${equipment.id}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equipment || !onDelete) return;

    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${equipment.name}" ?`);
    if (!confirmDelete) {
      return;
    }

    try {
      console.log(`Attempting to delete equipment: ${equipment.id}`);

      const isInGroup = equipment.equipment_group_ids && equipment.equipment_group_ids.length > 0;

      if (!isInGroup) {
        console.log(`Equipment ${equipment.id} is not in any group. Deleting associated documents and parts.`);
        await deleteDocumentsByEquipmentId(equipment.id);
        console.log(`Documents for equipment ${equipment.id} deleted.`);

        await deletePartsByEquipmentId(equipment.id);
        console.log(`Parts for equipment ${equipment.id} deleted.`);
      } else {
        console.log(`Equipment ${equipment.id} is in a group. Keeping associated documents and parts.`);
      }

      await deleteEquipment(equipment.id);
      console.log(`Equipment ${equipment.id} deleted successfully.`);

      toast({
        title: "Équipement supprimé",
        description: `${equipment.name} a été supprimé avec succès.`,
      });

      onDelete();

    } catch (error: any) {
      console.error("Error deleting equipment:", error);
      toast({
        title: "Erreur de suppression",
        description: `Impossible de supprimer l'équipement: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Function to enrich intervention data for PDF/Print
  const enrichInterventionData = (intervention: any): PDFInterventionData => {
    return {
      ...intervention,
      equipmentName: equipment?.name || 'Équipement inconnu',
      equipmentModel: equipment?.model,
      equipmentLocation: equipment?.location_id ? locations?.find(l => l.id === equipment.location_id)?.name || '' : '',
      equipmentSerialNumber: equipment?.serial_number,
      technicians: Array.isArray(intervention.technicians)
        ? intervention.technicians.map((id: string) => users?.find(u => u.id === id)?.full_name || `ID: ${id}`).filter(Boolean)
        : [],
      technician_history: Array.isArray(intervention.technician_history)
        ? intervention.technician_history.map((entry: any) => ({
            ...entry,
            parts_used: Array.isArray(entry.parts_used)
              ? entry.parts_used.map((part: any) => ({
                  name: part.name || 'Pièce inconnue',
                  quantity: part.quantity ?? 0,
                }))
              : [],
          }))
        : [],
      parts: Array.isArray(intervention.parts)
        ? intervention.parts.map((part: any) => ({
            name: part.name || 'Pièce inconnue',
            quantity: part.quantity ?? 0,
          }))
        : [],
      createdAt: intervention.created_at || new Date().toISOString(),
      completedDate: intervention.completed_date ? format(new Date(intervention.completed_date), 'dd/MM/yyyy', { locale: fr }) : undefined,
      scheduled_date: intervention.scheduled_date ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy', { locale: fr }) : 'Non renseignée',
    };
  };

  // Function to handle PDF Export (Download)
  const handleExportInterventionPDF = (intervention: any) => {
    try {
      const enrichedIntervention = enrichInterventionData(intervention);
      generateInterventionPDF(enrichedIntervention);

      toast({
        title: "PDF généré",
        description: "La fiche d'intervention a été téléchargée en PDF.",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF de l'intervention.",
        variant: "destructive",
      });
    }
  };

  // Function to handle Printing
  const handlePrintIntervention = (intervention: any) => {
    try {
      const enrichedIntervention = enrichInterventionData(intervention);

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

      // Create HTML content for printing
      const printContent = `
        <html>
          <head>
            <title>Fiche d'intervention - ${enrichedIntervention.title || 'Sans titre'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
              .section { margin-bottom: 20px; }
              .section-title { font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
              .field { margin-bottom: 6px; }
              .field-label { font-weight: bold; }
              .history-entry { border-left: 2px solid #3b82f6; padding-left: 10px; margin-bottom: 10px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>FICHE D'INTERVENTION</h1>
            </div>

            <div class="section">
              <div class="section-title">INFORMATIONS GÉNÉRALES</div>
              <div class="field"><span class="field-label">ID :</span> ${enrichedIntervention.id}</div>
              <div class="field"><span class="field-label">Titre :</span> ${enrichedIntervention.title || 'Sans titre'}</div>
              <div class="field"><span class="field-label">Type :</span> ${getInterventionTypeText(enrichedIntervention.type)}</div>
              <div class="field"><span class="field-label">Statut :</span> ${getInterventionStatusText(enrichedIntervention.status || 'in-progress')}</div>
              ${enrichedIntervention.priority ? `<div class="field"><span class="field-label">Priorité :</span> ${enrichedIntervention.priority}</div>` : ''}
              <div class="field"><span class="field-label">Date d'intervention :</span> ${enrichedIntervention.scheduled_date}</div>
              ${enrichedIntervention.completedDate ? `<div class="field"><span class="field-label">Date de fin :</span> ${enrichedIntervention.completedDate}</div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">ÉQUIPEMENT</div>
              <div class="field"><span class="field-label">Nom :</span> ${enrichedIntervention.equipmentName}</div>
              ${enrichedIntervention.equipmentModel ? `<div class="field"><span class="field-label">Modèle :</span> ${enrichedIntervention.equipmentModel}</div>` : ''}
              ${enrichedIntervention.equipmentSerialNumber ? `<div class="field"><span class="field-label">N° de série :</span> ${enrichedIntervention.equipmentSerialNumber}</div>` : ''}
              ${enrichedIntervention.equipmentLocation ? `<div class="field"><span class="field-label">Localisation :</span> ${enrichedIntervention.equipmentLocation}</div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">TECHNICIEN(S)</div>
              ${enrichedIntervention.technicians && enrichedIntervention.technicians.length > 0
                ? enrichedIntervention.technicians.map((tech: string, i: number)=> `<div class="field">${i + 1}. ${tech}</div>`).join('')
                : '<div class="field">Aucun technicien assigné</div>'
              }
            </div>

            ${enrichedIntervention.actions ? `
            <div class="section">
              <div class="section-title">ACTIONS RÉALISÉES</div>
              <div>${enrichedIntervention.actions}</div>
            </div>
            ` : ''}

            ${enrichedIntervention.technician_history && enrichedIntervention.technician_history.length > 0 ? `
            <div class="section">
              <div class="section-title">HISTORIQUE DÉTAILLÉ</div>
              ${enrichedIntervention.technician_history.map((entry: any, i: number) => {
                const formattedStartDate = entry.date_start ? format(new Date(entry.date_start), 'dd/MM/yyyy', { locale: fr }) : '';
                const formattedEndDate = entry.date_end ? format(new Date(entry.date_end), 'dd/MM/yyyy', { locale: fr }) : '';
                const formattedCompletedDate = enrichedIntervention.completedDate;

                let dateDisplay;
                if (!entry.date_end) {
                  dateDisplay = `${formattedStartDate} (En cours)`;
                } else if (formattedEndDate && formattedCompletedDate && formattedEndDate === formattedCompletedDate) {
                  dateDisplay = `${formattedStartDate} (Terminée)`;
                } else if (entry.date_end) {
                  dateDisplay = `${formattedStartDate} → ${formattedEndDate}`;
                } else {
                  dateDisplay = formattedStartDate;
                }

                return `
                <div class="history-entry">
                  <div class="field-label">${i + 1}. ${entry.technician_name}</div>
                  <div class="field">Période : ${dateDisplay}</div>
                  ${entry.actions ? `<div class="field">Actions : ${entry.actions}</div>` : ''}
                  ${entry.parts_used && entry.parts_used.length > 0 ? `
                    <div class="field">Pièces utilisées :</div>
                    ${entry.parts_used.map((part: any) => `<div>• ${part.name} (Quantité: ${part.quantity})</div>`).join('')}
                  ` : ''}
                </div>
                `;
              }).join('')}
            </div>
            ` : ''}

            ${enrichedIntervention.parts && enrichedIntervention.parts.length > 0 ? `
            <div class="section">
              <div class="section-title">PIÈCES UTILISÉES (GLOBAL)</div>
              ${enrichedIntervention.parts.map((part: any) => `<div class="field">• ${part.name} (Quantité: ${part.quantity})</div>`).join('')}
            </div>
            ` : ''}

            <div style="margin-top: 40px; font-size: 12px; color: #666;">
              Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
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

  const getLocationName = (locationId: string | null): string => {
    if (!locationId || !locations) {
      return '';
    }
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : '';
  };


  const handleExportDetailToPDF = async () => {
    if (!equipment) return;
    
    await exportToPDF(
      'equipment-detail-content',
      equipment.name,
      {
        title: `Fiche Équipement - ${equipment.name}`,
        orientation: 'portrait',
        format: 'a4',
        includeQRCode: showQrCode,
        includeActions: false
      }
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-4 md:p-6 w-[calc(100vw-32px)] mx-auto">
          <div id="equipment-detail-content" className="w-full">
          <DialogHeader>
            <DialogTitle className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 equipment-header">
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg truncate equipment-title">{equipment.name}</span>
                {getStatusBadge(equipment.status)}
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExportDetailToPDF}
                  title="Exporter en PDF"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {equipment.equipment_type && (
            <div className="mt-2">
              <Badge variant="outline">
                {equipment.equipment_type === 'biomedical' ? 'Biomédical' : 'Technique'}
              </Badge>
            </div>
          )}

          {displayImage && (
            <div className="mt-2 border rounded-md overflow-hidden equipment-image-container">
              <AspectRatio ratio={16/9}>
                <img
                  src={displayImage}
                  alt={equipment.name}
                  className="object-contain w-full h-full"
                />
              </AspectRatio>
            </div>
          )}

          <div className="relative mt-4 space-y-2">
            <Label htmlFor="health_percentage">État de santé (%)</Label>
            <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <Slider
                    id="health_percentage"
                    min={0}
                    max={100}
                    step={1}
                    value={[currentHealthPercentage]}
                    onValueChange={handleHealthChange}
                    onValueCommit={handleHealthCommit}
                    disabled={isUpdatingHealth}
                  />
                </div>
                {isUpdatingHealth && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
            <div className="mt-1 text-xs text-right">
              État de santé actuel: <span className="font-medium">{currentHealthPercentage}%</span>
            </div>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full mt-4">
            <EquipmentDetailTabs currentTab={currentTab} onTabChange={setCurrentTab} />

            <EquipmentInfoTab
              equipment={equipment}
              buildings={buildings}
              services={services}
              locations={locations}
              equipmentGroups={groups}
              loading={false}
              error={null}
              showQrCode={showQrCode}
              isMobile={isMobile}
              onToggleQrCode={() => setShowQrCode(!showQrCode)}
              onPrintQRCode={handlePrintQRCode}
              onDownloadQRCode={handleDownloadQRCode}
              onEdit={handleEditEquipment}
              onDelete={handleDeleteEquipment}
              onSetCurrentTab={setCurrentTab}
            />


            <EquipmentHistoryView
              currentTab={currentTab}
              historyViewMode={historyViewMode}
              setHistoryViewMode={setHistoryViewMode}
              interventions={convertedInterventions}
              interventionsLoading={interventionsLoading}
              interventionsError={interventionsError}
              usersLoading={usersLoading}
              usersError={usersError}
              users={users}
              equipment={equipment}
              equipmentHistory={filteredHistory}
              historyLoading={historyLoading}
              historyError={historyError}
              expandedHistory={expandedHistory}
              onToggleHistoryExpansion={(id) => setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }))}
              interventionFilters={interventionFilters}
              isInterventionFilterOpen={isInterventionFilterOpen}
              setIsInterventionFilterOpen={setIsInterventionFilterOpen}
              updateInterventionFilter={updateInterventionFilter}
              clearInterventionFilters={clearInterventionFilters}
              hasActiveInterventionFilters={hasActiveInterventionFilters}
              modificationFilters={modificationFilters}
              isModificationFilterOpen={isModificationFilterOpen}
              setIsModificationFilterOpen={setIsModificationFilterOpen}
              updateModificationFilter={updateModificationFilter}
              clearModificationFilters={clearModificationFilters}
              hasActiveModificationFilters={hasActiveModificationFilters}
              buildings={buildings}
              services={services}
              locations={locations}
            />

            <EquipmentActionsTab
              equipment={equipment}
              onCreateIntervention={handleCreateIntervention}
              checkingOngoingIntervention={checkingOngoingIntervention}
              showDocuments={showDocuments}
              onToggleDocuments={setShowDocuments}
              documentsLoading={documentsLoading}
              documentsError={documentsError}
              equipmentDocuments={equipmentDocuments}
              currentUser={user}
              autoOpenMaintenance={initialAction === 'maintenance'}
            />
          </Tabs>

          <DialogFooter className="mt-6 no-print">
            <Button onClick={onClose} size={isMobile ? "sm" : "default"}>
              Fermer
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>

        {equipment && (
          <InterventionFormModal
            isOpen={interventionModalOpen}
            onClose={() => {
              setInterventionModalOpen(false);
              setOngoingInterventionData(null);
            }}
            onSave={handleSaveIntervention}
            equipmentId={equipment.id}
            currentUser={user}
            intervention={ongoingInterventionData}
          />
        )}
      </Dialog>

      <AlertDialog open={showOngoingInterventionDialog} onOpenChange={setShowOngoingInterventionDialog}>
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
                    {ongoingInterventionData?.title}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Calendar className="w-3 h-3 mr-1" />
                    {ongoingInterventionData?.type}
                  </Badge>
                </div>
              </div>
              Souhaitez-vous continuer cette intervention ou en créer une nouvelle ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartNewIntervention}>
              Créer une nouvelle intervention
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueExistingIntervention}>
              Continuer l'intervention existante
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EquipmentDetailView;
