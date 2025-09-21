import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    health_percentage: true,
    building: false,
    service: false,
    location: false,
    groups: true,
    date_mise_en_service: false,
  },
};

const fieldLabels = {
  manufacturer: 'Fabricant',
  model: 'Modèle',
  uf: 'UF',
  purchase_date: 'Date d\'achat',
  inventory_number: 'Numéro d\'inventaire',
  serial_number: 'Numéro de série',
  supplier: 'Fournisseur',
  warranty_expiry: 'Fin de garantie',
  health_percentage: 'État de santé',
  building: 'Bâtiment',
  service: 'Service',
  location: 'Local',
  groups: 'Groupes',
  date_mise_en_service: 'Mise en service',
};

const EquipmentFieldVisibilitySettings = () => {
  const [settings, setSettings] = useState<EquipmentFieldVisibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

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
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('equipmentFieldVisibility', JSON.stringify(settings));
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres de visibilité des champs ont été mis à jour.',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCardField = (field: keyof EquipmentFieldVisibilitySettings['card'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      card: {
        ...prev.card,
        [field]: value,
      },
    }));
  };

  const updateListField = (field: keyof EquipmentFieldVisibilitySettings['list'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      list: {
        ...prev.list,
        [field]: value,
      },
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const renderFieldControls = (
    type: 'card' | 'list',
    fieldSettings: EquipmentFieldVisibilitySettings['card'] | EquipmentFieldVisibilitySettings['list'],
    updateFunction: (field: string, value: boolean) => void
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(fieldLabels).map(([field, label]) => (
        <div key={field} className="flex items-center space-x-2">
          <Switch
            id={`${type}-${field}`}
            checked={fieldSettings[field as keyof typeof fieldSettings]}
            onCheckedChange={(checked) => updateFunction(field, checked)}
          />
          <Label htmlFor={`${type}-${field}`} className="text-sm">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des champs d'équipements</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configurez les champs qui doivent être visibles dans les cartes et listes d'équipements.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">Vue Carte</TabsTrigger>
            <TabsTrigger value="list">Vue Liste</TabsTrigger>
          </TabsList>
          
          <TabsContent value="card" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Champs affichés dans les cartes d'équipements</h3>
              {renderFieldControls('card', settings.card, updateCardField)}
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Champs affichés dans la liste d'équipements</h3>
              {renderFieldControls('list', settings.list, updateListField)}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            Réinitialiser
          </Button>
          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentFieldVisibilitySettings;
