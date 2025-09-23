import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import * as XLSX from 'xlsx';

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

export const exportEquipmentsToCSV = (equipments: Equipment[], data: ExportData) => {
  const { printOptions, groups, buildings, services, locations } = data;
  
  // Helper functions
  const getGroupNames = (equipment: Equipment) => {
    // Check both equipment_group_ids and associated_group_ids for compatibility
    const groupIds = equipment.equipment_group_ids || (equipment as any).associated_group_ids;
    if (!groupIds || groupIds.length === 0) {
      return '';
    }
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

  // Define columns based on format
  const allColumns = [
    { key: 'name', label: 'Nom' },
    { key: 'model', label: 'Modèle' },
    { key: 'manufacturer', label: 'Fabricant' },
    { key: 'supplier', label: 'Fournisseur' },
    { key: 'serial_number', label: 'N° Série' },
    { key: 'inventory_number', label: 'N° Inventaire' },
    { key: 'uf', label: 'UF' },
    { key: 'location', label: 'Localisation' },
    { key: 'status', label: 'Statut' },
    { key: 'loan_status', label: 'En prêt' },
    { key: 'health', label: 'Santé (%)' },
    { key: 'purchase_date', label: 'Date Achat' },
    { key: 'warranty_expiry', label: 'Garantie' },
    { key: 'groups', label: 'Groupes' }
  ];

  // Filter columns based on options
  let columnsToExport = allColumns;
  
  if (printOptions.format === 'grid') {
    columnsToExport = allColumns.filter(col => 
      ['name', 'model', 'status', 'health'].includes(col.key)
    );
  } else {
    // Remove columns based on options
    if (!printOptions.includeLocation) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'location');
    }
    if (!printOptions.includeHealth) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'health');
    }
    if (!printOptions.includeGroups) {
      columnsToExport = columnsToExport.filter(col => col.key !== 'groups');
    }
  }

  // Create CSV content with UTF-8 BOM
  const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
  const headers = columnsToExport.map(col => col.label);
  let csvContent = BOM + headers.join(';') + '\n';

  equipments.forEach(equipment => {
    const row = columnsToExport.map(col => {
      let value = '';
      
      switch (col.key) {
        case 'name':
          value = equipment.name || '';
          break;
        case 'model':
          value = equipment.model || '';
          break;
        case 'manufacturer':
          value = equipment.manufacturer || '';
          break;
        case 'supplier':
          value = equipment.supplier || '';
          break;
        case 'serial_number':
          value = equipment.serial_number || '';
          break;
        case 'inventory_number':
          value = equipment.inventory_number || '';
          break;
        case 'uf':
          value = equipment.uf || '';
          break;
        case 'location':
          const buildingName = getBuildingName(equipment.building_id);
          const serviceName = getServiceName(equipment.service_id);
          const locationName = getLocationName(equipment.location_id);
          
          // Only show parts that have values
          const locationParts = [buildingName, serviceName, locationName].filter(part => part);
          value = locationParts.join(' > ');
          break;
        case 'status':
          value = getStatusText(equipment.status);
          break;
        case 'loan_status':
          value = equipment.loan_status ? 'Oui' : 'Non';
          break;
        case 'health':
          value = equipment.health_percentage !== null ? `${equipment.health_percentage}%` : '';
          break;
        case 'purchase_date':
          value = equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('fr-FR') : '';
          break;
        case 'warranty_expiry':
          value = equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString('fr-FR') : '';
          break;
        case 'groups':
          value = getGroupNames(equipment);
          break;
        default:
          value = '';
      }
      
      // Escape quotes and wrap in quotes if contains semicolon or quotes
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      
      return value;
    });
    
    csvContent += row.join(';') + '\n';
  });

  // Create and download the file with proper UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `listing_equipements_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportEquipmentsToExcel = (equipments: Equipment[], data: ExportData) => {
  const { groups, buildings, services, locations } = data;
  
  // Helper functions
  const getGroupNames = (equipment: Equipment) => {
    // Check both equipment_group_ids and associated_group_ids for compatibility
    const groupIds = equipment.equipment_group_ids || (equipment as any).associated_group_ids;
    if (!groupIds || groupIds.length === 0) {
      return '';
    }
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

  // Define columns for Excel export
  const columns = [
    { key: 'name', label: 'Nom', width: 25 },
    { key: 'model', label: 'Modèle', width: 20 },
    { key: 'manufacturer', label: 'Fabricant', width: 20 },
    { key: 'supplier', label: 'Fournisseur', width: 20 },
    { key: 'serial_number', label: 'N° Série', width: 15 },
    { key: 'inventory_number', label: 'N° Inventaire', width: 15 },
    { key: 'uf', label: 'UF', width: 10 },
    { key: 'building', label: 'Bâtiment', width: 20 },
    { key: 'service', label: 'Service', width: 20 },
    { key: 'location', label: 'Localisation', width: 20 },
    { key: 'status', label: 'Statut', width: 15 },
    { key: 'loan_status', label: 'En prêt', width: 12 },
    { key: 'health_percentage', label: 'Santé (%)', width: 12 },
    { key: 'purchase_date', label: 'Date Achat', width: 15 },
    { key: 'warranty_expiry', label: 'Garantie', width: 15 },
    { key: 'date_mise_en_service', label: 'Mise en Service', width: 15 },
    { key: 'groups', label: 'Groupes', width: 30 }
  ];

  // Prepare data for Excel
  const excelData = equipments.map(equipment => {
    const row: any = {};
    
    columns.forEach(col => {
      switch (col.key) {
        case 'name':
          row[col.label] = equipment.name || '';
          break;
        case 'model':
          row[col.label] = equipment.model || '';
          break;
        case 'manufacturer':
          row[col.label] = equipment.manufacturer || '';
          break;
        case 'supplier':
          row[col.label] = equipment.supplier || '';
          break;
        case 'serial_number':
          row[col.label] = equipment.serial_number || '';
          break;
        case 'inventory_number':
          row[col.label] = equipment.inventory_number || '';
          break;
        case 'uf':
          row[col.label] = equipment.uf || '';
          break;
        case 'building':
          row[col.label] = getBuildingName(equipment.building_id);
          break;
        case 'service':
          row[col.label] = getServiceName(equipment.service_id);
          break;
        case 'location':
          row[col.label] = getLocationName(equipment.location_id);
          break;
        case 'status':
          row[col.label] = getStatusText(equipment.status);
          break;
        case 'loan_status':
          row[col.label] = equipment.loan_status ? 'Oui' : 'Non';
          break;
        case 'health_percentage':
          row[col.label] = equipment.health_percentage !== null ? equipment.health_percentage : '';
          break;
        case 'purchase_date':
          row[col.label] = equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('fr-FR') : '';
          break;
        case 'warranty_expiry':
          row[col.label] = equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString('fr-FR') : '';
          break;
        case 'date_mise_en_service':
          row[col.label] = equipment.date_mise_en_service ? new Date(equipment.date_mise_en_service).toLocaleDateString('fr-FR') : '';
          break;
        case 'groups':
          row[col.label] = getGroupNames(equipment);
          break;
        default:
          row[col.label] = '';
      }
    });
    
    return row;
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width }));
  ws['!cols'] = colWidths;

  // Style the header row
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "366092" } },
    alignment: { horizontal: "center", vertical: "center" }
  };

  // Apply header styling
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { v: '' };
    ws[cellAddress].s = headerStyle;
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Équipements');

  // Generate filename with current date
  const currentDate = new Date().toISOString().split('T')[0];
  const filename = `equipements_${currentDate}.xlsx`;

  // Write and download the file
  XLSX.writeFile(wb, filename);
};
