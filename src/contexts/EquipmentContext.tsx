import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';

interface EquipmentContextType {
  equipments: Equipment[] | null;
  loadingEquipments: boolean;
  errorEquipments: Error | null;
  refetchEquipments: () => void;
  equipmentGroups: EquipmentGroup[] | null;
  loadingGroups: boolean;
  errorGroups: Error | null;
  refetchGroups: () => void;
  buildings: BuildingType[] | null;
  loadingBuildings: boolean;
  errorBuildings: Error | null;
  refetchBuildings: () => void;
  services: Service[] | null;
  loadingServices: boolean;
  errorServices: Error | null;
  refetchServices: () => void;
  locations: Location[] | null;
  loadingLocations: boolean;
  errorLocations: Error | null;
  refetchLocations: () => void;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const EquipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tous les appels de hooks sont inconditionnels et au niveau supérieur du composant
  const {
    data: equipments,
    loading: loadingEquipments,
    error: errorEquipments,
    refetch: refetchEquipments
  } = useCollection<Equipment>({ tableName: 'equipments' });

  const {
    data: equipmentGroups,
    loading: loadingGroups,
    error: errorGroups,
    refetch: refetchGroups
  } = useCollection<EquipmentGroup>({ 
    tableName: 'equipment_groups',
    orderBy: { column: 'name', ascending: true }
  });

  const {
    data: buildings,
    loading: loadingBuildings,
    error: errorBuildings,
    refetch: refetchBuildings
  } = useCollection<BuildingType>({ 
    tableName: 'buildings',
    orderBy: { column: 'name', ascending: true }
  });

  const {
    data: services,
    loading: loadingServices,
    error: errorServices,
    refetch: refetchServices
  } = useCollection<Service>({ 
    tableName: 'services',
    orderBy: { column: 'name', ascending: true }
  });

  const {
    data: locations,
    loading: loadingLocations,
    error: errorLocations,
    refetch: refetchLocations
  } = useCollection<Location>({ 
    tableName: 'locations',
    orderBy: { column: 'name', ascending: true }
  });

  const contextValue = {
    equipments,
    loadingEquipments,
    errorEquipments,
    refetchEquipments,
    equipmentGroups,
    loadingGroups,
    errorGroups,
    refetchGroups,
    buildings,
    loadingBuildings,
    errorBuildings,
    refetchBuildings,
    services,
    loadingServices,
    errorServices,
    refetchServices,
    locations,
    loadingLocations,
    errorLocations,
    refetchLocations,
  };

  return (
    <EquipmentContext.Provider value={contextValue}>
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipmentContext = () => {
  const context = useContext(EquipmentContext);
  if (context === undefined) {
    throw new Error('useEquipmentContext must be used within an EquipmentProvider');
  }
  return context;
};
