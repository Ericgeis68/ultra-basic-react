import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Calendar, Save, User, ChevronDown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { MultiDatePicker } from '@/components/ui/multi-date-picker';
import { cn } from '@/lib/utils';

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
  recipient_ids: string[];
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
  const [multiSchedule, setMultiSchedule] = useState(false);
  const [multiDates, setMultiDates] = useState<Date[]>([]);
  
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
      scheduled_date: notification?.scheduled_date ? (() => {
        const d = new Date(notification.scheduled_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      })() : '',
      recipient_ids: notification?.user_id ? [notification.user_id] : [],
      
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

  // Avoid UTC shift when editing date-time locally
  const setLocalScheduled = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    setValue('scheduled_date', `${yyyy}-${mm}-${dd}T${hh}:${mi}`);
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  const onSubmit = async (data: FormData) => {
    try {
      if (multiSchedule && multiDates.length > 0) {
        const isoDates = multiDates.map(d => new Date(d).toISOString());
        if (notification) {
          const [first, ...rest] = isoDates;
          await updateNotification(notification.id, {
            title: data.title,
            description: data.description,
            category: data.category,
            scheduled_date: first,
            recipients: selectedRecipients,
          });
          for (const dt of rest) {
            await createNotification({
              title: data.title,
              description: data.description,
              category: data.category,
              scheduled_date: dt,
              recipients: selectedRecipients,
            });
          }
        } else {
          for (const dt of isoDates) {
            await createNotification({
              title: data.title,
              description: data.description,
              category: data.category,
              scheduled_date: dt,
              recipients: selectedRecipients,
            });
          }
        }
      } else {
        // Construire la date strictement en local pour éviter tout glissement de fuseau
        const [datePart, timePart] = (data.scheduled_date || '').split('T');
        const [y, m, d] = (datePart || '').split('-').map(v => parseInt(v, 10));
        const [hh, mm] = (timePart || '00:00').split(':').map(v => parseInt(v, 10));
        const localDateObj = new Date(
          Number.isFinite(y) ? y : new Date().getFullYear(),
          (Number.isFinite(m) ? m : 1) - 1,
          Number.isFinite(d) ? d : new Date().getDate(),
          Number.isFinite(hh) ? hh : 0,
          Number.isFinite(mm) ? mm : 0,
          0,
          0
        );
        const localIso = localDateObj.toISOString();
        await (notification
          ? updateNotification(notification.id, {
              title: data.title,
              description: data.description,
              category: data.category,
              scheduled_date: localIso,
              recipients: selectedRecipients,
            })
          : createNotification({
              title: data.title,
              description: data.description,
              category: data.category,
              scheduled_date: localIso,
              recipients: selectedRecipients,
            }));
      }
      
      // Recharger les données et informer le reste de l'app
      try { window.dispatchEvent(new Event('notifications:updated')); } catch {}
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {notification ? 'Modifier la notification' : 'Créer une notification'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
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

          {/* Date programmée / Multi-date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Date(s) et heure(s) programmée(s) *</Label>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Multi-date</span>
                <input type="checkbox" className="h-4 w-4" checked={multiSchedule} onChange={(e) => setMultiSchedule(e.target.checked)} />
              </div>
            </div>
            {!multiSchedule ? (
              <div className="grid gap-2">
                <div className="block sm:hidden">
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    min={(() => { const now = new Date(); const off = now.getTimezoneOffset(); const local = new Date(now.getTime() - off*60000); return local.toISOString().slice(0,16); })()}
                    {...register('scheduled_date', { required: 'La date est requise' })}
                  />
                </div>
                <div className="hidden sm:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>
                          {watch('scheduled_date')
                            ? new Date(watch('scheduled_date')).toLocaleString()
                            : 'Choisir une date et une heure'}
                        </span>
                        <Calendar className="h-4 w-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] sm:w-[360px] p-3" align="start">
                      <div className="space-y-3">
                        <CalendarComponent
                          mode="single"
                          selected={watch('scheduled_date') ? new Date(watch('scheduled_date')) : undefined}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          onSelect={(day) => {
                            const current = watch('scheduled_date') ? new Date(watch('scheduled_date')) : new Date();
                            if (day) {
                              const merged = new Date(day);
                              merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
                              setLocalScheduled(merged);
                            }
                          }}
                          initialFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Heures</Label>
                            <Select
                              value={(watch('scheduled_date') ? new Date(watch('scheduled_date')).getHours() : 9).toString()}
                              onValueChange={(val) => {
                                const date = watch('scheduled_date') ? new Date(watch('scheduled_date')) : new Date();
                                date.setHours(parseInt(val), date.getMinutes(), 0, 0);
                                setLocalScheduled(date);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {Array.from({ length: 24 }).map((_, h) => (
                                  <SelectItem key={h} value={h.toString()}>{h.toString().padStart(2, '0')} h</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Minutes</Label>
                            <Select
                              value={(watch('scheduled_date') ? new Date(watch('scheduled_date')).getMinutes() : 0).toString()}
                              onValueChange={(val) => {
                                const date = watch('scheduled_date') ? new Date(watch('scheduled_date')) : new Date();
                                date.setMinutes(parseInt(val), 0, 0);
                                setLocalScheduled(date);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-56">
                                {[0, 5, 10, 15, 20, 30, 40, 45, 50, 55].map((m) => (
                                  <SelectItem key={m} value={m.toString()}>{m.toString().padStart(2, '0')} min</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <div>
                <MultiDatePicker selected={multiDates} onSelect={(dates) => setMultiDates(dates || [])} />
                {multiDates.length === 0 && (
                  <p className="text-sm text-destructive mt-2">Au moins une date est requise</p>
                )}
              </div>
            )}
            {!multiSchedule && errors.scheduled_date && (
              <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>
            )}
          </div>

          {/* Options avancées supprimées: aucun rappel avant, planification stricte */}

          {/* Option de persistance supprimée */}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
