import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface EquipmentStatusBadgeProps {
  status: string;
  scaleFactor?: number; // Facteur de mise à l'échelle pour le ratio fixe
}

const EquipmentStatusBadge: React.FC<EquipmentStatusBadgeProps> = ({ status, scaleFactor = 1 }) => {
  const iconSize = Math.round(6 * scaleFactor); // Taille d'icône encore plus réduite pour économiser l'espace
  const fontSize = Math.round(7 * scaleFactor); // Taille de police encore plus réduite
  
  switch (status) {
    case 'operational':
      return (
        <Badge 
          variant="outline" 
          className="border-green-500 text-green-500 flex items-center gap-1"
          style={{ 
            fontSize: `${fontSize}px`,
            padding: `${1 * scaleFactor}px ${3 * scaleFactor}px`,
            height: `${14 * scaleFactor}px`,
            lineHeight: `${14 * scaleFactor}px`
          }}
        >
          <CheckCircle style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
          Opérationnel
        </Badge>
      );
    case 'maintenance':
      return (
        <Badge 
          variant="outline" 
          className="border-amber-500 text-amber-500 flex items-center gap-1"
          style={{ 
            fontSize: `${fontSize}px`,
            padding: `${1 * scaleFactor}px ${3 * scaleFactor}px`,
            height: `${14 * scaleFactor}px`,
            lineHeight: `${14 * scaleFactor}px`
          }}
        >
          <Clock style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
          En maintenance
        </Badge>
      );
    case 'faulty':
      return (
        <Badge 
          variant="outline" 
          className="border-red-500 text-red-500 flex items-center gap-1"
          style={{ 
            fontSize: `${fontSize}px`,
            padding: `${1 * scaleFactor}px ${3 * scaleFactor}px`,
            height: `${14 * scaleFactor}px`,
            lineHeight: `${14 * scaleFactor}px`
          }}
        >
          <AlertTriangle style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
          En panne
        </Badge>
      );
    default:
      return null;
  }
};

export default EquipmentStatusBadge;
