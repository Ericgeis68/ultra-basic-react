import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { navItems } from './Sidebar'; // Re-use navItems from Sidebar
import {
  Tooltip,
  TooltipContent,
  // TooltipProvider, // L'importation de TooltipProvider n'est pas nécessaire ici car il est déjà à la racine
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useEmblaCarousel from 'embla-carousel-react'; // Import Embla Carousel

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  // Initialiser Embla Carousel pour le glissement horizontal
  const [emblaRef] = useEmblaCarousel({
    dragFree: true, // Permet un glissement libre sans s'accrocher à des diapositives spécifiques
    containScroll: 'trimSnaps', // Assure que le contenu ne défile pas au-delà de la fin
    loop: false, // Pas de boucle pour la navigation
    align: 'start', // Aligne les éléments au début de la vue
  });

  if (isLoading) {
    return null; // Ou un spinner de chargement
  }

  const isAdmin = user?.role === 'admin';
  const userPreferences = user?.menu_preferences || {};

  // Filtrer les éléments de navigation pour les onglets inférieurs mobiles
  const mobileNavItems = navItems.filter(item => {
    if (item.requiredRole === 'admin' && !isAdmin) {
      return false;
    }
    if (!isAdmin && item.settingKey && userPreferences[item.settingKey] === false) {
      return false;
    }
    const mobileRelevantPaths = [
      '/dashboard',
      '/equipment',
      '/scanner',
      '/tasks',
      '/notifications',
      '/interventions',
      // '/profile', // Supprimé car l'élément 'Profil' a été retiré de navItems dans Sidebar.tsx
      '/documents',
      '/equipment-groups',
      '/parts',
      '/maintenance',
      '/staff',
      '/facilities',
      // Removed '/reports' from mobileRelevantPaths
      // Ajoutez d'autres chemins pertinents pour les onglets inférieurs mobiles
    ];
    return mobileRelevantPaths.includes(item.href);
  }); // Suppression de .slice(0, 8) pour permettre le défilement de tous les éléments

  return (
    // <TooltipProvider> // Supprimé car déjà présent à la racine de l'application dans main.tsx
      <nav className="fixed inset-x-0 bottom-0 z-30 bg-surface border-t border-border shadow-lg md:hidden">
        <div className="flex h-16 items-center overflow-hidden"> {/* Conteneur externe, masque le débordement */}
          <div className="embla__viewport w-full" ref={emblaRef}> {/* Vue Embla */}
            <div className="embla__container flex flex-nowrap"> {/* Conteneur Embla pour les éléments */}
              {mobileNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const linkContent = (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-1 rounded-md transition-colors duration-200",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs mt-1 font-medium truncate max-w-[60px]">
                      {item.label}
                    </span>
                  </div>
                );

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    // Chaque NavLink agit comme une "diapositive" Embla
                    className="embla__slide flex-shrink-0 w-[80px] flex justify-center items-center h-full"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="top" className="mb-2">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    // </TooltipProvider>
  );
};

export default BottomNavigation;
