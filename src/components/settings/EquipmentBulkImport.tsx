// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Download, Wrench, AlertTriangle, XCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

// En-têtes EXACTES de l'export "Équipements" (menu Équipements) en français
// Source: src/lib/equipment-export.ts (const columns labels)
const EQUIPMENT_EXPORT_HEADERS_FR = [
  'Nom',
  'Modèle',
  'Fabricant',
  'Fournisseur',
  'N° Série',
  'N° Inventaire',
  'UF',
  'Bâtiment',
  'Service',
  'Localisation',
  'Statut',
  'En prêt',
  'Santé (%)',
  'Date Achat',
  "Prix d'achat (€)",
  'Garantie',
  'Mise en Service',
  'Groupes'
];

interface EquipmentDuplicateInfo {
  duplicates: string[];
  newEquipments: any[];
  allEquipments: any[];
}

interface ValidationError {
  line: number;
  field: string;
  value: string;
  error: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validEquipments: any[];
}

const EquipmentBulkImport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<EquipmentDuplicateInfo | null>(null);
  const [validationDialog, setValidationDialog] = useState<ValidationError[] | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const equipmentFileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[][] => {
    console.log("=== DÉBUT DU PARSING CSV ===");
    console.log("Texte CSV brut:", text);
    
    // Diviser en lignes et filtrer les lignes vides
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log("Nombre de lignes trouvées:", lines.length);
    
    const result: string[][] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      console.log(`\n--- Ligne ${lineIndex + 1} ---`);
      console.log("Ligne brute:", JSON.stringify(line));
      
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          // Basculer l'état des guillemets
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // Virgule en dehors des guillemets = séparateur
          row.push(current.replace(/^"(.*)"$/, '$1').trim()); // Retirer les guillemets externes
          current = '';
        } else {
          current += char;
        }
      }
      
      // Ajouter le dernier champ
      row.push(current.replace(/^"(.*)"$/, '$1').trim());
      
      console.log("Champs parsés:", row);
      console.log("Nombre de champs:", row.length);
      
      result.push(row);
    }
    
    console.log("=== RÉSULTAT FINAL DU PARSING ===");
    console.log("Nombre de lignes parsées:", result.length);
    result.forEach((row, index) => {
      console.log(`Ligne ${index + 1}: [${row.map(cell => `"${cell}"`).join(', ')}]`);
    });
    
    return result;
  };

  const validateCSVData = async (dataRows: string[][], headerRow?: string[]): Promise<ValidationResult> => {
    console.log("=== DÉBUT DE LA VALIDATION ===");
    
    // Récupération des données de référence
    const [buildingsResult, servicesResult, locationsResult, groupsResult] = await Promise.all([
      supabase.from('buildings').select('id, name'),
      supabase.from('services').select('id, name'),
      supabase.from('locations').select('id, name'),
      supabase.from('equipment_groups').select('id, name')
    ]);

    const buildings = buildingsResult.data || [];
    const services = servicesResult.data || [];
    const locations = locationsResult.data || [];
    const equipmentGroups = groupsResult.data || [];

    console.log("Données de référence pour validation:", {
      buildings: buildings.length,
      services: services.length,
      locations: locations.length,
      equipmentGroups: equipmentGroups.length
    });

    const errors: ValidationError[] = [];
    const validEquipments: any[] = [];

    const useHeaderMapping = Array.isArray(headerRow) && headerRow.length > 0;

    const normalizeHeader = (h: string) => (h || '').toLowerCase().trim();
    const headerIndex: Record<string, number> = {};
    if (useHeaderMapping) {
      headerRow!.forEach((h, idx) => {
        headerIndex[normalizeHeader(String(h))] = idx;
      });
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineNumber = i + 2; // +2 car ligne 1 = en-tête, et index commence à 0
      
      console.log(`\n=== VALIDATION LIGNE ${lineNumber} ===`);
      console.log("Données:", row);
      
      // Helpers to pick by header name or fallback by position (legacy 18 cols)
      const getByHeader = (labelVariants: string[]): string => {
        if (!useHeaderMapping) return '';
        for (const label of labelVariants) {
          const idx = headerIndex[normalizeHeader(label)];
          if (idx !== undefined) return (row[idx] ?? '').toString().trim();
        }
        return '';
      };

      const getPos = (idx: number) => (row[idx] ?? '').toString().trim();

      const isLegacy18 = !useHeaderMapping || headerRow!.length === 18;

      const name = useHeaderMapping ? getByHeader(['Nom','name']) : getPos(0);
      const model = useHeaderMapping ? getByHeader(['Modèle','model']) : getPos(1);
      const manufacturer = useHeaderMapping ? getByHeader(['Fabricant','manufacturer']) : getPos(2);
      const supplier = useHeaderMapping ? getByHeader(['Fournisseur','supplier']) : getPos(3);
      const serial_number = useHeaderMapping ? getByHeader(['N° Série','Numéro de série','serial_number']) : getPos(4);
      const inventory_number = useHeaderMapping ? getByHeader(['N° Inventaire','Numéro inventaire','inventory_number']) : getPos(5);
      const purchase_date = useHeaderMapping ? getByHeader(['Date Achat','purchase_date','date achat']) : getPos(6);
      const date_mise_en_service = useHeaderMapping ? getByHeader(['Mise en Service','date_mise_en_service','date mise en service']) : getPos(7);
      const warranty_expiry = useHeaderMapping ? getByHeader(['Date garantie','Garantie','warranty_expiry','warranty']) : getPos(8);
      const purchase_price = useHeaderMapping ? getByHeader(["Prix d'achat","purchase_price"]) : getPos(9);
      const uf = useHeaderMapping ? getByHeader(['UF','uf']) : getPos(10);
      const status = useHeaderMapping ? getByHeader(['Statut','status']) : getPos(11);
      const health_percentage_str = useHeaderMapping ? getByHeader(['Santé (%)','health_percentage']) : getPos(12);
      const loan_status = useHeaderMapping ? getByHeader(['En prêt','loan_status']) : getPos(13);
      const buildingName = useHeaderMapping ? getByHeader(['Bâtiment','building_name']) : getPos(14);
      const serviceName = useHeaderMapping ? getByHeader(['Service','service_name']) : getPos(15);
      const locationName = useHeaderMapping ? getByHeader(['Localisation','Local','location_name']) : getPos(16);
      const groupNames = useHeaderMapping ? getByHeader(['Groupes','groups']) : getPos(17);

      // Extended optional fields for full re-import
      const buildingIdDirect = useHeaderMapping ? getByHeader(['Bâtiment ID','building_id']) : '';
      const serviceIdDirect = useHeaderMapping ? getByHeader(['Service ID','service_id']) : '';
      const locationIdDirect = useHeaderMapping ? getByHeader(['Local ID','location_id']) : '';
      const description = useHeaderMapping ? getByHeader(['Descriptif','description']) : '';
      const equipment_type = useHeaderMapping ? getByHeader(["Type d'équipement",'equipment_type']) : '';
      const image_url = useHeaderMapping ? getByHeader(['Image URL','image_url']) : '';
      const groupIdsCsv = useHeaderMapping ? getByHeader(['Group IDs','group_ids']) : '';
      
      // Règle minimale: au moins 3 champs non vides dans la ligne
      const nonEmptyCount = row.filter(v => (v ?? '').toString().trim().length > 0).length;
      if (nonEmptyCount < 3) {
        errors.push({
          line: lineNumber,
          field: 'Structure',
          value: `${nonEmptyCount} champ(s) renseigné(s)`,
          error: 'Chaque ligne doit contenir au moins 3 champs renseignés'
        });
        continue;
      }

      // Validation du statut
      const validStatuses = ['operational', 'maintenance', 'faulty'];
      if (status && !validStatuses.includes(status.toLowerCase())) {
        errors.push({
          line: lineNumber,
          field: 'Statut',
          value: status,
          error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`
        });
      }

      // Validation du statut de prêt
      let loanStatusBoolean = false;
      // Validation de la santé (%)
      let health_percentage: number | null = null;
      if (health_percentage_str) {
        const hp = Number(String(health_percentage_str).replace(',', '.'));
        if (isNaN(hp) || hp < 0 || hp > 100) {
          errors.push({
            line: lineNumber,
            field: 'Santé (%)',
            value: health_percentage_str,
            error: 'La santé doit être un nombre entre 0 et 100'
          });
        } else {
          health_percentage = Math.round(hp);
        }
      }

      if (loan_status) {
        const loanStatusLower = loan_status.toLowerCase();
        if (loanStatusLower === 'oui' || loanStatusLower === 'yes' || loanStatusLower === 'true' || loanStatusLower === '1') {
          loanStatusBoolean = true;
        } else if (loanStatusLower === 'non' || loanStatusLower === 'no' || loanStatusLower === 'false' || loanStatusLower === '0') {
          loanStatusBoolean = false;
        } else {
          errors.push({
            line: lineNumber,
            field: 'En prêt',
            value: loan_status,
            error: 'Valeur invalide. Valeurs autorisées: oui/non, yes/no, true/false, 1/0'
          });
        }
      }

      // Validation du bâtiment
      let building_id = null as string | null;
      if (buildingIdDirect) {
        const exists = buildings.some(b => b.id === buildingIdDirect);
        if (!exists) {
          errors.push({ line: lineNumber, field: 'Bâtiment ID', value: buildingIdDirect, error: 'ID bâtiment introuvable' });
        } else {
          building_id = buildingIdDirect;
        }
      } else if (buildingName) {
        const building = buildings.find(b => 
          b.name.toLowerCase().trim() === buildingName.toLowerCase().trim()
        );
        if (!building) {
          const availableBuildings = buildings.map(b => b.name).join(', ');
          errors.push({
            line: lineNumber,
            field: 'Bâtiment',
            value: buildingName,
            error: `Bâtiment "${buildingName}" introuvable. Valeurs disponibles: ${availableBuildings || 'Aucun bâtiment'}`
          });
        } else {
          building_id = building.id;
        }
      }

      // Validation du service
      let service_id = null as string | null;
      if (serviceIdDirect) {
        const exists = services.some(s => s.id === serviceIdDirect);
        if (!exists) {
          errors.push({ line: lineNumber, field: 'Service ID', value: serviceIdDirect, error: 'ID service introuvable' });
        } else {
          service_id = serviceIdDirect;
        }
      } else if (serviceName) {
        const service = services.find(s => 
          s.name.toLowerCase().trim() === serviceName.toLowerCase().trim()
        );
        if (!service) {
          const availableServices = services.map(s => s.name).join(', ');
          errors.push({
            line: lineNumber,
            field: 'Service',
            value: serviceName,
            error: `Service "${serviceName}" introuvable. Valeurs disponibles: ${availableServices || 'Aucun service'}`
          });
        } else {
          service_id = service.id;
        }
      }

      // Validation du local
      let location_id = null as string | null;
      if (locationIdDirect) {
        const exists = locations.some(l => l.id === locationIdDirect);
        if (!exists) {
          errors.push({ line: lineNumber, field: 'Local ID', value: locationIdDirect, error: 'ID local introuvable' });
        } else {
          location_id = locationIdDirect;
        }
      } else if (locationName) {
        const location = locations.find(l => 
          l.name.toLowerCase().trim() === locationName.toLowerCase().trim()
        );
        if (!location) {
          const availableLocations = locations.map(l => l.name).join(', ');
          errors.push({
            line: lineNumber,
            field: 'Local',
            value: locationName,
            error: `Local "${locationName}" introuvable. Valeurs disponibles: ${availableLocations || 'Aucun local'}`
          });
        } else {
          location_id = location.id;
        }
      }

      // Validation des groupes
      let equipment_group_ids = null as string[] | null;
      if (groupIdsCsv) {
        const ids = groupIdsCsv.split(',').map(s => s.trim()).filter(Boolean);
        const invalid = ids.filter(id => !equipmentGroups.some(g => g.id === id));
        if (invalid.length > 0) {
          errors.push({ line: lineNumber, field: 'Group IDs', value: invalid.join(','), error: 'ID de groupe introuvable' });
        } else if (ids.length > 0) {
          equipment_group_ids = ids;
        }
      } else if (groupNames) {
        const groupNamesList = groupNames.split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0);
        
        const invalidGroups: string[] = [];
        const foundGroups: string[] = [];
        
        groupNamesList.forEach(groupName => {
          const group = equipmentGroups.find(g => 
            g.name.toLowerCase().trim() === groupName.toLowerCase().trim()
          );
          if (!group) {
            invalidGroups.push(groupName);
          } else {
            foundGroups.push(group.id);
          }
        });
        
        if (invalidGroups.length > 0) {
          const availableGroups = equipmentGroups.map(g => g.name).join(', ');
          errors.push({
            line: lineNumber,
            field: 'Groupes',
            value: invalidGroups.join(', '),
            error: `Groupe(s) introuvable(s): ${invalidGroups.join(', ')}. Valeurs disponibles: ${availableGroups || 'Aucun groupe'}`
          });
        }
        
        equipment_group_ids = foundGroups.length > 0 ? foundGroups : null;
      }
      
      // Normalisation dates: accepte JJ/MM/AAAA, YYYY-MM-DD, et numéros Excel (séries)
      const toISODate = (val: string) => {
        if (!val) return null;
        const trimmed = val.trim();
        if (trimmed === '' || /^null$/i.test(trimmed) || /^n\/?a$/i.test(trimmed)) return null;
        // Numéro de série Excel (ex: 45917)
        if (/^\d{1,6}$/.test(trimmed)) {
          const serial = Number(trimmed);
          if (!isNaN(serial) && serial > 0) {
            // Excel epoch 1899-12-30 (corrigé pour le bug 1900)
            const excelEpoch = Date.UTC(1899, 11, 30);
            const ms = excelEpoch + serial * 86400000;
            const d = new Date(ms);
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(d.getUTCDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
        // JJ/MM/AAAA ou JJ-MM-AAAA
        const m1 = /^([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](\d{4})$/.exec(trimmed);
        if (m1) {
          const dd = m1[1].padStart(2, '0');
          const mm = m1[2].padStart(2, '0');
          const yyyy = m1[3];
          return `${yyyy}-${mm}-${dd}`;
        }
        // YYYY-MM-DD ou YYYY-M-D
        const m2 = /^(\d{4})-([0-1]?\d)-([0-3]?\d)$/.exec(trimmed);
        if (m2) {
          const yyyy = m2[1];
          const mm = m2[2].padStart(2, '0');
          const dd = m2[3].padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
        // Fallback JS parser
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) return null;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const toNumberOrNull = (val: string) => {
        if (val === undefined || val === null || val === '') return null;
        const n = Number(String(val).replace(',', '.'));
        return isNaN(n) ? null : n;
      };

      // Si pas d'erreurs pour cette ligne, ajouter l'équipement valide
      if (!errors.some(error => error.line === lineNumber)) {
        const validStatus = status && validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'operational';
        
        const equipment = {
          name,
          model: model || null,
          manufacturer: manufacturer || null,
          supplier: supplier || null,
          description: description || null,
          equipment_type: equipment_type || null,
          serial_number: serial_number || null,
          inventory_number: inventory_number || null,
          purchase_date: toISODate(purchase_date),
          date_mise_en_service: toISODate(date_mise_en_service),
          warranty_expiry: toISODate(warranty_expiry),
          purchase_price: toNumberOrNull(purchase_price),
          uf: uf || null,
          building_id,
          service_id,
          location_id,
          image_url: image_url || null,
          // Ne plus insérer equipment_group_ids directement; on s'en servira après insert pour la jonction
          status: validStatus,
          loan_status: loanStatusBoolean,
          health_percentage,
          equipment_group_ids
        };
        
        validEquipments.push(equipment);
        console.log(`Équipement ligne ${lineNumber} validé:`, equipment);
      }
    }

    console.log("\n=== RÉSULTAT DE LA VALIDATION ===");
    console.log(`Erreurs trouvées: ${errors.length}`);
    console.log(`Équipements valides: ${validEquipments.length}`);
    
    return {
      isValid: errors.length === 0,
      errors,
      validEquipments
    };
  };

  const checkForEquipmentDuplicates = async (equipments: any[]) => {
    // Filtrer les équipements qui ont un numéro de série
    const equipmentsWithSerialNumber = equipments.filter(eq => eq.serial_number && eq.serial_number.trim() !== '');
    
    if (equipmentsWithSerialNumber.length === 0) {
      return []; // Aucun équipement avec numéro de série, donc pas de doublons possibles
    }

    const serialNumbers = equipmentsWithSerialNumber.map(eq => eq.serial_number);
    
    console.log("Vérification des doublons pour les numéros de série:", serialNumbers);
    
    const { data: existingEquipments } = await supabase
      .from('equipments')
      .select('serial_number')
      .in('serial_number', serialNumbers)
      .not('serial_number', 'is', null);

    const duplicateSerialNumbers = existingEquipments?.map(eq => eq.serial_number) || [];
    
    console.log("Numéros de série en doublon trouvés:", duplicateSerialNumbers);
    
    return duplicateSerialNumbers;
  };

  const performEquipmentImport = async (equipmentsToInsert: any[], action: 'import-all' | 'skip-duplicates' | 'replace-duplicates' = 'import-all') => {
    try {
      let finalEquipments = equipmentsToInsert;
      const updatesLog: { id: string; serial_number: string | null; changes: { field: string; oldValue: any; newValue: any }[] }[] = [];
      let updatedChangedCount = 0;

      if (action === 'skip-duplicates') {
        const duplicateSerialNumbers = await checkForEquipmentDuplicates(equipmentsToInsert);
        finalEquipments = equipmentsToInsert.filter(eq => 
          !eq.serial_number || 
          !duplicateSerialNumbers.some(dup => dup === eq.serial_number)
        );
      } else if (action === 'replace-duplicates') {
        // Mettre à jour les équipements existants au lieu de supprimer (évite les violations de clés étrangères)
        const serialNumbers = equipmentsToInsert
          .filter(eq => eq.serial_number && eq.serial_number.trim() !== '')
          .map(eq => eq.serial_number);

        // Récupérer les équipements existants correspondants
        const { data: existingList, error: fetchExistingError } = await supabase
          .from('equipments')
          .select('*')
          .in('serial_number', serialNumbers)
          .not('serial_number', 'is', null);
        if (fetchExistingError) {
          throw fetchExistingError;
        }
        const existingBySerial = new Map<string, any>((existingList || []).map(e => [e.serial_number as string, e]));

        // Pour les équipements avec numéro de série déjà existant: update, sinon on les insère plus loin
        const toUpdate = equipmentsToInsert.filter(eq => eq.serial_number && existingBySerial.has(eq.serial_number));
        const toInsert = equipmentsToInsert.filter(eq => !eq.serial_number || !existingBySerial.has(eq.serial_number));

        // Effectuer les updates un par un (préservera les relations). On peut aussi batcher si besoin.
        for (const eq of toUpdate) {
          const existing = existingBySerial.get(eq.serial_number);
          const equipmentId = existing?.id as string | undefined;
          if (!equipmentId) continue;
          const { equipment_group_ids: _ignored, ...rest } = eq;

          // Calculer les changements champ par champ
          const changes: { field: string; oldValue: any; newValue: any }[] = [];
          Object.keys(rest).forEach((key) => {
            const oldVal = (existing as any)[key];
            const newVal = (rest as any)[key];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              changes.push({ field: key, oldValue: oldVal ?? null, newValue: newVal ?? null });
            }
          });

          const { error: updateError } = await supabase
            .from('equipments')
            .update(rest)
            .eq('id', equipmentId);
          if (updateError) {
            console.error('Erreur lors de la mise à jour d\'un équipement existant:', updateError);
            throw updateError;
          }

          if (changes.length > 0) {
            updatedChangedCount += 1;
            updatesLog.push({ id: equipmentId, serial_number: eq.serial_number || null, changes });
          }
        }

        // Continuer le flux avec les nouveaux à insérer et garder trace pour l\'assignation de groupes
        finalEquipments = toInsert;
      }

      if (finalEquipments.length === 0) {
        toast({
          title: "Information",
          description: "Aucun équipement à importer après filtrage des doublons",
        });
        return;
      }

      console.log("Équipements finaux à insérer:", finalEquipments);

      const { data, error } = await supabase
        .from('equipments')
        .insert(finalEquipments.map(eq => {
          const { equipment_group_ids: _ignored, ...rest } = eq;
          return rest;
        }))
        .select();

      if (error) {
        console.error("Erreur lors de l'insertion:", error);
        throw error;
      }

      console.log("Équipements insérés avec succès:", data);

      // Assigner les groupes via la table de jonction si fournis dans le fichier
      try {
        const groupAssignments: { equipment_id: string, group_id: string }[] = [];

        // Assignations pour les nouveaux insérés (data)
        if (Array.isArray(data)) {
          finalEquipments.forEach((eq, idx) => {
            const created = data[idx];
            const equipmentId = created?.id;
            if (equipmentId && Array.isArray(eq.equipment_group_ids) && eq.equipment_group_ids.length > 0) {
              eq.equipment_group_ids.forEach((gid: string) => {
                groupAssignments.push({ equipment_id: equipmentId, group_id: gid });
              });
            }
          });
        }

        // Assignations pour les équipements mis à jour (replace-duplicates)
        if (action === 'replace-duplicates') {
          const serialNumbers = equipmentsToInsert
            .filter(eq => eq.serial_number && Array.isArray(eq.equipment_group_ids) && eq.equipment_group_ids.length > 0)
            .map(eq => eq.serial_number);
          if (serialNumbers.length > 0) {
            const { data: existingList } = await supabase
              .from('equipments')
              .select('id, serial_number')
              .in('serial_number', serialNumbers)
              .not('serial_number', 'is', null);
            const existingBySerial = new Map<string, string>((existingList || []).map(e => [e.serial_number as string, e.id as string]));

            for (const eq of equipmentsToInsert) {
              const serial = eq.serial_number;
              if (!serial || !Array.isArray(eq.equipment_group_ids) || eq.equipment_group_ids.length === 0) continue;
              const equipmentId = existingBySerial.get(serial);
              if (!equipmentId) continue;
              // Remplacer les appartenances de groupe
              await supabase.from('equipment_group_members').delete().eq('equipment_id', equipmentId);
              const inserts = eq.equipment_group_ids.map((gid: string) => ({ equipment_id: equipmentId, group_id: gid }));
              if (inserts.length > 0) await supabase.from('equipment_group_members').insert(inserts);
            }
          }
        }

        if (groupAssignments.length > 0) {
          console.log('Création des relations groupe-équipement:', groupAssignments.length);
          const equipmentIds = [...new Set(groupAssignments.map(ga => ga.equipment_id))];
          await supabase.from('equipment_group_members').delete().in('equipment_id', equipmentIds);
          await supabase.from('equipment_group_members').insert(
            groupAssignments.map(ga => ({ equipment_id: ga.equipment_id, group_id: ga.group_id }))
          );
        }
      } catch (e) {
        console.error('Erreur lors de la création des relations de groupes:', e);
      }

      const actionMessage = action === 'replace-duplicates' 
        ? `Mises à jour: ${updatedChangedCount} équipement(s).` 
        : action === 'skip-duplicates' 
        ? 'Les doublons ont été ignorés.' 
        : '';

      toast({
        title: "Succès",
        description: `${(data?.length || 0) + (action === 'replace-duplicates' ? equipmentsToInsert.length - (finalEquipments?.length || 0) : 0)} équipements traités avec succès. ${actionMessage} Les QR codes seront générés automatiquement.`
      });

      // Log détaillé en console pour audit
      if (updatesLog.length > 0) {
        console.group('Rapport d\'import équipements - Mises à jour');
        updatesLog.forEach(entry => {
          console.group(`Equipement ${entry.id} (SN: ${entry.serial_number || 'N/A'})`);
          entry.changes.forEach(ch => {
            console.log(`Champ: ${ch.field} | Ancien:`, ch.oldValue, '| Nouveau:', ch.newValue);
          });
          console.groupEnd();
        });
        console.groupEnd();
      }
    } catch (error: any) {
      console.error("Erreur dans performEquipmentImport:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEquipmentImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      let rows: string[][] = [];

      if (isExcel) {
        // Lecture et conversion du fichier Excel en tableau de lignes
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const aoa: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = (aoa || []).map((r: any[]) => (r || []).map((c: any) => (c != null ? String(c) : '')));
      } else {
        // Lecture texte pour CSV/TXT
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        console.log("=== DÉBUT DE L'IMPORT ===");
        console.log("Contenu du fichier:", text);
        rows = parseCSV(text);
      }

      console.log("Lignes parsées:", rows);
      
      if (rows.length < 2) {
        toast({
          title: "Erreur",
          description: "Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données",
          variant: "destructive"
        });
        return;
      }
      
      const headerRow = rows[0];
      const dataRows = rows.slice(1);
      
      console.log("En-tête:", headerRow);
      console.log("Lignes de données:", dataRows);
      
      // Validation complète des données (avec en-tête pour mapper les champs étendus)
      const validationResult = await validateCSVData(dataRows, headerRow);
      
      if (!validationResult.isValid) {
        console.log("Erreurs de validation trouvées:", validationResult.errors);
        setValidationDialog(validationResult.errors);
        return;
      }

      console.log("\n=== VALIDATION RÉUSSIE ===");
      console.log(`Équipements valides à importer: ${validationResult.validEquipments.length}`);

      // Vérification des doublons basée sur le numéro de série
      const duplicateSerialNumbers = await checkForEquipmentDuplicates(validationResult.validEquipments);
      
      if (duplicateSerialNumbers.length > 0) {
        setDuplicateDialog({
          duplicates: duplicateSerialNumbers,
          newEquipments: validationResult.validEquipments,
          allEquipments: validationResult.validEquipments
        });
      } else {
        await performEquipmentImport(validationResult.validEquipments);
      }
    } catch (error: any) {
      console.error("Erreur dans handleEquipmentImport:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }

    // Reset file input
    if (equipmentFileRef.current) {
      equipmentFileRef.current.value = '';
    }
  };

  const handleDuplicateDialogAction = async (action: 'import-all' | 'skip-duplicates' | 'replace-duplicates') => {
    if (!duplicateDialog) return;

    if (action === 'import-all') {
      await performEquipmentImport(duplicateDialog.allEquipments, 'import-all');
    } else if (action === 'skip-duplicates') {
      await performEquipmentImport(duplicateDialog.newEquipments, 'skip-duplicates');
    } else if (action === 'replace-duplicates') {
      await performEquipmentImport(duplicateDialog.allEquipments, 'replace-duplicates');
    }

    setDuplicateDialog(null);
  };

  const downloadEquipmentTemplate = () => {
    // Photocopie vide de l'export (mêmes en-têtes FR du listing Équipements)
    const csvHeader = EQUIPMENT_EXPORT_HEADERS_FR.join(';');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvHeader + '\n'], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_equipements_complet.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEquipmentTemplateExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([EQUIPMENT_EXPORT_HEADERS_FR]);
      worksheet['!cols'] = EQUIPMENT_EXPORT_HEADERS_FR.map((h) => ({ wch: Math.max(12, h.length + 2) }));
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'modele_equipements.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de la génération du modèle Excel:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le modèle Excel', variant: 'destructive' });
    }
  };

  const exportAllEquipmentsExcel = async () => {
    try {
      setLoading(true);
      // Fetch equipments and reference data
      const [equipmentsRes, buildingsRes, servicesRes, locationsRes, groupsRes, membershipsRes] = await Promise.all([
        supabase.from('equipments').select('id,name,model,manufacturer,supplier,serial_number,inventory_number,purchase_date,date_mise_en_service,warranty_expiry,purchase_price,uf,status,loan_status,health_percentage,building_id,service_id,location_id,image_url,description,equipment_type,created_at,updated_at').order('name'),
        supabase.from('buildings').select('id,name'),
        supabase.from('services').select('id,name'),
        supabase.from('locations').select('id,name'),
        supabase.from('equipment_groups').select('id,name'),
        supabase.from('equipment_group_members').select('equipment_id,group_id')
      ]);

      const equipments = equipmentsRes.data || [];
      const buildings = buildingsRes.data || [];
      const services = servicesRes.data || [];
      const locations = locationsRes.data || [];
      const groups = groupsRes.data || [];
      const memberships = membershipsRes.data || [];

      const buildingById = new Map(buildings.map(b => [b.id, b.name]));
      const serviceById = new Map(services.map(s => [s.id, s.name]));
      const locationById = new Map(locations.map(l => [l.id, l.name]));
      const groupNameById = new Map(groups.map(g => [g.id, g.name]));

      const equipmentIdToGroupIds = new Map<string, string[]>();
      memberships.forEach((m: any) => {
        const list = equipmentIdToGroupIds.get(m.equipment_id) || [];
        list.push(m.group_id);
        equipmentIdToGroupIds.set(m.equipment_id, list);
      });

      const formatDateDMY = (value?: string | null) => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      const toOuiNon = (val?: boolean) => (val ? 'oui' : 'non');

      // Sheet 1: Importable (base 18 columns + optional extended columns recognized by importer)
      const importHeaders = ['Nom', 'Modèle', 'Fabricant', 'Fournisseur', 'Numéro de série', 'Numéro inventaire', 'Date achat', 'Date mise en service', 'Date garantie', "Prix d'achat", 'UF', 'Statut', 'Santé (%)', 'En prêt', 'Bâtiment', 'Service', 'Local', 'Groupes', 'Descriptif', "Type d'équipement", 'Image URL', 'Group IDs'];
      const importRows = equipments.map((eq: any) => {
        const groupIds = equipmentIdToGroupIds.get(eq.id) || [];
        const groupNames = groupIds.map(id => groupNameById.get(id)).filter(Boolean).join(', ');
        return [
          eq.name || '',
          eq.model || '',
          eq.manufacturer || '',
          eq.supplier || '',
          eq.serial_number || '',
          eq.inventory_number || '',
          formatDateDMY(eq.purchase_date),
          formatDateDMY(eq.date_mise_en_service),
          formatDateDMY(eq.warranty_expiry),
          eq.purchase_price ?? '',
          eq.uf || '',
          (eq.status || 'operational'),
          eq.health_percentage ?? '',
          toOuiNon(eq.loan_status),
          buildingById.get(eq.building_id) || '',
          serviceById.get(eq.service_id) || '',
          locationById.get(eq.location_id) || '',
          groupNames,
          eq.description || '',
          eq.equipment_type || '',
          eq.image_url || '',
          (groupIds.join(','))
        ];
      });

      // Sheet 2: Complet (all fields)
      const fullHeaders = [
        'id','name','model','manufacturer','supplier','description','equipment_type','status','health_percentage','purchase_price','purchase_date','date_mise_en_service','warranty_expiry','uf','building_id','service_id','location_id','building_name','service_name','location_name','image_url','serial_number','inventory_number','loan_status','group_ids','group_names','created_at','updated_at'
      ];
      const fullRows = equipments.map((eq: any) => {
        const groupIds = equipmentIdToGroupIds.get(eq.id) || [];
        const groupNames = groupIds.map(id => groupNameById.get(id)).filter(Boolean).join(', ');
        return [
          eq.id,
          eq.name || '',
          eq.model || '',
          eq.manufacturer || '',
          eq.supplier || '',
          eq.description || '',
          eq.equipment_type || '',
          eq.status || '',
          eq.health_percentage ?? '',
          eq.purchase_price ?? '',
          formatDateDMY(eq.purchase_date),
          formatDateDMY(eq.date_mise_en_service),
          formatDateDMY(eq.warranty_expiry),
          eq.uf || '',
          eq.building_id || '',
          eq.service_id || '',
          eq.location_id || '',
          buildingById.get(eq.building_id) || '',
          serviceById.get(eq.service_id) || '',
          locationById.get(eq.location_id) || '',
          eq.image_url || '',
          eq.serial_number || '',
          eq.inventory_number || '',
          toOuiNon(eq.loan_status),
          groupIds.join(','),
          groupNames,
          eq.created_at || '',
          eq.updated_at || ''
        ];
      });

      const wb = XLSX.utils.book_new();
      const wsImport = XLSX.utils.aoa_to_sheet([importHeaders, ...importRows]);
      const wsFull = XLSX.utils.aoa_to_sheet([fullHeaders, ...fullRows]);
      wsImport['!cols'] = importHeaders.map(() => ({ wch: 20 }));
      wsFull['!cols'] = fullHeaders.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, wsImport, 'Importable');
      XLSX.utils.book_append_sheet(wb, wsFull, 'Complet');
      const filename = `export_equipements_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast({ title: 'Export réussi', description: `${equipments.length} équipements exportés.` });
    } catch (error: any) {
      console.error('Erreur export équipements:', error);
      toast({ title: 'Erreur', description: error.message || 'Export impossible', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllEquipments = async () => {
    setDeleteAllLoading(true);
    try {
      // 1) Supprimer les relations de groupes (FK)
      await supabase
        .from('equipment_group_members')
        .delete()
        .not('equipment_id', 'is', null);

      // 2) Supprimer les historiques liés aux équipements (FK)
      await supabase
        .from('equipment_history')
        .delete()
        .not('equipment_id', 'is', null);

      // 3) Supprimer les interventions liées aux équipements (FK)
      await supabase
        .from('interventions')
        .delete()
        .not('equipment_id', 'is', null);

      // 4) Nettoyer les références côté documents/parts (colonnes array, pas de FK)
      await supabase
        .from('documents')
        .update({ equipment_ids: null })
        .not('equipment_ids', 'is', null);

      await supabase
        .from('parts')
        .update({ equipment_ids: null })
        .not('equipment_ids', 'is', null);

      // 5) Supprimer les équipements
      const { error: delErr } = await supabase
        .from('equipments')
        .delete()
        .not('id', 'is', null);
      if (delErr) throw delErr;

      toast({ title: 'Succès', description: 'Tous les équipements ont été supprimés.' });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de tous les équipements:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer tous les équipements.', variant: 'destructive' });
    } finally {
      setDeleteAllLoading(false);
      setDeleteAllDialogOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Import d'Équipements en Masse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Importez plusieurs équipements à la fois en utilisant un fichier CSV ou Excel. 
            Les QR codes seront générés automatiquement pour chaque équipement.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 mb-4 w-full">
              <Button
                variant="outline"
                onClick={() => equipmentFileRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Import en cours...' : 'Importer CSV/Excel'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadEquipmentTemplate}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Télécharger Modèle CSV
              </Button>
              <Button
                variant="outline"
                onClick={downloadEquipmentTemplateExcel}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Télécharger Modèle Excel
              </Button>
              <Button
                variant="default"
                onClick={exportAllEquipmentsExcel}
                className="flex items-center gap-2 w-full sm:w-auto"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Exporter tous les équipements (Excel)
              </Button>
            </div>
            
            <input
              ref={equipmentFileRef}
              type="file"
              accept=".csv,.txt,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleEquipmentImport}
              className="hidden"
            />
            
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h4 className="font-medium mb-2">Format du fichier CSV/Excel :</h4>
              <p className="mb-2">Le modèle téléchargé contient les colonnes suivantes :</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li><strong>Minimum 3 champs</strong> à remplir par ligne (les autres peuvent rester vides)</li>
                <li><strong>Modèle</strong> (optionnel)</li>
                <li><strong>Fabricant</strong> (optionnel)</li>
                <li><strong>Fournisseur</strong> (optionnel)</li>
                <li><strong>Numéro de série</strong> (optionnel)</li>
                <li><strong>Numéro inventaire</strong> (optionnel)</li>
                <li><strong>Date achat</strong> (JJ/MM/AAAA, optionnel)</li>
                <li><strong>Date mise en service</strong> (JJ/MM/AAAA, optionnel)</li>
                <li><strong>Date garantie</strong> (JJ/MM/AAAA, optionnel)</li>
                <li><strong>Prix d'achat</strong> (nombre, optionnel)</li>
                <li><strong>UF</strong> (optionnel)</li>
                <li><strong>Statut</strong> (operational/maintenance/faulty - défaut: operational)</li>
                <li><strong>Santé (%)</strong> (0 à 100)</li>
                <li><strong>Bâtiment</strong> (nom exact du bâtiment existant)</li>
                <li><strong>Service</strong> (nom exact du service existant)</li>
                <li><strong>Local</strong> (nom exact du local existant)</li>
                <li><strong>Groupes</strong> (noms des groupes séparés par des virgules)</li>
                <li><strong>Descriptif</strong> (optionnel) et <strong>Type d'équipement</strong> (biomedical/technique)</li>
                <li><strong>Image URL</strong> (optionnel), <strong>Group IDs</strong> (ids séparés par des virgules)</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <p className="font-medium text-blue-800 mb-1">💡 Important :</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Le modèle fournit 18 colonnes de base. Des colonnes supplémentaires sont acceptées: Descriptif, Type d'équipement, Image URL, Group IDs, ainsi que building_id/service_id/location_id.</li>
                  <li>• Les noms de bâtiments, services et locaux doivent correspondre exactement aux noms existants</li>
                  <li>• La recherche est insensible à la casse (majuscules/minuscules)</li>
                  <li>• Utilisez des guillemets pour les valeurs contenant des virgules</li>
                  <li>• <strong>Statut</strong> accepte: operational, maintenance, faulty</li>
                  <li>• <strong>En prêt</strong> accepte: oui/non, yes/no, true/false, 1/0</li>
                  <li>• <strong>Prix d'achat</strong>: nombre (point ou virgule)</li>
                  <li>• <strong>Dates</strong> au format: JJ/MM/AAAA</li>
                  <li>• Le fichier est validé avant l'importation pour éviter les erreurs</li>
                </ul>
              </div>
              <div className="mt-3 p-2 bg-amber-50 rounded text-xs">
                <p className="font-medium text-amber-800 mb-1">⚠️ Gestion des doublons :</p>
                <ul className="space-y-1 text-amber-700">
                  <li>• Le système détecte automatiquement les équipements en doublon <strong>basé sur le numéro de série</strong></li>
                  <li>• Seuls les équipements avec un numéro de série sont vérifiés pour les doublons</li>
                  <li>• Vous aurez le choix de remplacer les équipements existants, d'importer quand même ou d'ignorer les doublons</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone de danger - suppression complète des équipements */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Zone de danger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-red-800">
                Supprime <b>tous</b> les équipements et leurs liens. Les documents et pièces ne seront pas supprimés, mais leurs références seront effacées.
              </div>
              <Button
                onClick={() => setDeleteAllDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteAllLoading}
              >
                {deleteAllLoading ? 'Suppression…' : 'Supprimer tous les équipements'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation errors dialog */}
      <AlertDialog open={!!validationDialog} onOpenChange={() => setValidationDialog(null)}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Erreurs de validation détectées
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Le fichier CSV contient des erreurs qui empêchent l'importation :</p>
              <div className="bg-red-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {validationDialog?.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-400 pl-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                        <span>Ligne {error.line}</span>
                        <span>•</span>
                        <span>Champ: {error.field}</span>
                      </div>
                      <div className="text-sm text-red-700">
                        <span className="font-medium">Valeur:</span> "{error.value}"
                      </div>
                      <div className="text-sm text-red-600">
                        <span className="font-medium">Erreur:</span> {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-2">💡 Pour corriger ces erreurs :</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Vérifiez que tous les noms obligatoires sont renseignés</li>
                  <li>• Assurez-vous que les bâtiments, services et locaux existent dans le système</li>
                  <li>• Vérifiez que le statut utilise les valeurs autorisées (operational, maintenance, faulty)</li>
                <li>• Le fichier comporte 17 colonnes d'en-tête; les cellules manquantes dans les lignes seront traitées comme vides</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setValidationDialog(null)}>
              Fermer et corriger le fichier
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate confirmation dialog */}
      <AlertDialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Numéros de série en doublon détectés
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Les numéros de série suivants existent déjà dans le système :</p>
              <div className="bg-amber-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1">
                  {duplicateDialog?.duplicates.map((duplicate, index) => (
                    <li key={index} className="text-sm text-amber-800 font-mono">{duplicate}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm font-medium">Que souhaitez-vous faire ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2">
            <div className="flex flex-col gap-3 w-full">
              <div className="border rounded-lg p-3 bg-red-50">
                <AlertDialogAction
                  onClick={() => handleDuplicateDialogAction('replace-duplicates')}
                  className="bg-red-600 hover:bg-red-700 text-white w-full mb-2"
                >
                  Supprimer et remplacer les équipements existants
                </AlertDialogAction>
                <p className="text-xs text-red-700">
                  Les équipements existants avec les mêmes numéros de série seront définitivement supprimés et remplacés par les nouveaux équipements du fichier CSV.
                </p>
              </div>
              
              <div className="border rounded-lg p-3 bg-orange-50">
                <AlertDialogAction
                  onClick={() => handleDuplicateDialogAction('import-all')}
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full mb-2"
                >
                  Créer des doublons (importer avec numéros de série identiques)
                </AlertDialogAction>
                <p className="text-xs text-orange-700">
                  Tous les équipements du fichier CSV seront importés, même ceux avec des numéros de série déjà existants. Vous aurez plusieurs équipements avec le même numéro de série.
                </p>
              </div>
              
              <div className="border rounded-lg p-3 bg-blue-50">
                <AlertDialogAction
                  onClick={() => handleDuplicateDialogAction('skip-duplicates')}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full mb-2"
                >
                  Ignorer les doublons (ne pas importer ces équipements)
                </AlertDialogAction>
                <p className="text-xs text-blue-700">
                  Seuls les équipements avec des numéros de série uniques seront importés. Les équipements en doublon seront ignorés et ne seront pas ajoutés.
                </p>
              </div>
            </div>
            <AlertDialogCancel onClick={() => setDuplicateDialog(null)} className="w-full mt-2">
              Annuler l'importation
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation suppression totale */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Supprimer tous les équipements
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement <b>tous</b> les équipements et leurs liens. Les documents et pièces ne seront pas supprimés, mais leurs références seront effacées.
              Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleteAllLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllEquipments} className="bg-red-600 hover:bg-red-700" disabled={deleteAllLoading}>
              {deleteAllLoading ? 'Suppression…' : 'Supprimer tout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EquipmentBulkImport;
