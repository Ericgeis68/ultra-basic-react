import React, { useState, useEffect } from 'react';
import EquipmentCard from '@/components/dashboard/EquipmentCard';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import MaintenanceAlerts, { Alert } from '@/components/dashboard/MaintenanceAlerts';
import { NotificationStatus } from '@/components/dashboard/NotificationStatus';
import CustomCard from '@/components/ui/CustomCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Hook pour gérer le bouton retour Android
  useAndroidBackButton({
    currentScreen: 'dashboard',
    showExitConfirmation: true,
    exitConfirmationMessage: 'Voulez-vous vraiment quitter l\'application ?'
  });

  // Mock data for equipment
  const equipments = [
    {
      id: 'eq1',
      name: 'Machine de production A',
      status: 'operational',
      healthPercentage: 85,
      nextMaintenance: '15/07/2024',
      location: 'Zone A',
      department: 'Production'
    },
    {
      id: 'eq2',
      name: 'Convoyeur B',
      status: 'maintenance',
      healthPercentage: 60,
      nextMaintenance: '10/07/2024',
      location: 'Zone B',
      department: 'Logistique'
    },
    {
      id: 'eq3',
      name: 'Système de refroidissement',
      status: 'faulty',
      healthPercentage: 30,
      nextMaintenance: '05/07/2024',
      location: 'Zone C',
      department: 'Production'
    },
    {
      id: 'eq4',
      name: 'Ascenseur principal',
      status: 'operational',
      healthPercentage: 90,
      nextMaintenance: '25/07/2024',
      location: 'Bâtiment 1',
      department: 'Services'
    }
  ];

  // Mock data for maintenance tasks
  const tasks = [
    {
      id: 't1',
      title: 'Inspection machine A',
      equipment: 'Machine de production A',
      date: '07/07/2024',
      assignee: 'Michel Dupont',
      priority: 'high',
      status: 'pending'
    },
    {
      id: 't2',
      title: 'Remplacement filtre',
      equipment: 'Système de refroidissement',
      date: '05/07/2024',
      assignee: 'Sophie Martin',
      priority: 'urgent',
      status: 'in-progress'
    },
    {
      id: 't3',
      title: 'Lubrification Convoyeur',
      equipment: 'Convoyeur B',
      date: '10/07/2024',
      assignee: 'Jean Leroy',
      priority: 'medium',
      status: 'pending'
    }
  ];

  // Mock data for alerts - fix the type property to match the Alert type
  const alerts: Alert[] = [
    {
      id: 'a1',
      title: 'Panne critique - Système de refroidissement',
      description: 'Le système de refroidissement a signalé une surchauffe. Intervention urgente requise.',
      type: 'urgent',
      date: '04/07/2024',
      equipmentId: 'eq3'
    },
    {
      id: 'a2',
      title: 'Maintenance préventive à planifier',
      description: 'Le Convoyeur B nécessite une maintenance préventive dans les 5 jours.',
      type: 'warning',
      date: '05/07/2024',
      equipmentId: 'eq2'
    },
    {
      id: 'a3',
      title: 'Pièce de rechange disponible',
      description: 'La pièce commandée pour la Machine de production A est disponible au magasin.',
      type: 'info',
      date: '03/07/2024',
      equipmentId: 'eq1'
    }
  ];

  const summaryItems = [
    {
      title: 'Équipements',
      value: '124',
      change: '+3',
      color: 'text-blue-500'
    },
    {
      title: 'Tâches en cours',
      value: '18',
      change: '-2',
      color: 'text-amber-500'
    },
    {
      title: 'Problèmes critiques',
      value: '3',
      change: '+1',
      color: 'text-red-500'
    },
    {
      title: 'Taux disponibilité',
      value: '96%',
      change: '+2%',
      color: 'text-green-500'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="w-16 justify-center">Urgent</Badge>;
      case 'high':
        return <Badge variant="default" className="w-16 justify-center bg-amber-500">Élevée</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="w-16 justify-center">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline" className="w-16 justify-center">Basse</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-500">Terminé</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">En cours</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">À faire</Badge>;
      default:
        return null;
    }
  };

  // Ajuster le padding en fonction de la taille de l'écran
  const containerClass = isMobile
    ? "p-4 pt-20 min-h-screen"
    : "p-6 pt-20 md:p-8 md:pl-72 page-transition min-h-screen";

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Tâches à venir</h2>
              <Button variant="outline" size={isMobile ? "sm" : "default"}>Voir tout</Button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <CustomCard key={task.id} variant="default" className="border p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm md:text-base truncate max-w-[70%]">{task.title}</h3>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 truncate">{task.equipment}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{task.date}</span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CustomCard>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Alertes</h2>
              <Button variant="outline" size={isMobile ? "sm" : "default"}>Voir tout</Button>
            </div>
            <MaintenanceAlerts alerts={alerts} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Équipements à surveiller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipments.filter(eq => eq.status !== 'operational').map((equipment) => (
                <EquipmentCard
                  key={equipment.id}
                  id={equipment.id}
                  name={equipment.name}
                  status={equipment.status as 'operational' | 'maintenance' | 'faulty'}
                  healthPercentage={equipment.healthPercentage}
                  nextMaintenance={equipment.nextMaintenance}
                  location={equipment.location}
                  department={equipment.department}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Tous les équipements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {equipments.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                id={equipment.id}
                name={equipment.name}
                status={equipment.status as 'operational' | 'maintenance' | 'faulty'}
                healthPercentage={equipment.healthPercentage}
                nextMaintenance={equipment.nextMaintenance}
                location={equipment.location}
                department={equipment.department}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
