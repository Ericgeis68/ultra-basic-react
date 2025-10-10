import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomCard from '../ui/CustomCard';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  History,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wrench,
  Download,
  FileText,
  Filter,
  XCircle,
  Loader2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InterventionUI } from '@/types/intervention';
import { EquipmentHistoryEntry } from '@/types/equipment';
import { generateInterventionPDF, PDFInterventionData } from '@/lib/pdfGenerator';
import { generateInterventionsPDF } from '@/lib/intervention-print';
import { toast } from '@/components/ui/use-toast';

interface EquipmentHistoryViewProps {
  currentTab: string;
  historyViewMode: 'interventions' | 'modifications';
  setHistoryViewMode: (mode: 'interventions' | 'modifications') => void;
  interventions: InterventionUI[] | null;
  interventionsLoading: boolean;
  interventionsError: any;
  usersLoading: boolean;
  usersError: any;
  users: any[] | null;
  equipment: Equipment | null;
  equipmentHistory: EquipmentHistoryEntry[];
  historyLoading: boolean;
  historyError: Error | null;
  expandedHistory: Record<string, boolean>;
  onToggleHistoryExpansion: (id: string) => void;
  interventionFilters: any;
  isInterventionFilterOpen: boolean;
  setIsInterventionFilterOpen: (open: boolean) => void;
  updateInterventionFilter: (key: string, value: any) => void;
  clearInterventionFilters: () => void;
  hasActiveInterventionFilters: boolean;
  modificationFilters: any;
  isModificationFilterOpen: boolean;
  setIsModificationFilterOpen: (open: boolean) => void;
  updateModificationFilter: (key: string, value: any) => void;
  clearModificationFilters: () => void;
  hasActiveModificationFilters: boolean;
  buildings?: any[];
  services?: any[];
  locations?: any[];
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

const EquipmentHistoryView: React.FC<EquipmentHistoryViewProps> = ({
  currentTab,
  historyViewMode,
  setHistoryViewMode,
  interventions,
  interventionsLoading,
  interventionsError,
  usersLoading,
  usersError,
  users,
  equipment,
  equipmentHistory,
  historyLoading,
  historyError,
  expandedHistory,
  onToggleHistoryExpansion,
  interventionFilters,
  isInterventionFilterOpen,
  setIsInterventionFilterOpen,
  updateInterventionFilter,
  clearInterventionFilters,
  hasActiveInterventionFilters,
  modificationFilters,
  isModificationFilterOpen,
  setIsModificationFilterOpen,
  updateModificationFilter,
  clearModificationFilters,
  hasActiveModificationFilters,
  buildings = [],
  services = [],
  locations = []
}) => {
  const getInterventionStatusBadge = (status: string) => {
    // Normaliser le statut pour gérer les variations
    const normalizedStatus = status?.toLowerCase() || '';
    
    // Gérer les cas où le statut arrive déjà en français
    if (normalizedStatus.includes('en cours') || normalizedStatus.includes('cours')) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          En cours
        </Badge>
      );
    }
    if (normalizedStatus.includes('terminé') || normalizedStatus.includes('termine')) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Terminé
        </Badge>
      );
    }
    if (normalizedStatus.includes('planifié') || normalizedStatus.includes('planifie')) {
      return (
        <Badge variant="outline" className="border-purple-500 text-purple-500 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Planifié
        </Badge>
      );
    }
    if (normalizedStatus.includes('annulé') || normalizedStatus.includes('annule')) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-500 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Annulé
        </Badge>
      );
    }
    
    switch (normalizedStatus) {
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </Badge>
        );
      case 'in_progress':
      case 'in-progress':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En cours
          </Badge>
        );
      case 'planned':
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Planifié
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Annulé
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {status || 'Inconnu'}
          </Badge>
        );
    }
  };

  const getInterventionTypeBadge = (type: string) => {
    // Normaliser le type pour gérer les variations
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'preventive':
        return (
          <Badge variant="outline" className="bg-primary/10 border-primary text-primary">
            Préventive
          </Badge>
        );
      case 'corrective':
        return (
          <Badge variant="outline" className="bg-red-500/10 border-red-500 text-red-500">
            Corrective
          </Badge>
        );
      case 'improvement':
        return (
          <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-500">
            Amélioration
          </Badge>
        );
      case 'regulatory':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500 text-yellow-500">
            Réglementaire
          </Badge>
        );
      case 'inspection':
        return (
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500 text-blue-500">
            Inspection
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 border-gray-500 text-gray-500">
            {type || 'Inconnu'}
          </Badge>
        );
    }
  };

  const enrichInterventionData = (intervention: any): PDFInterventionData => {
    return {
      ...intervention,
      equipmentName: 'Équipement inconnu',
      equipmentModel: '',
      equipmentLocation: '',
      equipmentSerialNumber: '',
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

  // Fonction pour l'export PDF standard
  const handleExportToPDF = async (intervention: any) => {
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
      const equipmentName = equipment?.name || 'Équipement inconnu';
      
      // Fonctions utilitaires pour les textes (synchronisées avec Interventions.tsx)
      const getInterventionStatusText = (status: string) => {
        switch (status) {
          case 'in-progress': return 'En cours d\'exécution';
          case 'completed': return 'Terminée avec succès';
          case 'planned': return 'Planifiée';
          case 'cancelled': return 'Annulée';
          default: return status;
        }
      };

      const getInterventionTypeText = (type: string) => {
        switch (type) {
          case 'preventive': return 'Maintenance Préventive';
          case 'corrective': return 'Maintenance Corrective';
          case 'improvement': return 'Amélioration';
          case 'regulatory': return 'Contrôle Réglementaire';
          default: return type;
        }
      };
      
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
              <div style="text-align: right;"><strong>Date planifiée:</strong> ${intervention.scheduled_date ? (() => { const d = new Date(intervention.scheduled_date); if (isNaN(d.getTime())) return 'Non définie'; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : 'Non définie'}</div>
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
              ${intervention.technician_history.map((entry: any, index: number) => `
                <div style="border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; margin-bottom: 8px; background: white;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${index + 1}. ${entry.technician_name || 'Technicien inconnu'}</div>
                  <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
                    ${entry.date_start ? (() => { const d = new Date(entry.date_start); if (isNaN(d.getTime())) return 'Date inconnue'; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : 'Date inconnue'}
                    ${entry.date_end ? ` → ${(() => { const d = new Date(entry.date_end); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}` : ' (En cours)'}
                  </div>
                  ${entry.actions ? `<div style="margin: 4px 0;"><strong>Actions:</strong> ${entry.actions}</div>` : ''}
                  ${entry.parts_used && entry.parts_used.length > 0 ? `
                    <div style="margin: 4px 0;"><strong>Pièces utilisées:</strong></div>
                    ${entry.parts_used.map((part: any) => `<div style="margin-left: 10px;">• ${part.name} (Quantité: ${part.quantity})</div>`).join('')}
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Pied de page -->
          <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px;">
            Généré le ${(() => { const d = new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()} à ${new Date().toLocaleTimeString('fr-FR')}
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

  // Fonction pour l'export PDF au format carte (vert)
  const generateInterventionPDFCard = async (intervention: any) => {
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

      const equipmentName = equipment?.name || 'Équipement inconnu';
      
      // Fonctions utilitaires pour les textes (synchronisées avec Interventions.tsx)
      const getInterventionStatusText = (status: string) => {
        switch (status) {
          case 'in-progress': return 'En cours d\'exécution';
          case 'completed': return 'Terminée avec succès';
          case 'planned': return 'Planifiée';
          case 'cancelled': return 'Annulée';
          default: return status;
        }
      };

      const getInterventionTypeText = (type: string) => {
        switch (type) {
          case 'preventive': return 'Maintenance Préventive';
          case 'corrective': return 'Maintenance Corrective';
          case 'improvement': return 'Amélioration';
          case 'regulatory': return 'Contrôle Réglementaire';
          default: return type;
        }
      };

      const cleanTechnicianNames = (technicians: any) => {
        if (!technicians || technicians.length === 0) return 'Aucun technicien assigné';
        return technicians.join(', ');
      };
      
      tempDiv.innerHTML = `
        <div class="print-content" style="height: 100vh; display: flex; flex-direction: column;">
          <div class="print-header border-b-2 border-gray-300 pb-4 mb-4" style="flex-shrink: 0;">
            <h1 class="text-4xl font-black text-center text-black mb-2">Rapport d'intervention</h1>
          </div>
          <div class="flex-1" style="display: flex; flex-direction: column; overflow: hidden;">
            <div class="intervention-card border rounded-lg bg-white shadow-sm flex-1" style="display: flex; flex-direction: column; overflow: hidden;">
              <div class="p-4 pb-3 flex-shrink-0">
                <div class="flex items-start justify-between mb-3" style="width: 100%;">
                  <h3 class="font-extrabold text-xl text-black" style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; max-width: 70%;">${intervention.title || 'Sans titre'}</h3>
                  <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">${getInterventionStatusText(intervention.status)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-sm px-3 py-1">${getInterventionTypeText(intervention.type)}</div>
                </div>
              </div>
              <div class="px-4 pb-4 space-y-3 flex-1 overflow-auto" style="min-height: 0px;">
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



  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (e) {
      console.error("Failed to parse date string:", dateString, e);
      return dateString;
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

  const formatJsonValue = (value: any, fieldName?: string): string => {
    if (value === null || value === undefined) return '';

    try {
      if (typeof value === 'string') {
        // Si c'est un ID, chercher le nom correspondant
        if (fieldName === 'building_id' && buildings) {
          const building = buildings.find(b => b.id === value);
          return building ? building.name : value;
        }
        if (fieldName === 'service_id' && services) {
          const service = services.find(s => s.id === value);
          return service ? service.name : value;
        }
        if (fieldName === 'location_id' && locations) {
          const location = locations.find(l => l.id === value);
          return location ? location.name : value;
        }
        return value;
      }
      return JSON.stringify(value);
    } catch (e) {
      console.error("Failed to format JSON value:", value, e);
      return String(value);
    }
  };

  const getTranslatedFieldName = (fieldName: string): string => {
    return fieldNameTranslations[fieldName] || fieldName;
  };

  if (currentTab !== 'history') return null;

  return (
    <TabsContent value="history" className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm md:text-lg font-medium">Historique</h3>
        <div className="flex gap-1">
          <Button
            variant={historyViewMode === 'interventions' ? 'secondary' : 'outline'}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => setHistoryViewMode('interventions')}
          >
            Interventions
          </Button>
          <Button
            variant={historyViewMode === 'modifications' ? 'secondary' : 'outline'}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => setHistoryViewMode('modifications')}
          >
            Modifications
          </Button>
          <Popover open={historyViewMode === 'interventions' ? isInterventionFilterOpen : isModificationFilterOpen} onOpenChange={historyViewMode === 'interventions' ? setIsInterventionFilterOpen : setIsModificationFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs px-2 py-1 h-auto relative ${historyViewMode === 'interventions' && hasActiveInterventionFilters || historyViewMode === 'modifications' && hasActiveModificationFilters ? 'border-primary text-primary' : ''}`}
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                {historyViewMode === 'interventions' && hasActiveInterventionFilters && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
                {historyViewMode === 'modifications' && hasActiveModificationFilters && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <h4 className="font-semibold mb-3">Filtrer l'historique</h4>
              {historyViewMode === 'interventions' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tech-filter-interventions" className="text-xs">Technicien</Label>
                    <Input
                      id="tech-filter-interventions"
                      placeholder="Nom du technicien"
                      value={interventionFilters.technicianFilter}
                      onChange={(e) => updateInterventionFilter('technicianFilter', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date de début</Label>
                    <DatePicker
                      selected={interventionFilters.dateFrom}
                      onSelect={(date) => updateInterventionFilter('dateFrom', date)}
                      placeholder="Date de début"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date de fin</Label>
                    <DatePicker
                      selected={interventionFilters.dateTo}
                      onSelect={(date) => updateInterventionFilter('dateTo', date)}
                      placeholder="Date de fin"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-completed"
                      checked={interventionFilters.statusFilter === 'completed'}
                      onCheckedChange={(checked) => updateInterventionFilter('statusFilter', checked ? 'completed' : 'all')}
                    />
                    <Label htmlFor="status-completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Terminée
                    </Label>
                  </div>
                  {hasActiveInterventionFilters && (
                    <Button variant="outline" size="sm" onClick={clearInterventionFilters} className="w-full text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tech-filter-modifications" className="text-xs">Technicien</Label>
                    <Input
                      id="tech-filter-modifications"
                      placeholder="Nom du technicien"
                      value={modificationFilters.technicianFilter}
                      onChange={(e) => updateModificationFilter('technicianFilter', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-filter-modifications" className="text-xs">Champ modifié</Label>
                    <Input
                      id="field-filter-modifications"
                      placeholder="Nom du champ"
                      value={modificationFilters.fieldFilter}
                      onChange={(e) => updateModificationFilter('fieldFilter', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date de début</Label>
                    <DatePicker
                      selected={modificationFilters.dateFrom ? new Date(modificationFilters.dateFrom) : undefined}
                      onSelect={(date) => updateModificationFilter('dateFrom', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="Date de début"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date de fin</Label>
                    <DatePicker
                      selected={modificationFilters.dateTo ? new Date(modificationFilters.dateTo) : undefined}
                      onSelect={(date) => updateModificationFilter('dateTo', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="Date de fin"
                    />
                  </div>
                  {hasActiveModificationFilters && (
                    <Button variant="outline" size="sm" onClick={clearModificationFilters} className="w-full text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Effacer les filtres
                    </Button>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {historyViewMode === 'interventions' ? (
        interventionsLoading || usersLoading ? (
          <div className="text-center p-6 border rounded-md">
            <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Chargement de l'historique des interventions...</p>
          </div>
        ) : interventionsError || usersError ? (
          <div className="text-center p-6 border border-destructive text-destructive rounded-md">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur lors du chargement de l'historique des interventions: {interventionsError?.message || usersError?.message}</p>
          </div>
        ) : interventions && interventions.length > 0 ? (
          <div className="space-y-4">
            {interventions.map((intervention) => {
              const technicianHistory = intervention.technician_history || [];
              const sortedTechnicianHistory = [...technicianHistory].sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date_start);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date_start);
                return dateA.getTime() - dateB.getTime();
              });

              const displayEntries = sortedTechnicianHistory; // Afficher tout l'historique par défaut

              return (
                <CustomCard key={intervention.id} className="p-4" variant="outline">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{intervention.title || 'Intervention sans titre'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getInterventionTypeBadge(intervention.type)}
                        {getInterventionStatusBadge(intervention.status || 'planned')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportToPDF(intervention)}
                        title="Exporter en PDF"
                        className="text-primary hover:bg-primary/10"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateInterventionPDFCard(intervention)}
                        title="Exporter PDF Carte"
                        className="text-green-600 hover:bg-green-100"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Date prévue :</span>
                      <span className="font-medium">
                        {intervention.scheduled_date ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy') : 'Non renseignée'}
                      </span>
                    </div>
                    {intervention.completedDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Date de fin :</span>
                        <span className="font-medium">{intervention.completedDate}</span>
                      </div>
                    )}
                  </div>

                  {sortedTechnicianHistory.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Historique détaillé :</span>
                      </div>
                      <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                        {displayEntries.map((entry, index) => {
                          const formattedStartDate = formatDateOnly(entry.date_start);
                          const formattedEndDate = formatDateOnly(entry.date_end);

                          let dateDisplay;
                          if (!entry.date_end) {
                            dateDisplay = `${formattedStartDate} (En cours)`;
                          } else if (entry.date_end) {
                            dateDisplay = `${formattedStartDate} → ${formattedEndDate}`;
                          } else {
                            dateDisplay = formattedStartDate;
                          }

                          return (
                            <div key={`${intervention.id}-history-${index}`} className="text-sm">
                              <div className="flex items-center gap-2 font-semibold text-primary">
                                <User className="h-4 w-4 text-primary" />
                                <span>{entry.technician_name}</span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-normal">
                                  {dateDisplay}
                                  {entry.timestamp && (
                                    <span className="ml-1">({format(new Date(entry.timestamp), 'HH:mm', { locale: fr })})</span>
                                  )}
                                </span>
                              </div>
                              {entry.actions && (
                                <div className="text-sm p-2 bg-background rounded border mt-2">
                                  <span className="font-medium flex items-center gap-1">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    Actions :
                                  </span>
                                  {entry.actions}
                                </div>
                              )}
                              {entry.parts_used && entry.parts_used.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-muted-foreground">Pièces utilisées :</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {entry.parts_used.map((part, partIndex) => (
                                      <div key={partIndex} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        <span>{part.name}</span>
                                        <span className="opacity-75">({part.quantity})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                  {intervention.parts && Array.isArray(intervention.parts) && intervention.parts.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-muted-foreground">Pièces utilisées (global) :</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {intervention.parts.map((part, index) => (
                          part && typeof part === 'object' && 'name' in part && 'quantity' in part && (
                            <div key={index} className="inline-flex items-center gap-1 text-sm bg-secondary/50 px-3 py-1 rounded">
                              <span>{part.name}</span>
                              <span className="text-muted-foreground">({part.quantity})</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </CustomCard>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Aucune intervention enregistrée pour cet équipement.
            {hasActiveInterventionFilters && <p className="mt-2 text-sm">Ajustez les filtres pour voir plus de résultats.</p>}
          </div>
        )
      ) : (
        historyLoading ? (
          <div className="text-center p-6 border rounded-md">
            <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Chargement de l'historique des modifications...</p>
          </div>
        ) : historyError ? (
          <div className="text-center p-6 border border-destructive text-destructive rounded-md">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur lors du chargement de l'historique des modifications: {historyError.message}</p>
          </div>
        ) : equipmentHistory.length > 0 ? (
          <div className="space-y-3">
            {(() => {
              // Filtrer les entrées
              const filteredEntries = equipmentHistory.filter(entry =>
                entry.field_name !== 'general_update' &&
                entry.field_name !== 'image_url' &&
                entry.field_name !== 'imageUrl'
              );

              // Regrouper les modifications par date/heure (arrondi à la minute) et utilisateur
              const grouped: { [key: string]: typeof filteredEntries } = {};
              filteredEntries.forEach((entry) => {
                // Arrondir la date à la minute pour regrouper les modifications quasi-simultanées
                const date = new Date(entry.changed_at);
                const roundedDate = new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  date.getHours(),
                  date.getMinutes()
                );
                const key = `${roundedDate.toISOString()}_${entry.changed_by || 'unknown'}`;
                if (!grouped[key]) {
                  grouped[key] = [];
                }
                grouped[key].push(entry);
              });

              // Convertir en tableau et trier par date décroissante
              return Object.entries(grouped)
                .sort(([keyA], [keyB]) => {
                  const dateA = new Date(keyA.split('_')[0]);
                  const dateB = new Date(keyB.split('_')[0]);
                  return dateB.getTime() - dateA.getTime();
                })
                .map(([key, entries]) => {
                  const firstEntry = entries[0];
                  return (
                    <CustomCard key={key} className="p-3" variant="outline">
                      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                        <span>{formatDateTime(firstEntry.changed_at)}</span>
                        {firstEntry.changed_by && <span>Par: {firstEntry.changed_by}</span>}
                      </div>
                      <div className="space-y-2">
                        {entries.map((entry) => (
                          <p key={entry.id} className="text-sm">
                            Champ "<span className="font-medium">{getTranslatedFieldName(entry.field_name)}</span>" modifié :
                            <br />
                            De: <code className="text-xs bg-muted p-1 rounded">{formatJsonValue(entry.old_value, entry.field_name)}</code>
                            <br />
                            À: <code className="text-xs bg-muted p-1 rounded">{formatJsonValue(entry.new_value, entry.field_name)}</code>
                          </p>
                        ))}
                      </div>
                    </CustomCard>
                  );
                });
            })()}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Aucune modification enregistrée pour cet équipement.
            {hasActiveModificationFilters && <p className="mt-2 text-sm">Ajustez les filtres pour voir plus de résultats.</p>}
          </div>
        )
      )}
    </TabsContent>
  );
};

export default EquipmentHistoryView;
