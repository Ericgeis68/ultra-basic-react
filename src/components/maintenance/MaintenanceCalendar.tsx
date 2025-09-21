import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import CustomCard from '@/components/ui/CustomCard';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Settings, WrenchIcon, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceEvent {
  id: string;
  title: string;
  type: 'preventive' | 'corrective' | 'regulatory' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  next_due_date: string;
  equipment_name?: string;
  estimated_duration?: number;
}

interface MaintenanceCalendarProps {
  maintenances: MaintenanceEvent[];
  selectedDate?: Date;
  onDateSelect?: (date: Date | undefined) => void;
  onMaintenanceClick?: (maintenance: MaintenanceEvent) => void;
}

const typeIcons = {
  preventive: Settings,
  corrective: WrenchIcon,
  regulatory: AlertTriangle,
  improvement: Plus
};

const typeColors = {
  preventive: "bg-blue-100 text-blue-800 border-blue-200",
  corrective: "bg-red-100 text-red-800 border-red-200",
  regulatory: "bg-yellow-100 text-yellow-800 border-yellow-200",
  improvement: "bg-green-100 text-green-800 border-green-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200"
};

const statusColors = {
  scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  'in-progress': "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200"
};

const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  maintenances,
  selectedDate,
  onDateSelect,
  onMaintenanceClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get maintenances for selected date
  const selectedDateMaintenances = useMemo(() => {
    if (!selectedDate) return [];
    return maintenances.filter(maintenance => 
      isSameDay(new Date(maintenance.next_due_date), selectedDate)
    );
  }, [maintenances, selectedDate]);

  // Create calendar day modifiers
  const modifiers = useMemo(() => {
    const maintenanceDates = maintenances.map(m => new Date(m.next_due_date));
    return {
      maintenance: maintenanceDates,
      overdue: maintenances
        .filter(m => m.status === 'overdue')
        .map(m => new Date(m.next_due_date)),
      high_priority: maintenances
        .filter(m => m.priority === 'urgent' || m.priority === 'high')
        .map(m => new Date(m.next_due_date))
    };
  }, [maintenances]);

  const modifiersStyles = {
    maintenance: {
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      border: '1px solid hsl(var(--primary) / 0.3)',
      borderRadius: '4px'
    },
    overdue: {
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      border: '1px solid hsl(var(--destructive) / 0.3)',
      borderRadius: '4px',
      color: 'hsl(var(--destructive))'
    },
    high_priority: {
      backgroundColor: 'hsl(var(--destructive) / 0.2)',
      border: '2px solid hsl(var(--destructive))',
      borderRadius: '4px'
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h${remainingMinutes}`;
  };

  const getMaintenancesForDate = (date: Date) => {
    return maintenances.filter(maintenance => 
      isSameDay(new Date(maintenance.next_due_date), date)
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <CustomCard className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Calendrier des maintenances</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border" style={modifiersStyles.maintenance}></div>
                <span>Maintenance planifiée</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border" style={modifiersStyles.high_priority}></div>
                <span>Priorité élevée/urgente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border" style={modifiersStyles.overdue}></div>
                <span>En retard</span>
              </div>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={fr}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="pointer-events-auto"
            components={{
              DayContent: ({ date }) => {
                const dayMaintenances = getMaintenancesForDate(date);
                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <span>{date.getDate()}</span>
                    {dayMaintenances.length > 0 && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </CustomCard>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <CustomCard className="p-4">
          <h3 className="font-semibold mb-3">
            {selectedDate ? (
              <>
                Maintenances du {format(selectedDate, 'PPP', { locale: fr })}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedDateMaintenances.length})
                </span>
              </>
            ) : (
              "Sélectionnez une date"
            )}
          </h3>

          {selectedDate ? (
            selectedDateMaintenances.length > 0 ? (
              <div className="space-y-3">
                {selectedDateMaintenances.map((maintenance) => {
                  const TypeIcon = typeIcons[maintenance.type];
                  return (
                    <div
                      key={maintenance.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onMaintenanceClick?.(maintenance)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{maintenance.title}</h4>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusColors[maintenance.status])}
                        >
                          {maintenance.status === 'scheduled' && 'Planifiée'}
                          {maintenance.status === 'in-progress' && 'En cours'}
                          {maintenance.status === 'completed' && 'Terminée'}
                          {maintenance.status === 'overdue' && 'En retard'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", typeColors[maintenance.type])}
                        >
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {maintenance.type === 'preventive' && 'Préventive'}
                          {maintenance.type === 'corrective' && 'Corrective'}
                          {maintenance.type === 'regulatory' && 'Réglementaire'}
                          {maintenance.type === 'improvement' && 'Amélioration'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", priorityColors[maintenance.priority])}
                        >
                          {maintenance.priority === 'low' && 'Basse'}
                          {maintenance.priority === 'medium' && 'Moyenne'}
                          {maintenance.priority === 'high' && 'Élevée'}
                          {maintenance.priority === 'urgent' && 'Urgente'}
                        </Badge>
                      </div>

                      {maintenance.equipment_name && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <WrenchIcon className="w-3 h-3 inline mr-1" />
                          {maintenance.equipment_name}
                        </p>
                      )}

                      {maintenance.estimated_duration && (
                        <p className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Durée: {formatDuration(maintenance.estimated_duration)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune maintenance prévue pour cette date
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cliquez sur une date pour voir les maintenances prévues
            </p>
          )}
        </CustomCard>

        {/* Statistics */}
        <CustomCard className="p-4">
          <h3 className="font-semibold mb-3">Statistiques</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total ce mois:</span>
              <span className="font-medium">
                {maintenances.filter(m => {
                  const date = new Date(m.next_due_date);
                  return date >= startOfMonth(currentMonth) && date <= endOfMonth(currentMonth);
                }).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>En retard:</span>
              <span className="font-medium text-red-600">
                {maintenances.filter(m => m.status === 'overdue').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>En cours:</span>
              <span className="font-medium text-blue-600">
                {maintenances.filter(m => m.status === 'in-progress').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Planifiées:</span>
              <span className="font-medium text-purple-600">
                {maintenances.filter(m => m.status === 'scheduled').length}
              </span>
            </div>
          </div>
        </CustomCard>
      </div>
    </div>
  );
};

export default MaintenanceCalendar;
