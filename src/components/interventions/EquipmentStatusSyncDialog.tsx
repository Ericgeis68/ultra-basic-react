import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Wrench } from "lucide-react";

interface EquipmentStatusSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentName: string;
  currentEquipmentStatus: string;
  interventionStatus: 'in-progress' | 'completed';
  onConfirm: (newEquipmentStatus: 'operational' | 'faulty') => void;
}

const EquipmentStatusSyncDialog: React.FC<EquipmentStatusSyncDialogProps> = ({
  isOpen,
  onClose,
  equipmentName,
  currentEquipmentStatus,
  interventionStatus,
  onConfirm
}) => {
  const isInterventionInProgress = interventionStatus === 'in-progress';
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Opérationnel
          </Badge>
        );
      case 'faulty':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            En panne
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            En maintenance
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleConfirmFaulty = () => {
    onConfirm('faulty');
    onClose();
  };

  const handleConfirmOperational = () => {
    onConfirm('operational');
    onClose();
  };

  const handleKeepCurrent = () => {
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg mx-4 sm:mx-auto">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <span className="leading-tight">Synchroniser le statut de l'équipement</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-sm">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-medium text-foreground">Équipement :</span>
                <span className="text-muted-foreground break-words">{equipmentName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-medium text-foreground">Statut actuel :</span>
                <div className="flex-shrink-0">
                  {getStatusBadge(currentEquipmentStatus)}
                </div>
              </div>
            </div>
            
            <div className="text-muted-foreground leading-relaxed">
              {isInterventionInProgress ? (
                <>
                  L'intervention est maintenant <strong className="text-foreground">en cours</strong>. 
                  Souhaitez-vous marquer l'équipement comme <strong className="text-foreground">en panne</strong> 
                  ou le laisser <strong className="text-foreground">opérationnel</strong> ?
                </>
              ) : (
                <>
                  L'intervention est maintenant <strong className="text-foreground">terminée</strong>. 
                  Souhaitez-vous remettre l'équipement en statut <strong className="text-foreground">opérationnel</strong> 
                  ou le laisser dans son état actuel ?
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {isInterventionInProgress ? (
            <>
              <AlertDialogAction
                onClick={handleConfirmFaulty}
                className="bg-red-600 hover:bg-red-700 text-white order-1 sm:order-1 w-full sm:w-auto sm:flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Marquer comme "En panne"</span>
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleConfirmOperational}
                className="bg-green-600 hover:bg-green-700 text-white order-2 sm:order-2 w-full sm:w-auto sm:flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Garder "Opérationnel"</span>
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogAction
                onClick={handleConfirmOperational}
                className="bg-green-600 hover:bg-green-700 text-white order-1 sm:order-1 w-full sm:w-auto sm:flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Remettre "Opérationnel"</span>
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleKeepCurrent}
                className="bg-gray-600 hover:bg-gray-700 text-white order-2 sm:order-2 w-full sm:w-auto sm:flex-1"
              >
                <span className="truncate">Garder le statut actuel</span>
              </AlertDialogAction>
            </>
          )}
          <AlertDialogCancel 
            onClick={handleKeepCurrent} 
            className="order-3 sm:order-3 w-full sm:w-auto border-muted-foreground/20"
          >
            Annuler
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EquipmentStatusSyncDialog;
