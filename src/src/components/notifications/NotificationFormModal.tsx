import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Calendar, Clock, Save, User, ChevronDown, Plus, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationFormModalProps {
  open: boolean;
  onClose: () => void;
  notification?: UserNotification;
}

interface FormData {
  title: string;
  description: string;
  category: 'general' | 'meeting' | 'task' | 'reminder' | 'personal';
  scheduled_date: string;
  reminder_time: number;
  recipient_ids: string[];
  persistent: boolean;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

export function NotificationFormModal({ open, onClose, notification }: NotificationFormModalProps) {
  const { createNotification, updateNotification } = useUserNotifications();
  const { showInterventionNotification, isEnabled } = useMaintenanceNotifications();
  const { user } = useCustomAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showOtherUsers, setShowOtherUsers] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      title: notification?.title || '',
      description: notification?.description || '',
      category: notification?.category || 'general',
      scheduled_date: notification?.scheduled_date ? new Date(notification.scheduled_date).toISOString().slice(0, 16) : '',
      reminder_time: notification?.reminder_time || 15,
      recipient_ids: notification?.user_id ? [notification.user_id] : [],
      persistent: notification?.persistent ?? true
    }
  });

  // Charger la liste des utilisateurs et initialiser les destinataires
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, username, role')
          .order('full_name');

        if (error) {
          console.error('Erreur chargement utilisateurs:', error);
          return;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    if (open) {
      fetchUsers();
      
      // Initialiser les destinataires sélectionnés si on modifie une notification
      if (notification) {
        const recipients = notification.recipients || (notification.user_id ? [notification.user_id] : []);
        setSelectedRecipients(recipients);
      } else {
        // Pré-sélectionner l'utilisateur connecté par défaut
        setSelectedRecipients(user ? [user.id] : []);
      }
    }
  }, [open, notification]);

  const onSubmit = async (data: FormData) => {
    try {
      const notificationData = {
        title: data.title,
        description: data.description,
        category: data.category,
        scheduled_date: new Date(data.scheduled_date).toISOString(),
        reminder_time: data.reminder_time,
        recipients: selectedRecipients,
        persistent: data.persistent
      };

      if (notification) {
        await updateNotification(notification.id, notificationData);
      } else {
        // Créer la notification dans la base de données
        await createNotification(notificationData);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedRecipients([]);
    setShowOtherUsers(false);
    onClose();
  };

  const toggleRecipient = (userId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {notification ? 'Modifier la notification' : 'Créer une notification'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Titre de la notification"
              {...register('title', { 
                required: 'Le titre est requis',
                minLength: { value: 2, message: 'Le titre doit faire au moins 2 caractères' }
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description détaillée (optionnel)"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select 
              value={watch('category')} 
              onValueChange={(value) => setValue('category', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="meeting">Réunion</SelectItem>
                <SelectItem value="task">Tâche</SelectItem>
                <SelectItem value="reminder">Rappel</SelectItem>
                <SelectItem value="personal">Personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinataires */}
          <div className="space-y-3">
            <Label>
              <User className="h-4 w-4 inline mr-1" />
              Destinataires * ({selectedRecipients.length} sélectionné{selectedRecipients.length > 1 ? 's' : ''})
            </Label>
            
            <div className="border rounded-md p-3 space-y-2">
              {/* Utilisateur connecté (toujours visible) */}
              {user && users.find(u => u.id === user.id) && (
                <div 
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    selectedRecipients.includes(user.id) 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleRecipient(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(user.id)}
                    onChange={() => toggleRecipient(user.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{users.find(u => u.id === user.id)?.full_name}</span>
                      <span className="text-sm text-muted-foreground">({users.find(u => u.id === user.id)?.username})</span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Moi</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton pour afficher/masquer les autres utilisateurs */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowOtherUsers(!showOtherUsers)}
              >
                {showOtherUsers ? (
                  <>
                    <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                    Masquer les autres utilisateurs
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Ajouter d'autres destinataires ({users.filter(u => u.id !== user?.id).length})
                  </>
                )}
              </Button>

              {/* Autres utilisateurs (cachés par défaut) */}
              {showOtherUsers && (
                <div className="max-h-48 overflow-y-auto space-y-2 border-t pt-2">
                  {users.filter(u => u.id !== user?.id).map(otherUser => (
                    <div 
                      key={otherUser.id} 
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedRecipients.includes(otherUser.id) 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleRecipient(otherUser.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(otherUser.id)}
                        onChange={() => toggleRecipient(otherUser.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{otherUser.full_name}</span>
                          <span className="text-sm text-muted-foreground">({otherUser.username})</span>
                          <span className="text-xs bg-muted px-1 rounded">{otherUser.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedRecipients.length === 0 && (
              <p className="text-sm text-destructive">Au moins un destinataire est requis</p>
            )}
          </div>

          {/* Date programmée */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Date et heure programmée *</Label>
            <Input
              id="scheduled_date"
              type="datetime-local"
              {...register('scheduled_date', { required: 'La date est requise' })}
            />
            {errors.scheduled_date && (
              <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>
            )}
          </div>

          {/* Rappel */}
          <div className="space-y-2">
            <Label htmlFor="reminder_time">
              <Clock className="h-4 w-4 inline mr-1" />
              Rappel avant (minutes)
            </Label>
            <Select 
              value={watch('reminder_time')?.toString() || '15'} 
              onValueChange={(value) => setValue('reminder_time', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
                <SelectItem value="1440">1 jour</SelectItem>
                <SelectItem value="10080">1 semaine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Persistance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {watch('persistent') ? (
                  <Shield className="h-4 w-4 text-green-600" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-orange-600" />
                )}
                Notification persistante
              </Label>
              <Switch
                checked={watch('persistent')}
                onCheckedChange={(checked) => setValue('persistent', checked)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {watch('persistent') 
                ? "✓ La notification restera visible jusqu'à suppression manuelle" 
                : "⚠️ La notification disparaîtra automatiquement après quelques secondes"
              }
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedRecipients.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}