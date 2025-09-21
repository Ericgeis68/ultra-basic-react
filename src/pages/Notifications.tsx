import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { NotificationFormModal } from '@/components/notifications/NotificationFormModal';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Plus, Bell, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomAuth } from '@/hooks/useCustomAuth';

export default function Notifications() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { notifications, loading, getStats } = useUserNotifications();
  const { user, isAdmin } = useCustomAuth();
  const isMobile = useIsMobile();
  
  const stats = getStats();

  const filterNotifications = (filter: string) => {
    const now = new Date();
    
    // Filtrer d'abord les notifications visibles pour l'utilisateur
    const visibleNotifications = notifications.filter(notification => {
      // Admin peut voir toutes les notifications
      if (isAdmin()) return true;
      
      // Utilisateur normal ne voit que ses notifications ou celles qui lui sont destinées
      const isRecipient = notification.user_id === user?.id ||
                         (notification.recipients &&
                          notification.recipients.includes(user?.id));
      return isRecipient;
    });
    
    switch (filter) {
      case 'unread':
        return visibleNotifications.filter(n => !n.is_read);
      case 'urgent':
        return visibleNotifications.filter(n => !n.is_completed && new Date(n.scheduled_date) < new Date());
      case 'overdue':
        return visibleNotifications.filter(n => {
          const scheduled = new Date(n.scheduled_date);
          return scheduled < now && !n.is_completed;
        });
      case 'completed':
        return visibleNotifications.filter(n => n.is_completed);
      case 'today':
        return visibleNotifications.filter(n => {
          const scheduled = new Date(n.scheduled_date);
          const today = new Date();
          return scheduled.toDateString() === today.toDateString();
        });
      default:
        return visibleNotifications.filter(n => !n.is_completed);
    }
  };

  const filteredNotifications = filterNotifications(activeTab);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Bell className="h-6 w-6 md:h-8 w-8" />
            Notifications & Rappels
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos notifications et rappels personnels
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          size={isMobile ? "sm" : "default"}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une notification
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de filtrage */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-6'}`}>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
          {!isMobile && <TabsTrigger value="urgent">Urgentes</TabsTrigger>}
          {!isMobile && <TabsTrigger value="overdue">En retard</TabsTrigger>}
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === 'all' 
                    ? 'Aucune notification' 
                    : `Aucune notification ${activeTab === 'unread' ? 'non lue' : activeTab}`
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? 'Créez votre première notification pour commencer.'
                    : 'Rien à afficher dans cette catégorie pour le moment.'
                  }
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une notification
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard 
                  key={notification.id} 
                  notification={notification} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de création */}
      <NotificationFormModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}