import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Box,
  Calendar,
  Wrench,
  Users,
  Building,
  // BarChart, // Removed BarChart icon as Reports is removed
  ClipboardList,
  Settings as SettingsIcon,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Bell,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredRole?: 'admin';
  settingKey?: keyof UserMenuPreferences;
}

import { UserMenuPreferences } from '@/contexts/AuthContext';

// Export navItems so BottomNavigation can reuse them
export const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    settingKey: 'showDashboard'
  },
  {
    href: '/equipment',
    label: 'Équipements',
    icon: Box,
    settingKey: 'showEquipment'
  },
  {
    href: '/equipment-groups',
    label: 'Gestion Groupes',
    icon: FolderOpen,
    settingKey: 'showEquipmentGroups'
  },
  {
    href: '/parts',
    label: 'Pièces',
    icon: Package,
    settingKey: 'showParts'
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FileText,
    settingKey: 'showDocuments'
  },
  {
    href: '/maintenance',
    label: 'Maintenance',
    icon: Wrench,
    settingKey: 'showMaintenance'
  },
  {
    href: '/interventions',
    label: 'Interventions',
    icon: Calendar,
    settingKey: 'showInterventions'
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: Bell,
    settingKey: 'showNotifications'
  },
  {
    href: '/staff',
    label: 'Personnel',
    icon: Users,
    settingKey: 'showStaff'
  },
  {
    href: '/facilities',
    label: 'Installations',
    icon: Building,
    settingKey: 'showFacilities'
  },
  {
    href: '/settings',
    label: 'Paramètres',
    icon: SettingsIcon,
    requiredRole: 'admin',
    settingKey: 'showSettings'
  },
  {
    href: '/scanner',
    label: 'Scanner',
    icon: QrCode,
    settingKey: 'showScanner'
  },
  // L'élément 'Profil' a été supprimé car il est déjà accessible via le menu en haut à droite.
  // {
  //   href: '/profile',
  //   label: 'Profil',
  //   icon: UserIcon,
  //   settingKey: 'showProfile'
  // },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return <div>Loading sidebar...</div>;
  }

  if (isMobile) {
    return null;
  }

  const isAdmin = user?.role === 'admin';
  const userPreferences: UserMenuPreferences = user?.menu_preferences || {};

  const visibleNavItems = navItems.filter(item => {
    // Exclure le scanner de la sidebar
    if (item.href === '/scanner') {
      return false;
    }

    if (item.requiredRole === 'admin' && !isAdmin) {
      return false;
    }

    if (!isAdmin && item.settingKey) {
      if (userPreferences[item.settingKey] === false) {
        return false;
      }
      return true;
    }

    return true;
  });

  const sidebarClasses = cn(
    "fixed top-16 left-0 z-20 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out",
    "bg-background border-r",
    {
      "w-64": !isCollapsed,
      "w-20": isCollapsed,
    }
  );

  return (
    <TooltipProvider>
      <aside className={sidebarClasses}>
        <div className="p-4 h-full flex flex-col">
          <nav className="flex-1 space-y-1">
            {visibleNavItems.map((item) => {
              const menuButton = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    {
                      "justify-center": isCollapsed
                    }
                  )}
                >
                  <item.icon className={cn("h-5 w-5", { "mr-3": !isCollapsed })} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {menuButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return menuButton;
            })}
          </nav>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "mt-2 w-full",
                { "px-0 justify-center": isCollapsed }
              )}
              onClick={onToggleCollapse}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Réduire</span>
                </>
              )}
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
