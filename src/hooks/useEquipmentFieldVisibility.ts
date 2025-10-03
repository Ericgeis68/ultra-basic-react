import { useState, useEffect } from 'react';

interface EquipmentFieldVisibilitySettings {
  card: {
    manufacturer: boolean;
    model: boolean;
    uf: boolean;
    status: boolean;
    purchase_date: boolean;
    inventory_number: boolean;
    serial_number: boolean;
    supplier: boolean;
    purchase_price: boolean;
    warranty_expiry: boolean;
    health_percentage: boolean;
    building: boolean;
    service: boolean;
    location: boolean;
    groups: boolean;
    date_mise_en_service: boolean;
    loan_status: boolean;
    description: boolean;
  };
  list: {
    manufacturer: boolean;
    model: boolean;
    uf: boolean;
    status: boolean;
    purchase_date: boolean;
    inventory_number: boolean;
    serial_number: boolean;
    supplier: boolean;
    purchase_price: boolean;
    warranty_expiry: boolean;
    health_percentage: boolean;
    building: boolean;
    service: boolean;
    location: boolean;
    groups: boolean;
    date_mise_en_service: boolean;
    loan_status: boolean;
    description: boolean;
  };
}

const defaultSettings: EquipmentFieldVisibilitySettings = {
  card: {
    manufacturer: true,
    model: true,
    uf: true,
    status: true,
    purchase_date: true,
    inventory_number: true,
    serial_number: true,
    supplier: false,
    purchase_price: false,
    warranty_expiry: false,
    health_percentage: true,
    building: false,
    service: false,
    location: false,
    groups: false,
    date_mise_en_service: false,
    loan_status: true,
    description: false,
  },
  list: {
    manufacturer: true,
    model: true,
    uf: true,
    status: true,
    purchase_date: false,
    inventory_number: true,
    serial_number: true,
    supplier: false,
    purchase_price: false,
    warranty_expiry: false,
    health_percentage: true,
    building: false,
    service: false,
    location: false,
    groups: true,
    date_mise_en_service: false,
    loan_status: true,
    description: false,
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
