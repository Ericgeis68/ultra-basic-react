import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Combobox, ComboboxOption } from './Combobox';
import { Autocomplete } from './Autocomplete';

interface EquipmentFilterProps {
  filterName: string;
  setFilterName: (name: string) => void;
  filterModel: string;
  setFilterModel: (model: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterGroup: string;
  setFilterGroup: (group: string) => void;
  filterBuilding: string;
  setFilterBuilding: (building: string) => void;
  filterService: string;
  setFilterService: (service: string) => void;
  filterLocation: string;
  setFilterLocation: (location: string) => void;
  filterSupplier: string;
  setFilterSupplier: (supplier: string) => void;
  filterManufacturer: string;
  setFilterManufacturer: (manufacturer: string) => void;
  filterUF: string;
  setFilterUF: (uf: string) => void;
  
  equipmentGroups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  suppliers: string[];
  manufacturers: string[];
  ufs: string[];
  uniqueNames: string[];
  uniqueModels: string[];
  
  onClearFilters: () => void;
  hasActiveFilters: boolean;

  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EquipmentFilter: React.FC<EquipmentFilterProps> = ({
  filterName, setFilterName,
  filterModel, setFilterModel,
  filterStatus, setFilterStatus,
  filterGroup, setFilterGroup,
  filterBuilding, setFilterBuilding,
  filterService, setFilterService,
  filterLocation, setFilterLocation,
  filterSupplier, setFilterSupplier,
  filterManufacturer, setFilterManufacturer,
  filterUF, setFilterUF,
  equipmentGroups,
  buildings,
  services,
  locations,
  suppliers,
  manufacturers,
  ufs,
  uniqueNames,
  uniqueModels,
  onClearFilters,
  hasActiveFilters,
  isOpen,
  onOpenChange
}) => {
  const statusOptions: ComboboxOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'operational', label: 'Opérationnel' },
    { value: 'maintenance', label: 'En maintenance' },
    { value: 'faulty', label: 'En panne' },
  ];

  const groupOptions: ComboboxOption[] = [
    { value: 'all', label: 'Tous les groupes' },
    ...(equipmentGroups?.map(g => ({ value: g.id, label: g.name })) || []),
  ];

  const supplierOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les fournisseurs' },
      ...suppliers.map(s => ({ value: s, label: s }))
  ];

  const manufacturerOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les fabricants' },
      ...manufacturers.map(m => ({ value: m, label: m }))
  ];

  const ufOptions: ComboboxOption[] = [
    { value: 'all', label: 'Toutes les UF' },
    ...ufs.map(u => ({ value: u, label: u }))
  ];

  const buildingOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les bâtiments' },
      ...buildings.map(b => ({ value: b.id, label: b.name }))
  ];
  
  const serviceOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les services' },
      ...services.map(s => ({ value: s.id, label: s.name }))
  ];

  const locationOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les locaux' },
      ...locations.map(l => ({ value: l.id, label: l.name }))
  ];
    
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Filtres</span>
          {hasActiveFilters && (
            <span className="ml-2 rounded-full w-2 h-2 bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Filtrer les équipements</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-4">
                <div>
                    <Label htmlFor="name-filter">Nom</Label>
                    <Autocomplete
                        id="name-filter"
                        value={filterName}
                        onValueChange={setFilterName}
                        suggestions={uniqueNames}
                        placeholder="Filtrer par nom..."
                        emptyMessage="Aucun nom correspondant."
                    />
                </div>
                <div>
                    <Label htmlFor="model-filter">Modèle</Label>
                    <Autocomplete
                        id="model-filter"
                        value={filterModel}
                        onValueChange={setFilterModel}
                        suggestions={uniqueModels}
                        placeholder="Filtrer par modèle..."
                        emptyMessage="Aucun modèle correspondant."
                    />
                </div>
                <div>
                    <Label htmlFor="status-filter">Statut</Label>
                    <Combobox
                        options={statusOptions}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="Filtrer par statut"
                        searchPlaceholder="Rechercher statut..."
                        emptyPlaceholder="Aucun statut trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="group-filter">Groupe</Label>
                     <Combobox
                        options={groupOptions}
                        value={filterGroup}
                        onChange={setFilterGroup}
                        placeholder="Filtrer par groupe"
                        searchPlaceholder="Rechercher groupe..."
                        emptyPlaceholder="Aucun groupe trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="supplier-filter">Fournisseur</Label>
                    <Combobox
                        options={supplierOptions}
                        value={filterSupplier}
                        onChange={setFilterSupplier}
                        placeholder="Filtrer par fournisseur"
                        searchPlaceholder="Rechercher fournisseur..."
                        emptyPlaceholder="Aucun fournisseur trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="manufacturer-filter">Fabricant</Label>
                    <Combobox
                        options={manufacturerOptions}
                        value={filterManufacturer}
                        onChange={setFilterManufacturer}
                        placeholder="Filtrer par fabricant"
                        searchPlaceholder="Rechercher fabricant..."
                        emptyPlaceholder="Aucun fabricant trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="uf-filter">Unité Fonctionnelle (UF)</Label>
                    <Combobox
                        options={ufOptions}
                        value={filterUF}
                        onChange={setFilterUF}
                        placeholder="Filtrer par UF"
                        searchPlaceholder="Rechercher UF..."
                        emptyPlaceholder="Aucune UF trouvée."
                    />
                </div>

                <div>
                    <Label htmlFor="building-filter">Bâtiment</Label>
                    <Combobox
                        options={buildingOptions}
                        value={filterBuilding}
                        onChange={setFilterBuilding}
                        placeholder="Filtrer par bâtiment"
                        searchPlaceholder="Rechercher bâtiment..."
                        emptyPlaceholder="Aucun bâtiment trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="service-filter">Service</Label>
                    <Combobox
                        options={serviceOptions}
                        value={filterService}
                        onChange={setFilterService}
                        placeholder="Filtrer par service"
                        searchPlaceholder="Rechercher service..."
                        emptyPlaceholder="Aucun service trouvé."
                    />
                </div>

                <div>
                    <Label htmlFor="location-filter">Local</Label>
                    <Combobox
                        options={locationOptions}
                        value={filterLocation}
                        onChange={setFilterLocation}
                        placeholder="Filtrer par local"
                        searchPlaceholder="Rechercher local..."
                        emptyPlaceholder="Aucun local trouvé."
                    />
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="pr-4">
            {hasActiveFilters && (
                <Button
                    variant="outline"
                    onClick={() => {
                        onClearFilters();
                    }}
                >
                    Effacer les filtres
                </Button>
            )}
             <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentFilter;
