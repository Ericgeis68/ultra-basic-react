import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'general' | 'meeting' | 'task' | 'reminder' | 'personal';
  scheduled_date: string;
  is_read: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  recipients?: string[]; // Support pour plusieurs destinataires
}

export function useUserNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: customUser } = useCustomAuth();
  const { user: authUser } = useAuth() as any;
  const effectiveUser = customUser || authUser;
  const { isEnabled, scheduleClassicNotification } = useMaintenanceNotifications();

  // Charger les notifications
  const fetchNotifications = async () => {
    if (!effectiveUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Récupérer large puis filtrer côté client pour couvrir recipients stocké en texte/JSON
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Erreur chargement notifications:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les notifications.",
          variant: "destructive"
        });
        return;
      }

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

      const rows = (data as any[]) || [];
      const filtered = rows
        .map(row => ({ ...(row as any), recipients: normalizeRecipients((row as any).recipients) }))
        .filter(row => row.user_id === effectiveUser.id || (Array.isArray(row.recipients) && row.recipients.includes(effectiveUser.id)));

      setNotifications(filtered as UserNotification[]);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Créer une notification
  const createNotification = async (notification: (Omit<UserNotification, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'is_completed'> & { user_id?: string }) | (Omit<UserNotification, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'is_completed' | 'user_id'> & { recipients?: string[] })) => {
    if (!effectiveUser && !('user_id' in notification && notification.user_id) && !('recipients' in notification && notification.recipients)) return null;

    try {
      const insertData: any = {
        title: notification.title,
        description: notification.description,
        category: notification.category,
        scheduled_date: notification.scheduled_date,
      };

      // Support pour ancien format (user_id) ou nouveau (recipients)
      if ('recipients' in notification && notification.recipients) {
        insertData.recipients = notification.recipients; // envoyer en JSON natif
        insertData.user_id = notification.recipients[0]; // Compatibilité
      } else if ('user_id' in notification) {
        insertData.user_id = notification.user_id || effectiveUser?.id;
      } else {
        insertData.user_id = effectiveUser?.id;
      }

      const { data, error } = await supabase
        .from('user_notifications')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Erreur création notification:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer la notification.",
          variant: "destructive"
        });
        return null;
      }

      // Recharger seulement si la notification concerne l'utilisateur connecté
      const isForCurrentUser = ('recipients' in notification && notification.recipients?.includes(effectiveUser?.id)) ||
                               ('user_id' in notification && notification.user_id === effectiveUser?.id) ||
                               (!('recipients' in notification) && !('user_id' in notification));
      
      if (isForCurrentUser) {
        await fetchNotifications();
      }
      
      const recipientCount = 'recipients' in notification ? notification.recipients?.length || 1 : 1;
      const isForOthers = ('recipients' in notification && effectiveUser && !notification.recipients?.includes(effectiveUser.id)) ||
                         ('user_id' in notification && notification.user_id && notification.user_id !== effectiveUser?.id);
      
      toast({
        title: "Notification créée",
        description: isForOthers 
          ? `La notification a été créée pour ${recipientCount} destinataire${recipientCount > 1 ? 's' : ''}.`
          : "La notification a été créée avec succès."
      });

      // Déclenchement natif via hook maintenance (même canal) pour uniformité
      if (isEnabled && data) {
        try {
          const scheduled = new Date(data.scheduled_date);
          const now = new Date();
          const title = data.title;
          const body = data.description || '';
          await scheduleClassicNotification(title, scheduled.getTime() <= now.getTime() ? undefined : scheduled, body);
        } catch (e) {
          console.warn('Impossible de déclencher la notification classique (création):', e);
        }
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Marquer comme lue
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Erreur marquage lu:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  // Marquer comme complété
  const markAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_completed: true, is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Erreur marquage complété:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, is_completed: true, is_read: true } : notif)
      );
      // Recharger pour assurer la sync totale et rafraîchir les vues
      await fetchNotifications();
      try { window.dispatchEvent(new Event('notifications:updated')); } catch {}

      toast({
        title: "Tâche terminée",
        description: "La notification a été marquée comme terminée."
      });
    } catch (error) {
      console.error('Erreur lors du marquage complet:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur suppression notification:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la notification.",
          variant: "destructive"
        });
        return;
      }

      setNotifications(prev => prev.filter(notif => notif.id !== id));
      await fetchNotifications();
      try { window.dispatchEvent(new Event('notifications:updated')); } catch {}
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Mettre à jour une notification
  const updateNotification = async (id: string, updates: Partial<UserNotification>) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur mise à jour notification:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la notification.",
          variant: "destructive"
        });
        return;
      }

      await fetchNotifications(); // Recharger la liste
      toast({
        title: "Notification mise à jour",
        description: "La notification a été mise à jour avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  // Calculer les statistiques
  const getStats = () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const overdueCount = notifications.filter(n => {
      const scheduled = new Date(n.scheduled_date);
      const now = new Date();
      return scheduled < now && !n.is_completed;
    }).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      urgent: 0, // Plus de priorité urgente
      overdue: overdueCount,
      completed: notifications.filter(n => n.is_completed).length
    };
  };

  // Charger au montage et quand l'utilisateur change
  useEffect(() => {
    if (!effectiveUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Chargement initial
    fetchNotifications();

    // Abonnement Realtime aux changements sur user_notifications
    const channel = supabase
      .channel('user_notifications_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications' }, (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload as { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: any; old: any };

        // Filtrer pour l'utilisateur courant (compat recipients)
        const isForCurrentUser = !!(
          (newRow && (newRow.user_id === effectiveUser.id || (Array.isArray(newRow.recipients) && newRow.recipients.includes(effectiveUser.id)))) ||
          (oldRow && (oldRow.user_id === effectiveUser.id || (Array.isArray(oldRow.recipients) && oldRow.recipients.includes(effectiveUser.id))))
        );

        if (!isForCurrentUser) return;

        if (eventType === 'INSERT' && newRow) {
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newRow.id);
            if (exists) return prev;
            const updated = [...prev, newRow as UserNotification];
            // Garder l'ordre par date planifiée croissante
            return updated.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
          });

          // Déclenchement natif sur INSERT en temps réel
          if (isEnabled && newRow) {
            try {
              const scheduled = new Date(newRow.scheduled_date);
              const now = new Date();
              const title = newRow.title as string;
              const body = (newRow.description as string) || '';
              scheduleClassicNotification(title, scheduled.getTime() <= now.getTime() ? undefined : scheduled, body);
            } catch (e) {
              console.warn('Impossible de déclencher la notification classique (INSERT):', e);
            }
          }
        } else if (eventType === 'UPDATE' && newRow) {
          setNotifications(prev => prev.map(n => (n.id === newRow.id ? { ...n, ...(newRow as UserNotification) } : n)));
        } else if (eventType === 'DELETE' && oldRow) {
          setNotifications(prev => prev.filter(n => n.id !== oldRow.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUser, isEnabled, scheduleClassicNotification]);

  return {
    notifications,
    loading,
    createNotification,
    markAsRead,
    markAsCompleted,
    deleteNotification,
    updateNotification,
    fetchNotifications,
    getStats
  };
}
