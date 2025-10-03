import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomCard from '@/components/ui/CustomCard';
import { Clock, Settings, WrenchIcon, AlertTriangle, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MaintenanceTask } from '@/hooks/useMaintenance';
import { useMaintenanceInterventions } from '@/hooks/useMaintenanceInterventions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MaintenanceCardViewProps {
  maintenances: MaintenanceTask[];
  loading: boolean;
  onEdit: (maintenance: MaintenanceTask) => void;
  onDelete: (id: string) => void;
  onCreateIntervention: (maintenance: MaintenanceTask) => void;
  onContinueIntervention: (maintenance: MaintenanceTask, interventionId: string) => void;
  onNew: () => void;
}

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
        className: "bg-red-100 text-red-800 border-red-200" 
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

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${remainingMinutes}`;
};

const MaintenanceCardView: React.FC<MaintenanceCardViewProps> = ({
  maintenances,
  loading,
  onEdit,
  onDelete,
  onCreateIntervention,
  onContinueIntervention,
  onNew
}) => {
  const maintenanceIds = React.useMemo(() => {
    const ids = maintenances.map(m => m.id);
    // Ensure stable reference and order to avoid unnecessary effect triggers
    return Array.from(new Set(ids)).sort();
  }, [maintenances]);
  const { hasIntervention, getIntervention } = useMaintenanceInterventions(maintenanceIds);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chargement des maintenances...</p>
      </div>
    );
  }

  if (maintenances.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune maintenance trouvée</p>
        <Button className="mt-4" onClick={onNew}>
          Créer votre première maintenance
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {maintenances.map((maintenance) => {
        const typeBadgeInfo = getTypeBadgeInfo(maintenance.type);
        const TypeIcon = typeBadgeInfo.icon;
        
        return (
          <CustomCard key={maintenance.id} variant="default" hover className="border">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{maintenance.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {maintenance.equipment_name || 'Équipement non défini'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(maintenance)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la maintenance</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cette maintenance ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(maintenance.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {maintenance.description && (
              <p className="text-sm mb-4 text-muted-foreground">{maintenance.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className={typeBadgeInfo.className}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeBadgeInfo.label}
              </Badge>

              <Badge 
                variant="outline" 
                className={
                  maintenance.status === 'scheduled' ? "bg-purple-100 text-purple-800 border-purple-200" :
                  maintenance.status === 'in-progress' ? "bg-blue-100 text-blue-800 border-blue-200" :
                  maintenance.status === 'completed' ? "bg-green-100 text-green-800 border-green-200" :
                  "bg-red-100 text-red-800 border-red-200"
                }
              >
                <Clock className="w-3 h-3 mr-1" />
                {maintenance.status === 'scheduled' ? 'Planifiée' :
                 maintenance.status === 'in-progress' ? 'En cours' :
                 maintenance.status === 'completed' ? 'Terminée' : 'En retard'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date prévue</p>
                <p className="font-medium">
                  {format(new Date(maintenance.next_due_date), 'PPP', { locale: fr })}
                </p>
              </div>
              {maintenance.estimated_duration && (
                <div>
                  <p className="text-xs text-muted-foreground">Durée estimée</p>
                  <p className="font-medium">{formatDuration(maintenance.estimated_duration)}</p>
                </div>
              )}
              {maintenance.frequency_type && maintenance.frequency_type !== 'one-time' && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Récurrence</p>
                  <p className="font-medium">
                    {maintenance.frequency_type === 'daily' ? 'Quotidien' :
                     maintenance.frequency_type === 'weekly' ? 'Hebdomadaire' :
                     maintenance.frequency_type === 'monthly' ? 'Mensuel' :
                     maintenance.frequency_type === 'quarterly' ? 'Trimestriel' :
                     maintenance.frequency_type === 'yearly' ? 'Annuel' :
                     maintenance.custom_frequency_pattern || 'Personnalisé'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t">
              {(() => {
                const hasExistingIntervention = hasIntervention(maintenance.id);
                const existingIntervention = getIntervention(maintenance.id);
                
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (hasExistingIntervention && existingIntervention) {
                        onContinueIntervention(maintenance, existingIntervention.intervention_id);
                      } else {
                        onCreateIntervention(maintenance);
                      }
                    }}
                  >
                    {hasExistingIntervention ? (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Poursuivre intervention</span>
                      </>
                    ) : (
                      <>
                        <WrenchIcon className="h-3.5 w-3.5" />
                        <span>Créer intervention</span>
                      </>
                    )}
                  </Button>
                );
              })()}
            </div>
          </CustomCard>
        );
      })}
    </div>
  );
};

export default MaintenanceCardView;
