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

  const [testing, setTesting] = useState(false);

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        toast({
          title: "Test réussi",
          description: "La notification de test a été envoyée avec succès.",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer la notification de test.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec du test de notification.",
        variant: "destructive"
      });
    }
    setTesting(false);
  };

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

              {/* Délai de rappel */}
              {preferences.maintenanceReminders && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Rappel avant échéance
                  </Label>
                  <Select
                    value={preferences.reminderDays.toString()}
                    onValueChange={(value) => savePreferences({ reminderDays: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jour avant</SelectItem>
                      <SelectItem value="2">2 jours avant</SelectItem>
                      <SelectItem value="3">3 jours avant</SelectItem>
                      <SelectItem value="7">1 semaine avant</SelectItem>
                      <SelectItem value="14">2 semaines avant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={testing || !isEnabled}
                  className="flex-1"
                >
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? "Envoi..." : "Test"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClearNotifications}
                  disabled={!isEnabled}
                  className="flex-1"
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