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
  filterInventory: string;
  setFilterInventory: (inventory: string) => void;
  filterPurchaseDateFrom: string;
  setFilterPurchaseDateFrom: (date: string) => void;
  filterPurchaseDateTo: string;
  setFilterPurchaseDateTo: (date: string) => void;
  filterServiceDateFrom: string;
  setFilterServiceDateFrom: (date: string) => void;
  filterServiceDateTo: string;
  setFilterServiceDateTo: (date: string) => void;
  filterWarrantyFrom: string;
  setFilterWarrantyFrom: (date: string) => void;
  filterWarrantyTo: string;
  setFilterWarrantyTo: (date: string) => void;
  filterPriceMin: string;
  setFilterPriceMin: (price: string) => void;
  filterPriceMax: string;
  setFilterPriceMax: (price: string) => void;
  filterHealthMin: string;
  setFilterHealthMin: (health: string) => void;
  filterHealthMax: string;
  setFilterHealthMax: (health: string) => void;
  filterLoanStatus: string;
  setFilterLoanStatus: (status: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  
  equipmentGroups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  suppliers: string[];
  manufacturers: string[];
  ufs: string[];
  uniqueNames: string[];
  uniqueModels: string[];
  uniqueInventoryNumbers: string[];
  
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
  filterInventory, setFilterInventory,
  filterPurchaseDateFrom, setFilterPurchaseDateFrom,
  filterPurchaseDateTo, setFilterPurchaseDateTo,
  filterServiceDateFrom, setFilterServiceDateFrom,
  filterServiceDateTo, setFilterServiceDateTo,
  filterWarrantyFrom, setFilterWarrantyFrom,
  filterWarrantyTo, setFilterWarrantyTo,
  filterPriceMin, setFilterPriceMin,
  filterPriceMax, setFilterPriceMax,
  filterHealthMin, setFilterHealthMin,
  filterHealthMax, setFilterHealthMax,
  filterLoanStatus, setFilterLoanStatus,
  filterType, setFilterType,
  equipmentGroups,
  buildings,
  services,
  locations,
  suppliers,
  manufacturers,
  ufs,
  uniqueNames,
  uniqueModels,
  uniqueInventoryNumbers,
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

  const loanStatusOptions: ComboboxOption[] = [
    { value: 'all', label: 'Tous les statuts de prêt' },
    { value: 'available', label: 'Disponible' },
    { value: 'loaned', label: 'En prêt' },
  ];

  const typeOptions: ComboboxOption[] = [
    { value: 'all', label: 'Tous les types' },
    { value: 'biomedical', label: 'Biomédical' },
    { value: 'technique', label: 'Technique' },
  ];

  const groupOptions: ComboboxOption[] = [
    { value: 'all', label: 'Tous les groupes' },
    ...(equipmentGroups?.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
      .map(g => ({ value: g.id, label: g.name })) || []),
  ];

  const supplierOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les fournisseurs' },
      ...suppliers.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .map(s => ({ value: s, label: s }))
  ];

  const manufacturerOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les fabricants' },
      ...manufacturers.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .map(m => ({ value: m, label: m }))
  ];

  const ufOptions: ComboboxOption[] = [
    { value: 'all', label: 'Toutes les UF' },
    ...ufs.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
      .map(u => ({ value: u, label: u }))
  ];

  const buildingOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les bâtiments' },
      ...buildings
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
        .map(b => ({ value: b.id, label: b.name }))
  ];
  
  const serviceOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les services' },
      ...services
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
        .map(s => ({ value: s.id, label: s.name }))
  ];

  const locationOptions: ComboboxOption[] = [
      { value: 'all', label: 'Tous les locaux' },
      ...locations
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
        .map(l => ({ value: l.id, label: l.name }))
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
                    <Label htmlFor="type-filter">Type d'équipement</Label>
                    <Combobox
                        options={typeOptions}
                        value={filterType}
                        onChange={setFilterType}
                        placeholder="Filtrer par type"
                        searchPlaceholder="Rechercher type..."
                        emptyPlaceholder="Aucun type trouvé."
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

                <div>
                    <Label htmlFor="inventory-filter">Numéro d'inventaire</Label>
                    <Autocomplete
                        id="inventory-filter"
                        value={filterInventory}
                        onValueChange={setFilterInventory}
                        suggestions={uniqueInventoryNumbers}
                        placeholder="Filtrer par numéro d'inventaire..."
                        emptyMessage="Aucun numéro d'inventaire correspondant."
                    />
                </div>

                <div>
                    <Label htmlFor="loan-status-filter">Statut de prêt</Label>
                    <Combobox
                        options={loanStatusOptions}
                        value={filterLoanStatus}
                        onChange={setFilterLoanStatus}
                        placeholder="Filtrer par statut de prêt"
                        searchPlaceholder="Rechercher statut..."
                        emptyPlaceholder="Aucun statut trouvé."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Date d'achat</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="purchase-date-from" className="text-sm text-muted-foreground">Du</Label>
                            <input
                                id="purchase-date-from"
                                type="date"
                                value={filterPurchaseDateFrom}
                                onChange={(e) => setFilterPurchaseDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="purchase-date-to" className="text-sm text-muted-foreground">Au</Label>
                            <input
                                id="purchase-date-to"
                                type="date"
                                value={filterPurchaseDateTo}
                                onChange={(e) => setFilterPurchaseDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Date de mise en service</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="service-date-from" className="text-sm text-muted-foreground">Du</Label>
                            <input
                                id="service-date-from"
                                type="date"
                                value={filterServiceDateFrom}
                                onChange={(e) => setFilterServiceDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="service-date-to" className="text-sm text-muted-foreground">Au</Label>
                            <input
                                id="service-date-to"
                                type="date"
                                value={filterServiceDateTo}
                                onChange={(e) => setFilterServiceDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Date d'expiration de garantie</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="warranty-from" className="text-sm text-muted-foreground">Du</Label>
                            <input
                                id="warranty-from"
                                type="date"
                                value={filterWarrantyFrom}
                                onChange={(e) => setFilterWarrantyFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="warranty-to" className="text-sm text-muted-foreground">Au</Label>
                            <input
                                id="warranty-to"
                                type="date"
                                value={filterWarrantyTo}
                                onChange={(e) => setFilterWarrantyTo(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Prix d'achat</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="price-min" className="text-sm text-muted-foreground">Min (€)</Label>
                            <input
                                id="price-min"
                                type="number"
                                step="0.01"
                                value={filterPriceMin}
                                onChange={(e) => setFilterPriceMin(e.target.value)}
                                placeholder="Prix minimum"
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="price-max" className="text-sm text-muted-foreground">Max (€)</Label>
                            <input
                                id="price-max"
                                type="number"
                                step="0.01"
                                value={filterPriceMax}
                                onChange={(e) => setFilterPriceMax(e.target.value)}
                                placeholder="Prix maximum"
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Pourcentage de santé</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="health-min" className="text-sm text-muted-foreground">Min (%)</Label>
                            <input
                                id="health-min"
                                type="number"
                                min="0"
                                max="100"
                                value={filterHealthMin}
                                onChange={(e) => setFilterHealthMin(e.target.value)}
                                placeholder="Santé minimum"
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                        <div>
                            <Label htmlFor="health-max" className="text-sm text-muted-foreground">Max (%)</Label>
                            <input
                                id="health-max"
                                type="number"
                                min="0"
                                max="100"
                                value={filterHealthMax}
                                onChange={(e) => setFilterHealthMax(e.target.value)}
                                placeholder="Santé maximum"
                                className="w-full px-3 py-2 border border-input rounded-md"
                            />
                        </div>
                    </div>
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
