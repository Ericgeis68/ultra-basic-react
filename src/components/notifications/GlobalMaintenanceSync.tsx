import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';

export function GlobalMaintenanceSync() {
  const { isEnabled, scheduleMaintenanceReminders, cancelMaintenanceReminders } = useMaintenanceNotifications();
  const { user } = useCustomAuth();

  const shouldNotifyForMaintenance = useCallback((maintenance: any) => {
    if (!maintenance) return false;
    if (maintenance.status === 'completed') return false;
    if (maintenance.notification_enabled === false) return false;
    // If assigned_technicians exists, ensure current user is among them
    if (Array.isArray(maintenance.assigned_technicians) && user) {
      return maintenance.assigned_technicians.includes(user.id);
    }
    return true;
  }, [user]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const channel = supabase
      .channel('scheduled_maintenance_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scheduled_maintenance' }, async (payload: any) => {
        const newRow = payload?.new as any;
        const oldRow = payload?.old as any;
        if (!newRow || !oldRow || !isEnabled) return;
        if (!shouldNotifyForMaintenance(newRow)) {
          // If not eligible anymore, cancel existing reminders (both J-x and J0)
          await cancelMaintenanceReminders(newRow.id, [0, 1, 2, 3, 7, 14]);
          return;
        }
        // Reschedule when relevant fields change (date, priority, notification settings)
        const dueChanged = newRow.next_due_date !== oldRow.next_due_date;
        const notifChanged = (newRow.notification_enabled !== oldRow.notification_enabled) ||
                             (newRow.notification_time_before_value !== oldRow.notification_time_before_value) ||
                             (newRow.notification_time_before_unit !== oldRow.notification_time_before_unit) ||
                             (newRow.priority !== oldRow.priority);
        if (dueChanged || notifChanged) {
          await cancelMaintenanceReminders(newRow.id, [0, 1, 2, 3, 7, 14]);
          // Recompute reminderDays like in useIntegratedMaintenanceNotifications
          const timeValue = newRow.notification_time_before_value || 1;
          let daysBeforeDue = timeValue;
          switch (newRow.notification_time_before_unit) {
            case 'hours':
              daysBeforeDue = timeValue / 24;
              break;
            case 'weeks':
              daysBeforeDue = timeValue * 7;
              break;
            case 'days':
            default:
              daysBeforeDue = timeValue;
          }
          const reminderDays: number[] = [Math.ceil(daysBeforeDue)];
          if (newRow.priority === 'urgent' || newRow.priority === 'high') {
            reminderDays.push(0);
          }
          await scheduleMaintenanceReminders(
            newRow.id,
            newRow.title,
            newRow.next_due_date,
            newRow.equipment_name,
            reminderDays,
            newRow.assigned_technicians
          );
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'scheduled_maintenance' }, async (payload: any) => {
        const oldRow = payload?.old as any;
        if (!oldRow || !isEnabled) return;
        await cancelMaintenanceReminders(oldRow.id, [0, 1, 2, 3, 7, 14]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isEnabled, cancelMaintenanceReminders, scheduleMaintenanceReminders, shouldNotifyForMaintenance]);

  return null;
}

export default GlobalMaintenanceSync;





