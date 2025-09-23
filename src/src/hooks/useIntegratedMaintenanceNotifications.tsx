import { useEffect, useCallback } from 'react';
import { useMaintenanceNotifications } from './useMaintenanceNotifications';
import { useMaintenance } from './useMaintenance';

export function useIntegratedMaintenanceNotifications() {
  const { 
    scheduleMaintenanceReminders, 
    showInterventionNotification, 
    showUrgentAlert,
    isEnabled 
  } = useMaintenanceNotifications();
  
  const { maintenances } = useMaintenance();

  // Programmer les notifications pour toutes les maintenances
  const scheduleAllMaintenanceNotifications = useCallback(async () => {
    if (!isEnabled || !maintenances.length) return;

    try {
      for (const maintenance of maintenances) {
        // Ignorer les maintenances déjà terminées ou sans notifications activées
        if (maintenance.status === 'completed' || !maintenance.notification_enabled) continue;

        // Calculer les jours de rappel basés sur les paramètres individuels de la maintenance
        let reminderDays: number[] = [];
        
        const timeValue = maintenance.notification_time_before_value || 1;
        let daysBeforeDue = timeValue;
        
        // Convertir en jours selon l'unité
        switch (maintenance.notification_time_before_unit) {
          case 'hours':
            daysBeforeDue = timeValue / 24; // Convertir heures en jours
            break;
          case 'weeks':
            daysBeforeDue = timeValue * 7; // Convertir semaines en jours
            break;
          case 'days':
          default:
            daysBeforeDue = timeValue;
            break;
        }

        // Ajouter le rappel personnalisé et le jour J si c'est urgent
        reminderDays = [Math.ceil(daysBeforeDue)];
        
        // Ajouter notification le jour J pour les maintenances urgentes
        if (maintenance.priority === 'urgent' || maintenance.priority === 'high') {
          reminderDays.push(0);
        }

        await scheduleMaintenanceReminders(
          maintenance.id,
          maintenance.title,
          maintenance.next_due_date,
          maintenance.equipment_name,
          reminderDays
        );
      }
    } catch (error) {
      console.error('Erreur programmation notifications maintenance:', error);
    }
  }, [isEnabled, maintenances, scheduleMaintenanceReminders]);

  // Re-programmer les notifications quand les maintenances changent
  useEffect(() => {
    scheduleAllMaintenanceNotifications();
  }, [scheduleAllMaintenanceNotifications]);

  // Notification automatique pour nouvelle intervention d'urgence
  const notifyUrgentMaintenance = useCallback(async (
    maintenanceId: string, 
    title: string, 
    equipmentName?: string
  ) => {
    if (!isEnabled) return;

    try {
      await showUrgentAlert(
        `Maintenance urgente requise: ${title}`,
        equipmentName || 'Équipement non spécifié'
      );
    } catch (error) {
      console.error('Erreur notification maintenance urgente:', error);
    }
  }, [isEnabled, showUrgentAlert]);

  // Notification pour maintenance en retard
  const notifyOverdueMaintenance = useCallback(async (
    title: string,
    daysPastDue: number,
    equipmentName?: string
  ) => {
    if (!isEnabled) return;

    try {
      await showUrgentAlert(
        `Maintenance en retard (${daysPastDue} jours): ${title}`,
        equipmentName || 'Équipement non spécifié'
      );
    } catch (error) {
      console.error('Erreur notification maintenance en retard:', error);
    }
  }, [isEnabled, showUrgentAlert]);

  // Notification pour nouvelle intervention créée
  const notifyNewIntervention = useCallback(async (
    interventionTitle: string,
    equipmentName: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ) => {
    if (!isEnabled) return;

    try {
      await showInterventionNotification(
        interventionTitle,
        equipmentName,
        priority === 'urgent' || priority === 'high'
      );
    } catch (error) {
      console.error('Erreur notification nouvelle intervention:', error);
    }
  }, [isEnabled, showInterventionNotification]);

  // Vérifier les maintenances en retard
  const checkOverdueMaintenances = useCallback(async () => {
    if (!isEnabled || !maintenances.length) return;

    const now = new Date();
    const overdueMaintenances = maintenances.filter(maintenance => {
      const dueDate = new Date(maintenance.next_due_date);
      return maintenance.status !== 'completed' && dueDate < now;
    });

    for (const maintenance of overdueMaintenances) {
      const dueDate = new Date(maintenance.next_due_date);
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      await notifyOverdueMaintenance(
        maintenance.title,
        daysPastDue,
        maintenance.equipment_name
      );
    }
  }, [isEnabled, maintenances, notifyOverdueMaintenance]);

  // Vérifier les maintenances en retard au chargement et périodiquement
  useEffect(() => {
    checkOverdueMaintenances();
    
    // Vérifier toutes les heures
    const interval = setInterval(checkOverdueMaintenances, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkOverdueMaintenances]);

  // Programmer automatiquement les notifications pour les nouvelles maintenances
  const autoScheduleForNewMaintenance = useCallback(async (maintenance: any) => {
    if (!isEnabled || !maintenance.notification_enabled) return;

    // Calculer les jours de rappel basés sur les paramètres individuels de la maintenance
    let reminderDays: number[] = [];
    
    const timeValue = maintenance.notification_time_before_value || 1;
    let daysBeforeDue = timeValue;
    
    // Convertir en jours selon l'unité
    switch (maintenance.notification_time_before_unit) {
      case 'hours':
        daysBeforeDue = timeValue / 24; // Convertir heures en jours
        break;
      case 'weeks':
        daysBeforeDue = timeValue * 7; // Convertir semaines en jours
        break;
      case 'days':
      default:
        daysBeforeDue = timeValue;
        break;
    }

    // Ajouter le rappel personnalisé
    reminderDays = [Math.ceil(daysBeforeDue)];
    
    // Ajouter notification le jour J pour les maintenances urgentes
    if (maintenance.priority === 'urgent' || maintenance.priority === 'high') {
      reminderDays.push(0);
    }

    await scheduleMaintenanceReminders(
      maintenance.id,
      maintenance.title,
      maintenance.next_due_date,
      maintenance.equipment_name,
      reminderDays
    );
  }, [isEnabled, scheduleMaintenanceReminders]);

  return {
    scheduleAllMaintenanceNotifications,
    notifyUrgentMaintenance,
    notifyOverdueMaintenance,
    notifyNewIntervention,
    checkOverdueMaintenances,
    autoScheduleForNewMaintenance,
    isEnabled
  };
}