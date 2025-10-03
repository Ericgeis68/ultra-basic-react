import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  maintenanceReminders: boolean;
  classicNotifications: boolean; // Interventions et notifications générales
  urgentAlerts: boolean;
  reminderDays: number; // Nombre de jours avant maintenance pour rappel
  defaultNotificationPreset?: 'none' | 'standard'; // Préconfigurations d'options par défaut
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  maintenanceReminders: true,
  classicNotifications: true,
  urgentAlerts: true,
  reminderDays: 1,
  defaultNotificationPreset: 'none'
};

export function useMaintenanceNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const { user } = useCustomAuth();

  // Détecter si on est dans un environnement mobile natif
  const isNativePlatform = Capacitor.isNativePlatform();

  // Convertir une chaîne en entier positif 31-bit stable (IDs Android)
  const hashToPositiveInt = useCallback((input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    const MAX_INT = 2147483647;
    const positive = Math.abs(hash) % MAX_INT;
    return positive > 0 ? positive : 1;
  }, []);

  // Générer un identifiant sûr (int32 Java)
  const generateNotificationId = useCallback(() => {
    const MAX_INT = 2147483647; // Java int max
    const now = Date.now();
    // Réduire dans l'intervalle signé positif et éviter 0
    const id = Math.floor(now % MAX_INT);
    return id > 0 ? id : 1;
  }, []);

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('maintenance_notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  // Créer un canal de notification par défaut sur Android
  useEffect(() => {
    const ensureDefaultChannel = async () => {
      if (!isNativePlatform) return;
      try {
        await LocalNotifications.createChannel?.({
          id: 'default',
          name: 'Notifications par défaut',
          description: 'Canal par défaut pour les notifications',
          importance: 4 // IMPORTANCE_HIGH
        } as any);
        console.log('🔔 Canal de notification par défaut vérifié/créé');
      } catch (e) {
        console.warn('⚠️ Impossible de créer le canal par défaut (peut être déjà présent):', e);
      }
    };
    ensureDefaultChannel();
  }, [isNativePlatform]);

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem('maintenance_notification_preferences', JSON.stringify(updated));
  }, [preferences]);

  // Vérifier et demander les permissions (seulement sur mobile natif)
  const requestPermissions = useCallback(async () => {
    console.log('🔔 Vérification des permissions de notification...');
    console.log('Platforme native:', isNativePlatform);
    
    if (!isNativePlatform) {
      console.log('🌐 Mode web - permissions accordées par défaut');
      setIsPermissionGranted(true);
      return true;
    }

    try {
      // Étape 1: vérifier l'état actuel
      const current = await LocalNotifications.checkPermissions();
      console.log('📱 État actuel des permissions:', current);
      if (current.display === 'granted') {
        setIsPermissionGranted(true);
        return true;
      }

      // Étape 2: tenter de demander
      console.log('📱 Demande des permissions sur mobile...');
      const result = await LocalNotifications.requestPermissions();
      console.log('📱 Résultat permissions:', result);
      const granted = result.display === 'granted';
      setIsPermissionGranted(granted);

      if (granted) {
        console.log('✅ Permissions accordées');
        return true;
      }

      console.warn('⚠️ Permissions de notification refusées par l\'utilisateur');

      // Étape 3: ouvrir les paramètres si refusé/permanent
      try {
        console.log('⚙️ Ouverture des paramètres de l\'application...');
        await App.openSettings();
      } catch (openErr) {
        console.warn('⚠️ Impossible d\'ouvrir les paramètres:', openErr);
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur demande/lecture permissions notifications:', error);
      console.error('Détails erreur:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name
      });
      
      // Fallback prudent: considérer comme non accordé pour éviter des faux positifs
      setIsPermissionGranted(false);
      return false;
    }
  }, [isNativePlatform]);

  // Initialiser les permissions
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Notification pour nouvelle intervention avec vérification d'assignation
  const showInterventionNotification = useCallback(async (
    intervention: any, 
    maintenance?: any
  ) => {
    if (!preferences.enabled || !preferences.classicNotifications || !user) return;

    // Vérifier si l'utilisateur connecté est dans les techniciens assignés à la maintenance
    const isAssignedToMaintenance = maintenance?.assigned_technicians?.includes(user.id);
    
    // Pour les maintenances, ne notifier que les techniciens assignés
    if (maintenance && !isAssignedToMaintenance) return;
    
    // Pour les interventions sans maintenance, vérifier les techniciens de l'intervention
    const isAssignedToIntervention = intervention.technicians?.includes(user.id);
    if (!maintenance && !isAssignedToIntervention) return;

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
        console.log('📱 Envoi notification native...');
        console.log('📱 Titre:', isUrgent ? `🚨 ${title}` : `🔧 ${title}`);
        console.log('📱 Corps:', `Équipement: ${equipment}${isUrgent ? ' - Intervention urgente!' : ''}`);
        console.log('📱 Son activé:', preferences.sound);
        
        try {
          await LocalNotifications.schedule({
            notifications: [{
              title: isUrgent ? `🚨 ${title}` : `🔧 ${title}`,
              body: `Équipement: ${equipment}${isUrgent ? ' - Intervention urgente!' : ''}`,
              id: generateNotificationId(),
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
          console.log('✅ Notification native envoyée avec succès');
        } catch (notificationError) {
          console.error('❌ Erreur envoi notification native:', notificationError);
          console.error('Détails erreur notification:', {
            message: notificationError.message,
            stack: notificationError.stack,
            name: notificationError.name
          });
        }
      } else {
        console.log('⚠️ Notification native non envoyée:', {
          isNativePlatform,
          isPermissionGranted,
          preferencesEnabled: preferences.enabled
        });
      }
    } catch (error) {
      console.error('Erreur notification intervention:', error);
    }
  }, [preferences, isPermissionGranted, isNativePlatform, user]);

  // Alerte urgente avec vibration forte
  const showUrgentAlert = useCallback(async (message: string, equipment: string) => {
    if (!preferences.enabled || !preferences.classicNotifications || !preferences.urgentAlerts || !isPermissionGranted) return;

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
          id: generateNotificationId(),
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
      // Planifier à J - reminderDays, en se basant sur minuit local de la dueDate
      const baseDue = new Date(`${dueDate}T00:00:00`);
      // Normaliser au milieu de journée pour éviter problèmes DST
      baseDue.setHours(12, 0, 0, 0);
      const scheduledDate = new Date(baseDue);
      scheduledDate.setDate(scheduledDate.getDate() - preferences.reminderDays);

      await LocalNotifications.schedule({
        notifications: [{
          title: '📅 Rappel Maintenance',
          body: (() => { const d = new Date(`${dueDate}T00:00:00`); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${maintenanceTitle}${equipment ? ` - ${equipment}` : ''}\nÉchéance: ${dd}/${mm}/${yyyy}`; })(),
          id: generateNotificationId(),
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

  // Notification de maintenance immédiate (sans horaire futur) pour éviter erreurs de planification passée
  const notifyMaintenanceNow = useCallback(async (
    maintenanceTitle: string,
    equipment?: string
  ) => {
    if (!preferences.enabled || !isPermissionGranted || !user) return;
    // Sur web, ne pas utiliser le shim Capacitor (déclenche immédiat). Laisser l'app web gérer.
    if (!isNativePlatform) return;

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title: '📅 Maintenance',
          body: `${maintenanceTitle}${equipment ? ` - ${equipment}` : ''}`,
          id: generateNotificationId(),
          // Sans schedule.at → notification immédiate
          channelId: 'default',
          actionTypeId: 'maintenance_reminder',
          extra: {
            type: 'maintenance_now',
            title: maintenanceTitle,
            equipment
          }
        }]
      });
    } catch (error) {
      console.error('Erreur notification maintenance immédiate:', error);
    }
  }, [preferences, isPermissionGranted, user, generateNotificationId]);

  // Classique: planifier ou envoyer maintenant via le même hook
  const scheduleClassicNotification = useCallback(async (
    title: string,
    at?: Date,
    body?: string
  ) => {
    if (!preferences.enabled || !preferences.classicNotifications || !isPermissionGranted) return;
    // Sur web, ne pas programmer via Capacitor (le shim envoie tout de suite). Géré par GlobalWebInTabNotifications.
    if (!isNativePlatform) return;

    try {
      const shouldSchedule = at && at.getTime() > Date.now();
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body: body || '',
          id: generateNotificationId(),
          ...(shouldSchedule ? { schedule: { at, allowWhileIdle: true } as any } : {}),
          channelId: 'default',
          actionTypeId: 'classic',
          extra: { type: shouldSchedule ? 'classic_scheduled' : 'classic_now' }
        }]
      });
    } catch (error) {
      console.error('Erreur notification classique (hook):', error);
    }
  }, [preferences, isPermissionGranted, generateNotificationId]);


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
      const notifications = reminderDays.map((days) => {
        // Base à 19:30 locale si disponible via préférences; sinon 12:00
        const baseDue = new Date(`${dueDate}T00:00:00`);
        const targetHour = typeof (preferences as any).targetHour === 'number' ? (preferences as any).targetHour : 19;
        const targetMinute = typeof (preferences as any).targetMinute === 'number' ? (preferences as any).targetMinute : 30;
        baseDue.setHours(targetHour, targetMinute, 0, 0);
        const scheduledDate = new Date(baseDue);
        scheduledDate.setDate(scheduledDate.getDate() - days);

        return {
          title: days === 0 ? '⏰ Maintenance Aujourd\'hui' : `📅 Rappel Maintenance (J-${days})`,
          body: (() => { const d = new Date(`${dueDate}T00:00:00`); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${title}${equipment ? ` - ${equipment}` : ''}\nÉchéance: ${dd}/${mm}/${yyyy}`; })(),
          id: hashToPositiveInt(`${maintenanceId}:reminder:${days}`),
          schedule: { at: scheduledDate },
          sound: preferences.sound ? 'beep.wav' : undefined,
          attachments: undefined,
          actionTypeId: 'maintenance_reminder',
          channelId: 'default',
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

  // Annuler les rappels planifiés pour une maintenance
  const cancelMaintenanceReminders = useCallback(async (
    maintenanceId: string,
    days?: number[]
  ) => {
    try {
      const reminderDays = days && days.length ? days : [preferences.reminderDays, 0];
      const notifications = reminderDays.map((d) => ({ id: hashToPositiveInt(`${maintenanceId}:reminder:${d}`) }));
      await LocalNotifications.cancel({ notifications });
    } catch (error) {
      console.warn('Erreur annulation rappels maintenance:', error);
    }
  }, [preferences.reminderDays, hashToPositiveInt]);

  // Test notification native direct
  const sendTestNotification = useCallback(async () => {
    console.log('🧪 Démarrage test notification native...');
    console.log('🧪 Permissions accordées:', isPermissionGranted);
    console.log('🧪 Plateforme native:', isNativePlatform);
    
    if (!isPermissionGranted) {
      console.log('🧪 Demande des permissions...');
      const granted = await requestPermissions();
      if (!granted) {
        console.log('❌ Permissions refusées pour le test');
        return false;
      }
    }

    if (!isNativePlatform) {
      console.log('⚠️ Test impossible - pas sur plateforme native');
      return false;
    }

    try {
      console.log('🧪 Envoi notification native directe...');
      
      // Envoyer directement une notification native de test
      await LocalNotifications.schedule({
        notifications: [{
          title: '🧪 Test Notification Native',
          body: 'Ceci est un test de notification native Android',
          id: generateNotificationId(),
          schedule: { at: new Date(Date.now() + 1000) },
          // Ne pas utiliser de son custom pour éviter les échecs si la ressource manque
          sound: preferences.sound ? undefined : undefined,
          channelId: 'default',
          actionTypeId: 'test',
          extra: {
            type: 'test',
            source: 'maintenance_test'
          }
        }]
      });
      
      console.log('✅ Notification native de test envoyée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur test notification:', error);
      return false;
    }
  }, [isPermissionGranted, requestPermissions, isNativePlatform, preferences.sound]);

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
    notifyMaintenanceNow,
    scheduleClassicNotification,
    scheduleMaintenanceReminders,
    cancelMaintenanceReminders,
    sendTestNotification,
    clearAllNotifications
  };
}
