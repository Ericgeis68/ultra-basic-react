// @ts-nocheck
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, CheckCircle, AlertTriangle, MoreVertical, Send, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StaffMember } from './StaffFormModal';
import { useToast } from "@/components/ui/use-toast";

interface CertificationTrackerProps {
  staff: StaffMember[];
  onUpdateStatus?: ( // Made optional as it's not used in the current Staff.tsx
    staffId: string,
    certificationName: string,
    newStatus: 'valid' | 'expiring-soon' | 'expired'
  ) => void;
}

const CertificationTracker: React.FC<CertificationTrackerProps> = ({
  staff,
  onUpdateStatus
}) => {
  const [filter, setFilter] = useState<'all' | 'expiring-soon' | 'expired'>('all');
  const { toast } = useToast();

  // Fonction pour filtrer les techniciens selon leurs certifications
  const getFilteredData = () => {
    const result: Array<{
      staffMember: StaffMember;
      certification: StaffMember['certifications'][number];
    }> = [];

    staff.forEach(member => {
      // Safely access certifications, default to empty array if null or undefined
      const memberCertifications = member.certifications || []; // Added null/undefined check
      memberCertifications.forEach(cert => {
        if (
          filter === 'all' ||
          (filter === 'expiring-soon' && cert.status === 'expiring-soon') ||
          (filter === 'expired' && cert.status === 'expired')
        ) {
          result.push({
            staffMember: member,
            certification: cert
          });
        }
      });
    });

    return result;
  };

  const filteredData = getFilteredData();

  const getStatusBadge = (status: 'valid' | 'expiring-soon' | 'expired') => {
    switch (status) {
      case 'valid':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valide
          </Badge>
        );
      case 'expiring-soon':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expire bientôt
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expirée
          </Badge>
        );
    }
  };

  const handleNotifyRenewal = (staffMember: StaffMember, certificationName: string) => {
    // Simulation d'envoi de notification
    toast({
      title: "Notification envoyée",
      description: `Une notification a été envoyée à ${staffMember.name} pour le renouvellement de ${certificationName}`,
    });
  };

  const handleMarkAsRenewed = (
    staffId: string,
    certificationName: string
  ) => {
    // Call the optional onUpdateStatus prop if it exists
    if (onUpdateStatus) {
      onUpdateStatus(staffId, certificationName, 'valid');
      toast({
        title: "Certification mise à jour",
        description: `La certification a été marquée comme renouvelée`,
        variant: "default",
      });
    } else {
       toast({
        title: "Action non implémentée",
        description: "La fonction de mise à jour du statut n'est pas disponible.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 w-full overflow-x-auto">
      <div className="flex flex-wrap space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Toutes
        </Button>
        <Button
          variant={filter === 'expiring-soon' ? 'default' : 'outline'}
          onClick={() => setFilter('expiring-soon')}
          size="sm"
        >
          Expirent bientôt
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          onClick={() => setFilter('expired')}
          size="sm"
        >
          Expirées
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technicien</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Date d'obtention</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucune certification {filter === 'expiring-soon' ? 'qui expire bientôt' : filter === 'expired' ? 'expirée' : ''} trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map(({ staffMember, certification }, index) => (
                  <TableRow key={`${staffMember.id}-${certification.name}-${index}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {staffMember.avatar_url ? (
                            <AvatarImage src={staffMember.avatar_url} alt={staffMember.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              {staffMember.name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{staffMember.name}</div>
                          <div className="text-xs text-muted-foreground">{staffMember.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{certification.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {format(new Date(certification.obtainedDate), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {certification.expiryDate ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {format(new Date(certification.expiryDate), "dd MMM yyyy", { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(certification.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(certification.status === 'expired' || certification.status === 'expiring-soon') && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleNotifyRenewal(staffMember, certification.name)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                <span>Notifier renouvellement</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMarkAsRenewed(staffMember.id!, certification.name)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                <span>Marquer comme renouvelé</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CertificationTracker;
