import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, User, Wrench, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Intervention } from '@/types/intervention';
import { toast } from '@/components/ui/use-toast';

interface EquipmentInterventionHistoryProps {
  interventions: Intervention[];
}

const EquipmentInterventionHistory: React.FC<EquipmentInterventionHistoryProps> = ({
  interventions,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (interventionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(interventionId)) {
      newExpandedRows.delete(interventionId);
    } else {
      newExpandedRows.add(interventionId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Planifiée</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En cours d'exécution</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Terminée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'preventive':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Maintenance Préventive</Badge>;
      case 'corrective':
        return <Badge variant="outline" className="border-red-200 text-red-700">Maintenance Corrective</Badge>;
      case 'improvement':
        return <Badge variant="outline" className="border-purple-200 text-purple-700">Amélioration</Badge>;
      case 'regulatory':
        return <Badge variant="outline" className="border-orange-200 text-orange-700">Contrôle Réglementaire</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non renseignée';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getStatusWithDates = (intervention: Intervention) => {
    const status = intervention.status || 'in-progress';
    
    if (status === 'completed' && intervention.start_date && intervention.end_date) {
      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          <span className="text-sm text-muted-foreground">
            ({formatDate(intervention.start_date)} → {formatDate(intervention.end_date)})
          </span>
        </div>
      );
    } else if (status === 'in-progress' && intervention.start_date) {
      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          <span className="text-sm text-muted-foreground">
            (Début: {formatDate(intervention.start_date)})
          </span>
        </div>
      );
    }
    
    return getStatusBadge(status);
  };

  const handlePrintIntervention = async (intervention: Intervention) => {
    try {
      // Create a hidden iframe with the PDF content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fiche d'intervention - ${intervention.title}</title>
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
                <div class="field"><span class="field-label">ID :</span> ${intervention.id}</div>
                <div class="field"><span class="field-label">Titre :</span> ${intervention.title || 'Sans titre'}</div>
                <div class="field"><span class="field-label">Type :</span> ${intervention.type}</div>
                <div class="field"><span class="field-label">Statut :</span> ${intervention.status}</div>
                <div class="field"><span class="field-label">Date d'intervention :</span> ${formatDate(intervention.scheduled_date)}</div>
                ${intervention.start_date ? `<div class="field"><span class="field-label">Date de début :</span> ${formatDate(intervention.start_date)}</div>` : ''}
                ${intervention.end_date ? `<div class="field"><span class="field-label">Date de fin d'intervention :</span> ${formatDate(intervention.end_date)}</div>` : ''}
              </div>
              
                ${Array.isArray(intervention.technician_history) && intervention.technician_history.length > 0 ? `
                <div class="section">
                  <div class="section-title">HISTORIQUE DÉTAILLÉ</div>
                  ${Array.isArray(intervention.technician_history) ? intervention.technician_history.map((entry, i) => `
                    <div class="history-entry">
                      <div class="field-label">${i + 1}. ${(entry as any).technician_name || 'Technicien inconnu'}</div>
                      <div class="field">Période : ${(entry as any).date_start || 'Non définie'}${(entry as any).date_end ? ` → ${(entry as any).date_end}` : ' (En cours)'}</div>
                      ${(entry as any).actions ? `<div class="field">Actions : ${(entry as any).actions}</div>` : ''}
                      ${(entry as any).parts_used && (entry as any).parts_used.length > 0 ? `
                        <div class="field">Pièces utilisées :</div>
                        ${(entry as any).parts_used.map((part: any) => `<div>• ${part.name || 'Pièce inconnue'} (Quantité: ${part.quantity || 0})</div>`).join('')}
                      ` : ''}
                    </div>
                  `).join('') : ''}
                </div>
                ` : ''}
              
              <div style="margin-top: 40px; font-size: 12px; color: #666;">
                Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Wait a bit for content to load, then print
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

  if (!interventions || interventions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune intervention enregistrée pour cet équipement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des interventions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <div key={intervention.id} className="border rounded-lg p-4 space-y-3">
              {/* En-tête de l'intervention */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h4 className="font-semibold text-lg">{intervention.title || 'Intervention sans titre'}</h4>
                  {getTypeBadge(intervention.type)}
                  {getStatusWithDates(intervention)}
                </div>
                <div className="flex items-center gap-2">
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

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Date d'intervention :</span>
                  <div>{formatDate(intervention.scheduled_date)}</div>
                </div>
                {intervention.start_date && (
                  <div>
                    <span className="font-medium text-muted-foreground">Date de début :</span>
                    <div>{formatDate(intervention.start_date)}</div>
                  </div>
                )}
                {intervention.end_date && (
                  <div>
                    <span className="font-medium text-muted-foreground">Date de fin d'intervention :</span>
                    <div>{formatDate(intervention.end_date)}</div>
                  </div>
                )}
              </div>

              {/* Menu déroulant pour historique détaillé */}
              {intervention.technician_history && Array.isArray(intervention.technician_history) && (intervention.technician_history as any[]).length > 0 && (
                <div className="border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-sm font-medium"
                    onClick={() => toggleRow(intervention.id)}
                  >
                    {expandedRows.has(intervention.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    Historique détaillé ({(intervention.technician_history as any[]).length} entrée(s))
                  </Button>
                  
                  {/* Historique détaillé expandable */}
                  {expandedRows.has(intervention.id) && (
                    <div className="mt-3 space-y-3 pl-6">
                      {intervention.technician_history.map((entry, index) => (
                        <div key={`${intervention.id}-detail-${index}`} className="border border-border rounded-lg p-3 bg-muted/10">
                          <div className="flex flex-col gap-2">
                            {/* En-tête avec technicien et dates */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                 <span className="font-semibold text-primary">
                                   {(entry as any).technician_name}
                                 </span>
                               </div>
                               <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                 <Clock className="h-3 w-3" />
                                 {(entry as any).date_start}{(entry as any).date_end ? ` → ${(entry as any).date_end}` : ' (En cours)'}
                               </div>
                             </div>
                             
                             {/* Actions réalisées */}
                             <div className="space-y-1">
                               <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                 <Wrench className="h-3 w-3" />
                                 Actions réalisées :
                               </div>
                               <div className="text-sm p-2 bg-muted/30 rounded border-l-2 border-primary/30">
                                 {(entry as any).actions || 'Aucune action renseignée'}
                               </div>
                             </div>
                             
                             {/* Pièces utilisées */}
                             {(entry as any).parts_used && (entry as any).parts_used.length > 0 && (
                               <div className="space-y-1">
                                 <span className="text-xs font-medium text-muted-foreground">Pièces utilisées :</span>
                                 <div className="flex flex-wrap gap-1">
                                   {(entry as any).parts_used.map((part: any, partIndex: number) => (
                                    <div key={partIndex} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                      <span className="font-medium">{part.name}</span>
                                      <span className="text-xs opacity-75">({part.quantity})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentInterventionHistory;
