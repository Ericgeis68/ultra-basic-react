import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMaintenanceNotifications } from '@/hooks/useMaintenanceNotifications';
import { useIntegratedMaintenanceNotifications } from '@/hooks/useIntegratedMaintenanceNotifications';
import { Bell, BellOff, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotificationStatus() {
  const { 
    preferences, 
    isEnabled, 
    isPermissionGranted, 
    requestPermissions 
  } = useMaintenanceNotifications();
  
  const { isEnabled: integrationEnabled } = useIntegratedMaintenanceNotifications();

  const getStatusColor = () => {
    if (isEnabled && integrationEnabled) return 'default';
    if (isPermissionGranted && preferences.enabled) return 'secondary';
    return 'destructive';
  };

  const getStatusText = () => {
    if (!isPermissionGranted) return 'Permissions requises';
    if (!preferences.enabled) return 'Désactivées';
    if (!integrationEnabled) return 'Configuration incomplète';
    return 'Actives';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Notifications
        </CardTitle>
        {isEnabled ? (
          <Bell className="h-4 w-4 text-muted-foreground" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge variant={getStatusColor()}>
            {getStatusText()}
          </Badge>
          
          {preferences.enabled && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Rappels: {preferences.reminderDays}j avant</div>
              <div>• Sons: {preferences.sound ? 'Oui' : 'Non'}</div>
              <div>• Vibrations: {preferences.vibration ? 'Oui' : 'Non'}</div>
            </div>
          )}
          
          <div className="flex gap-1">
            {!isPermissionGranted && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={requestPermissions}
                className="text-xs"
              >
                Autoriser
              </Button>
            )}
            
            <Button size="sm" variant="outline" asChild className="text-xs">
              <Link to="/settings?tab=notifications">
                <Settings className="h-3 w-3 mr-1" />
                Config
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}