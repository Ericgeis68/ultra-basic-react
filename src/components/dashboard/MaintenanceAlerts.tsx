import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Alert = {
  id: string;
  title: string;
  description: string;
  type: "urgent" | "warning" | "info";
  date: string;
  equipmentId: string;
};

interface MaintenanceAlertsProps {
  className?: string;
  alerts: Alert[];
}

const MaintenanceAlerts = ({ className, alerts }: MaintenanceAlertsProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "warning":
        return <Badge className="bg-amber-500">Attention</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-medium">Alertes</CardTitle>
          <CardDescription>Maintenance et alertes équipements</CardDescription>
        </div>
        <Button variant="outline" className="h-8 text-xs">
          Voir tout
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start px-6 py-2 hover:bg-accent/50 transition-colors"
            >
              <div className="mt-0.5 mr-3">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
                <div className="flex items-center pt-1">
                  <time className="text-xs text-muted-foreground">{alert.date}</time>
                  <div className="ml-auto">{getAlertBadge(alert.type)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceAlerts;
