import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'technician';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Accès refusé</h2>
          <p className="mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Vérifier les permissions de menu pour les utilisateurs non-admin
  if (user && user.role !== 'admin') {
    const userPreferences = user.menu_preferences || {};
    const currentPath = location.pathname;
    
    // Mapping des routes vers les clés de préférences
    const routePermissions: { [key: string]: string } = {
      '/dashboard': 'showDashboard',
      '/equipment': 'showEquipment',
      '/equipment-groups': 'showEquipmentGroups',
      '/parts': 'showParts',
      '/documents': 'showDocuments',
      '/maintenance': 'showMaintenance',
      '/interventions': 'showInterventions',
      '/tasks': 'showTasks',
      '/staff': 'showStaff',
      '/facilities': 'showFacilities',
      '/reports': 'showReports',
    };

    const permissionKey = routePermissions[currentPath];
    
    // Si la route nécessite une permission et que l'utilisateur ne l'a pas
    if (permissionKey && userPreferences[permissionKey] === false) {
      // Trouver la première route disponible pour rediriger
      const availableRoutes = [
        { path: '/dashboard', key: 'showDashboard' },
        { path: '/equipment', key: 'showEquipment' },
        { path: '/equipment-groups', key: 'showEquipmentGroups' },
        { path: '/parts', key: 'showParts' },
        { path: '/documents', key: 'showDocuments' },
        { path: '/maintenance', key: 'showMaintenance' },
        { path: '/interventions', key: 'showInterventions' },
        { path: '/tasks', key: 'showTasks' },
        { path: '/staff', key: 'showStaff' },
        { path: '/facilities', key: 'showFacilities' },
        { path: '/reports', key: 'showReports' },
      ];

      const firstAvailableRoute = availableRoutes.find(route => {
        return userPreferences[route.key] !== false;
      });

      return <Navigate to={firstAvailableRoute?.path || '/dashboard'} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
