import React from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { ExportOptions } from '@/services/PDFExportService';
import EquipmentStatusBadge from '@/components/equipment/EquipmentStatusBadge';
import EquipmentHealthBar from '@/components/equipment/EquipmentHealthBar';
import { getEmptyFieldValue } from '@/lib/print-utils';

interface EquipmentPrintListViewProps {
  equipments: Equipment[];
  groups: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
  options: ExportOptions;
}

const EquipmentPrintListView: React.FC<EquipmentPrintListViewProps> = ({ 
  equipments, 
  groups, 
  buildings, 
  services, 
  locations, 
  options 
}) => {
  const getGroupName = (equipment: Equipment) => {
    const groupIds = equipment.associated_group_ids || [];
    if (groupIds.length > 0) {
      const group = groups.find(g => groupIds.includes(g.id));
      return group ? group.name : 'Aucun groupe';
    }
    return 'Aucun groupe';
  };

  const getBuildingName = (equipment: Equipment) => {
    if (!equipment.building_id) return 'Non spécifié';
    const building = buildings.find(b => b.id === equipment.building_id);
    return building ? building.name : 'Non spécifié';
  };

  const getServiceName = (equipment: Equipment) => {
    if (!equipment.service_id) return 'Non spécifié';
    const service = services.find(s => s.id === equipment.service_id);
    return service ? service.name : 'Non spécifié';
  };

  const getLocationName = (equipment: Equipment) => {
    if (!equipment.location_id) return 'Non spécifié';
    const location = locations.find(l => l.id === equipment.location_id);
    return location ? location.name : 'Non spécifié';
  };

  const getDisplayImage = (equipment: Equipment) => {
    const groupIds = equipment.associated_group_ids || [];
    if (groupIds.length > 0) {
      const group = groups.find(g => groupIds.includes(g.id));
      if (group?.shared_image_url) {
        return group.shared_image_url;
      }
    }
    return equipment.image_url || '/placeholder.svg';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Opérationnel';
      case 'maintenance': return 'En maintenance';
      case 'faulty': return 'En panne';
      default: return 'Non spécifié';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#22c55e'; // green-500
      case 'maintenance': return '#f59e0b'; // amber-500
      case 'faulty': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  // Définir les colonnes à afficher selon les options
  const visibleColumns = {
    image: options.includeImages,
    name: true, // Toujours affiché
    model: options.includeModel,
    manufacturer: options.includeManufacturer,
    status: options.includeStatus,
    loanStatus: options.includeLoanStatus,
    health: options.includeHealth,
    uf: options.includeUF,
    inventoryNumber: options.includeInventoryNumber,
    serialNumber: options.includeSerialNumber,
    building: options.includeBuilding,
    service: options.includeService,
    location: options.includeLocation,
    groups: options.includeGroups,
    description: options.includeDescription,
    purchaseDate: options.includePurchaseDate,
    warrantyExpiry: options.includeWarranty
  };

  return (
    <div className="print-list-container">
      <table className="print-table">
        <thead className="print-table-header">
          <tr>
            {visibleColumns.image && <th className="print-th-image">Image</th>}
            <th className="print-th-name">Nom</th>
            {visibleColumns.model && <th className="print-th">Modèle</th>}
            {visibleColumns.manufacturer && <th className="print-th">Fabricant</th>}
            {visibleColumns.status && <th className="print-th" style={{ minWidth: '120px' }}>Statut</th>}
            {visibleColumns.loanStatus && <th className="print-th">En prêt</th>}
            {visibleColumns.health && <th className="print-th">Santé</th>}
            {visibleColumns.uf && <th className="print-th">UF</th>}
            {visibleColumns.inventoryNumber && <th className="print-th">N° Inventaire</th>}
            {visibleColumns.serialNumber && <th className="print-th">N° Série</th>}
            {visibleColumns.building && <th className="print-th">Bâtiment</th>}
            {visibleColumns.service && <th className="print-th">Service</th>}
            {visibleColumns.location && <th className="print-th">Local</th>}
            {visibleColumns.groups && <th className="print-th">Groupe</th>}
            {visibleColumns.purchaseDate && <th className="print-th">Achat</th>}
            {visibleColumns.warrantyExpiry && <th className="print-th">Garantie</th>}
          </tr>
        </thead>
        <tbody>
          {equipments.map((equipment, index) => (
            <tr key={equipment.id} className="print-table-row">
              {visibleColumns.image && (
                <td className="print-td-image">
                  <img 
                    src={getDisplayImage(equipment)} 
                    alt={equipment.name}
                    className="print-equipment-image"
                  />
                </td>
              )}
              <td className="print-td-name">
                <div className="print-equipment-name">{equipment.name}</div>
              </td>
              {visibleColumns.model && (
                <td className="print-td">
                  {getEmptyFieldValue(equipment.model)}
                </td>
              )}
              {visibleColumns.manufacturer && (
                <td className="print-td">
                  {getEmptyFieldValue(equipment.manufacturer)}
                </td>
              )}
              {visibleColumns.status && (
                <td className="print-td">
                  <span 
                    style={{ 
                      color: getStatusColor(equipment.status),
                      fontSize: '10px' // Taille réduite comme les autres champs
                    }}
                  >
                    {getStatusText(equipment.status)}
                  </span>
                </td>
              )}
              {visibleColumns.loanStatus && (
                <td className="print-td">
                  <span style={{ fontSize: '10px' }}>
                    {equipment.loan_status ? 'Oui' : 'Non'}
                  </span>
                </td>
              )}
              {visibleColumns.health && (
                <td className="print-td">
                  <span style={{ fontSize: '10px' }}>
                    {equipment.health_percentage ? `${equipment.health_percentage}%` : 'N/A'}
                  </span>
                </td>
              )}
              {visibleColumns.uf && (
                <td className="print-td">
                  {getEmptyFieldValue(equipment.uf)}
                </td>
              )}
              {visibleColumns.inventoryNumber && (
                <td className="print-td">
                  {getEmptyFieldValue(equipment.inventory_number)}
                </td>
              )}
              {visibleColumns.serialNumber && (
                <td className="print-td">
                  {getEmptyFieldValue(equipment.serial_number)}
                </td>
              )}
              {visibleColumns.building && (
                <td className="print-td">
                  {getBuildingName(equipment)}
                </td>
              )}
              {visibleColumns.service && (
                <td className="print-td">
                  {getServiceName(equipment)}
                </td>
              )}
              {visibleColumns.location && (
                <td className="print-td">
                  {getLocationName(equipment)}
                </td>
              )}
              {visibleColumns.groups && (
                <td className="print-td">
                  {getGroupName(equipment)}
                </td>
              )}
              {visibleColumns.purchaseDate && (
                <td className="print-td">
                  {equipment.purchase_date ? (() => { const d = new Date(equipment.purchase_date); if (isNaN(d.getTime())) return 'Non spécifié'; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : 'Non spécifié'}
                </td>
              )}
              {visibleColumns.warrantyExpiry && (
                <td className="print-td">
                  {equipment.warranty_expiry ? (() => { const d = new Date(equipment.warranty_expiry); if (isNaN(d.getTime())) return 'Non spécifié'; const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yyyy = d.getFullYear(); return `${dd}/${mm}/${yyyy}`; })() : 'Non spécifié'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <style dangerouslySetInnerHTML={{
        __html: `
         .print-list-container {
           width: 100%;
           overflow: hidden;
         }

         .print-table {
           width: 100%;
           max-width: 100%;
           border-collapse: separate; /* éviter la fusion qui fait disparaître des traits au zoom */
           border-spacing: 0;
           font-family: Arial, sans-serif;
           font-size: ${options.fontSize === 'small' ? '8px' : options.fontSize === 'large' ? '11px' : '9px'};
           table-layout: fixed;
         }

        .print-table-header th {
          background-color: #f8f9fa;
          border: 1px solid #333;
          padding: 8px 6px;
          text-align: center; /* centrer les en-têtes */
          font-weight: bold;
          color: #000;
          white-space: nowrap;
          font-size: ${options.fontSize === 'small' ? '9px' : options.fontSize === 'large' ? '13px' : '11px'};
        }

         .print-th-image {
           width: 30px;
           max-width: 30px;
           text-align: center;
         }

         .print-th-name {
           width: 80px;
           max-width: 80px;
           font-weight: bold;
         }

         .print-th {
           width: auto;
           max-width: 60px;
           overflow: hidden;
           text-overflow: ellipsis;
           white-space: nowrap;
         }

        .print-table-row {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-table-row:nth-child(even) {
          background-color: #f9f9f9;
        }

         .print-td, .print-td-name, .print-td-image {
           border: 1px solid #666;
           padding: 3px 2px;
           vertical-align: middle; /* centrer verticalement */
           text-align: center; /* centrer horizontalement */
           color: #000;
           font-size: ${options.fontSize === 'small' ? '7px' : options.fontSize === 'large' ? '9px' : '8px'};
           overflow: hidden;
           text-overflow: ellipsis;
           white-space: nowrap;
           max-width: 60px;
         }

         /* Renforcer les traits uniquement en aperçu pour éviter qu'ils ne disparaissent avec le zoom */
         .print-preview .print-table-header th,
         .print-preview .print-td,
         .print-preview .print-td-name,
         .print-preview .print-td-image {
           border-color: #555;
           border-width: 1.25px; /* traits un peu plus épais en preview */
         }

         .print-td-image {
           text-align: center;
           width: 30px;
           max-width: 30px;
           padding: 2px;
         }

         .print-equipment-image {
           width: 25px;
           height: 25px;
           object-fit: cover;
           border-radius: 2px;
           border: 1px solid #ddd;
         }

         .print-td-name {
           font-weight: 600;
           width: 80px;
           max-width: 80px;
           overflow: hidden;
           text-overflow: ellipsis;
           white-space: nowrap;
         }

        .print-equipment-name {
          font-weight: bold;
          color: #000;
        }

        .print-health-container {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          justify-content: center; /* centrer la jauge */
        }

        .print-health-text {
          font-size: 10px;
          font-weight: 500;
          color: #000;
        }

        .print-description {
          max-width: 200px;
          word-wrap: break-word;
          line-height: 1.2;
          text-align: center; /* centrer la description */
        }

        ${options.orientation === 'landscape' ? `
          .print-table {
            font-size: ${options.fontSize === 'small' ? '9px' : options.fontSize === 'large' ? '12px' : '10px'};
          }
          .print-table-header th {
            padding: 6px 4px;
            font-size: ${options.fontSize === 'small' ? '8px' : options.fontSize === 'large' ? '11px' : '9px'};
          }
          .print-td, .print-td-name, .print-td-image {
            padding: 4px 3px;
            font-size: ${options.fontSize === 'small' ? '8px' : options.fontSize === 'large' ? '10px' : '9px'};
          }
        ` : `
          /* Portrait: réduire davantage les tailles et paddings */
          .print-table { font-size: ${options.fontSize === 'small' ? '6px' : '7px'}; }
          .print-table-header th { padding: 5px 3px; font-size: ${options.fontSize === 'small' ? '7px' : '9px'}; }
          .print-td, .print-td-name, .print-td-image { padding: 2px 2px; font-size: ${options.fontSize === 'small' ? '5px' : '6px'}; }
          .print-td-name .print-equipment-name { font-size: ${options.fontSize === 'small' ? '6px' : '7px'}; }
          .print-description { font-size: ${options.fontSize === 'small' ? '5px' : '6px'}; }
        `}
        `
      }} />
    </div>
  );
};

export default EquipmentPrintListView;
