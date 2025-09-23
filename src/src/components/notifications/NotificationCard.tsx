import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserNotifications, UserNotification } from '@/hooks/useUserNotifications';
import { NotificationFormModal } from './NotificationFormModal';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Bell,
  Users,
  Clipboard,
  Heart,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationCardProps {
  notification: UserNotification;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const { markAsRead, markAsCompleted, deleteNotification } = useUserNotifications();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'task': return <Clipboard className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      case 'personal': return <Heart className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meeting': return 'Réunion';
      case 'task': return 'Tâche';
      case 'reminder': return 'Rappel';
      case 'personal': return 'Personnel';
      default: return 'Général';
    }
  };

  const isOverdue = () => {
    const scheduled = new Date(notification.scheduled_date);
    const now = new Date();
    return scheduled < now && !notification.is_completed;
  };

  const handleMarkAsRead = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAsCompleted = () => {
    markAsCompleted(notification.id);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      deleteNotification(notification.id);
    }
  };

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          !notification.is_read ? 'border-l-4 border-l-primary' : ''
        } ${notification.is_completed ? 'opacity-60' : ''}`}
        onClick={handleMarkAsRead}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getCategoryIcon(notification.category)}
                  {getCategoryLabel(notification.category)}
                </Badge>

                {!notification.is_read && (
                  <Badge variant="default">Nouveau</Badge>
                )}

                {notification.is_completed && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Terminé
                  </Badge>
                )}

                {isOverdue() && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    En retard
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg leading-tight">
                {notification.title}
              </h3>
              
              {notification.description && (
                <p className="text-muted-foreground text-sm">
                  {notification.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(notification.scheduled_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Rappel: {notification.reminder_time}min avant
              </div>
            </div>

            {!notification.is_completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsCompleted();
                }}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Terminer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        notification={notification}
      />
    </>
  );
}