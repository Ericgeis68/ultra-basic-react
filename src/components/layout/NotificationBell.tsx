import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CombinedNotification {
  id: string;
  type: 'user' | 'maintenance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  is_read?: boolean;
  is_completed?: boolean;
  status?: string;
  equipment_name?: string;
}

export function NotificationBell() {
  const { notifications: userNotifications, markAsRead, markAsCompleted } = useUserNotifications();
  const { maintenances } = useMaintenance();
  const { showUrgentAlert, isEnabled } = useMaintenanceNotifications();
  const [combinedNotifications, setCombinedNotifications] = useState<CombinedNotification[]>([]);
  const [nowTick, setNowTick] = useState(0);

  // Combiner toutes les notifications
  useEffect(() => {
    const combined: CombinedNotification[] = [];

    // Heure courante pour filtrage cohérent avec le déclenchement/toast
    const now = new Date();

    // Ajouter les notifications utilisateur DUES (scheduled_date <= now)
    userNotifications
      .filter(n => n && typeof n.id === 'string')
      .filter(n => !n.is_completed)
      .filter(n => {
        const at = new Date(n.scheduled_date).getTime();
        return Number.isFinite(at) && at <= now.getTime();
      })
      .forEach(notif => {
        combined.push({
          id: notif.id,
          type: 'user',
          title: notif.title,
          description: notif.description || '',
          priority: 'medium',
          scheduled_date: notif.scheduled_date,
          is_read: notif.is_read,
          is_completed: notif.is_completed
        });
      });

    // Ajouter les maintenances urgentes et en retard
    const now2 = new Date();
    maintenances.forEach(maintenance => {
      if (maintenance.status === 'completed' || !maintenance.notification_enabled) return;

      const dueDate = new Date(maintenance.next_due_date);
      const daysDiff = Math.floor((dueDate.getTime() - now2.getTime()) / (1000 * 60 * 60 * 24));

      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      let title = '';
      let description = '';

      if (daysDiff < 0) {
        priority = 'urgent';
        title = `🚨 Maintenance en retard`;
        description = `${maintenance.title} - En retard de ${Math.abs(daysDiff)} jour(s)`;
      } else if (daysDiff === 0) {
        priority = 'high';
        title = `📅 Maintenance aujourd'hui`;
        description = maintenance.title;
      } else if (daysDiff <= (maintenance.notification_time_before_value || 1)) {
        priority = 'medium';
        title = `🔔 Maintenance prochaine`;
        description = `${maintenance.title} - Dans ${daysDiff} jour(s)`;
      }

      if (title) {
        combined.push({
          id: `maintenance-${maintenance.id}`,
          type: 'maintenance',
          title,
          description,
          priority,
          scheduled_date: maintenance.next_due_date,
          status: maintenance.status,
          equipment_name: maintenance.equipment_name
        });
      }
    });

    // Trier par priorité et date
    combined.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.scheduled_date || 0).getTime() - new Date(b.scheduled_date || 0).getTime();
    });

    setCombinedNotifications(combined);
  }, [userNotifications, maintenances, nowTick]);

  // Tick every second to re-evaluate due state exactly on time
  useEffect(() => {
    const i = setInterval(() => setNowTick(t => (t + 1) % 1000000), 1000);
    return () => clearInterval(i);
  }, []);

  // Rafraîchir la cloche immédiatement sur création de notification côté Realtime
  useEffect(() => {
    const recompute = () => setCombinedNotifications(prev => [...prev]);
    window.addEventListener('auth:updated', recompute);
    window.addEventListener('notifications:updated', recompute);
    return () => {
      window.removeEventListener('auth:updated', recompute);
      window.removeEventListener('notifications:updated', recompute);
    };
  }, []);

  const handleMarkAsRead = async (notification: CombinedNotification) => {
    if (notification.type === 'user' && !notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAsCompleted = async (notification: CombinedNotification) => {
    if (notification.type === 'user' && !notification.is_completed) {
      await markAsCompleted(notification.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Compter tout ce qui est affiché dans la cloche pour aligner l'indicateur
  const totalUnread = combinedNotifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Link to="/notifications" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[80vh] overflow-auto">
          {combinedNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {combinedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    (notification.type === 'user' && !notification.is_read) || 
                    (notification.type === 'maintenance' && notification.priority === 'urgent')
                      ? 'bg-muted/50' 
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(notification.priority)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {notification.type === 'user' ? 'Rappel' : 'Maintenance'}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.description}
                      </p>
                      
                      {notification.equipment_name && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Équipement: {notification.equipment_name}
                        </p>
                      )}
                      
                      {notification.scheduled_date && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {(() => { const d = new Date(notification.scheduled_date); if (isNaN(d.getTime())) return ''; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })()}
                        </p>
                      )}
                      
                      {notification.type === 'user' && (
                        <div className="flex gap-1">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleMarkAsRead(notification)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Lu
                            </Button>
                          )}
                          {!notification.is_completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleMarkAsCompleted(notification)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Terminé
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
