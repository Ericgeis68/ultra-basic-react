import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEmptyFieldValue, getEmptyFieldValueSafe, getEmptyFieldListValue, cleanTechnicianNames } from '@/lib/print-utils';
import { 
  Printer, 
  Download,
  Calendar,
  User,
  Wrench,
  Tag,
  Eye,
  Monitor,
  Smartphone,
  Clock
} from 'lucide-react';
import { InterventionUI } from '@/types/intervention';
import { Equipment } from '@/types/equipment';
import { useSmartPrint } from '@/hooks/useSmartPrint';
import { useToast } from '@/hooks/use-toast';

interface SingleInterventionPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: InterventionUI;
  equipment: Equipment | null;
}

const SingleInterventionPrintPreview: React.FC<SingleInterventionPrintPreviewProps> = ({
  isOpen,
  onClose,
  intervention,
  equipment
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

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Haute';
      default: return 'Non définie';
    }
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

  const getBorderStyle = () => {
    const printStyle = printOptions.printStyle || 'professional';
    switch (printStyle) {
      case 'minimal':
        return {
          sectionBorder: 'border border-gray-300',
          tableBorder: 'border border-gray-300',
          headerBorder: 'border-b border-gray-300',
          padding: 'p-3'
        };
      case 'classic':
        return {
          sectionBorder: '',
          tableBorder: 'border border-gray-300',
          headerBorder: 'border-b-2 border-gray-400',
          padding: 'p-4'
        };
      case 'professional':
      default:
        return {
          sectionBorder: 'border-2 border-gray-400',
          tableBorder: 'border-2 border-gray-400',
          headerBorder: 'border-b border-gray-300',
          padding: 'p-4'
        };
    }
  };

  const renderInterventionPreview = () => {
    const borderStyle = getBorderStyle();
    
    // Utiliser le même format que l'export global des interventions
    if (printOptions.format === 'list') {
      return (
        <div 
          className="bg-white border-2 border-gray-300 rounded-lg shadow-lg mx-auto print-page"
          style={{
            width: getPreviewWidth(),
            minHeight: getPreviewHeight(),
            maxWidth: 'none'
          }}
        >
          <div className="p-6 h-full relative" style={{ minHeight: getPreviewHeight() }}>
            <div id="single-intervention-print-preview" className="print-content h-full">
              
              {/* En-tête seulement si activé */}
              {printOptions.showHeaders && (
                <div className="print-header border-b-2 border-gray-300 mb-6 pb-4">
                  <h1 className="text-2xl font-bold">{printOptions.title || 'Fiche d\'intervention'}</h1>
                </div>
              )}
              
              {/* Tableau au format liste comme l'export global */}
              <div className="intervention-list">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Titre</th>
                      <th className="border border-gray-300 p-2 text-left">Type</th>
                      <th className="border border-gray-300 p-2 text-left">Équipement</th>
                      <th className="border border-gray-300 p-2 text-left">Statut</th>
                      <th className="border border-gray-300 p-2 text-left">Date d'intervention</th>
                      {printOptions.includeDetails && <th className="border border-gray-300 p-2 text-left">Description</th>}
                      {printOptions.includeDetails && <th className="border border-gray-300 p-2 text-left">Actions</th>}
                      <th className="border border-gray-300 p-2 text-left">Techniciens</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="intervention-item">
                      <td className="border border-gray-300 p-2">{getEmptyFieldValue(intervention.title, 'Sans titre')}</td>
                      <td className="border border-gray-300 p-2">{getTypeText(intervention.type)}</td>
                      <td className="border border-gray-300 p-2">{equipment?.name || '\u00A0\u00A0\u00A0'}</td>
                      <td className="border border-gray-300 p-2">
                        <span className="status-badge">{getStatusText(intervention.status || 'scheduled')}</span>
                      </td>
                      <td className="border border-gray-300 p-2">
                        {intervention.scheduled_date ? new Date(intervention.scheduled_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </td>
                      {printOptions.includeDetails && <td className="border border-gray-300 p-2 max-w-xs break-words whitespace-pre-wrap">{getEmptyFieldValue(intervention.actions)}</td>}
                      <td className="border border-gray-300 p-2">
                        {cleanTechnicianNames(intervention.technicians)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
            </div>
          </div>
        </div>
      );
    }

    // Format grille (cartes) - carte unique qui occupe toute la page
    return (
      <div 
        className="bg-white border-2 border-gray-300 rounded-lg shadow-lg mx-auto print-page"
        style={{
          width: getPreviewWidth(),
          minHeight: getPreviewHeight(),
          maxWidth: 'none'
        }}
      >
        <div className="p-6 h-full relative" style={{ minHeight: getPreviewHeight() }}>
          <div id="single-intervention-print-preview" className="print-content h-full">
            
            
            {/* Carte unique qui occupe toute la page */}
            <div className="h-full flex flex-col">
              <div className="intervention-card border rounded-lg bg-white shadow-sm flex-1 flex flex-col">
                {/* Titre principal */}
                <div className="text-center p-6 pb-4 border-b border-gray-200">
                  <h1 className="font-bold text-3xl text-black">Rapport d'intervention</h1>
                </div>

                {/* Contenu organisé en sections - optimisé pour impression N&B */}
                <div className="p-6 flex-1 space-y-6">
                  

                  {/* Informations de base */}
                  <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                    <h4 className={`font-bold text-lg text-black mb-3 flex items-center gap-2 ${borderStyle.headerBorder} pb-2`}>
                      <Calendar className="h-5 w-5" />
                      INFORMATIONS GÉNÉRALES
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><strong>Équipement:</strong> {equipment?.name || '\u00A0\u00A0\u00A0'}</p>
                        <p><strong>Modèle:</strong> {equipment?.model || '\u00A0\u00A0\u00A0'}</p>
                        <p><strong>N° de série:</strong> {equipment?.serial_number || '\u00A0\u00A0\u00A0'}</p>
                        {intervention.priority && (
                          <p><strong>Priorité:</strong> {getPriorityText(intervention.priority)}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p><strong>Date d'intervention:</strong> {intervention.scheduled_date ? new Date(intervention.scheduled_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                        {intervention.start_date && (
                          <p><strong>Date de début:</strong> {new Date(intervention.start_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        {intervention.completed_date && (
                          <p><strong>Date de fin:</strong> {new Date(intervention.completed_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        {intervention.duration && (
                          <p><strong>Durée:</strong> {intervention.duration} minutes</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Techniciens */}
                  <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                    <h4 className={`font-bold text-lg text-black mb-3 flex items-center gap-2 ${borderStyle.headerBorder} pb-2`}>
                      <User className="h-5 w-5" />
                      TECHNICIENS ASSIGNÉS
                    </h4>
                    <div className="text-sm">
                      <p>{cleanTechnicianNames(intervention.technicians)}</p>
                    </div>
                  </div>

                  {/* Actions réalisées si incluses */}
                  {printOptions.includeDetails && (
                    <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                      <h4 className={`font-bold text-lg text-black mb-3 flex items-center gap-2 ${borderStyle.headerBorder} pb-2`}>
                        <Wrench className="h-5 w-5" />
                        ACTIONS RÉALISÉES
                      </h4>
                      <div className="text-sm">
                        <p className="whitespace-pre-wrap">{getEmptyFieldValue(intervention.actions, 'Aucune action renseignée')}</p>
                      </div>
                    </div>
                  )}

                  {/* Pièces utilisées */}
                  <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                    <h4 className={`font-bold text-lg text-black mb-3 flex items-center gap-2 ${borderStyle.headerBorder} pb-2`}>
                      <Tag className="h-5 w-5" />
                      PIÈCES UTILISÉES
                    </h4>
                    <div className="text-sm">
                      {intervention.parts && intervention.parts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className={`w-full border-collapse ${borderStyle.tableBorder}`}>
                            <thead>
                              <tr className="bg-gray-200">
                                <th className={`${borderStyle.tableBorder} ${borderStyle.padding} text-left font-bold`}>Nom</th>
                                <th className={`${borderStyle.tableBorder} ${borderStyle.padding} text-left font-bold`}>Quantité</th>
                                <th className={`${borderStyle.tableBorder} ${borderStyle.padding} text-left font-bold`}>Prix unitaire</th>
                                <th className={`${borderStyle.tableBorder} ${borderStyle.padding} text-left font-bold`}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {intervention.parts.map((part, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className={`${borderStyle.tableBorder} ${borderStyle.padding}`}>{part.name}</td>
                                  <td className={`${borderStyle.tableBorder} ${borderStyle.padding}`}>{part.quantity}</td>
                                  <td className={`${borderStyle.tableBorder} ${borderStyle.padding}`}>{part.unit_price ? `${part.unit_price}€` : '-'}</td>
                                  <td className={`${borderStyle.tableBorder} ${borderStyle.padding} font-semibold`}>
                                    {part.unit_price && part.quantity ? `${(Number(part.unit_price) * Number(part.quantity)).toFixed(2)}€` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-600 italic">Aucune pièce utilisée</p>
                      )}
                    </div>
                  </div>

                  {/* Historique des interventions */}
                  {intervention.technician_history && intervention.technician_history.length > 0 && (
                    <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                      <h4 className={`font-bold text-lg text-black mb-3 flex items-center gap-2 ${borderStyle.headerBorder} pb-2`}>
                        <Clock className="h-5 w-5" />
                        HISTORIQUE DES INTERVENTIONS
                      </h4>
                      <div className="space-y-3">
                        {intervention.technician_history.map((entry: any, index: number) => (
                          <div key={index} className={`${borderStyle.tableBorder} ${borderStyle.padding} rounded-lg bg-gray-50`}>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-sm text-blue-600">
                                {entry.technician_name || 'Technicien inconnu'}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                {entry.date_start ? new Date(entry.date_start).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                {entry.date_end ? 
                                  (entry.date_start && new Date(entry.date_start).toLocaleDateString('fr-FR') === new Date(entry.date_end).toLocaleDateString('fr-FR') ? 
                                    ' (Terminée)' : 
                                    ` → ${new Date(entry.date_end).toLocaleDateString('fr-FR')}`) : 
                                  ' (En cours)'}
                              </span>
                            </div>
                            {entry.actions && (
                              <div className="text-sm text-gray-700 mb-2">
                                <span className="font-medium">Actions:</span> {entry.actions}
                              </div>
                            )}
                            {entry.parts_used && entry.parts_used.length > 0 && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Pièces utilisées:</span>
                                <div className="mt-1">
                                  {entry.parts_used.map((part: any, partIndex: number) => (
                                    <span key={partIndex} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                                      {part.name} ({part.quantity})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes et observations */}
                  {printOptions.includeDetails && intervention.notes && (
                    <div className={`${borderStyle.sectionBorder} ${borderStyle.padding} rounded-lg`}>
                      <h4 className={`font-bold text-lg text-black mb-3 ${borderStyle.headerBorder} pb-2`}>
                        NOTES ET OBSERVATIONS
                      </h4>
                      <div className="text-sm">
                        <p className="whitespace-pre-wrap">{intervention.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  };

  const handleConfirmPrint = () => {
    handlePrint('single-intervention-print-preview-root');
  };

  const handleGeneratePDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const previewElement = document.getElementById('single-intervention-print-preview-root');
      if (!previewElement) {
        throw new Error('Élément d\'aperçu non trouvé');
      }

      // Créer une capture de l'aperçu avec une résolution plus élevée
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: previewElement.scrollWidth,
        height: previewElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Créer le PDF avec les mêmes dimensions que l'aperçu
      const pdf = new jsPDF({
        orientation: printOptions.orientation || 'portrait',
        unit: 'mm',
        format: printOptions.pageSize === 'a3' ? 'a3' : 
               printOptions.pageSize === 'letter' ? [216, 279] :
               printOptions.pageSize === 'legal' ? [216, 356] : 'a4'
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
      
      const fileName = `intervention_${intervention.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF généré",
        description: `Le PDF de l'intervention "${intervention.title}" a été téléchargé.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu avant impression - {intervention.title || 'Intervention'}
            <Badge variant="outline" className="ml-2">
              {isDesktop ? (
                <>
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </>
              ) : (
                <>
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile
                </>
              )}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Aperçu de l'intervention avant impression ou export PDF
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-6">
          <div className="h-full bg-gray-100 p-6 overflow-auto">
            <div id="single-intervention-print-preview-root" className="min-w-max">
              {renderInterventionPreview()}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Intervention ID: {intervention.id}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                variant="secondary"
                onClick={handleGeneratePDF}
                disabled={isPrinting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isPrinting ? 'Génération PDF...' : 'Télécharger PDF'}
              </Button>
              <Button 
                onClick={handleConfirmPrint}
                disabled={isPrinting}
                className="flex items-center gap-2"
              >
                {isPrinting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Impression...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    Imprimer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SingleInterventionPrintPreview;
