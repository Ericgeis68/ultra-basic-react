import React from 'react';
import { CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import CustomCard from '../ui/CustomCard';
import { Badge } from '@/components/ui/badge';

type EquipmentCardProps = {
  id: string;
  name: string;
  status: 'operational' | 'maintenance' | 'faulty';
  healthPercentage: number;
  nextMaintenance?: string;
  location: string;
  department: string;
};

const EquipmentCard = ({
  id,
  name,
  status,
  healthPercentage,
  nextMaintenance,
  location,
  department
}: EquipmentCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-amber-500';
      case 'faulty':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'maintenance':
        return 'En maintenance';
      case 'faulty':
        return 'En panne';
      default:
        return 'Inconnu';
    }
  };

  const getHealthColor = () => {
    if (healthPercentage >= 70) return 'text-green-500';
    if (healthPercentage >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'faulty':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <CustomCard variant="default" hover className="border">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-lg truncate">{name}</h3>
        <Badge variant={status === 'operational' ? 'default' : status === 'maintenance' ? 'secondary' : 'destructive'} className="ml-2 flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">État de santé</p>
        <div className="flex items-center gap-3">
          <Progress value={healthPercentage} className="h-2" />
          <span className={`text-sm font-medium ${getHealthColor()}`}>
            {healthPercentage}%
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Emplacement</p>
          <p className="text-sm font-medium">{location}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Département</p>
          <p className="text-sm font-medium">{department}</p>
        </div>
      </div>
      
      {nextMaintenance && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-xs">
              Prochaine maintenance: <span className="font-medium">{nextMaintenance}</span>
            </p>
          </div>
        </div>
      )}
    </CustomCard>
  );
};

export default EquipmentCard;
