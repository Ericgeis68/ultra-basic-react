import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  };

  // State to hold the current settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const localStorageKey = 'gmaoAppSettings';

  // Load settings from local storage on initial mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(localStorageKey);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge saved settings with defaults to handle new settings being added
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings,
          menuVisibility: {
            ...prevSettings.menuVisibility,
            ...parsedSettings.menuVisibility,
          },
          // Merge other setting categories similarly
        }));
      }
    } catch (error) {
      console.error("Failed to load settings from local storage:", error);
      // If loading fails, use default settings
      setSettings(defaultSettings);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

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
      };
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Failed to save settings to local storage:", error);
      }
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
