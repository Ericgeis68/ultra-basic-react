import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UserManagement from "./components/auth/UserManagement";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import BottomNavigation from "./components/layout/BottomNavigation";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Parts from "./pages/Parts";
import Documents from "./pages/Documents";
import Maintenance from "./pages/Maintenance";
import Interventions from "./pages/Interventions";
import Tasks from "./pages/Tasks";
import Staff from "./pages/Staff";
import Facilities from "./pages/Facilities";
// import Reports from "./pages/Reports"; // Removed Reports import
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import EquipmentGroupsPage from "./pages/EquipmentGroups";
import EquipmentGroupsManagement from "./pages/EquipmentGroupsManagement";
import { useIsMobile } from "./hooks/use-mobile";
import { cn } from "./lib/utils";
import Notifications from "./pages/Notifications";
import { GlobalMaintenanceNotifications } from "./components/notifications/GlobalMaintenanceNotifications";
import { GlobalMaintenanceSync } from "./components/notifications/GlobalMaintenanceSync";
import { NotificationToast } from "./components/notifications/NotificationToast";
import { GlobalUserNotifications } from "./components/notifications/GlobalUserNotifications";
import { GlobalWebInTabNotifications } from "./components/notifications/GlobalWebInTabNotifications";

const PrintStyles = () => (
  <style type="text/css">
    {`
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        main {
          padding: 0 !important;
          margin: 0 !important;
          transition: none !important;
          overflow: visible !important;
        }
        main > div.container {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100% !important;
        }
        aside, header, nav.fixed.bottom-0 { /* Hide sidebar, navbar, and bottom nav on print */
          display: none !important;
        }
      }
    `}
  </style>
);

// Composant pour gérer la redirection intelligente
const SmartRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  // Si on est déjà sur une route spécifique, ne pas rediriger
  if (location.pathname !== '/' && location.pathname !== '/index.html') {
    return <Navigate to={location.pathname} replace />;
  }

  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = user.role === 'admin';
  const userPreferences = user.menu_preferences || {};

  // Pour les admins, toujours rediriger vers dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pour les utilisateurs non-admin, vérifier les préférences
  const availableRoutes = [
    { path: '/dashboard', key: 'showDashboard' },
    { path: '/equipment', key: 'showEquipment' },
    { path: '/equipment-groups', key: 'showEquipmentGroups' },
    { path: '/parts', key: 'showParts' },
    { path: '/documents', key: 'showDocuments' },
    { path: '/maintenance', key: 'showMaintenance' },
    { path: '/interventions', key: 'showInterventions' },
    { path: '/tasks', 'key': 'showTasks' },
    { path: '/staff', key: 'showStaff' },
    { path: '/facilities', key: 'showFacilities' },
    // Removed Reports from availableRoutes
    // { path: '/reports', key: 'showReports' },
    { path: '/notifications', key: 'showNotifications' },
    { path: '/profile', key: 'showProfile' },
  ];

  // Trouver la première route disponible pour l'utilisateur
  const firstAvailableRoute = availableRoutes.find(route => {
    return userPreferences[route.key] !== false;
  });

  // Rediriger vers la première route disponible ou dashboard par défaut
  return <Navigate to={firstAvailableRoute?.path || '/dashboard'} replace />;
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (!isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const mainPaddingClass = isMobile
    ? "pb-16"
    : (sidebarCollapsed ? "md:pl-20" : "md:pl-64");

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-background">
      <Navbar toggleSidebar={toggleSidebar} isCollapsed={sidebarCollapsed} />
      {!isMobile && (
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}
      <main className={cn(
        "pt-16 transition-all duration-300 ease-in-out flex-1 overflow-auto",
        mainPaddingClass
      )}>
         <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
           {children}
         </div>
      </main>
      {isMobile && <BottomNavigation />}
    </div>
  );

  return (
    <>
      <PrintStyles />
      <GlobalMaintenanceNotifications />
      <GlobalMaintenanceSync />
      <GlobalUserNotifications />
      <GlobalWebInTabNotifications />
      <NotificationToast />
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><SmartRedirect /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/index.html" element={
          <ProtectedRoute>
            <Layout><SmartRedirect /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/equipment" element={
          <ProtectedRoute>
            <Layout><Equipment /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/parts" element={
          <ProtectedRoute>
            <Layout><Parts /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <Layout><Documents /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/maintenance" element={
          <ProtectedRoute>
            <Layout><Maintenance /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/interventions" element={
          <ProtectedRoute>
            <Layout><Interventions /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Layout><Tasks /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute>
            <Layout><Staff /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/facilities" element={
          <ProtectedRoute>
            <Layout><Facilities /></Layout>
          </ProtectedRoute>
        } />
        {/* Removed Reports route */}
        {/* <Route path="/reports" element={
          <ProtectedRoute>
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } /> */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><UserManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/equipment-groups" element={
          <ProtectedRoute>
            <Layout><EquipmentGroupsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/equipment-groups/management" element={
          <ProtectedRoute>
            <Layout><EquipmentGroupsManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/equipment-groups/create" element={
          <ProtectedRoute>
            <Layout><EquipmentGroupsManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout><Notifications /></Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={
          <ProtectedRoute>
            <Layout><NotFound /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

export default App;
