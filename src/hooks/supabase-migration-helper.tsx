import { Document } from '@/types/document';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Intervention } from '@/types/intervention';
import { useCollection } from '@/hooks/use-supabase-collection';

export function useFirestoreCompat<T extends { id: string }>(tableName: string) {
  return useCollection<T>({ tableName });
}

export function useDocumentsCollection() {
  return useCollection<Document>({ tableName: 'documents' });
}

export function useEquipmentsCollection() {
  return useCollection<Equipment>({ tableName: 'equipments' });
}

export function useEquipmentGroupsCollection() {
  return useCollection<EquipmentGroup>({ tableName: 'equipmentGroups' });
}

export function useInterventionsCollection() {
  return useCollection<Intervention>({ tableName: 'interventions' });
}
