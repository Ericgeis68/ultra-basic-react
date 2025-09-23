import React, { useState, useEffect } from 'react';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import { NotificationStatus } from '@/components/dashboard/NotificationStatus';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '@/hooks/use-supabase-collection';
import { useMaintenance } from '@/hooks/useMaintenance';
import { Equipment } from '@/types/equipment';
import { InterventionUI } from '@/types/intervention';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Hook pour gérer le bouton retour Android
  useAndroidBackButton({
    currentScreen: 'dashboard',
    showExitConfirmation: true,
    exitConfirmationMessage: 'Voulez-vous vraiment quitter l\'application ?'
  });

  // Récupération des vraies données
  const { data: equipments, loading: equipmentsLoading, error: equipmentsError } = useCollection<Equipment>({ tableName: 'equipments' });
  const { data: maintenances, loading: maintenancesLoading, error: maintenancesError } = useMaintenance();
  const { data: interventions, loading: interventionsLoading, error: interventionsError } = useCollection<any>({ tableName: 'interventions' });



  // Calcul des statistiques adaptées à l'application
  const summaryItems = React.useMemo(() => {
    const totalEquipments = equipments?.length || 0;
    const totalMaintenances = maintenances?.length || 0;
    const totalInterventions = interventions?.length || 0;
    const completedInterventions = interventions?.filter(int => int.status === 'completed').length || 0;
    const inProgressInterventions = interventions?.filter(int => int.status === 'in-progress').length || 0;
    const scheduledMaintenances = maintenances?.filter(maintenance => {
      const dueDate = new Date(maintenance.next_due_date);
      return dueDate >= new Date();
    }).length || 0;

    return [
      {
        title: 'Équipements',
        value: totalEquipments.toString(),
        change: '+0',
        color: 'text-blue-500'
      },
      {
        title: 'Maintenances',
        value: totalMaintenances.toString(),
        change: scheduledMaintenances > 0 ? `+${scheduledMaintenances}` : '0',
        color: 'text-purple-500'
      },
      {
        title: 'Interventions',
        value: totalInterventions.toString(),
        change: inProgressInterventions > 0 ? `+${inProgressInterventions}` : '0',
        color: 'text-amber-500'
      },
      {
        title: 'Terminées',
        value: completedInterventions.toString(),
        change: completedInterventions > 0 ? `+${completedInterventions}` : '0',
        color: 'text-green-500'
      }
    ];
  }, [equipments, interventions, maintenances]);


  // Ajuster le padding en fonction de la taille de l'écran
  const containerClass = isMobile
    ? "p-4 pt-20 min-h-screen"
    : "p-6 pt-20 md:p-8 md:pl-72 page-transition min-h-screen";

  // Gestion du chargement
  const isLoading = equipmentsLoading || maintenancesLoading || interventionsLoading;
  const hasError = equipmentsError || maintenancesError || interventionsError;

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto py-20 px-4">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">Erreur lors du chargement des données</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Aperçu des données de maintenance et des équipements.
          </p>
        </div>
        <div>
          {/* Add any dashboard specific buttons here if needed */}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {summaryItems.map((item, index) => (
            <CustomCard key={index} variant="default" className="border p-3 md:p-5">
              <div className="flex flex-col">
                <p className="text-xs md:text-sm text-muted-foreground truncate">{item.title}</p>
                <div className="flex items-end mt-1 space-x-2">
                  <h3 className={`text-lg md:text-2xl font-bold ${item.color}`}>{item.value}</h3>
                  <span className="text-xs font-medium text-green-500 mb-1">{item.change}</span>
                </div>
              </div>
            </CustomCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="lg:col-span-2">
            <AnalyticsOverview />
          </div>

          <div>
            <NotificationStatus />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Maintenances à venir</h2>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => navigate('/maintenance')}>
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {maintenances && maintenances.length > 0 ? (
                maintenances
                  .filter(maintenance => {
                    const dueDate = new Date(maintenance.next_due_date);
                    return dueDate >= new Date();
                  })
                  .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
                  .slice(0, 5)
                  .map((maintenance) => (
                    <CustomCard key={maintenance.id} variant="default" className="border p-3 md:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm md:text-base truncate max-w-[70%]">
                          {maintenance.title || 'Maintenance sans titre'}
                        </h3>
                        <Badge variant="outline" className="border-purple-500 text-purple-500">
                          {maintenance.type === 'preventive' ? 'Préventive' : 
                           maintenance.type === 'corrective' ? 'Corrective' : 
                           maintenance.type === 'regulatory' ? 'Réglementaire' : 
                           maintenance.type === 'improvement' ? 'Amélioration' : maintenance.type}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 truncate">
                        {maintenance.equipment_name || 'Équipement inconnu'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(maintenance.next_due_date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {maintenance.frequency_type === 'one-time' ? 'Unique' : 
                           maintenance.frequency_type === 'daily' ? 'Quotidien' :
                           maintenance.frequency_type === 'weekly' ? 'Hebdomadaire' :
                           maintenance.frequency_type === 'monthly' ? 'Mensuel' :
                           maintenance.frequency_type === 'yearly' ? 'Annuel' : maintenance.frequency_type}
                        </span>
                      </div>
                    </CustomCard>
                  ))
              ) : (
                <CustomCard variant="default" className="border p-3 md:p-4 text-center">
                  <p className="text-sm text-muted-foreground">Aucune maintenance planifiée</p>
                </CustomCard>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Interventions récentes</h2>
              <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => navigate('/interventions')}>
                Voir tout
              </Button>
            </div>
            <div className="space-y-3">
              {interventions && interventions.length > 0 ? (
                interventions
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((intervention) => {
                    // Trouver le nom de l'équipement
                    const equipment = equipments?.find(eq => eq.id === intervention.equipment_id);
                    const equipmentName = equipment?.name || 'Équipement inconnu';
                    
                    return (
                      <CustomCard key={intervention.id} variant="default" className="border p-3 md:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm md:text-base truncate max-w-[70%]">
                            {intervention.title || 'Intervention sans titre'}
                          </h3>
                          <Badge variant={intervention.status === 'completed' ? 'outline' : 'default'} 
                                 className={intervention.status === 'completed' ? 'border-green-500 text-green-500' : 'bg-blue-500'}>
                            {intervention.status === 'completed' ? 'Terminé' : 
                             intervention.status === 'in-progress' ? 'En cours' : 'Planifié'}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 truncate">
                          {equipmentName}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {intervention.scheduled_date ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy', { locale: fr }) : 'Non planifié'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {intervention.type === 'preventive' ? 'Préventive' : 
                             intervention.type === 'corrective' ? 'Corrective' : 
                             intervention.type === 'regulatory' ? 'Réglementaire' : 
                             intervention.type === 'improvement' ? 'Amélioration' : intervention.type}
                          </span>
                        </div>
                      </CustomCard>
                    );
                  })
              ) : (
                <CustomCard variant="default" className="border p-3 md:p-4 text-center">
                  <p className="text-sm text-muted-foreground">Aucune intervention récente</p>
                </CustomCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
