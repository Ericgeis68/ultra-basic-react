import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export function NotificationToast() {
  const { notifications } = useUserNotifications();
  const { user } = useCustomAuth();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !notifications.length) return;

    // Filtrer les notifications pour l'utilisateur connecté
    const userNotifications = notifications.filter(notification => {
      const isRecipient = notification.user_id === user.id ||
                         (notification.recipients && 
                          notification.recipients.includes(user.id));
      return isRecipient && !notification.is_completed;
    });

    // Vérifier s'il y a de nouvelles notifications
    if (userNotifications.length > lastNotificationCount) {
      const newNotifications = userNotifications.filter(
        notification => !shownNotifications.has(notification.id)
      );

      newNotifications.forEach(notification => {
        // Ne montrer que les notifications récentes (dernières 24h)
        const notificationDate = new Date(notification.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24 && !shownNotifications.has(notification.id)) {
          showNotificationToast(notification);
          setShownNotifications(prev => new Set([...prev, notification.id]));
        }
      });
    }

    setLastNotificationCount(userNotifications.length);
  }, [notifications, user, lastNotificationCount, shownNotifications]);

  const showNotificationToast = (notification: any) => {
    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        case 'medium': return <Bell className="h-4 w-4 text-blue-500" />;
        case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
        default: return <Bell className="h-4 w-4" />;
      }
    };

    const getPriorityLabel = (priority: string) => {
      switch (priority) {
        case 'urgent': return 'Urgent';
        case 'high': return 'Priorité élevée';
        case 'medium': return 'Priorité moyenne';
        case 'low': return 'Priorité faible';
        default: return 'Notification';
      }
    };

    const scheduledDate = new Date(notification.scheduled_date);
    const now = new Date();
    const isOverdue = scheduledDate < now;
    const isToday = scheduledDate.toDateString() === now.toDateString();

    let timeInfo = '';
    if (isOverdue) {
      timeInfo = '⚠️ En retard';
    } else if (isToday) {
      timeInfo = '📅 Aujourd\'hui';
    } else {
      timeInfo = `📅 ${scheduledDate.toLocaleDateString('fr-FR')}`;
    }

    toast({
      title: (
        <div className="flex items-center gap-2">
          {getPriorityIcon(notification.priority)}
          <span>{getPriorityLabel(notification.priority)}</span>
        </div>
      ) as any,
      description: (
        <div className="space-y-2">
          <p className="font-medium">{notification.title}</p>
          {notification.description && (
            <p className="text-sm text-muted-foreground">{notification.description}</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeInfo}
          </p>
        </div>
      ) as any,
      duration: notification.persistent === false ? (notification.priority === 'urgent' ? 10000 : 5000) : Infinity,
    });
  };

  return null; // Ce composant ne rend rien visuellement
}