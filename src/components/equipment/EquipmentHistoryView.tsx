import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
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
  Printer,
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
  hasActiveModificationFilters
}) => {
  const getInterventionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </Badge>
        );
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
      default:
        return null;
    }
  };

  const getInterventionTypeBadge = (type: string) => {
    switch (type) {
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
      default:
        return null;
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

  const handlePrintAllInterventions = () => {
    if (!interventions || interventions.length === 0) {
      toast({
        title: "Aucune intervention",
        description: "Il n'y a aucune intervention à imprimer pour cet équipement.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert InterventionUI to the format expected by generateInterventionsPDF
      const convertedInterventions = interventions.map(intervention => ({
        ...intervention,
        equipmentId: intervention.equipmentId || '',
        equipmentName: intervention.equipmentName || 'Équipement inconnu',
        buildingName: intervention.buildingName || '',
        createdAt: intervention.createdAt || new Date().toISOString(),
        created_at: intervention.createdAt || new Date().toISOString(),
        completedDate: intervention.completedDate || undefined,
        title: intervention.title || 'Intervention sans titre',
        type: (intervention.type as "preventive" | "corrective" | "improvement" | "regulatory") || 'corrective',
        status: (intervention.status as "in-progress" | "completed") || 'in-progress',
      }));

      generateInterventionsPDF(convertedInterventions as any, {
        equipments: [],
        printOptions: {
          includeDetails: true,
          includeTechnicians: true,
          includeParts: true,
          includeHistory: true,
          format: 'list',
        },
        filters: {}
      });

      toast({
        title: "PDF généré",
        description: `Toutes les interventions (${interventions.length}) ont été exportées en PDF.`,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF global:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF de toutes les interventions.",
        variant: "destructive",
      });
    }
  };

  const handlePrintIntervention = (intervention: any) => {
    try {
      const enrichedIntervention = enrichInterventionData(intervention);

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
          case 'planned': return 'Planifiée';
          case 'in-progress': return 'En cours d\'exécution';
          case 'completed': return 'Terminée avec succès';
          default: return status;
        }
      };

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
              <div class="field"><span class="field-label">Statut :</span> ${getInterventionStatusText(enrichedIntervention.status || 'planned')}</div>
              <div class="field"><span class="field-label">Date d'intervention :</span> ${enrichedIntervention.scheduled_date}</div>
            </div>
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

  const formatJsonValue = (value: any): string => {
    if (value === null || value === undefined) return '';

    try {
      if (typeof value === 'string') return value;
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
          {historyViewMode === 'interventions' && interventions && interventions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-auto"
              onClick={handlePrintAllInterventions}
              title="Imprimer toutes les interventions"
            >
              <Printer className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Tout imprimer
            </Button>
          )}
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
                        onClick={() => handleExportInterventionPDF(intervention)}
                        title="Exporter en PDF"
                        className="text-primary hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintIntervention(intervention)}
                        title="Imprimer"
                        className="text-primary hover:bg-primary/10"
                      >
                        <Printer className="h-4 w-4" />
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
            {equipmentHistory
              .filter(entry =>
                entry.field_name !== 'general_update' &&
                entry.field_name !== 'image_url' &&
                entry.field_name !== 'imageUrl'
              )
              .map((entry) => (
                <CustomCard key={entry.id} className="p-3" variant="outline">
                  <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                    <span>{formatDateTime(entry.changed_at)}</span>
                    {entry.changed_by && <span>Par: {entry.changed_by}</span>}
                  </div>
                  <p className="text-sm">
                    Champ "<span className="font-medium">{getTranslatedFieldName(entry.field_name)}</span>" modifié :
                    <br />
                    De: <code className="text-xs bg-muted p-1 rounded">{formatJsonValue(entry.old_value)}</code>
                    <br />
                    À: <code className="text-xs bg-muted p-1 rounded">{formatJsonValue(entry.new_value)}</code>
                  </p>
                </CustomCard>
              ))}
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
