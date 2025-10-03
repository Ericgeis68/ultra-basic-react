import React, { useEffect, useState } from 'react';
import { toast, useToast } from '@/hooks/use-toast';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function NotificationToast() {
  const { notifications } = useUserNotifications();
  const { user } = useCustomAuth();
  const { dismiss } = useToast();
  const location = useLocation();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  // Persistence helpers to avoid duplicate toasts across reloads
  const STORAGE_KEY = 'shown_notification_ids_v1';
  const loadShownFromStorage = (): Set<string> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
    } catch {
      return new Set();
    }
  };
  const saveShownToStorage = (ids: Set<string>) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids))); } catch {}
  };

  // Initialize from storage once
  useEffect(() => {
    setShownNotifications(loadShownFromStorage());
  }, []);

  useEffect(() => {
    if (!user || !notifications.length) return;

    // Filtrer les notifications pour l'utilisateur connecté
    const userNotifications = notifications.filter(notification => {
      const isRecipient = notification.user_id === user.id ||
                         (notification.recipients && 
                          notification.recipients.includes(user.id));
      return isRecipient && !notification.is_completed;
    });

    // Ne toast QUE quand la notification est DUE (scheduled_date <= now)
    const now = new Date();
    const dueNotifications = userNotifications.filter(n => {
      const at = new Date(n.scheduled_date).getTime();
      return Number.isFinite(at) && at <= now.getTime();
    });

    const toShow = dueNotifications.filter(n => !shownNotifications.has(n.id));
    toShow.forEach(n => {
      showNotificationToast(n);
      setShownNotifications(prev => {
        const next = new Set([...prev, n.id]);
        saveShownToStorage(next);
        return next;
      });
    });

    setLastNotificationCount(userNotifications.length);
  }, [notifications, user, lastNotificationCount, shownNotifications, tick]);

  // Tick every second to evaluate due notifications at the exact time
  useEffect(() => {
    const interval = setInterval(() => setTick(t => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(interval);
  }, []);

  // Réinitialiser les compteurs quand l'utilisateur se déconnecte
  useEffect(() => {
    const isLoginPage = typeof location?.pathname === 'string' && location.pathname.toLowerCase().includes('login');
    if (!user || isLoginPage) {
      // Fermer tous les toasts visibles
      dismiss();
      setLastNotificationCount(0);
      setShownNotifications(new Set());
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, [user, location?.pathname, dismiss, lastNotificationCount, shownNotifications]);

  const showNotificationToast = (notification: any) => {
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
      timeInfo = (() => { const d = scheduledDate; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `📅 ${dd}/${mm}/${yyyy}`; })();
    }

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          <span>Rappel</span>
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
      duration: 6000,
    });
  };

  return null; // Ce composant ne rend rien visuellement
}
