import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchBranding, upsertBranding } from '@/services/BrandingService';

// Define the shape of the settings state
interface AppSettings {
  menuVisibility: {
    showDashboard: boolean;
    showEquipment: boolean;
    showEquipmentGroups: boolean;
    showParts: boolean;
    showDocuments: boolean;
    showMaintenance: boolean;
    showInterventions: boolean;
    showTasks: boolean;
    showStaff: boolean;
    showFacilities: boolean;
    showReports: boolean;
  };
  // Add other settings here as needed (e.g., theme, language, etc.)
  branding: {
    appName: string;
    logoUrl: string;
    loginBackgroundUrl?: string;
    loginPanelVariant?: 'default' | 'glass' | 'bordered';
    loginTitle?: string;
  };
}

// Define the shape of the context value
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

// Create the context with a default value (null initially)
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Define the provider component
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Define default settings
  const defaultSettings: AppSettings = {
    menuVisibility: {
      showDashboard: true,
      showEquipment: true,
      showEquipmentGroups: true,
      showParts: true,
      showDocuments: true,
      showMaintenance: true,
      showInterventions: true,
      showTasks: true,
      showStaff: true,
      showFacilities: true,
      showReports: true,
    },
    // Add defaults for other settings
    branding: {
      appName: 'GMAO MEYER',
      logoUrl: '',
      loginBackgroundUrl: '',
      loginPanelVariant: 'default',
      loginTitle: 'Connexion',
    },
  };

  // State to hold the current settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const localStorageKey = 'gmaoAppSettings';

  // Load settings from local storage on initial mount
  useEffect(() => {
    // Load local settings
    try {
      const savedSettings = localStorage.getItem(localStorageKey);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings,
          menuVisibility: { ...prevSettings.menuVisibility, ...parsedSettings.menuVisibility },
          branding: { ...prevSettings.branding, ...(parsedSettings.branding || {}) },
        }));
      }
    } catch (error) {
      console.error("Failed to load settings from local storage:", error);
      setSettings(defaultSettings);
    }

    // Also try to fetch branding from Supabase for anonymous users
    (async () => {
      try {
        const branding = await fetchBranding();
        if (branding) {
          setSettings(prev => ({
            ...prev,
            branding: {
              ...prev.branding,
              appName: branding.app_name ?? prev.branding.appName,
              logoUrl: branding.logo_url ?? prev.branding.logoUrl,
              loginBackgroundUrl: branding.login_background_url ?? prev.branding.loginBackgroundUrl,
              loginPanelVariant: (branding.login_panel_variant as any) ?? prev.branding.loginPanelVariant,
              loginTitle: branding.login_title ?? prev.branding.loginTitle,
            }
          }));
        }
      } catch (e) {
        console.warn('Branding fetch skipped/failed:', e);
      }
    })();
  }, []);

  // Function to update settings and save to local storage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = {
        ...prevSettings,
        ...newSettings,
        // Deep merge for nested objects like menuVisibility
        menuVisibility: {
          ...prevSettings.menuVisibility,
          ...(newSettings.menuVisibility || {}), // Merge if newSettings.menuVisibility exists
        },
        // Deep merge other setting categories similarly
        branding: {
          ...prevSettings.branding,
          ...(newSettings.branding || {}),
        }
      };
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Failed to save settings to local storage:", error);
      }
      // Persist branding remotely (best-effort)
      const b = updatedSettings.branding;
      upsertBranding({
        app_name: b.appName,
        logo_url: b.logoUrl,
        login_background_url: b.loginBackgroundUrl,
        login_panel_variant: (b.loginPanelVariant as any) ?? null,
        login_title: b.loginTitle,
      }).catch(e => console.warn('upsertBranding failed:', e));
      return updatedSettings;
    });
  };

  // Provide the settings and update function to children
  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to easily access the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
