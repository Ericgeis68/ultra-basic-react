import { useEffect, useRef, useState } from 'react';
import { useIntegratedMaintenanceNotifications } from '@/hooks/useIntegratedMaintenanceNotifications';
import { useMaintenance } from '@/hooks/useMaintenance';
import { toast } from '@/hooks/use-toast';

export function GlobalMaintenanceNotifications() {
  const { isEnabled } = useIntegratedMaintenanceNotifications();
  const { maintenances } = useMaintenance();
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Afficher les toasts web même si les permissions locales (mobile) ne sont pas encore prêtes
    if (!maintenances.length) return;

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

      // Maintenances en retard
      if (daysDiff < 0) {
        if (shownIdsRef.current.has(`overdue-${maintenance.id}`)) return;
        const daysPastDue = Math.abs(daysDiff);
        toast({
          title: "🚨 Maintenance en retard",
          description: (
            <div className="space-y-2">
              <div className="font-medium">{maintenance.title}</div>
              <div className="text-sm text-muted-foreground">
                Équipement: {maintenance.equipment_name}
              </div>
              <div className="text-sm text-destructive">
                En retard de {daysPastDue} jour{daysPastDue > 1 ? 's' : ''}
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 12000,
        });
        shownIdsRef.current.add(`overdue-${maintenance.id}`);
      }
      // Maintenances à réaliser aujourd'hui
      else if (daysDiff === 0) {
        if (shownIdsRef.current.has(`today-${maintenance.id}`)) return;
        toast({
          title: "📅 Maintenance à réaliser aujourd'hui",
          description: (
            <div className="space-y-2">
              <div className="font-medium">{maintenance.title}</div>
              <div className="text-sm text-muted-foreground">
                Équipement: {maintenance.equipment_name}
              </div>
              <div className="text-sm text-warning">
                À réaliser aujourd'hui
              </div>
            </div>
          ),
          duration: 10000,
        });
        shownIdsRef.current.add(`today-${maintenance.id}`);
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
          if (shownIdsRef.current.has(`soon-${maintenance.id}-${daysDiff}`)) return;
          toast({
            title: "🔔 Rappel de maintenance",
            description: (
              <div className="space-y-2">
                <div className="font-medium">{maintenance.title}</div>
                <div className="text-sm text-muted-foreground">
                  Équipement: {maintenance.equipment_name}
                </div>
                <div className="text-sm text-primary">
                  À réaliser dans {daysDiff} jour{daysDiff > 1 ? 's' : ''}
                </div>
              </div>
            ),
            duration: 9000,
          });
          shownIdsRef.current.add(`soon-${maintenance.id}-${daysDiff}`);
        }
      }
    });

    }, 2000); // Attendre 2 secondes après le chargement

    // Vérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(() => {
      // Re-exécuter la logique de vérification (web)
      if (!maintenances.length) return;
      
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
          if (!shownIdsRef.current.has(`overdue-${maintenance.id}`)) {
            toast({
            title: "🚨 Maintenance en retard",
            description: `${maintenance.title} - ${maintenance.equipment_name} - En retard de ${daysPastDue} jour${daysPastDue > 1 ? 's' : ''}`,
            variant: "destructive",
              duration: 12000,
            });
            shownIdsRef.current.add(`overdue-${maintenance.id}`);
          }
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isEnabled, maintenances]);

  // Reset anti-doublons quand la liste est vidée (changement d'utilisateur)
  useEffect(() => {
    if (!maintenances.length && (hasShownInitial || shownIdsRef.current.size > 0)) {
      setHasShownInitial(false);
      shownIdsRef.current = new Set();
    }
  }, [maintenances, hasShownInitial]);

  return null; // Ce composant n'affiche rien directement
}