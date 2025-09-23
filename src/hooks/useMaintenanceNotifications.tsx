import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  maintenanceReminders: boolean;
  urgentAlerts: boolean;
  reminderDays: number; // Nombre de jours avant maintenance pour rappel
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  maintenanceReminders: true,
  urgentAlerts: true,
  reminderDays: 1
};

export function useMaintenanceNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const { user } = useCustomAuth();

  // Détecter si on est dans un environnement mobile natif
  const isNativePlatform = Capacitor.isNativePlatform();

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('maintenance_notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('maintenance_notification_preferences', JSON.stringify(updated));
  }, [preferences]);

  // Vérifier et demander les permissions (seulement sur mobile natif)
  const requestPermissions = useCallback(async () => {
    if (!isNativePlatform) {
      // Sur web, on considère que les permissions sont accordées (on utilise les toasts)
      setIsPermissionGranted(true);
      return true;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setIsPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Erreur demande permissions notifications:', error);
      // Fallback sur web si LocalNotifications n'est pas disponible
      setIsPermissionGranted(true);
      return true;
    }
  }, [isNativePlatform]);

  // Initialiser les permissions
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Notification pour nouvelle intervention avec vérification d'assignation
  const showInterventionNotification = useCallback(
    (intervention: any, maintenance?: any) => {
      if (!preferences.enabled || !user) return;

      // Vérifier si l'utilisateur connecté est dans les techniciens assignés à la maintenance
      const isAssignedToMaintenance = maintenance?.assigned_technicians?.includes(user.id);
      
      // Pour les maintenances, ne notifier que les techniciens assignés
      if (maintenance && !isAssignedToMaintenance) return;
      
      // Pour les interventions sans maintenance, vérifier les techniciens de l'intervention
      const isAssignedToIntervention = intervention.technicians?.includes(user.id);
      if (!maintenance && !isAssignedToIntervention) return;

    try {
      const title = intervention.title || 'Nouvelle intervention';
      const equipment = intervention.equipment_name || 'Équipement non spécifié';
      const isUrgent = intervention.priority === 'urgent';

      try {
        // Vibration si activée et sur mobile natif
        if (preferences.vibration && isNativePlatform) {
          await Haptics.impact({ 
            style: isUrgent ? ImpactStyle.Heavy : ImpactStyle.Medium 
          });
        }

        if (isNativePlatform && isPermissionGranted) {
          await LocalNotifications.schedule({
            notifications: [{
              title: isUrgent ? `🚨 ${title}` : `🔧 ${title}`,
              body: `Équipement: ${equipment}${isUrgent ? ' - Intervention urgente!' : ''}`,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: preferences.sound ? 'beep.wav' : undefined,
              attachments: undefined,
              actionTypeId: 'maintenance',
              extra: {
                type: 'intervention',
                equipment,
                urgent: isUrgent
              }
            }]
          });
        }
      } catch (error) {
        console.error('Erreur notification intervention:', error);
      }
    }, [preferences, isPermissionGranted, isNativePlatform, user]);

  // Alerte urgente avec vibration forte
  const showUrgentAlert = useCallback(async (message: string, equipment: string) => {
    if (!preferences.enabled || !preferences.urgentAlerts || !isPermissionGranted) return;

    try {
      // Triple vibration pour urgence
      if (preferences.vibration && isNativePlatform) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
        setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 400);
      }

      if (isNativePlatform) {
        await LocalNotifications.schedule({
        notifications: [{
          title: '🚨 ALERTE URGENTE',
          body: `${message} - ${equipment}`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: preferences.sound ? 'beep.wav' : undefined,
          attachments: undefined,
          actionTypeId: 'urgent',
          extra: {
            type: 'urgent_alert',
            equipment,
            message
          }
        }]
        });
      }
    } catch (error) {
      console.error('Erreur alerte urgente:', error);
    }
  }, [preferences, isPermissionGranted, isNativePlatform]);

  // Rappel de maintenance planifiée avec vérification d'assignation
  const showMaintenanceReminder = useCallback(async (
    maintenanceTitle: string, 
    dueDate: string, 
    equipment?: string,
    assignedTechnicians?: string[]
  ) => {
    if (!preferences.enabled || !preferences.maintenanceReminders || !isPermissionGranted || !user) return;
    
    // Vérifier si l'utilisateur est assigné à cette maintenance
    if (assignedTechnicians && !assignedTechnicians.includes(user.id)) return;

    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + preferences.reminderDays);

      await LocalNotifications.schedule({
        notifications: [{
          title: '📅 Rappel Maintenance',
          body: `${maintenanceTitle}${equipment ? ` - ${equipment}` : ''}\nÉchéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
          id: Date.now(),
          schedule: { at: scheduledDate },
          sound: preferences.sound ? 'beep.wav' : undefined,
          attachments: undefined,
          actionTypeId: 'maintenance_reminder',
          extra: {
            type: 'maintenance_reminder',
            title: maintenanceTitle,
            dueDate,
            equipment
          }
        }]
      });
    } catch (error) {
      console.error('Erreur rappel maintenance:', error);
    }
  }, [preferences, isPermissionGranted, user]);

  // Planifier plusieurs rappels pour une maintenance avec vérification d'assignation
  const scheduleMaintenanceReminders = useCallback(async (
    maintenanceId: string,
    title: string,
    dueDate: string,
    equipment?: string,
    customReminderDays?: number[],
    assignedTechnicians?: string[]
  ) => {
    if (!preferences.enabled || !preferences.maintenanceReminders || !isPermissionGranted || !user) return;
    
    // Vérifier si l'utilisateur est assigné à cette maintenance
    if (assignedTechnicians && !assignedTechnicians.includes(user.id)) return;

    const reminderDays = customReminderDays || [preferences.reminderDays, 0]; // Par défaut: rappel + jour même

    try {
      const notifications = reminderDays.map((days, index) => {
        const scheduledDate = new Date(dueDate);
        scheduledDate.setDate(scheduledDate.getDate() - days);

        return {
          title: days === 0 ? '⏰ Maintenance Aujourd\'hui' : `📅 Rappel Maintenance (J-${days})`,
          body: `${title}${equipment ? ` - ${equipment}` : ''}\nÉchéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
          id: parseInt(`${Date.now()}${index}`),
          schedule: { at: scheduledDate },
          sound: preferences.sound ? 'beep.wav' : undefined,
          attachments: undefined,
          actionTypeId: 'maintenance_reminder',
          extra: {
            type: 'maintenance_reminder',
            maintenanceId,
            title,
            dueDate,
            equipment,
            reminderDay: days
          }
        };
      });

      await LocalNotifications.schedule({ notifications });
    } catch (error) {
      console.error('Erreur programmation rappels:', error);
    }
  }, [preferences, isPermissionGranted, user]);

  // Test notification
  const sendTestNotification = useCallback(async () => {
    if (!isPermissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return false;
    }

    try {
      await showInterventionNotification(
        'Test Notification',
        'Équipement Test-001',
        false
      );
      return true;
    } catch (error) {
      console.error('Erreur test notification:', error);
      return false;
    }
  }, [isPermissionGranted, requestPermissions, showInterventionNotification]);

  // Annuler toutes les notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await LocalNotifications.cancel({ notifications: [] });
    } catch (error) {
      console.error('Erreur effacement notifications:', error);
    }
  }, []);

  return {
    preferences,
    savePreferences,
    isEnabled: preferences.enabled && isPermissionGranted,
    isPermissionGranted,
    requestPermissions,
    showInterventionNotification,
    showUrgentAlert,
    showMaintenanceReminder,
    scheduleMaintenanceReminders,
    sendTestNotification,
    clearAllNotifications
  };
}