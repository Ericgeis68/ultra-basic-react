import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export function NotificationToast() {
  const { notifications } = useUserNotifications();
  // Note: les notifications sont déjà filtrées côté hook pour l'utilisateur courant
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const INITIAL_DELAY_MS = 900; // Laisse la priorité aux toasts de maintenance au démarrage
  const INITIAL_MAX_TO_SHOW = 3; // Ne pas saturer la file au démarrage
  
  // Aide au debug
  // console.debug('[NotificationToast] render', { len: notifications.length, hasShownInitial });

  useEffect(() => {
    if (!notifications.length) return;

    // Garder uniquement les notifications non terminées
    const userNotifications = notifications.filter(notification => !notification.is_completed);

    // Affichage initial après connexion avec léger délai et limite
    if (!hasShownInitial) {
      const initialToShow = userNotifications.filter(n => !shownNotifications.has(n.id));
      const timer = setTimeout(() => {
        initialToShow.slice(0, INITIAL_MAX_TO_SHOW).forEach(notification => {
          showNotificationToast(notification);
          setShownNotifications(prev => new Set([...prev, notification.id]));
        });
        setHasShownInitial(true);
        setLastNotificationCount(userNotifications.length);
      }, INITIAL_DELAY_MS);
      return () => clearTimeout(timer);
    }

    // Vérifier s'il y a de nouvelles notifications (après initial)
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
  }, [notifications, lastNotificationCount, shownNotifications, hasShownInitial]);

  // Filet de sécurité: si après un délai les notifications sont là mais rien n'a été montré, déclencher l'initial
  useEffect(() => {
    if (hasShownInitial) return;
    if (!notifications.length) return;
    const t = setTimeout(() => {
      if (!hasShownInitial && notifications.length) {
        const pending = notifications
          .filter(n => !n.is_completed && !shownNotifications.has(n.id))
          .slice(0, INITIAL_MAX_TO_SHOW);
        if (pending.length) {
          // console.debug('[NotificationToast] fallback timer showing', { pending: pending.length });
          pending.forEach(n => {
            showNotificationToast(n);
            setShownNotifications(prev => new Set([...prev, n.id]));
          });
          setHasShownInitial(true);
          setLastNotificationCount(pending.length);
        }
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [notifications, shownNotifications, hasShownInitial]);

  // Si la liste devient vide (changement de session), réinitialiser
  useEffect(() => {
    if (!notifications.length && (hasShownInitial || lastNotificationCount > 0 || shownNotifications.size > 0)) {
      setHasShownInitial(false);
      setLastNotificationCount(0);
      setShownNotifications(new Set());
    }
  }, [notifications, hasShownInitial, lastNotificationCount, shownNotifications]);

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
      // Durée finie pour ne pas bloquer les rappels de maintenance
      duration: notification.priority === 'urgent' ? 9000 : 6000,
    });
  };

  return null; // Ce composant ne rend rien visuellement
}