import ExcelJS from 'exceljs';

interface Building {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  building_id: string;
}

interface Location {
  id: string;
  name: string;
  service_id: string;
}

interface UFItem { id?: string; name: string }
interface EquipmentGroupItem { id?: string; name: string }

export const generateEquipmentTemplateBuffer = async (
  buildings: Building[],
  services: Service[],
  locations: Location[],
  ufs?: UFItem[],
  groups?: EquipmentGroupItem[]
) => {
  // Créer le workbook
  const workbook = new ExcelJS.Workbook();
  
  // En-têtes des équipements (même ordre que EQUIPMENT_EXPORT_HEADERS_FR)
  // Aligné sur l'ordre de "Exporter tous les équipements (Excel)" (Paramètres → Import Équipements)
  const headers = [
    'Nom',
    'Modèle',
    'Fabricant',
    'Fournisseur',
    'Numéro de série',
    'Numéro inventaire',
    'Date achat',
    'Date mise en service',
    'Date garantie',
    "Prix d'achat",
    'UF',
    'Statut',
    'Santé (%)',
    'En prêt',
    'Bâtiment',
    'Service',
    'Local',
    'Groupes',
    'Descriptif',
    "Type d'équipement",
    'Image URL',
    'Group IDs'
  ];
  
  // Créer la feuille principale "Modèle"
  const mainSheet = workbook.addWorksheet('Modèle');
  
  // Ajouter les en-têtes
  mainSheet.addRow(headers);
  
  // Style des en-têtes
  const headerRow = mainSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Définir les largeurs de colonnes
  headers.forEach((header, index) => {
    mainSheet.getColumn(index + 1).width = Math.max(12, header.length + 2);
  });
  
  // Créer une feuille de données cachée pour les listes déroulantes
  const dataSheet = workbook.addWorksheet('Donnees');
  dataSheet.state = 'hidden';
  
  // Fonction pour normaliser les noms pour les plages nommées Excel
  const normalizeName = (name: string) => {
    // Remplacer les espaces et caractères spéciaux par des underscores
    const normalized = name.replace(/[^\w]/g, '_');
    return normalized.replace(/_+/g, '_').replace(/^_|_$/g, '');
  };
  
  // === ORGANISATION DES DONNÉES POUR LES MENUS DÉROULANTS AVEC CASCADE ===
  // Mise en place d'une structure permettant:
  // - Liste Bâtiments (colonne A)
  // - Table de correspondance Bâtiment -> Adresse plage Services (colonnes C-D)
  // - Table de correspondance (Bâtiment||Service) -> Adresse plage Locaux (colonnes E-H)
  // - Zones de données Services par Bâtiment (à partir de colonne J)
  // - Zones de données Locaux par (Bâtiment, Service) (après les Services)

  // Helpers
  const columnLetters = (col: number) => {
    let c = col;
    let s = '';
    while (c > 0) {
      const m = (c - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      c = Math.floor((c - 1) / 26);
    }
    return s;
  };
  const absCell = (col: number, row: number) => `$${columnLetters(col)}$${row}`;

  const buildingHeaderRow = 1;
  const buildingListStartRow = 2;
  // Colonne A: Bâtiments
  dataSheet.getCell('A1').value = 'Bâtiments';
  const buildingNames = buildings.map(b => b.name);
  buildingNames.forEach((name, i) => {
    dataSheet.getCell(`A${buildingListStartRow + i}`).value = name;
  });

  // Colonnes C-D: Mapping Bâtiment -> Adresse plage Services
  dataSheet.getCell('C1').value = 'Bâtiment';
  dataSheet.getCell('D1').value = 'AdresseServices';

  // Colonnes E-H: Mapping (Bâtiment||Service) -> Adresse plage Locaux
  dataSheet.getCell('E1').value = 'Key'; // Bâtiment||Service
  dataSheet.getCell('F1').value = 'Bâtiment';
  dataSheet.getCell('G1').value = 'Service';
  dataSheet.getCell('H1').value = 'AdresseLocaux';

  // Zones de données dynamiques
  let nextFreeColumn = 10; // Colonne J

  // Construire zones Services par Bâtiment et remplir mapping C-D
  let mapRowServices = 2; // pour C-D
  const servicesByBuilding = new Map<string, Service[]>();
  buildings.forEach(b => {
    const list = services.filter(s => s.building_id === b.id);
    servicesByBuilding.set(b.id, list);
  });

  buildings.forEach((b, bIndex) => {
    const buildingServices = servicesByBuilding.get(b.id) || [];
    if (buildingServices.length === 0) return;
    const colForServices = nextFreeColumn++;
    // Titre facultatif
    dataSheet.getCell(`${columnLetters(colForServices)}1`).value = `Services_${b.name}`;
    const startRow = 2;
    buildingServices.forEach((s, i) => {
      dataSheet.getCell(`${columnLetters(colForServices)}${startRow + i}`).value = s.name;
    });
    const endRow = startRow + buildingServices.length - 1;
    const rangeAddress = `'Donnees'!${absCell(colForServices, startRow)}:${absCell(colForServices, endRow)}`;
    // Mapping row
    dataSheet.getCell(`C${mapRowServices}`).value = b.name;
    dataSheet.getCell(`D${mapRowServices}`).value = rangeAddress;
    mapRowServices++;
  });

  // Construire zones Locaux par (Bâtiment, Service) et remplir mapping E-H
  let mapRowLocations = 2;
  const servicesById = new Map<string, Service>();
  services.forEach(s => servicesById.set(s.id, s));

  buildings.forEach(b => {
    const buildingServices = servicesByBuilding.get(b.id) || [];
    buildingServices.forEach(svc => {
      const serviceLocations = locations.filter(l => l.service_id === svc.id);
      if (serviceLocations.length === 0) return;
      const colForLocations = nextFreeColumn++;
      dataSheet.getCell(`${columnLetters(colForLocations)}1`).value = `Locaux_${b.name}_${svc.name}`;
      const startRow = 2;
      serviceLocations.forEach((l, i) => {
        dataSheet.getCell(`${columnLetters(colForLocations)}${startRow + i}`).value = l.name;
      });
      const endRow = startRow + serviceLocations.length - 1;
      const rangeAddress = `'Donnees'!${absCell(colForLocations, startRow)}:${absCell(colForLocations, endRow)}`;
      const key = `${b.name}||${svc.name}`;
      dataSheet.getCell(`E${mapRowLocations}`).value = key;
      dataSheet.getCell(`F${mapRowLocations}`).value = b.name;
      dataSheet.getCell(`G${mapRowLocations}`).value = svc.name;
      dataSheet.getCell(`H${mapRowLocations}`).value = rangeAddress;
      mapRowLocations++;
    });
  });

  // === VALIDATIONS DE DONNÉES (CASCADE) ===
  // Colonne O (Bâtiment)
  const buildingValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`Donnees!$A$${buildingListStartRow}:$A$${buildingListStartRow + buildingNames.length - 1}`],
    error: 'Veuillez sélectionner un bâtiment valide',
    errorTitle: 'Erreur de saisie'
  } as any;
  mainSheet.dataValidations.add('O2:O1000', buildingValidation);

  // Colonne P (Service) dépend de Bâtiment via VLOOKUP vers C-D
  const servicesMapStartRow = 2;
  const servicesMapEndRow = mapRowServices - 1;
  const serviceValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`INDIRECT(VLOOKUP($O2,Donnees!$C$${servicesMapStartRow}:$D$${servicesMapEndRow},2,FALSE))`],
    error: 'Veuillez sélectionner un service valide',
    errorTitle: 'Erreur de saisie'
  } as any;
  mainSheet.dataValidations.add('P2:P1000', serviceValidation);

  // Colonne Q (Local) dépend de Bâtiment + Service via VLOOKUP sur clé concaténée
  const locMapStartRow = 2;
  const locMapEndRow = mapRowLocations - 1;
  const locationValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`INDIRECT(VLOOKUP($O2&"||"&$P2,Donnees!$E$${locMapStartRow}:$H$${locMapEndRow},4,FALSE))`],
    error: 'Veuillez sélectionner une localisation valide',
    errorTitle: 'Erreur de saisie'
  } as any;
  mainSheet.dataValidations.add('Q2:Q1000', locationValidation);

  // === LISTES PLATES: UF, Statut, En prêt, Groupes ===
  const flatSheet = workbook.addWorksheet('Listes');
  flatSheet.state = 'hidden';

  // En-têtes
  flatSheet.getCell('A1').value = 'UF';
  flatSheet.getCell('B1').value = 'Statut';
  flatSheet.getCell('C1').value = "Type d'équipement";
  flatSheet.getCell('D1').value = 'En prêt';
  flatSheet.getCell('E1').value = 'Groupes';

  const ufValues = (ufs || []).map(u => u.name);
  if (ufValues.length === 0) {
    ufValues.push('—');
  }
  const statusValues = ['operational', 'maintenance', 'faulty'];
  const typeValues = ['biomedical', 'technique'];
  const loanValues = ['oui', 'non'];
  const groupValues = (groups || []).map(g => g.name);

  const maxLen = Math.max(ufValues.length, statusValues.length, typeValues.length, loanValues.length, groupValues.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < ufValues.length) flatSheet.getCell(`A${2 + i}`).value = ufValues[i];
    if (i < statusValues.length) flatSheet.getCell(`B${2 + i}`).value = statusValues[i];
    if (i < typeValues.length) flatSheet.getCell(`C${2 + i}`).value = typeValues[i];
    if (i < loanValues.length) flatSheet.getCell(`D${2 + i}`).value = loanValues[i];
    if (i < groupValues.length) flatSheet.getCell(`E${2 + i}`).value = groupValues[i];
  }

  const ufEnd = 1 + ufValues.length;
  const statusEnd = 1 + statusValues.length;
  const typeEnd = 1 + typeValues.length;
  const loanEnd = 1 + loanValues.length;
  const groupEnd = groupValues.length > 0 ? 1 + groupValues.length : 1;

  // UF -> Colonne K (toujours présent, avec placeholder si nécessaire)
  mainSheet.dataValidations.add('K2:K1000', {
    type: 'list',
    allowBlank: true,
    formulae: [`Listes!$A$2:$A$${ufEnd}`],
    error: "Veuillez sélectionner une UF valide",
    errorTitle: 'Erreur de saisie'
  } as any);

  // Statut -> Colonne L
  mainSheet.dataValidations.add('L2:L1000', {
    type: 'list',
    allowBlank: true,
    formulae: [`Listes!$B$2:$B$${statusEnd}`],
    error: 'Veuillez sélectionner un statut valide',
    errorTitle: 'Erreur de saisie'
  } as any);

  // En prêt -> Colonne N
  mainSheet.dataValidations.add('N2:N1000', {
    type: 'list',
    allowBlank: true,
    formulae: [`Listes!$D$2:$D$${loanEnd}`],
    error: 'Veuillez sélectionner Oui/Non',
    errorTitle: 'Erreur de saisie'
  } as any);

  // Groupes -> Colonne R (liste simple; plusieurs valeurs possibles en saisie manuelle séparée par virgule)
  if (groupValues.length > 0) {
    mainSheet.dataValidations.add('R2:R1000', {
      type: 'list',
      allowBlank: true,
      formulae: [`Listes!$E$2:$E$${groupEnd}`],
      error: 'Sélectionnez un groupe existant ou saisissez plusieurs séparés par des virgules',
      errorTitle: 'Information'
    } as any);
  }

  // Type d'équipement -> colonne U
  const typeColIndex = headers.findIndex(h => h === "Type d'équipement") + 1;
  if (typeColIndex > 0) {
    const typeColLetter = columnLetters(typeColIndex);
    mainSheet.dataValidations.add(`${typeColLetter}2:${typeColLetter}1000`, {
      type: 'list',
      allowBlank: true,
      formulae: [`Listes!$C$2:$C$${typeEnd}`],
      error: "Veuillez sélectionner un type valide",
      errorTitle: 'Erreur de saisie'
    } as any);
  }

  // === CRÉATION D'ONGLETS PAR BÂTIMENT (guide visuel) ===
  
  // Créer un onglet pour chaque bâtiment avec ses services et localisations
  buildings.forEach(building => {
    const buildingServices = services.filter(s => s.building_id === building.id);
    if (buildingServices.length > 0) {
      const buildingSheet = workbook.addWorksheet(`Bâtiment_${normalizeName(building.name)}`);
      
      // En-têtes pour cet onglet
      buildingSheet.addRow(['Services et Localisations pour:', building.name]);
      buildingSheet.addRow(['Service', 'Localisations']);
      
      // Style des en-têtes
      const titleRow = buildingSheet.getRow(1);
      titleRow.font = { bold: true, size: 14 };
      const headerRow2 = buildingSheet.getRow(2);
      headerRow2.font = { bold: true };
      headerRow2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      
      // Ajouter les services et leurs localisations
      buildingServices.forEach(service => {
        const serviceLocations = locations.filter(l => l.service_id === service.id);
        const locationNames = serviceLocations.map(l => l.name).join(', ');
        buildingSheet.addRow([service.name, locationNames || 'Aucune localisation']);
      });
      
      // Ajuster les largeurs de colonnes
      buildingSheet.getColumn(1).width = 25;
      buildingSheet.getColumn(2).width = 40;
    }
  });
  
  // Créer une feuille d'instructions
  const instructionsSheet = workbook.addWorksheet('Instructions');
  
  const instructionsData = [
    'Instructions d\'utilisation du modèle d\'équipements avec guide hiérarchique',
    '',
    '🏢 COMMENT UTILISER CE FICHIER EXCEL :',
    '',
    '📋 MÉTHODE RECOMMANDÉE (avec guide hiérarchique) :',
    '',
    '1. Consultez les onglets "Bâtiment_[Nom]" pour voir la hiérarchie complète',
    '2. Chaque onglet montre : Services → Localisations pour ce bâtiment',
    '3. Utilisez ces informations pour remplir correctement les colonnes',
    '',
    '📝 SAISIE DES DONNÉES :',
    '',
    '4. Cliquez dans la cellule O2 (colonne Bâtiment)',
    '5. Cliquez sur la flèche du menu déroulant qui apparaît',
    '6. Sélectionnez un bâtiment dans la liste',
    '',
    '7. Cliquez dans la cellule P2 (colonne Service)',
    '8. Cliquez sur la flèche du menu déroulant qui apparaît',
    '9. Sélectionnez un service dans la liste déroulante',
    '10. IMPORTANT: Consultez l\'onglet du bâtiment pour voir les services disponibles',
    '',
    '11. Cliquez dans la cellule Q2 (colonne Local)',
    '12. Cliquez sur la flèche du menu déroulant qui apparaît',
    '13. Sélectionnez une localisation dans la liste déroulante',
    '14. IMPORTANT: Consultez l\'onglet du bâtiment pour voir les localisations du service',
    '',
    '✨ FONCTIONNALITÉS :',
    '• Menus déroulants pour éviter les erreurs de saisie',
    '• Onglets séparés par bâtiment avec la hiérarchie complète',
    '• Guide visuel des relations : Bâtiment → Service → Localisation',
    '• Structure hiérarchique documentée ci-dessous',
    '',
    '⚠️  CONSEILS IMPORTANTS :',
    '• TOUJOURS consulter l\'onglet du bâtiment avant de saisir',
    '• Respectez la hiérarchie : Bâtiment → Service → Localisation',
    '• Les onglets vous montrent exactement quels services/locaux sont disponibles',
    '• Si un service/local n\'apparaît pas, vérifiez l\'onglet du bâtiment',
    '',
    '📋 STRUCTURE HIÉRARCHIQUE :',
    '',
    ...buildings.map(building => {
      const buildingServices = services.filter(s => s.building_id === building.id);
      const result = [`• ${building.name}`];
      if (buildingServices.length > 0) {
        result.push(`  └─ Services: ${buildingServices.map(s => s.name).join(', ')}`);
        buildingServices.forEach(service => {
          const serviceLocations = locations.filter(l => l.service_id === service.id);
          if (serviceLocations.length > 0) {
            result.push(`    └─ Localisations: ${serviceLocations.map(l => l.name).join(', ')}`);
          }
        });
      }
      return result;
    }).flat(),
    '',
    '📝 COLONNES DISPONIBLES :',
    '• Nom : Nom de l\'équipement',
    '• Modèle : Modèle de l\'équipement',
    '• Fabricant : Nom du fabricant',
    '• Fournisseur : Nom du fournisseur',
    '• N° Série : Numéro de série',
    '• N° Inventaire : Numéro d\'inventaire',
    '• UF : Unité fonctionnelle',
    '• Bâtiment : Sélection dans la liste déroulante',
    '• Service : Sélection dans la liste déroulante',
    '• Localisation : Sélection dans la liste déroulante',
    '• Statut : Opérationnel, En maintenance, En panne',
    '• En prêt : Oui/Non',
    '• Santé (%) : Pourcentage de santé (0-100)',
    '• Date Achat : Date au format JJ/MM/AAAA',
    '• Prix d\'achat (€) : Prix en euros',
    '• Garantie : Date d\'expiration de garantie',
    '• Mise en Service : Date de mise en service',
    '• Groupes : Groupes d\'équipements séparés par des virgules'
  ];
  
  instructionsData.forEach(instruction => {
    instructionsSheet.addRow([instruction]);
  });
  
  // Style de la feuille d'instructions
  instructionsSheet.getColumn(1).width = 60;
  
  // Générer le buffer Excel
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new Uint8Array(buffer);
};


