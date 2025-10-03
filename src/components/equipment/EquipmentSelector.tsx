import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, MapPin, Building, Users, QrCode, X } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import QrScanner from '@/components/equipment/QrScanner';
import { useCollection } from '@/hooks/use-supabase-collection';

interface EquipmentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  groups?: EquipmentGroup[];
  buildings?: BuildingType[];
  services?: Service[];
  locations?: Location[];
  title?: string;
  placeholder?: string;
  
  // Props for single selection mode
  onSelect?: (equipment: Equipment) => void;
  selectedEquipmentId?: string;

  // Props for multi-selection mode
  multiSelect?: boolean;
  onMultiSelect?: (selectedEquipments: Equipment[]) => void;
  initialSelectedEquipmentIds?: string[];
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  isOpen,
  onClose,
  equipments,
  groups = [],
  buildings = [],
  services = [],
  locations = [],
  title = "Sélectionner un équipement",
  placeholder = "Rechercher un équipement...",
  onSelect,
  selectedEquipmentId,
  multiSelect = false,
  onMultiSelect,
  initialSelectedEquipmentIds = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const itemsPerPage = 10;

  // Fetch additional data if not provided
  const { data: fetchedBuildings } = useCollection<BuildingType>({
    tableName: 'buildings'
  });

  const { data: fetchedServices } = useCollection<Service>({
    tableName: 'services'
  });

  const { data: fetchedLocations } = useCollection<Location>({
    tableName: 'locations'
  });

  const { data: fetchedGroups } = useCollection<EquipmentGroup>({
    tableName: 'equipment_groups'
  });

  // Use provided data or fallback to fetched data
  const allBuildings = buildings.length > 0 ? buildings : (fetchedBuildings || []);
  const allServices = services.length > 0 ? services : (fetchedServices || []);
  const allLocations = locations.length > 0 ? locations : (fetchedLocations || []);
  const allGroups = groups.length > 0 ? groups : (fetchedGroups || []);

  // Initialize currentSelections when dialog opens or initialSelectedEquipmentIds change
  useEffect(() => {
    if (isOpen && multiSelect) {
      setCurrentSelections(initialSelectedEquipmentIds);
    }
  }, [isOpen, multiSelect, initialSelectedEquipmentIds]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterGroup, filterBuilding, filterService, filterLocation]);

  // Reset filters and selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilterStatus('all');
      setFilterGroup('all');
      setFilterBuilding('all');
      setFilterService('all');
      setFilterLocation('all');
      setCurrentPage(1);
      setShowFilters(false);
    }
  }, [isOpen]);

  // Helper functions to get names
  const getGroupName = (groupId: string) => {
    const group = allGroups.find(g => g.id === groupId);
    return group ? group.name : `Groupe ${groupId.substring(0, 8)}...`;
  };

  const getBuildingName = (buildingId: string) => {
    const building = allBuildings.find(b => b.id === buildingId);
    return building ? building.name : `Bâtiment ${buildingId.substring(0, 8)}...`;
  };

  const getServiceName = (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId);
    return service ? service.name : `Service ${serviceId.substring(0, 8)}...`;
  };

  const getLocationName = (locationId: string) => {
    const location = allLocations.find(l => l.id === locationId);
    return location ? location.name : `Local ${locationId.substring(0, 8)}...`;
  };

  // Filter and search logic
  const filteredEquipments = useMemo(() => {
    return (equipments || []).filter(equipment => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        equipment.name.toLowerCase().includes(searchLower) ||
        equipment.model?.toLowerCase().includes(searchLower) ||
        equipment.manufacturer?.toLowerCase().includes(searchLower) ||
        equipment.serial_number?.toLowerCase().includes(searchLower) ||
        equipment.inventory_number?.toLowerCase().includes(searchLower);

      const matchesStatus = filterStatus === 'all' || equipment.status === filterStatus;

      const matchesGroup = filterGroup === 'all' ||
        (equipment.equipment_group_ids && equipment.equipment_group_ids.includes(filterGroup));

      const matchesBuilding = filterBuilding === 'all' || equipment.building_id === filterBuilding;

      const matchesService = filterService === 'all' || equipment.service_id === filterService;

      const matchesLocation = filterLocation === 'all' || equipment.location_id === filterLocation;

      return matchesSearch && matchesStatus && matchesGroup && matchesBuilding && matchesService && matchesLocation;
    });
  }, [equipments, searchTerm, filterStatus, filterGroup, filterBuilding, filterService, filterLocation]);

  // Pagination
  const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage);
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemClick = (equipment: Equipment) => {
    if (multiSelect) {
      setCurrentSelections(prev => {
        if (prev.includes(equipment.id)) {
          return prev.filter(id => id !== equipment.id);
        } else {
          return [...prev, equipment.id];
        }
      });
    } else {
      onSelect?.(equipment);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (multiSelect && onMultiSelect) {
      const selectedEquipments = equipments.filter(eq => currentSelections.includes(eq.id));
      onMultiSelect(selectedEquipments);
    }
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterGroup('all');
    setFilterBuilding('all');
    setFilterService('all');
    setFilterLocation('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterGroup !== 'all' || 
    filterBuilding !== 'all' || filterService !== 'all' || filterLocation !== 'all';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'faulty': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'Maintenance';
      case 'faulty': return 'En panne';
      default: return status;
    }
  };

  const handleQrCodeDetected = (result: string) => {
    setSearchTerm(result);
    setIsQrScannerOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        if (multiSelect) {
          setCurrentSelections([]);
        }
      }
    }}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-2 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-hidden min-h-0">
          {/* Search Bar and QR Scan Button */}
          <div className="relative shrink-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 sm:h-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsQrScannerOpen(true)}
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
            >
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 h-8 text-xs sm:text-sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              Filtres {hasActiveFilters && <Badge variant="secondary" className="ml-1 text-xs">Actifs</Badge>}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs sm:text-sm">
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg shrink-0">
              <div>
                <Label className="text-xs">Statut</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="operational">Opérationnel</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="faulty">En panne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Groupe</Label>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="h-7 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {allGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Bâtiment</Label>
                <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                  <SelectTrigger className="h-7 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {allBuildings
                      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                      .map(building => (
                      <SelectItem key={building.id} value={building.id}>{building.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Service</Label>
                <Select value={filterService} onValueChange={setFilterService}>
                  <SelectTrigger className="h-7 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {allServices
                      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                      .map(service => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Local</Label>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="h-7 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {allLocations
                      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                      .map(location => (
                      <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results Info */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground shrink-0">
            <span>
              {filteredEquipments.length} équipement{filteredEquipments.length > 1 ? 's' : ''} trouvé{filteredEquipments.length > 1 ? 's' : ''}
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} sur {totalPages}
              </span>
            )}
          </div>

          {/* Equipment List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full border rounded-md">
              <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
                {paginatedEquipments.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <p className="text-xs sm:text-sm">Aucun équipement trouvé avec ces critères</p>
                  </div>
                ) : (
                  paginatedEquipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className={cn(
                        "p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex items-center",
                        multiSelect ? (currentSelections.includes(equipment.id) && "border-primary bg-primary/5") : (selectedEquipmentId === equipment.id && "border-primary bg-primary/5")
                      )}
                      onClick={() => handleItemClick(equipment)}
                    >
                      {multiSelect && (
                        <Checkbox
                          checked={currentSelections.includes(equipment.id)}
                          onCheckedChange={() => handleItemClick(equipment)}
                          className="mr-3"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate text-sm sm:text-base">{equipment.name}</h4>
                          <Badge variant="outline" className={cn("text-xs", getStatusColor(equipment.status))}>
                            {getStatusLabel(equipment.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs sm:text-sm">
                          {equipment.model && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Modèle:</span> {equipment.model}
                            </p>
                          )}
                          
                          {equipment.serial_number && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">N° série:</span> {equipment.serial_number}
                            </p>
                          )}
                          
                          {equipment.inventory_number && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">N° inventaire:</span> {equipment.inventory_number}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {equipment.building_id && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {getBuildingName(equipment.building_id)}
                            </Badge>
                          )}
                          
                          {equipment.location_id && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              <MapPin className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {getLocationName(equipment.location_id)}
                            </Badge>
                          )}
                          
                          {equipment.service_id && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Users className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {getServiceName(equipment.service_id)}
                            </Badge>
                          )}
                          
                          {equipment.equipment_group_ids && equipment.equipment_group_ids.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              Groupes: {equipment.equipment_group_ids.map(id => getGroupName(id)).join(', ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              >
                Préc.
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              >
                Suiv.
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 mt-2 sm:mt-4">
          <Button variant="outline" onClick={onClose} className="h-8 sm:h-9 text-xs sm:text-sm">
            Annuler
          </Button>
          {multiSelect && (
            <Button onClick={handleConfirmSelection} className="h-8 sm:h-9 text-xs sm:text-sm">
              Confirmer la sélection ({currentSelections.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* QR Scanner Component */}
      <QrScanner
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onDetected={handleQrCodeDetected}
      />
    </Dialog>
  );
};

export default EquipmentSelector;
