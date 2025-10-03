import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import ExcelJS from 'exceljs';

interface ExportData {
  groups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  printOptions: {
    includeImage: boolean;
    includeDetails: boolean;
    includeHealth: boolean;
    includeGroups: boolean;
    includeLocation: boolean;
    format: 'list' | 'grid';
    selectedColumns?: string[];
  };
  filters: any;
}

export const exportEquipmentsToExcelWithDropdowns = async (equipments: Equipment[], data: ExportData) => {
  const { groups, buildings, services, locations } = data;
  
  const formatDateDMY = (value?: string | Date | null) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  
  const getGroupNames = (equipment: Equipment) => {
    const groupIds = (equipment as any).associated_group_ids;
    if (!groupIds || groupIds.length === 0) return '';
    const groupNames = groups
      .filter(group => groupIds.includes(group.id))
      .map(group => group.name);
    return groupNames.length > 0 ? groupNames.join(', ') : '';
  };

  const getBuildingName = (buildingId: string | null) => {
    if (!buildingId) return '';
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || '';
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return '';
    const service = services.find(s => s.id === serviceId);
    return service?.name || '';
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return '';
    const location = locations.find(l => l.id === locationId);
    return location?.name || '';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'En maintenance';
      case 'faulty': return 'En panne';
      default: return status;
    }
  };

  // Créer le classeur
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Application de gestion';
  workbook.created = new Date();

  // Créer la feuille principale
  const worksheet = workbook.addWorksheet('Équipements');
  
  // Définir les colonnes
  worksheet.columns = [
    { header: 'Nom', key: 'name', width: 25 },
    { header: 'Modèle', key: 'model', width: 20 },
    { header: 'Fabricant', key: 'manufacturer', width: 20 },
    { header: 'Fournisseur', key: 'supplier', width: 20 },
    { header: 'N° Série', key: 'serial_number', width: 15 },
    { header: 'N° Inventaire', key: 'inventory_number', width: 15 },
    { header: 'UF', key: 'uf', width: 10 },
    { header: 'Bâtiment', key: 'building', width: 20 },
    { header: 'Service', key: 'service', width: 20 },
    { header: 'Localisation', key: 'location', width: 20 },
    { header: 'Statut', key: 'status', width: 15 },
    { header: 'En prêt', key: 'loan_status', width: 12 },
    { header: 'Santé (%)', key: 'health_percentage', width: 12 },
    { header: 'Date Achat', key: 'purchase_date', width: 15 },
    { header: "Prix d'achat (€)", key: 'purchase_price', width: 15 },
    { header: 'Garantie', key: 'warranty_expiry', width: 15 },
    { header: 'Mise en Service', key: 'date_mise_en_service', width: 15 },
    { header: 'Groupes', key: 'groups', width: 30 }
  ];

  // Styliser l'en-tête
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Ajouter les données
  equipments.forEach(equipment => {
    worksheet.addRow({
      name: equipment.name || '',
      model: equipment.model || '',
      manufacturer: equipment.manufacturer || '',
      supplier: equipment.supplier || '',
      serial_number: equipment.serial_number || '',
      inventory_number: equipment.inventory_number || '',
      uf: equipment.uf || '',
      building: getBuildingName(equipment.building_id),
      service: getServiceName(equipment.service_id),
      location: getLocationName(equipment.location_id),
      status: getStatusText(equipment.status),
      loan_status: equipment.loan_status ? 'Oui' : 'Non',
      health_percentage: equipment.health_percentage !== null ? `${equipment.health_percentage}%` : '',
      purchase_date: formatDateDMY(equipment.purchase_date),
      purchase_price: equipment.purchase_price != null ? equipment.purchase_price : '',
      warranty_expiry: formatDateDMY(equipment.warranty_expiry),
      date_mise_en_service: formatDateDMY(equipment.date_mise_en_service),
      groups: getGroupNames(equipment)
    });
  });

  // Ajouter des lignes vides pour faciliter l'ajout de nouveaux équipements
  const startRow = equipments.length + 2;
  const endRow = startRow + 100; // 100 lignes supplémentaires

  // Créer les menus déroulants pour les nouvelles lignes
  // Bâtiment (colonne H = 8)
  if (buildings.length > 0) {
    const buildingNames = buildings.map(b => b.name);
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(`H${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${buildingNames.join(',')}"`]
      };
    }
  }

  // Service (colonne I = 9)
  if (services.length > 0) {
    const serviceNames = services.map(s => s.name);
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(`I${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${serviceNames.join(',')}"`]
      };
    }
  }

  // Localisation (colonne J = 10)
  if (locations.length > 0) {
    const locationNames = locations.map(l => l.name);
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(`J${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${locationNames.join(',')}"`]
      };
    }
  }

  // Statut (colonne K = 11)
  for (let row = startRow; row <= endRow; row++) {
    worksheet.getCell(`K${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Opérationnel,En maintenance,En panne"']
    };
  }

  // En prêt (colonne L = 12)
  for (let row = startRow; row <= endRow; row++) {
    worksheet.getCell(`L${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Oui,Non"']
    };
  }

  // Groupes (colonne R = 18)
  if (groups.length > 0) {
    const groupNames = groups.map(g => g.name);
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(`R${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${groupNames.join(',')}"`]
      };
    }
  }

  // Ajouter une feuille d'instructions
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { width: 80 }
  ];
  
  instructionsSheet.addRow(['INSTRUCTIONS POUR L\'IMPORT D\'ÉQUIPEMENTS']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['Format des colonnes:']);
  instructionsSheet.addRow(['- Statut: Sélectionnez dans le menu déroulant (Opérationnel, En maintenance, En panne)']);
  instructionsSheet.addRow(['- En prêt: Sélectionnez dans le menu déroulant (Oui ou Non)']);
  instructionsSheet.addRow(['- Bâtiment, Service, Localisation, Groupes: Sélectionnez dans les menus déroulants']);
  instructionsSheet.addRow(['- Dates: JJ/MM/AAAA (ex: 25/12/2024)']);
  instructionsSheet.addRow(['- Prix: nombre décimal (ex: 1250.50)']);
  instructionsSheet.addRow(['- Santé: nombre entre 0 et 100']);
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['IMPORTANT:']);
  instructionsSheet.addRow(['- Les lignes vides ont des menus déroulants prêts à l\'emploi']);
  instructionsSheet.addRow(['- Sélectionnez les valeurs dans les menus déroulants pour éviter les erreurs']);
  instructionsSheet.addRow(['- Ne modifiez pas les en-têtes de colonnes']);
  instructionsSheet.addRow(['- Laissez les cellules vides pour les valeurs optionnelles']);
  
  instructionsSheet.getRow(1).font = { bold: true, size: 14 };

  // Générer et télécharger le fichier
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `equipements_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};
