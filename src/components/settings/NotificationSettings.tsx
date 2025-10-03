import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { toast } from '@/hooks/use-toast';
import { Bell, TestTube2, Trash2, Volume2, Vibrate } from 'lucide-react';

export function NotificationSettings() {
  const {
    preferences,
    savePreferences,
    isEnabled,
    isPermissionGranted,
    requestPermissions,
    sendTestNotification,
    clearAllNotifications
  } = useMaintenanceNotifications();
  const { scheduleClassicNotification } = useMaintenanceNotifications();

  const [testing, setTesting] = useState(false);

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      console.log('🧪 Début du test de notification native...');
      const success = await sendTestNotification();
      if (success) {
        toast({
          title: "Test réussi",
          description: "La notification native a été envoyée. Vérifiez la barre de notification Android.",
        });
        console.log('✅ Test de notification native réussi');
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer la notification native. Vérifiez les permissions.",
          variant: "destructive"
        });
        console.log('❌ Test de notification native échoué');
      }
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      toast({
        title: "Erreur",
        description: "Échec du test de notification native.",
        variant: "destructive"
      });
    }
    setTesting(false);
  };

  // Tests classiques déplacés dans la page Notifications

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      toast({
        title: "Permissions accordées",
        description: "Les notifications sont maintenant activées.",
      });
    } else {
      toast({
        title: "Permissions refusées",
        description: "Veuillez autoriser les notifications dans les paramètres de votre appareil.",
        variant: "destructive"
      });
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearAllNotifications();
      toast({
        title: "Notifications effacées",
        description: "Toutes les notifications programmées ont été supprimées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les notifications.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications de Maintenance
          </CardTitle>
          <CardDescription>
            Configurez les notifications pour vos maintenances et interventions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* État des permissions */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">
                État des notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPermissionGranted ? "Autorisées" : "Non autorisées"}
              </p>
            </div>
            {!isPermissionGranted && (
              <Button onClick={handleRequestPermissions} variant="outline">
                Autoriser
              </Button>
            )}
          </div>

          {/* Activation générale */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Activer les notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevoir toutes les notifications de maintenance
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) => savePreferences({ enabled: checked })}
              disabled={!isPermissionGranted}
            />
          </div>

          {preferences.enabled && (
            <>
              {/* Sons */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <div>
                    <Label className="text-sm font-medium">Sons</Label>
                    <p className="text-xs text-muted-foreground">
                      Jouer un son avec les notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.sound}
                  onCheckedChange={(checked) => savePreferences({ sound: checked })}
                />
              </div>

              {/* Vibrations */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Vibrate className="h-4 w-4" />
                  <div>
                    <Label className="text-sm font-medium">Vibrations</Label>
                    <p className="text-xs text-muted-foreground">
                      Faire vibrer l'appareil
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.vibration}
                  onCheckedChange={(checked) => savePreferences({ vibration: checked })}
                />
              </div>

              {/* Notifications classiques (interventions, générales) */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Notifications classiques
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Interventions et notifications générales
                  </p>
                </div>
                <Switch
                  checked={preferences.classicNotifications}
                  onCheckedChange={(checked) => savePreferences({ classicNotifications: checked })}
                />
              </div>

              {/* Rappels de maintenance */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Rappels de maintenance
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications avant échéance
                  </p>
                </div>
                <Switch
                  checked={preferences.maintenanceReminders}
                  onCheckedChange={(checked) => savePreferences({ maintenanceReminders: checked })}
                />
              </div>

              {/* Alertes urgentes */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Alertes urgentes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications prioritaires avec vibration renforcée
                  </p>
                </div>
                <Switch
                  checked={preferences.urgentAlerts}
                  onCheckedChange={(checked) => savePreferences({ urgentAlerts: checked })}
                />
              </div>

              {/* Rappel avant échéance retiré (géré dans les modals) */}

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-2 pt-4 border-t w-full">
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={testing || !isEnabled}
                  className="w-full sm:w-auto flex-1"
                >
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? "Envoi..." : "Test maintenance"}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setTesting(true);
                    try {
                      await scheduleClassicNotification('🧪 Test Rappel', undefined, 'Test immédiat de rappel');
                      toast({ title: 'Test rappel envoyé', description: 'Une notification classique immédiate a été envoyée.' });
                    } catch {
                      toast({ title: 'Erreur', description: "Impossible d'envoyer le test de rappel.", variant: 'destructive' });
                    }
                    setTesting(false);
                  }}
                  disabled={testing || !isEnabled}
                  className="w-full sm:w-auto flex-1"
                >
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? "Envoi..." : "Test rappel"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClearNotifications}
                  disabled={!isEnabled}
                  className="w-full sm:w-auto flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Effacer tout
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
