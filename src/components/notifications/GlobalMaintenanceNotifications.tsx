import { useEffect } from 'react';
import { useIntegratedMaintenanceNotifications } from '@/hooks/useIntegratedMaintenanceNotifications';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';

export function GlobalMaintenanceNotifications() {
  const { isEnabled } = useIntegratedMaintenanceNotifications();
  const { maintenances } = useMaintenance();
  const { showUrgentAlert, showMaintenanceReminder, notifyMaintenanceNow } = useMaintenanceNotifications();

  useEffect(() => {
    if (!isEnabled || !maintenances.length) return;

    const now = new Date();
    // Normaliser les dates pour comparer uniquement les jours (sans heures/minutes)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Délai pour laisser le temps à l'interface de se charger complètement
    const timeoutId = setTimeout(() => {
    
    // Vérifier les maintenances en retard et à réaliser aujourd'hui
    maintenances.forEach(maintenance => {
      if (maintenance.status === 'completed' || !maintenance.notification_enabled) return;

      const dueDate = new Date(maintenance.next_due_date);
      const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const daysDiff = Math.floor((dueDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Maintenances en retard → alerte urgente native immédiate
      if (daysDiff < 0) {
        const daysPastDue = Math.abs(daysDiff);
        showUrgentAlert(
          `Maintenance en retard (${daysPastDue} jours): ${maintenance.title}`,
          maintenance.equipment_name
        );
      }
      // Maintenances à réaliser aujourd'hui: ne pas notifier immédiatement ici.
      // Laisser les rappels planifiés (heures/jours avant) gérer l'heure exacte.
      else if (daysDiff === 0) {
        // noop: rely on scheduleMaintenanceReminders for exact timing
      }
      // Maintenances dues bientôt (selon les préférences)
      else if (daysDiff > 0 && daysDiff <= (maintenance.notification_time_before_value || 1)) {
        const unit = maintenance.notification_time_before_unit || 'days';
        let shouldNotify = false;

        switch (unit) {
          case 'hours':
            shouldNotify = daysDiff <= 1; // Si due dans moins d'un jour
            break;
          case 'days':
            shouldNotify = daysDiff <= (maintenance.notification_time_before_value || 1);
            break;
          case 'weeks':
            shouldNotify = daysDiff <= (maintenance.notification_time_before_value || 1) * 7;
            break;
        }

        if (shouldNotify) {
          // Si l'échéance est très proche, préférer une notification immédiate
          if (daysDiff <= 1) {
            notifyMaintenanceNow(
              maintenance.title,
              maintenance.equipment_name
            );
          } else {
            showMaintenanceReminder(
              maintenance.title,
              maintenance.next_due_date,
              maintenance.equipment_name
            );
          }
        }
      }
    });

    }, 2000); // Attendre 2 secondes après le chargement

    // Vérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(() => {
      // Re-exécuter la logique de vérification
      if (!isEnabled || !maintenances.length) return;
      
      const currentNow = new Date();
      const currentToday = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate());
      
      maintenances.forEach(maintenance => {
        if (maintenance.status === 'completed' || !maintenance.notification_enabled) return;
        
        const dueDate = new Date(maintenance.next_due_date);
        const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const daysDiff = Math.floor((dueDateNormalized.getTime() - currentToday.getTime()) / (1000 * 60 * 60 * 24));
        
        // Vérifier seulement les maintenances critiques en continu
        if (daysDiff < 0) {
          const daysPastDue = Math.abs(daysDiff);
          showUrgentAlert(
            `Maintenance en retard (${daysPastDue} jours): ${maintenance.title}`,
            maintenance.equipment_name
          );
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isEnabled, maintenances]);

  return null; // Ce composant n'affiche rien directement
}
