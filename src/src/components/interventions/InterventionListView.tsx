import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronRight, Clock, User, Wrench, ChevronUp, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { InterventionUI } from '@/types/intervention';
import { Equipment } from '@/types/equipment';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { cleanTechnicianNames } from '@/lib/print-utils';

interface InterventionListViewProps {
  interventions: InterventionUI[];
  equipments: Equipment[];
  onEditIntervention: (intervention: InterventionUI) => void;
  onDeleteIntervention: (interventionId: string) => void;
  onExportToPDF: (intervention: InterventionUI) => void;
  onEquipmentClick: (equipmentId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getTypeBadge: (type: string) => React.ReactNode;
}

const InterventionListView: React.FC<InterventionListViewProps> = ({
  interventions,
  equipments,
  onEditIntervention,
  onDeleteIntervention,
  onExportToPDF,
  onEquipmentClick,
  getStatusBadge,
  getTypeBadge,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof InterventionUI | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (interventionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(interventionId)) {
      newExpandedRows.delete(interventionId);
    } else {
      newExpandedRows.add(interventionId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSort = (column: keyof InterventionUI) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedInterventions = useMemo(() => {
    if (!sortColumn) return interventions;
    
    const sortableInterventions = [...interventions];
    return sortableInterventions.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
  }, [interventions, sortColumn, sortDirection]);


  const getEquipmentForIntervention = (intervention: InterventionUI) => {
    const equipmentId = intervention.equipmentId || intervention.equipment_id;
    return equipments.find(eq => eq.id === equipmentId) || null;
  };

  const getSortIcon = (column: keyof InterventionUI) => {
    if (sortColumn !== column) return <ArrowUp className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-2">
                Titre
                {getSortIcon('title')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center gap-2">
                Type
                {getSortIcon('type')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('equipment_id')}
            >
              <div className="flex items-center gap-2">
                Équipement
                {getSortIcon('equipment_id')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Statut
                {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('scheduled_date')}
            >
              <div className="flex items-center gap-2">
                Date d'intervention
                {getSortIcon('scheduled_date')}
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInterventions.map((intervention) => (
            <React.Fragment key={intervention.id}>
              <TableRow className="hover:bg-gray-50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(intervention.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedRows.has(intervention.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {intervention.title || 'Sans titre'}
                </TableCell>
                <TableCell>
                  {getTypeBadge(intervention.type)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => onEquipmentClick(intervention.equipmentId || intervention.equipment_id || '')}
                  >
                    {getEquipmentForIntervention(intervention)?.name || 'Équipement inconnu'}
                  </Button>
                </TableCell>
                <TableCell>
                  {getStatusBadge(intervention.status || 'scheduled')}
                </TableCell>
                <TableCell>
                  {intervention.scheduled_date 
                    ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy')
                    : 'Non définie'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditIntervention(intervention)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteIntervention(intervention.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExportToPDF(intervention)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                      title="Exporter en PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedRows.has(intervention.id) && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <div className="bg-gray-50 p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Dates
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Date d'intervention:</strong> {intervention.scheduled_date ? format(new Date(intervention.scheduled_date), 'dd/MM/yyyy HH:mm') : 'Non définie'}</p>
                            {intervention.start_date && (
                              <p><strong>Début:</strong> {format(new Date(intervention.start_date), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                            {intervention.completed_date && (
                              <p><strong>Fin:</strong> {format(new Date(intervention.completed_date), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Techniciens
                          </h4>
                          <div className="text-sm">
                            <p>{cleanTechnicianNames(intervention.technicians)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                            <Wrench className="h-4 w-4" />
                            Détails
                          </h4>
                          <div className="space-y-1 text-sm">
                            {intervention.priority && (
                              <p><strong>Priorité:</strong> {intervention.priority}</p>
                            )}
                            {intervention.duration && (
                              <p><strong>Durée:</strong> {intervention.duration} min</p>
                            )}
                          </div>
                        </div>
                        
                        
                        {intervention.actions && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Actions réalisées</h4>
                            <p className="text-sm text-gray-600">{intervention.actions}</p>
                          </div>
                        )}
                        
                        {intervention.technician_history && intervention.technician_history.length > 0 && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Historique des interventions
                            </h4>
                            <div className="space-y-3">
                              {intervention.technician_history.map((entry: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-sm text-blue-600">
                                      {entry.technician_name || 'Technicien inconnu'}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {entry.date_start ? format(new Date(entry.date_start), 'dd/MM/yyyy') : 'Date inconnue'}
                                      {entry.date_end ? 
                                        (entry.date_start && format(new Date(entry.date_start), 'dd/MM/yyyy') === format(new Date(entry.date_end), 'dd/MM/yyyy') ? 
                                          ' (Terminée)' : 
                                          ` → ${format(new Date(entry.date_end), 'dd/MM/yyyy')}`) : 
                                        ' (En cours)'}
                                    </span>
                                  </div>
                                  {entry.actions && (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">Actions:</span> {entry.actions}
                                    </div>
                                  )}
                                  {entry.parts_used && entry.parts_used.length > 0 && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      <span className="font-medium">Pièces utilisées:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {entry.parts_used.map((part: any, partIndex: number) => (
                                          <span key={partIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                            {part.name} ({part.quantity})
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

    </div>
  );
};

export default InterventionListView;