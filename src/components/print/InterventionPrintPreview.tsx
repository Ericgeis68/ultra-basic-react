import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEmptyFieldValue, getEmptyFieldValueSafe, getEmptyFieldListValue, cleanTechnicianNames } from '@/lib/print-utils';
import { 
  Printer, 
  Eye, 
  Download,
  Calendar,
  Layout,
  FileText,
  Smartphone,
  Monitor,
  User,
  Wrench,
  X
} from 'lucide-react';
import { InterventionUI } from '@/types/intervention';
import { Equipment } from '@/types/equipment';
import { ExportOptions } from '@/services/PDFExportService';
import { useSmartPrint } from '@/hooks/useSmartPrint';
import { generateInterventionsPDF } from '@/lib/intervention-print';
import { useToast } from '@/hooks/use-toast';
import InterventionPrintConfigPanel from './InterventionPrintConfigPanel';
import { useState, useEffect } from 'react';
import { useRef } from 'react';

interface InterventionPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  interventions: InterventionUI[];
  equipments: Equipment[];
}

const InterventionPrintPreview: React.FC<InterventionPrintPreviewProps> = ({
  isOpen,
  onClose,
  interventions,
  equipments
}) => {
  const {
    isPrinting,
    printOptions,
    updatePrintOptions,
    handlePrint,
    isDesktop,
    isMobile
  } = useSmartPrint();

  const { toast } = useToast();
  const [previewKey, setPreviewKey] = useState(0);

  // Force re-render when orientation or page size changes
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [printOptions.orientation, printOptions.pageSize, printOptions.format, printOptions.gridSize]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifiée';
      case 'in_progress': return 'En cours';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e'; // green-500
      case 'in-progress':
      case 'in_progress':
        return '#3b82f6'; // blue-500
      case 'scheduled':
        return '#a855f7'; // purple-500
      case 'overdue':
        return '#ef4444'; // red-500
      case 'cancelled':
        return '#6b7280'; // gray-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'corrective': return 'Corrective';
      case 'correctives': return 'Corrective';
      case 'preventive': return 'Préventive';
      case 'preventives': return 'Préventive';
      case 'predictive': return 'Prédictive';
      case 'predictives': return 'Prédictive';
      case 'emergency': return 'Urgence';
      case 'emergencies': return 'Urgence';
      default: return type;
    }
  };

  const getEquipmentName = (equipmentId: string | undefined) => {
    if (!equipmentId) return '\u00A0\u00A0\u00A0';
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment?.name || '\u00A0\u00A0\u00A0';
  };

  const getUniqueTechniciansFromHistory = (intervention: any): string => {
    const history = intervention?.technician_history || [];
    if (!Array.isArray(history) || history.length === 0) {
      return 'Aucun technicien assigné';
    }

    const cleanedNames = history
      .map((entry: any) => entry?.technician_name)
      .filter((name: any) => typeof name === 'string' && name.trim() !== '')
      .map((name: string) => {
        const trimmed = name.trim();
        return trimmed.startsWith('ID:') ? trimmed.substring(3).trim() : trimmed;
      });

    const unique = Array.from(new Set(cleanedNames));
    return unique.length > 0 ? unique.join(', ') : 'Aucun technicien assigné';
  };

  const getPageDimensions = () => {
    switch (printOptions.pageSize) {
      case 'a3':
        return { width: 297, height: 420 };
      case 'letter':
        return { width: 216, height: 279 };
      case 'legal':
        return { width: 216, height: 356 };
      case 'custom':
        return { 
          width: printOptions.customPageWidth || 210, 
          height: printOptions.customPageHeight || 297 
        };
      case 'a4':
      default:
        return { width: 210, height: 297 };
    }
  };

  const getPreviewWidth = () => {
    const dimensions = getPageDimensions();
    const width = printOptions.orientation === 'landscape' ? dimensions.height : dimensions.width;
    return `${width * 3.78}px`;
  };

  const getPreviewHeight = () => {
    const dimensions = getPageDimensions();
    const height = printOptions.orientation === 'landscape' ? dimensions.width : dimensions.height;
    return `${height * 3.78}px`;
  };

  const getItemsPerPage = () => {
    const boost = printOptions.orientation === 'landscape' ? 1.3 : 1;
    if (printOptions.format === 'list') {
      let base: number;
      switch (printOptions.pageSize) {
        case 'a3': base = 20; break;
        case 'letter': base = 15; break;
        case 'legal': base = 18; break;
        default: base = 15; // A4
      }
      return Math.ceil(base * boost);
    } else {
      let base: number;
      switch (printOptions.gridSize) {
        case 'small': base = 8; // 2 lignes × 4 colonnes = 8 cartes
        case 'medium': base = printOptions.pageSize === 'a3' ? 8 : 6; break;
        case 'large': base = printOptions.pageSize === 'a3' ? 4 : 3; break;
        case 'xlarge': base = printOptions.pageSize === 'a3' ? 2 : 1; break;
        case 'single': base = 1; break;
        default: base = 6;
      }
      return Math.ceil(base * boost);
    }
  };

  const getItemsPerPageForGridSize = (gridSize: ExportOptions['gridSize']) => {
    const boost = printOptions.orientation === 'landscape' ? 1.3 : 1;
    let base: number;
    switch (gridSize) {
      case 'small': base = 8; // 2 lignes × 4 colonnes = 8 cartes
      case 'medium': base = printOptions.pageSize === 'a3' ? 8 : 6; break;
      case 'large': base = printOptions.pageSize === 'a3' ? 4 : 3; break;
      case 'xlarge': base = printOptions.pageSize === 'a3' ? 2 : 1; break;
      case 'single': base = 1; break;
      default: base = 6;
    }
    return Math.ceil(base * boost);
  };

  // Scaler pour la carte unique: dimensions fixes qui s'adaptent à la page
  const SingleCardScaler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <div 
        className="h-[85vh] pt-2 pb-2 px-3 overflow-auto flex items-start justify-center" 
        style={{ height: '85vh' }}
      >
        <div 
          className="intervention-card border rounded-lg bg-white shadow-sm"
          style={{
            width: 'calc(100vw - 2rem)', // Largeur qui occupe 100% de l'écran moins les marges
            maxWidth: 'calc(100vw - 2rem)', // Largeur maximale moins les marges
            height: 'auto', // Hauteur automatique pour s'adapter au contenu
            minHeight: 'calc(85vh - 1rem)', // Hauteur minimale moins les marges
            overflow: 'visible', // Permettre au contenu de s'afficher entièrement
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  const renderPaginatedPreview = () => {
    const itemsPerPage = getItemsPerPage();
    const pages = [];
    let currentPageInterventions: InterventionUI[] = [];
    let currentPageIndex = 0;

    // Algorithme intelligent de pagination qui vérifie la hauteur réelle des cartes
    for (let i = 0; i < interventions.length; i++) {
      const intervention = interventions[i];
      
      // Vérifier si ajouter cette intervention dépasserait la limite de la page
      if (currentPageInterventions.length >= itemsPerPage) {
        // Créer la page actuelle
        pages.push(createPage(currentPageIndex, currentPageInterventions, pages.length + 1));
        
        // Commencer une nouvelle page avec cette intervention
        currentPageInterventions = [intervention];
        currentPageIndex++;
      } else {
        // Ajouter l'intervention à la page actuelle
        currentPageInterventions.push(intervention);
      }
    }

    // Ajouter la dernière page s'il reste des interventions
    if (currentPageInterventions.length > 0) {
      pages.push(createPage(currentPageIndex, currentPageInterventions, pages.length + 1));
    }

    return pages;
  };

  const createPage = (pageIndex: number, pageInterventions: InterventionUI[], totalPages: number) => {
    return (
        <div 
          key={pageIndex}
          className="bg-white border-2 border-gray-300 rounded-lg shadow-lg mx-auto print-page"
          style={{
            width: getPreviewWidth(),
            minHeight: getPreviewHeight(),
            maxWidth: 'none',
          overflow: 'visible'
          }}
        >
          {/* Numéro de page en haut à droite */}
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium print:hidden">
            Page {pageIndex + 1} sur {totalPages}
          </div>
          
        <div className="p-6 relative" style={{ minHeight: getPreviewHeight(), overflow: 'visible' }}>
            <div id={pageIndex === 0 ? "intervention-print-preview" : `intervention-print-preview-page-${pageIndex + 1}`} className="print-content" style={{ minHeight: 'auto', height: 'auto' }}>
              
              {/* En-tête seulement sur la première page */}
              {/* Page content with margins */}
              <div className="mt-8 mb-8">
                {pageIndex === 0 && printOptions.showHeaders && (
                  <div className="print-header border-b-2 border-gray-300 mb-6 pb-4">
                    <h1 className="text-2xl font-bold text-center">{printOptions.title || 'Liste des interventions'}</h1>
                  </div>
                )}
                
              {/* Contenu de la page avec vérification de hauteur */}
              <div style={{ 
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                height: 'auto',
                maxHeight: '100%',
                overflow: 'visible'
              }}>
                {renderInterventionPreviewForPage(pageInterventions)}
              </div>
              </div>
              
              {/* Pied de page désactivé par défaut */}
              
              {/* Numéro de page en bas au centre */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 print:block">
                {pageIndex + 1} / {totalPages}
              </div>
            </div>
          </div>
        </div>
      );
  };

  const renderInterventionPreviewForPage = (pageInterventions: InterventionUI[]) => {
    if (printOptions.format === 'list') {
      return (
        <div className="intervention-list space-y-4">
          {pageInterventions.map((intervention, index) => (
            <div
              key={intervention.id}
              className="intervention-list-item border border-gray-200 rounded-lg bg-white p-4"
              style={{ 
                breakInside: 'avoid', 
                pageBreakInside: 'avoid',
                borderLeft: `4px solid ${getStatusColor(intervention.status || 'scheduled')}`
              }}
            >
              {/* En-tête avec titre et badge statut */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-gray-900 mb-1">
                    {getEmptyFieldValue(intervention.title, 'Intervention sans titre')}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {getTypeText(intervention.type)}
                    </Badge>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(intervention.status || 'scheduled')}`}>
                      {getStatusText(intervention.status || 'scheduled')}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                    {(() => { const d = new Date(intervention.scheduled_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {/* Dates */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-700">Dates</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 ml-5">
                    <p><strong>Date d'intervention:</strong> {(() => { const d = new Date(intervention.scheduled_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                    {intervention.start_date && (
                      <p><strong>Date de début:</strong> {(() => { const d = new Date(intervention.start_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                    )}
                    {intervention.completed_date && (
                      <p><strong>Date de fin:</strong> {(() => { const d = new Date(intervention.completed_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                    )}
                  </div>
                </div>

                {/* Techniciens */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-700">Techniciens</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-5">
                    <p>{getUniqueTechniciansFromHistory(intervention)}</p>
                  </div>
                </div>
              </div>

              {/* Équipement */}
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm text-gray-700">Détails</span>
                </div>
                <div className="text-sm text-gray-600 ml-5">
                  <p><strong>Équipement:</strong> {getEquipmentName(intervention.equipment_id)}</p>
                </div>
              </div>

              {/* Actions réalisées */}
              {intervention.actions && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-700">Actions réalisées</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-5 bg-gray-50 p-3 rounded border">
                    <p className="whitespace-pre-wrap break-words">{intervention.actions}</p>
                  </div>
                </div>
              )}

              {/* Historique des interventions si inclus */}
              {(printOptions as any).includeHistory && intervention.technician_history && intervention.technician_history.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-700">Historique des interventions</span>
                  </div>
                  <div className="ml-5 space-y-2">
                    {intervention.technician_history.map((entry, historyIndex) => (
                      <div key={historyIndex} className="border-l-2 border-blue-200 pl-3 bg-blue-50 p-2 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-blue-800">{entry.technician_name}</span>
                          <span className="text-xs text-gray-500">
                            {(() => { const d = new Date(entry.date_start); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}
                            {entry.date_end && ` (${(() => { const d = new Date(entry.date_end); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()})`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          <strong>Actions:</strong> {entry.actions}
                        </div>
                        {entry.parts_used && entry.parts_used.length > 0 && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Pièces:</strong> {entry.parts_used.map(p => `${p.name} (${p.quantity})`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                  )}

              {/* Actions - Boutons Modifier, Supprimer, Export PDF */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {/* Logique de modification */}}
                  >
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {/* Logique de suppression */}}
                  >
                    Supprimer
                  </Button>
                  <Button 
                    onClick={handleGeneratePDF}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
              ))}
        </div>
      );
    }

    const getGridClass = () => {
      switch (printOptions.gridSize) {
        case 'single': return 'flex justify-center items-center';
        case 'small': return 'grid grid-cols-4 grid-rows-2'; // 4 colonnes et 2 lignes = 8 cartes
        case 'medium': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // 3 par ligne en large
        case 'large': return 'grid grid-cols-1 md:grid-cols-2'; // 2 par ligne
        case 'xlarge': return 'grid grid-cols-1'; // 1 par ligne
        default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      }
    };

    const getCardHeight = () => {
      switch (printOptions.gridSize) {
        case 'small': return 'auto'; // Hauteur automatique pour s'adapter au contenu
        case 'medium': return 'auto'; // Hauteur automatique pour s'adapter au contenu
        case 'large': return 'auto'; // Hauteur automatique pour s'adapter au contenu
        case 'xlarge': return 'auto'; // Hauteur automatique pour s'adapter au contenu
        default: return 'auto';
      }
    };

    return (
      <div className={`${getGridClass()} gap-4`} style={{ 
        breakInside: 'avoid',
        pageBreakInside: 'avoid'
      }}>
        {pageInterventions.map((intervention) => (
          <div
            key={intervention.id}
            className={`${printOptions.gridSize === 'single' ? '' : 'intervention-card border rounded-lg bg-white shadow-sm'}`}
            style={{ 
              breakInside: 'avoid', 
              pageBreakInside: 'avoid', 
              breakAfter: 'auto',
              breakBefore: 'auto',
              overflow: 'visible', // Permettre le débordement pour les cartes single
              width: '100%',
              height: 'auto', // Hauteur automatique pour toutes les cartes
              display: 'flex',
              flexDirection: 'column',
              // Forcer l'évitement des coupures
              orphans: 2,
              widows: 2
            }}
          >
            {printOptions.gridSize === 'single' ? (
              <SingleCardScaler>
                {/* Header avec titre et statut */}
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base">{getEmptyFieldValue(intervention.title, 'Intervention sans titre')}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(intervention.status || 'scheduled')}`}>
                      {getStatusText(intervention.status || 'scheduled')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {getTypeText(intervention.type)}
                    </Badge>
                  </div>
                </div>

                {/* Contenu organisé en sections */}
                <div className="px-4 pb-4 space-y-3 flex-1" style={{ minHeight: '0' }}>
                  {/* Informations de base */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">Informations générales</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Équipement:</strong> {getEquipmentName(intervention.equipment_id)}</p>
                      <p><strong>Date d'intervention:</strong> {(() => { const d = new Date(intervention.scheduled_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                      {intervention.start_date && (
                        <p><strong>Date de début:</strong> {(() => { const d = new Date(intervention.start_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                      )}
                      {intervention.completed_date && (
                        <p><strong>Date de fin:</strong> {(() => { const d = new Date(intervention.completed_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}</p>
                      )}
                    </div>
                  </div>

                  {/* Techniciens */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Techniciens
                    </h4>
                    <div className="text-sm">
                      <p>{getUniqueTechniciansFromHistory(intervention)}</p>
                    </div>
                  </div>

                  {/* Historique des actions si inclus */}
                  {(printOptions as any).includeHistory && intervention.technician_history && intervention.technician_history.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Historique des actions
                        </h4>
                      <div className="text-sm space-y-3">
                        {intervention.technician_history.map((entry, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-3">
                            <div className="font-medium text-gray-800 break-words">{entry.technician_name}</div>
                            <div className="text-gray-600 break-words whitespace-pre-wrap" style={{
                              fontSize: '14px',
                              lineHeight: '1.4',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'break-word'
                            }}>{entry.actions}</div>
                            <div className="text-gray-500 text-xs">
                              {(() => { const d = new Date(entry.date_start); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}
                              {entry.date_end && ` - ${(() => { const d = new Date(entry.date_end); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}`}
                            </div>
                            {entry.parts_used && entry.parts_used.length > 0 && (
                              <div className="text-gray-600 mt-2 break-words" style={{
                                fontSize: '14px',
                                lineHeight: '1.3',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word'
                              }}>
                                Pièces: {entry.parts_used.map(p => `${p.name} (${p.quantity})`).join(', ')}
                              </div>
                            )}
                        </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pièces utilisées */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">Pièces utilisées</h4>
                    <div className="text-sm">
                      {intervention.parts && intervention.parts.length > 0 ? (
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {intervention.parts.map((part, index) => (
                            <li key={index}>
                              {part.name} (Qté: {part.quantity})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Aucune pièce utilisée</p>
                      )}
                    </div>
                  </div>
                </div>
              </SingleCardScaler>
            ) : (
              <>
                {/* Header avec titre et statut */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">{getEmptyFieldValue(intervention.title, 'Intervention sans titre')}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(intervention.status || 'scheduled')}`}>
                  {getStatusText(intervention.status || 'scheduled')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {getTypeText(intervention.type)}
                </Badge>
              </div>
            </div>

            {/* Contenu organisé en sections */}
            <div className="px-4 pb-4 space-y-3 flex-1" style={{ minHeight: '0' }}>
              {/* Informations de base */}
              <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Informations générales</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Équipement:</strong> {getEquipmentName(intervention.equipment_id)}</p>
                  <p><strong>Date d'intervention:</strong> {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR')}</p>
                  {intervention.start_date && (
                    <p><strong>Date de début:</strong> {new Date(intervention.start_date).toLocaleDateString('fr-FR')}</p>
                  )}
                  {intervention.completed_date && (
                    <p><strong>Date de fin:</strong> {new Date(intervention.completed_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>

              {/* Techniciens */}
              <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Techniciens
                </h4>
                <div className="text-sm">
                  <p>{getUniqueTechniciansFromHistory(intervention)}</p>
                </div>
              </div>

              {/* Historique des actions si inclus */}
              {(printOptions as any).includeHistory && intervention.technician_history && intervention.technician_history.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Historique des actions
                    </h4>
                  <div className="text-sm space-y-3">
                    {intervention.technician_history.map((entry, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-3">
                        <div className="font-medium text-gray-800 break-words">{entry.technician_name}</div>
                        <div className="text-gray-600 break-words whitespace-pre-wrap" style={{
                          fontSize: '14px', // Taille augmentée pour les cartes de grille
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'break-word',
                          maxHeight: '80px', // Hauteur réduite pour s'adapter aux cartes fixes
                          overflow: 'hidden' // Masquer le débordement
                        }}>{entry.actions}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(entry.date_start).toLocaleDateString('fr-FR')}
                          {entry.date_end && ` - ${new Date(entry.date_end).toLocaleDateString('fr-FR')}`}
                        </div>
                        {entry.parts_used && entry.parts_used.length > 0 && (
                          <div className="text-gray-600 mt-2 break-words" style={{
                            fontSize: '14px', // Taille augmentée pour les cartes de grille
                            lineHeight: '1.3',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            maxHeight: '40px', // Hauteur réduite pour s'adapter aux cartes fixes
                            overflow: 'hidden' // Masquer le débordement
                          }}>
                            Pièces: {entry.parts_used.map(p => `${p.name} (${p.quantity})`).join(', ')}
                          </div>
                        )}
                    </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces utilisées */}
              <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Pièces utilisées</h4>
                <div className="text-sm">
                  {intervention.parts && intervention.parts.length > 0 ? (
                    <ul className="list-disc list-inside ml-3 space-y-1">
                      {intervention.parts.map((part, index) => (
                        <li key={index}>
                          {part.name} (Qté: {part.quantity})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucune pièce utilisée</p>
                  )}
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleGeneratePDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // Récupérer chaque page d'aperçu séparément pour respecter l'orientation et la pagination
      const pageElements = Array.from(
        document.querySelectorAll('#intervention-print-preview, [id^="intervention-print-preview-page-"]')
      ) as HTMLElement[];
      if (!pageElements || pageElements.length === 0) {
        throw new Error('Aucune page d\'aperçu trouvée');
      }

      // Créer le PDF avec l'orientation et le format sélectionnés
      const pdf = new jsPDF({
        orientation: printOptions.orientation || 'portrait',
        unit: 'mm',
        format: printOptions.pageSize === 'a3' ? 'a3' : 
               printOptions.pageSize === 'letter' ? [216, 279] :
               printOptions.pageSize === 'legal' ? [216, 356] : 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        const element = pageElements[i];

        // Canvas pour chaque page, en haute résolution
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;

        // Conversion px -> mm (approx 96 dpi -> 25.4 mm/in)
        const pxToMm = 0.264583;
        const imgWidthMm = imgWidthPx * pxToMm;
        const imgHeightMm = imgHeightPx * pxToMm;

        // Adapter l'image à la page en respectant l'orientation
        const scale = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm);
        const renderWidth = imgWidthMm * scale;
        const renderHeight = imgHeightMm * scale;
        const x = (pdfWidth - renderWidth) / 2;
        const y = (pdfHeight - renderHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight);
      }

      const fileName = `interventions_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF généré",
        description: `Le PDF des interventions (${interventions.length}) a été téléchargé.`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF des interventions.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>Aperçu PDF - Interventions</span>
              <span className="text-sm font-normal text-muted-foreground">
                Système d'optimisation automatique de disposition
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleGeneratePDF}
                disabled={isPrinting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isPrinting ? 'Export...' : 'Télécharger PDF'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose} className="md:hidden">
                Fermer
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="hidden md:inline-flex">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Panneau de configuration */}
          <InterventionPrintConfigPanel
            options={printOptions as any}
            onOptionsChange={updatePrintOptions}
          />
          
          {/* Aperçu */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50">
            <div className="bg-white shadow-sm border">
              <div 
                id="intervention-print-preview-root"
                key={`intervention-preview-${previewKey}-${printOptions.orientation}-${printOptions.pageSize}`}
                className="space-y-8 min-w-max"
              >
                {renderPaginatedPreview()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bouton fermer persistant en bas sur mobile */}
        <div className="md:hidden sticky bottom-0 bg-background border-t p-3">
          <Button onClick={onClose} className="w-full">Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterventionPrintPreview;
