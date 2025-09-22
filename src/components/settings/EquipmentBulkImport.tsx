import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Download, Wrench, AlertTriangle, XCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

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

  const validateCSVData = async (dataRows: string[][]): Promise<ValidationResult> => {
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

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineNumber = i + 2; // +2 car ligne 1 = en-tête, et index commence à 0
      
      console.log(`\n=== VALIDATION LIGNE ${lineNumber} ===`);
      console.log("Données:", row);
      
      // Vérifier que la ligne a assez de colonnes
      if (row.length < 14) {
        errors.push({
          line: lineNumber,
          field: 'Structure',
          value: `${row.length} colonnes`,
          error: `La ligne doit contenir exactement 14 colonnes (trouvé: ${row.length})`
        });
        continue;
      }
      
      const [
        name,
        model, 
        manufacturer,
        supplier,
        serial_number,
        inventory_number,
        description,
        uf,
        status,
        loan_status,
        buildingName,
        serviceName,
        locationName,
        groupNames
      ] = row.map(field => field?.trim() || '');
      
      // Validation du nom (obligatoire)
      if (!name) {
        errors.push({
          line: lineNumber,
          field: 'Nom',
          value: name,
          error: 'Le nom de l\'équipement est obligatoire'
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
      let building_id = null;
      if (buildingName) {
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
      let service_id = null;
      if (serviceName) {
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
      let location_id = null;
      if (locationName) {
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
      let equipment_group_ids = null;
      if (groupNames) {
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
      
      // Si pas d'erreurs pour cette ligne, ajouter l'équipement valide
      if (!errors.some(error => error.line === lineNumber)) {
        const validStatus = status && validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'operational';
        
        const equipment = {
          name,
          model: model || null,
          manufacturer: manufacturer || null,
          supplier: supplier || null,
          serial_number: serial_number || null,
          inventory_number: inventory_number || null,
          description: description || null,
          uf: uf || null,
          building_id,
          service_id,
          location_id,
          equipment_group_ids,
          status: validStatus,
          loan_status: loanStatusBoolean
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

      if (action === 'skip-duplicates') {
        const duplicateSerialNumbers = await checkForEquipmentDuplicates(equipmentsToInsert);
        finalEquipments = equipmentsToInsert.filter(eq => 
          !eq.serial_number || 
          !duplicateSerialNumbers.some(dup => dup === eq.serial_number)
        );
      } else if (action === 'replace-duplicates') {
        // Supprimer d'abord les équipements existants avec les mêmes numéros de série
        const serialNumbers = equipmentsToInsert
          .filter(eq => eq.serial_number && eq.serial_number.trim() !== '')
          .map(eq => eq.serial_number);
        
        if (serialNumbers.length > 0) {
          const { error: deleteError } = await supabase
            .from('equipments')
            .delete()
            .in('serial_number', serialNumbers);

          if (deleteError) {
            console.error("Erreur lors de la suppression des doublons:", deleteError);
            throw deleteError;
          }

          console.log("Équipements existants supprimés pour remplacement (basé sur numéro de série)");
        }
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
        .insert(finalEquipments)
        .select();

      if (error) {
        console.error("Erreur lors de l'insertion:", error);
        throw error;
      }

      console.log("Équipements insérés avec succès:", data);

      const actionMessage = action === 'replace-duplicates' 
        ? 'Les équipements existants ont été remplacés.' 
        : action === 'skip-duplicates' 
        ? 'Les doublons ont été ignorés.' 
        : '';

      toast({
        title: "Succès",
        description: `${data.length} équipements importés avec succès. ${actionMessage} Les QR codes seront générés automatiquement.`
      });
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
      
      // Validation complète des données
      const validationResult = await validateCSVData(dataRows);
      
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
    const csvContent = [
      'Nom,Modèle,Fabricant,Fournisseur,Numéro de série,Numéro inventaire,Description,UF,Statut,En prêt,Bâtiment,Service,Local,Groupes',
      'Équipement A,Modèle X,Fabricant Y,Fournisseur Z,SN001,INV001,Description équipement,UF001,operational,non,Platanes,Platanes 2 USLD,Chambres 2,volker',
      'Équipement B,Modèle Y,Fabricant Z,Fournisseur A,SN002,INV002,Description équipement B,UF002,maintenance,oui,Platanes,Platanes 2 USLD,Chambres 2,volker'
    ].join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_equipements.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEquipmentTemplateExcel = async () => {
    try {
      // Récupérer les données actuelles de la DB
      const [buildingsResult, servicesResult, locationsResult, groupsResult] = await Promise.all([
        supabase.from('buildings').select('name').order('name'),
        supabase.from('services').select('name').order('name'),
        supabase.from('locations').select('name').order('name'),
        supabase.from('equipment_groups').select('name').order('name')
      ]);

      const buildings = buildingsResult.data?.map(b => b.name) || [];
      const services = servicesResult.data?.map(s => s.name) || [];
      const locations = locationsResult.data?.map(l => l.name) || [];
      const groups = groupsResult.data?.map(g => g.name) || [];

      const headers = ['Nom', 'Modèle', 'Fabricant', 'Fournisseur', 'Numéro de série', 'Numéro inventaire', 'Description', 'UF', 'Statut', 'En prêt', 'Bâtiment', 'Service', 'Local', 'Groupes'];
      
      // Créer des exemples avec des données réelles si disponibles
      const sampleData = [
        [
          'Équipement A', 
          'Modèle X', 
          'Fabricant Y', 
          'Fournisseur Z', 
          'SN001', 
          'INV001', 
          'Description équipement', 
          'UF001', 
          'operational', 
          'non',
          buildings[0] || 'Platanes', 
          services[0] || 'Platanes 2 USLD', 
          locations[0] || 'Chambres 2', 
          groups[0] || 'volker'
        ],
        [
          'Équipement B', 
          'Modèle Y', 
          'Fabricant Z', 
          'Fournisseur A', 
          'SN002', 
          'INV002', 
          'Description équipement B', 
          'UF002', 
          'maintenance', 
          'oui',
          buildings[1] || buildings[0] || 'Platanes', 
          services[1] || services[0] || 'Platanes 2 USLD', 
          locations[1] || locations[0] || 'Chambres 2', 
          groups[1] || groups[0] || 'volker'
        ]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      
      // Ajouter des commentaires avec les valeurs disponibles
      const comments = [
        `Statuts valides: operational, maintenance, faulty`,
        `Bâtiments disponibles: ${buildings.join(', ') || 'Aucun'}`,
        `Services disponibles: ${services.join(', ') || 'Aucun'}`,
        `Locaux disponibles: ${locations.join(', ') || 'Aucun'}`,
        `Groupes disponibles: ${groups.join(', ') || 'Aucun'}`
      ];
      
      // Ajouter les commentaires comme lignes supplémentaires
      const commentRows = comments.map(comment => [comment]);
      const allData = [headers, ...sampleData, ...commentRows];
      
      const finalWorksheet = XLSX.utils.aoa_to_sheet(allData);
      
      // Définir les largeurs de colonnes optimisées pour les équipements
      const columnWidths = [
        { wch: 20 }, // Nom
        { wch: 15 }, // Modèle
        { wch: 20 }, // Fabricant
        { wch: 20 }, // Fournisseur
        { wch: 15 }, // Numéro de série
        { wch: 15 }, // Numéro inventaire
        { wch: 30 }, // Description
        { wch: 10 }, // UF
        { wch: 12 }, // Statut
        { wch: 20 }, // Bâtiment
        { wch: 25 }, // Service
        { wch: 20 }, // Local
        { wch: 20 }  // Groupes
      ];
      finalWorksheet['!cols'] = columnWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, finalWorksheet, 'Équipements');

      // Générer le fichier Excel
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
      toast({
        title: "Erreur",
        description: "Impossible de générer le modèle Excel",
        variant: "destructive"
      });
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => equipmentFileRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {loading ? 'Import en cours...' : 'Importer CSV/Excel'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadEquipmentTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger Modèle CSV
              </Button>
              <Button
                variant="outline"
                onClick={downloadEquipmentTemplateExcel}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Télécharger Modèle Excel
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
                <li><strong>Nom</strong> (obligatoire)</li>
                <li><strong>Modèle</strong> (optionnel)</li>
                <li><strong>Fabricant</strong> (optionnel)</li>
                <li><strong>Fournisseur</strong> (optionnel)</li>
                <li><strong>Numéro de série</strong> (optionnel)</li>
                <li><strong>Numéro inventaire</strong> (optionnel)</li>
                <li><strong>Description</strong> (optionnel)</li>
                <li><strong>UF</strong> (optionnel)</li>
                <li><strong>Statut</strong> (operational/maintenance/faulty - défaut: operational)</li>
                <li><strong>Bâtiment</strong> (nom exact du bâtiment existant)</li>
                <li><strong>Service</strong> (nom exact du service existant)</li>
                <li><strong>Local</strong> (nom exact du local existant)</li>
                <li><strong>Groupes</strong> (noms des groupes séparés par des virgules)</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <p className="font-medium text-blue-800 mb-1">💡 Important :</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Le fichier CSV doit contenir exactement 14 colonnes</li>
                  <li>• Les noms de bâtiments, services et locaux doivent correspondre exactement aux noms existants</li>
                  <li>• La recherche est insensible à la casse (majuscules/minuscules)</li>
                  <li>• Utilisez des guillemets pour les valeurs contenant des virgules</li>
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
                  <li>• Vérifiez que le fichier contient exactement 14 colonnes</li>
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
    </>
  );
};

export default EquipmentBulkImport;
