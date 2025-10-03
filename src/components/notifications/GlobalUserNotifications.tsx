// @ts-nocheck
import { useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';

// Convert stable string (UUID) to positive 31-bit int for Android notification IDs
function hashToPositiveInt(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // Convert to 32-bit int
  }
  // Keep it in 1..MAX_INT (avoid 0 which is invalid on some devices)
  const MAX_INT = 2147483647;
  const positive = Math.abs(hash) % MAX_INT;
  return positive > 0 ? positive : 1;
}

export function GlobalUserNotifications() {
  const { user: customUser } = useCustomAuth();
  const { user: authUser } = useAuth() as any;
  const effectiveUser = customUser || authUser;
  const { isEnabled, requestPermissions } = useMaintenanceNotifications();

  const ensureChannel = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel?.({
        id: 'default',
        name: 'Notifications par défaut',
        description: 'Canal par défaut pour les notifications',
        importance: 4
      } as any);
    } catch {}
  }, []);

  const scheduleOne = useCallback(async (row: any) => {
    if (!Capacitor.isNativePlatform() || !row) return;
    // Only future or immediate
    const at = new Date(row.scheduled_date);
    const now = new Date();
    const shouldSchedule = at.getTime() > now.getTime();
    // Avoid scheduling in the near past; if less than 5s in future, send now
    const minFutureMs = now.getTime() + 5000;
    const id = hashToPositiveInt(row.id);
    // Si déjà passé, ne pas re-déclencher; laisser la logique web/Toast gérer l'affichage
    if (!shouldSchedule) return;
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: row.title as string,
          body: (row.description as string) || '',
          ...(shouldSchedule && at.getTime() > minFutureMs ? { schedule: { at, allowWhileIdle: true } as any } : {}),
          channelId: 'default',
          actionTypeId: 'classic',
          extra: { type: shouldSchedule ? 'classic_scheduled' : 'classic_now', source: 'global_user_notifications' }
        }]
      });
    } catch (e) {
      console.warn('GlobalUserNotifications schedule failed:', e);
    }
  }, []);

  const backfillUpcoming = useCallback(async () => {
    if (!effectiveUser || !Capacitor.isNativePlatform()) return;
    try {
      const nowIso = new Date().toISOString();
      const in7DaysIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, title, description, scheduled_date, user_id, recipients')
        .gte('scheduled_date', nowIso)
        .lte('scheduled_date', in7DaysIso)
        .order('scheduled_date', { ascending: true });
      if (error) return;
      const rows = (data as any[]) || [];
      const normalizeRecipients = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value as string[];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.startsWith('[')) {
            try { const parsed = JSON.parse(trimmed); return Array.isArray(parsed) ? parsed as string[] : []; } catch { return []; }
          }
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1);
            if (!inner) return [];
            return inner.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
          }
          return [value];
        }
        return [];
      };
      const filtered = rows
        .map(row => ({ ...row, recipients: normalizeRecipients(row.recipients) }))
        .filter(row => row.user_id === effectiveUser.id || (Array.isArray(row.recipients) && row.recipients.includes(effectiveUser.id)));
      for (const row of filtered) {
        await scheduleOne(row);
      }
    } catch {}
  }, [effectiveUser, scheduleOne]);

  useEffect(() => {
    (async () => {
      if (!Capacitor.isNativePlatform()) return;
      await requestPermissions();
      await ensureChannel();
      if (isEnabled) {
        await backfillUpcoming();
      }
    })();
  }, [isEnabled, requestPermissions, ensureChannel, backfillUpcoming]);

  useEffect(() => {
    if (!effectiveUser) return;
    // Realtime INSERT/UPDATE/DELETE → sync local schedules
    const channel = supabase
      .channel('user_notifications_global_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications' }, async (payload: any) => {
        const row = payload?.new as any;
        if (!row) return;
        const recipients = Array.isArray(row.recipients) ? row.recipients : (() => {
          if (!row.recipients || typeof row.recipients !== 'string') return [] as string[];
          const trimmed = row.recipients.trim();
          if (trimmed.startsWith('[')) {
            try { const parsed = JSON.parse(trimmed); return Array.isArray(parsed) ? parsed as string[] : []; } catch { return []; }
          }
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1);
            if (!inner) return [] as string[];
            return inner.split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
          }
          return [row.recipients];
        })();
        if (row.user_id === effectiveUser.id || (Array.isArray(recipients) && recipients.includes(effectiveUser.id))) {
          await scheduleOne(row);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_notifications' }, async (payload: any) => {
        const newRow = payload?.new as any;
        const oldRow = payload?.old as any;
        if (!newRow || !oldRow) return;
        const concernsUser = (newRow.user_id === effectiveUser.id) || (Array.isArray(newRow.recipients) && newRow.recipients.includes(effectiveUser.id));
        if (!concernsUser) return;
        // Cancel old schedule and reschedule new if needed
        try {
          const id = hashToPositiveInt(newRow.id);
          await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch {}
        await scheduleOne(newRow);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_notifications' }, async (payload: any) => {
        const oldRow = payload?.old as any;
        if (!oldRow) return;
        const concernsUser = (oldRow.user_id === effectiveUser.id) || (Array.isArray(oldRow.recipients) && oldRow.recipients.includes(effectiveUser.id));
        if (!concernsUser) return;
        try {
          const id = hashToPositiveInt(oldRow.id);
          await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [effectiveUser, scheduleOne]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onResume = CapacitorApp.addListener('appStateChange', async (state) => {
      if (state.isActive && isEnabled) {
        await ensureChannel();
        await backfillUpcoming();
      }
    });
    return () => { onResume.remove(); };
  }, [isEnabled, ensureChannel, backfillUpcoming]);

  return null;
}

export default GlobalUserNotifications;

// (deduplicated) only the main export above is needed


