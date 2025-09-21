import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, WrenchIcon, AlertTriangle, Plus, Edit, Trash2, User, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MaintenanceTask } from '@/hooks/useMaintenance';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils'; // Import cn for conditional classNames

interface MaintenanceListViewProps {
  maintenances: MaintenanceTask[];
  loading: boolean;
  onEdit: (maintenance: MaintenanceTask) => void;
  onDelete: (id: string) => void;
  onCreateIntervention: (maintenance: MaintenanceTask) => void;
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

const MaintenanceListView: React.FC<MaintenanceListViewProps> = ({
  maintenances,
  loading,
  onEdit,
  onDelete,
  onCreateIntervention,
  onNew
}) => {
  const [sortColumn, setSortColumn] = useState<keyof MaintenanceTask | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof MaintenanceTask) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedMaintenances = useMemo(() => {
    let sortableMaintenances = [...maintenances];

    if (sortColumn) {
      sortableMaintenances.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortColumn === 'next_due_date' || sortColumn === 'last_completed_date' || sortColumn === 'created_at' || sortColumn === 'updated_at') {
          aValue = a[sortColumn] ? new Date(a[sortColumn] as string).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          bValue = b[sortColumn] ? new Date(b[sortColumn] as string).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        } else if (sortColumn === 'estimated_duration') {
          aValue = a[sortColumn] || (sortDirection === 'asc' ? Infinity : -Infinity);
          bValue = b[sortColumn] || (sortDirection === 'asc' ? Infinity : -Infinity);
        } else {
          aValue = a[sortColumn];
          bValue = b[sortColumn];
        }

        // Handle null/undefined values for sorting
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
    return sortableMaintenances;
  }, [maintenances, sortColumn, sortDirection]);

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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'title' && 'text-primary')}
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-1">
                Titre
                {sortColumn === 'title' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'equipment_name' && 'text-primary')}
              onClick={() => handleSort('equipment_name')}
            >
              <div className="flex items-center gap-1">
                Équipement
                {sortColumn === 'equipment_name' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'type' && 'text-primary')}
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center gap-1">
                Type
                {sortColumn === 'type' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'priority' && 'text-primary')}
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center gap-1">
                Priorité
                {sortColumn === 'priority' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'status' && 'text-primary')}
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                Statut
                {sortColumn === 'status' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'next_due_date' && 'text-primary')}
              onClick={() => handleSort('next_due_date')}
            >
              <div className="flex items-center gap-1">
                Date prévue
                {sortColumn === 'next_due_date' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th
              className={cn("text-left p-4 font-medium cursor-pointer select-none", sortColumn === 'estimated_duration' && 'text-primary')}
              onClick={() => handleSort('estimated_duration')}
            >
              <div className="flex items-center gap-1">
                Durée
                {sortColumn === 'estimated_duration' && (
                  sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
              </div>
            </th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedMaintenances.map((maintenance) => {
            const typeBadgeInfo = getTypeBadgeInfo(maintenance.type);
            const TypeIcon = typeBadgeInfo.icon;
            
            return (
              <tr key={maintenance.id} className="border-b hover:bg-muted/50">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{maintenance.title}</div>
                    {maintenance.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {maintenance.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {maintenance.equipment_name || 'Équipement non défini'}
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant="outline" className={typeBadgeInfo.className}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {typeBadgeInfo.label}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge 
                    variant="outline" 
                    className={
                      maintenance.priority === 'urgent' ? "bg-red-100 text-red-800 border-red-200" :
                      maintenance.priority === 'high' ? "bg-orange-100 text-orange-800 border-orange-200" :
                      maintenance.priority === 'medium' ? "bg-blue-100 text-blue-800 border-blue-200" :
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {maintenance.priority === 'urgent' ? 'Urgente' :
                     maintenance.priority === 'high' ? 'Élevée' :
                     maintenance.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </td>
                <td className="p-4">
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
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {format(new Date(maintenance.next_due_date), 'PPP', { locale: fr })}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {maintenance.estimated_duration ? formatDuration(maintenance.estimated_duration) : '-'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(maintenance)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => onCreateIntervention(maintenance)}
                    >
                      <WrenchIcon className="h-3.5 w-3.5" />
                      <span>Intervention</span>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceListView;
