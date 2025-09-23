import { useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

interface BackButtonOptions {
  currentScreen: string;
  onNavigateBack?: () => void;
  showExitConfirmation?: boolean;
  exitConfirmationMessage?: string;
}

export function useAndroidBackButton({
  currentScreen,
  onNavigateBack,
  showExitConfirmation = true,
  exitConfirmationMessage = 'Voulez-vous vraiment quitter l\'application ?'
}: BackButtonOptions) {
  const navigationStack = useRef<string[]>([]);
  const lastBackTime = useRef<number>(0);

  // Ajouter l'écran courant à la pile de navigation
  useEffect(() => {
    if (currentScreen && !navigationStack.current.includes(currentScreen)) {
      navigationStack.current.push(currentScreen);
    }
  }, [currentScreen]);

  // Gérer le bouton retour
  const handleBackButton = useCallback(async () => {
    const now = Date.now();
    
    try {
      // Si on a une fonction de navigation personnalisée
      if (onNavigateBack) {
        onNavigateBack();
        return;
      }

      // Gérer la pile de navigation
      if (navigationStack.current.length > 1) {
        // Retirer l'écran courant et naviguer vers le précédent
        navigationStack.current.pop();
        const previousScreen = navigationStack.current[navigationStack.current.length - 1];
        
        // Ici vous pouvez ajouter la logique de navigation selon votre router
        console.log('Navigate back to:', previousScreen);
        
        // Exemple avec react-router
        if (typeof window !== 'undefined' && window.history) {
          window.history.back();
        }
        return;
      }

      // Si on est à l'écran d'accueil, gérer la sortie de l'app
      if (showExitConfirmation) {
        // Double tap pour quitter (dans les 2 secondes)
        if (now - lastBackTime.current < 2000) {
          await CapacitorApp.exitApp();
          return;
        }
        
        lastBackTime.current = now;
        
        // Afficher un message toast ou alert
        if (typeof window !== 'undefined' && window.alert) {
          const shouldExit = window.confirm(exitConfirmationMessage);
          if (shouldExit) {
            await CapacitorApp.exitApp();
          }
        } else {
          // Fallback: toast message pour double tap
          console.log('Appuyez à nouveau pour quitter');
          // Ici vous pouvez déclencher un toast avec votre système de notifications
        }
      } else {
        // Quitter directement sans confirmation
        await CapacitorApp.exitApp();
      }
    } catch (error) {
      console.error('Erreur gestion bouton retour:', error);
    }
  }, [onNavigateBack, showExitConfirmation, exitConfirmationMessage]);

  // Écouter le bouton retour physique
  useEffect(() => {
    let backButtonListener: any;

    const setupBackButtonListener = async () => {
      try {
        backButtonListener = await CapacitorApp.addListener('backButton', handleBackButton);
      } catch (error) {
        // Ignore les erreurs sur web ou si Capacitor n'est pas disponible
        console.log('Back button listener not available (web environment)');
      }
    };

    setupBackButtonListener();

    // Cleanup
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [handleBackButton]);

  // Méthodes utilitaires
  const pushToNavigationStack = useCallback((screen: string) => {
    navigationStack.current.push(screen);
  }, []);

  const clearNavigationStack = useCallback(() => {
    navigationStack.current = [];
  }, []);

  const getCurrentStack = useCallback(() => {
    return [...navigationStack.current];
  }, []);

  // Gérer le bouton retour web (browser back button)
  useEffect(() => {
    const handleBrowserBack = (event: PopStateEvent) => {
      // Optionnel: gérer aussi le bouton retour du navigateur
      if (onNavigateBack) {
        event.preventDefault();
        onNavigateBack();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleBrowserBack);
      
      return () => {
        window.removeEventListener('popstate', handleBrowserBack);
      };
    }
  }, [onNavigateBack]);

  return {
    pushToNavigationStack,
    clearNavigationStack,
    getCurrentStack,
    navigationStackLength: navigationStack.current.length
  };
}