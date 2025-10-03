import { useEffect, useRef } from 'react';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useMaintenance } from '@/hooks/useMaintenance';
import { toast } from '@/hooks/use-toast';

type TimerMap = { [id: string]: number };

export function GlobalWebInTabNotifications() {
  const { notifications } = useUserNotifications();
  const { maintenances } = useMaintenance();
  const timersRef = useRef<TimerMap>({});
  const STORAGE_KEY = 'shown_notification_ids_v1';

  const loadShown = (): Set<string> => {
    try { const raw = localStorage.getItem(STORAGE_KEY); const arr = raw ? JSON.parse(raw) : []; return new Set(Array.isArray(arr) ? arr : []); } catch { return new Set(); }
  };
  const saveShown = (setIds: Set<string>) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(setIds))); } catch {} };
  const shownRef = useRef<Set<string>>(loadShown());

  useEffect(() => {
    const canNotify = 'Notification' in window;
    if (canNotify && Notification.permission === 'default') {
      // Demander la permission une seule fois de façon douce
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Nettoyer les timers obsolètes (uniquement ceux qui ne sont plus pertinents)
    const existing = timersRef.current;
    const activeIds = new Set<string>([
      ...notifications.map(n => n.id),
      ...maintenances.map(m => `maint-${m.id}`),
      ...maintenances.flatMap(m => {
        const unit = m.notification_time_before_unit || 'days';
        const val = m.notification_time_before_value ?? 1;
        return [`maint-${m.id}-before-${unit}-${val}`];
      })
    ]);
    for (const key of Object.keys(existing)) {
      if (!activeIds.has(key)) {
        clearTimeout(existing[key]);
        delete existing[key];
      }
    }

    const now = Date.now();

    // User notifications strictes à l'heure, avec marge anti-déclenchement immédiat post-reload
    for (const n of notifications) {
      if (n.is_completed) continue;
      if (timersRef.current[n.id]) continue;
      if (shownRef.current.has(n.id)) continue; // already shown in this browser
      const at = new Date(n.scheduled_date).getTime();
      if (!Number.isFinite(at)) continue;
      let delay = at - now;
      // Si légèrement dans le passé (< 2000 ms), replanifier à +2000 ms au lieu de déclencher tout de suite
      if (delay < 0 && delay > -2000) {
        delay = 2000;
      }
      delay = Math.max(0, delay);
      const timer = window.setTimeout(() => {
        const canNotify = 'Notification' in window && Notification.permission === 'granted';
        if (canNotify) {
          try { new Notification(n.title, { body: n.description || '' }); } catch {}
        } else {
          toast({ title: n.title, description: n.description });
        }
        // mark as shown persistently
        shownRef.current.add(n.id);
        saveShown(shownRef.current);
        delete timersRef.current[n.id];
      }, delay);
      timersRef.current[n.id] = timer as unknown as number;
    }

    // Maintenance: planification stricte à l'échéance (pas d'avance)
    const parseDueAt = (dateOnly: string) => {
      const d = new Date(`${dateOnly}T00:00:00`);
      // Par défaut, définir à 09:00 locale pour le rendez-vous (ajustable si un champ heure existe)
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    };
    for (const m of maintenances) {
      const dueAt = parseDueAt(m.next_due_date);
      if (!Number.isFinite(dueAt)) continue;

      // Déclencher exactement à la date d'échéance (strict, sans avance)
      const idDue = `maint-${m.id}`;
      if (!timersRef.current[idDue]) {
        const delay = Math.max(0, dueAt - now);
        const timer = window.setTimeout(() => {
          const title = '⏰ Maintenance due';
          const body = `${m.title}${m.equipment_name ? ` - ${m.equipment_name}` : ''}`;
          const canNotify = 'Notification' in window && Notification.permission === 'granted';
          if (canNotify) {
            try { new Notification(title, { body }); } catch {}
          } else {
            toast({ title, description: body });
          }
          shownRef.current.add(idDue);
          saveShown(shownRef.current);
          delete timersRef.current[idDue];
        }, delay);
        timersRef.current[idDue] = timer as unknown as number;
      }
    }

    return () => {
      // no-op
    };
  }, [notifications, maintenances]);

  return null;
}

export default GlobalWebInTabNotifications;


