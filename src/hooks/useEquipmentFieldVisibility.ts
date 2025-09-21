import { useState, useEffect } from 'react';

interface EquipmentFieldVisibilitySettings {
  card: {
    manufacturer: boolean;
    model: boolean;
    uf: boolean;
    purchase_date: boolean;
    inventory_number: boolean;
    serial_number: boolean;
    supplier: boolean;
    warranty_expiry: boolean;
    description: boolean;
    health_percentage: boolean;
    building: boolean;
    service: boolean;
    location: boolean;
    groups: boolean;
    date_mise_en_service: boolean;
  };
  list: {
    manufacturer: boolean;
    model: boolean;
    uf: boolean;
    purchase_date: boolean;
    inventory_number: boolean;
    serial_number: boolean;
    supplier: boolean;
    warranty_expiry: boolean;
    description: boolean;
    health_percentage: boolean;
    building: boolean;
    service: boolean;
    location: boolean;
    groups: boolean;
    date_mise_en_service: boolean;
  };
}

const defaultSettings: EquipmentFieldVisibilitySettings = {
  card: {
    manufacturer: true,
    model: true,
    uf: true,
    purchase_date: true,
    inventory_number: true,
    serial_number: true,
    supplier: false,
    warranty_expiry: false,
    description: false,
    health_percentage: true,
    building: false,
    service: false,
    location: false,
    groups: false,
    date_mise_en_service: false,
  },
  list: {
    manufacturer: true,
    model: true,
    uf: true,
    purchase_date: false,
    inventory_number: true,
    serial_number: true,
    supplier: false,
    warranty_expiry: false,
    description: false,
    health_percentage: true,
    building: false,
    service: false,
    location: false,
    groups: true,
    date_mise_en_service: false,
  },
};

export const useEquipmentFieldVisibility = () => {
  const [settings, setSettings] = useState<EquipmentFieldVisibilitySettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('equipmentFieldVisibility');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          card: { ...defaultSettings.card, ...parsedSettings.card },
          list: { ...defaultSettings.list, ...parsedSettings.list },
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de visibilité:', error);
    }
  };

  return {
    cardFields: settings.card,
    listFields: settings.list,
    refreshSettings: loadSettings,
  };
};
