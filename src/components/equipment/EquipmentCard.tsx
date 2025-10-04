import React from 'react';
import { Calendar, Link } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import CustomCard from '@/components/ui/CustomCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import EquipmentHealthBar from './EquipmentHealthBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEquipmentFieldVisibility } from '@/hooks/useEquipmentFieldVisibility';
import { getEmptyFieldValue, getEmptyFieldValueSafe, getEmptyFieldListValue } from '@/lib/print-utils';
import { formatDateDMY } from '@/lib/utils';

interface EquipmentCardProps {
  equipment: Equipment;
  groups?: EquipmentGroup[];
  buildings?: Building[];
  services?: Service[];
  locations?: Location[];
  onClick: (equipment: Equipment) => void;
  printSize?: 'xlarge' | 'large' | 'medium' | 'small' | 'xsmall';
  isPrintPreview?: boolean;
  printOptions?: any; // Options d'impression pour l'aperçu
  scaleFactor?: number; // Facteur de mise à l'échelle pour le ratio fixe
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ 
  equipment, 
  groups = [], 
  buildings = [],
  services = [],
  locations = [],
  onClick,
  printSize,
  isPrintPreview = false,
  printOptions,
  scaleFactor = 1
}) => {
  const isMobile = useIsMobile();
  const { cardFields } = useEquipmentFieldVisibility();
  
  // Utiliser les options d'impression si on est en aperçu, sinon utiliser les paramètres standard
  const effectiveFields = isPrintPreview && printOptions ? {
    manufacturer: printOptions.includeManufacturer === true,
    model: printOptions.includeModel === true,
    uf: printOptions.includeUF === true,
    status: printOptions.includeStatus === true,
    purchase_date: printOptions.includePurchaseDate === true,
    inventory_number: printOptions.includeInventoryNumber === true,
    serial_number: printOptions.includeSerialNumber === true,
    supplier: printOptions.includeSupplier === true,
    purchase_price: printOptions.includePurchasePrice === true,
    warranty_expiry: printOptions.includeWarranty === true,
    health_percentage: printOptions.includeHealth === true,
    building: printOptions.includeBuilding === true || printOptions.includeLocation === true,
    service: printOptions.includeService === true,
    location: printOptions.includeLocation === true,
    groups: printOptions.includeGroups === true,
    date_mise_en_service: printOptions.includeDateMiseEnService === true,
  } : cardFields;

  // Options d'affichage conditionnelles pour l'impression
  const showImages = isPrintPreview ? (printOptions?.includeImages !== false) : true;
  const showStatus = effectiveFields.status === true;
  const showLoanStatus = isPrintPreview ? (printOptions?.includeLoanStatus !== false) : true;
  const showRelationships = false;

  const getRelationshipCount = (equipment: Equipment) => {
    return equipment.relationships?.length || 0;
  };

  const getDisplayImage = () => {
    // Use associated_group_ids from enriched equipment data
    const groupIds = equipment.associated_group_ids || [];
    if (groupIds.length > 0) {
      const group = groups.find(g => groupIds.includes(g.id));
      if (group?.shared_image_url) {
        return group.shared_image_url;
      }
    }
    
    // Fallback to equipment's own image
    return equipment.image_url || '/placeholder.svg';
  };

  const getBuildingName = () => {
    if (!equipment.building_id) return isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Non spécifié';
    const building = buildings.find(b => b.id === equipment.building_id);
    return building?.name || (isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Bâtiment introuvable');
  };

  const getServiceName = () => {
    if (!equipment.service_id) return isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Non spécifié';
    const service = services.find(s => s.id === equipment.service_id);
    return service?.name || (isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Service introuvable');
  };

  const getLocationName = () => {
    if (!equipment.location_id) return isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Non spécifié';
    const location = locations.find(l => l.id === equipment.location_id);
    return location?.name || (isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Localisation introuvable');
  };

  const getGroupNames = () => {
    const groupIds = equipment.associated_group_ids || [];
    const groupNames = groups
      .filter(group => groupIds.includes(group.id))
      .map(group => group.name);
    return groupNames.length > 0 ? groupNames.join(', ') : (isPrintPreview ? '\u00A0\u00A0\u00A0' : 'Aucun groupe');
  };

  const imageUrlToDisplay = getDisplayImage();

  // Styles adaptatifs pour l'impression avec facteur de mise à l'échelle
  const getPrintStyles = () => {
    const defaultStyles = {
      imageRatio: 16/12, // plus plat
      titleSize: 'text-[0.92rem] md:text-[1.02rem]',
      subtitleSize: 'text-[0.66rem] md:text-[0.76rem]',
      fieldSize: 'text-[0.66rem] md:text-[0.76rem]',
      spacing: 'mb-2.5 mt-2.5',
      gridGap: 'gap-x-2 md:gap-x-3 gap-y-1',
      fontSize: 13, // -~8% suppl.
      padding: 13,
      margin: 6,
    };
    
    if (!printSize) return defaultStyles;
    
    const baseStyles = {
      single: {
        imageRatio: 4/3,
        titleSize: 'text-xl',
        subtitleSize: 'text-base',
        fieldSize: 'text-base',
        spacing: 'mb-4 mt-4',
        gridGap: 'gap-x-4 gap-y-2',
        fontSize: 18,
        padding: 24,
        margin: 16,
      },
      xlarge: {
        imageRatio: 16/11,
        titleSize: 'text-[1.02rem]',
        subtitleSize: 'text-[0.85rem]',
        fieldSize: 'text-[0.85rem]',
        spacing: 'mb-2.5 mt-2.5',
        gridGap: 'gap-x-3 gap-y-2',
        fontSize: 16,
        padding: 17,
        margin: 9,
      },
      large: {
        imageRatio: 16/12,
        titleSize: 'text-[0.92rem]',
        subtitleSize: 'text-[0.66rem]',
        fieldSize: 'text-[0.66rem]',
        spacing: 'mb-2 mt-2',
        gridGap: 'gap-x-2 gap-y-1',
        fontSize: 13,
        padding: 12,
        margin: 7,
      },
      medium: {
        imageRatio: 16/13,
        titleSize: 'text-[0.86rem]',
        subtitleSize: 'text-[0.64rem]',
        fieldSize: 'text-[0.64rem]',
        spacing: 'mb-2 mt-2',
        gridGap: 'gap-x-2 gap-y-1',
        fontSize: 12,
        padding: 10,
        margin: 6,
      },
      small: {
        imageRatio: 16/12,
        titleSize: 'text-[0.76rem]',
        subtitleSize: 'text-[0.6rem]',
        fieldSize: 'text-[0.6rem]',
        spacing: 'mb-1.5 mt-1.5',
        gridGap: 'gap-x-2 gap-y-1',
        fontSize: 10.5,
        padding: 8,
        margin: 4,
      },
      xsmall: {
        imageRatio: 16/10,
        titleSize: 'text-[0.68rem]',
        subtitleSize: 'text-[0.56rem]',
        fieldSize: 'text-[0.56rem]',
        spacing: 'mb-1 mt-1',
        gridGap: 'gap-x-1 gap-y-1',
        fontSize: 8.5,
        padding: 6,
        margin: 4,
      },
    };
    
    const baseStyle = baseStyles[printSize] || defaultStyles;
    
    // Appliquer le facteur de mise à l'échelle pour maintenir le ratio fixe
    return {
      ...baseStyle,
      fontSize: Math.round(baseStyle.fontSize * scaleFactor),
      padding: Math.round(baseStyle.padding * scaleFactor),
      margin: Math.round(baseStyle.margin * scaleFactor),
      // Les classes CSS restent les mêmes, mais on peut ajuster les valeurs numériques
      scaledPadding: `${Math.round(baseStyle.padding * scaleFactor)}px`,
      scaledMargin: `${Math.round(baseStyle.margin * scaleFactor)}px`,
      scaledFontSize: `${Math.round(baseStyle.fontSize * scaleFactor)}px`,
    };
  };

  const printStyles = getPrintStyles();

  // Compte les champs visibles pour estimer l'espace vertical nécessaire
  const getVisibleFieldCount = (): number => {
    const countBoolean = (v?: boolean) => (v ? 1 : 0);
    return (
      countBoolean(effectiveFields.manufacturer) +
      countBoolean(effectiveFields.uf) +
      countBoolean(effectiveFields.purchase_date) +
      countBoolean(effectiveFields.inventory_number) +
      countBoolean(effectiveFields.serial_number) +
      countBoolean(effectiveFields.supplier) +
      countBoolean(effectiveFields.warranty_expiry) +
      countBoolean(effectiveFields.date_mise_en_service) +
      countBoolean(effectiveFields.building) +
      countBoolean(effectiveFields.service) +
      countBoolean(effectiveFields.location) +
      countBoolean(effectiveFields.groups) +
      countBoolean(effectiveFields.description)
    );
  };

  // Garde le ratio d'image mais réduit sa largeur (donc sa hauteur) quand il y a plus de contenu
  const getImageWidthPercent = (): number => {
    if (!isPrintPreview) return 100;
    const visible = getVisibleFieldCount();
    const baseline = 6; // nombre de champs sans réduction
    const extra = Math.max(0, visible - baseline);
    const aggressiveness = printSize === 'xsmall' ? 6 : printSize === 'small' ? 5 : printSize === 'medium' ? 4 : 3; // % par champ
    const reduction = extra * aggressiveness;
    const minPercent = 60;
    return Math.max(minPercent, 100 - reduction);
  };

    return (
    <CustomCard
      variant="default"
      hover
      clickable
      onClick={() => onClick(equipment)}
      className="border overflow-hidden"
    >
      {showImages && (
        <div 
          style={{ 
            marginLeft: isPrintPreview ? '0px' : `${-20 * scaleFactor}px`,
            marginRight: isPrintPreview ? '0px' : `${-20 * scaleFactor}px`,
            marginTop: isPrintPreview ? '0px' : `${-20 * scaleFactor}px`,
            marginBottom: `${(isPrintPreview ? 6 : 12) * scaleFactor}px`,
            width: `${getImageWidthPercent()}%`,
            marginInline: 'auto'
          }}
        >
          <AspectRatio ratio={printStyles.imageRatio || 16/12}>
            <img
              src={imageUrlToDisplay}
              alt={equipment.name}
              className="object-contain w-full h-full"
            />
          </AspectRatio>
        </div>
      )}

      {effectiveFields.health_percentage && typeof equipment.health_percentage === 'number' && (
         <EquipmentHealthBar 
           percentage={equipment.health_percentage} 
           showLabel={true} 
           labelPlacement="inline"
           compact
           scaleFactor={scaleFactor} 
         />
      )}

      <div 
        className="flex items-start" 
        style={{ 
          marginBottom: `${printStyles.margin}px`, 
          marginTop: `${printStyles.margin}px`,
          gap: `${12 * scaleFactor}px`
        }}
      >
        <div className="flex-1 min-w-0">
          <h3 
            className={`font-medium ${printStyles.titleSize} truncate`} 
            style={{ fontSize: `${printStyles.fontSize}px` }}
            title={equipment.name}
          >
            {equipment.name}
          </h3>
          {effectiveFields.model && (
            <p 
              className={`${printStyles.subtitleSize} text-muted-foreground truncate`} 
              style={{ 
                fontSize: `${Math.round(printStyles.fontSize * 0.8)}px`,
                marginTop: '0px'
              }}
              title={`Modèle: ${equipment.model}`}
            >
              Modèle: {equipment.model}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {showStatus && <EquipmentStatusBadge status={equipment.status} scaleFactor={scaleFactor} />}
          {showLoanStatus && equipment.loan_status && (
            <span 
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap"
              style={{ 
                fontSize: `${Math.round(7 * scaleFactor)}px`,
                padding: `${1 * scaleFactor}px ${3 * scaleFactor}px`,
                height: `${14 * scaleFactor}px`,
                lineHeight: `${14 * scaleFactor}px`
              }}
            >
              En prêt
            </span>
          )}
        </div>
      </div>

      <div 
        className={`${printStyles.fieldSize}`} 
        style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: `${8 * scaleFactor}px`,
          marginBottom: `${printStyles.margin}px`
        }}
      >
        {effectiveFields.manufacturer && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Fabricant</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={equipment.manufacturer} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(equipment.manufacturer) : equipment.manufacturer}
            </p>
          </div>
        )}
        {effectiveFields.uf && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>UF</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={equipment.uf} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(equipment.uf) : equipment.uf}
            </p>
          </div>
        )}
        {effectiveFields.purchase_date && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Achat</p>
            <p className={`font-medium ${printStyles.fieldSize}`} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(formatDateDMY(equipment.purchase_date)) : formatDateDMY(equipment.purchase_date) || (equipment.purchase_date || '')}
            </p>
          </div>
        )}
        {effectiveFields.purchase_price && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Prix</p>
            <p className={`font-medium ${printStyles.fieldSize}`} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {equipment.purchase_price != null ? `${equipment.purchase_price} €` : (isPrintPreview ? getEmptyFieldValue(undefined) : '')}
            </p>
          </div>
        )}
        {effectiveFields.inventory_number && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Inventaire</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={equipment.inventory_number} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(equipment.inventory_number) : equipment.inventory_number}
            </p>
          </div>
        )}
        {effectiveFields.serial_number && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Série</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={equipment.serial_number} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(equipment.serial_number) : equipment.serial_number}
            </p>
          </div>
        )}
        {effectiveFields.supplier && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Fournisseur</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={equipment.supplier} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(equipment.supplier) : equipment.supplier}
            </p>
          </div>
        )}
        {effectiveFields.warranty_expiry && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Garantie</p>
            <p className={`font-medium ${printStyles.fieldSize}`} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(formatDateDMY(equipment.warranty_expiry)) : formatDateDMY(equipment.warranty_expiry) || (equipment.warranty_expiry || '')}
            </p>
          </div>
        )}
        {effectiveFields.date_mise_en_service && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Mise en service</p>
            <p className={`font-medium ${printStyles.fieldSize}`} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>
              {isPrintPreview ? getEmptyFieldValue(formatDateDMY(equipment.date_mise_en_service)) : formatDateDMY(equipment.date_mise_en_service) || (equipment.date_mise_en_service || '')}
            </p>
          </div>
        )}
        {effectiveFields.building && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${32 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Bâtiment</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={getBuildingName()} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>{getBuildingName()}</p>
          </div>
        )}
        {effectiveFields.service && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${40 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Service</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={getServiceName()} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>{getServiceName()}</p>
          </div>
        )}
        {effectiveFields.location && (
          <div className="min-w-0 flex flex-col justify-center" style={{ height: `${40 * scaleFactor}px` }}>
            <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Local</p>
            <p className={`font-medium ${printStyles.fieldSize} line-clamp-1`} title={getLocationName()} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>{getLocationName()}</p>
          </div>
        )}
      </div>


      {effectiveFields.groups && (
        <div className="mb-1 flex flex-col justify-center" style={{ marginBottom: `${Math.round(printStyles.margin * 0.4)}px` }}>
          <p className="text-xs text-muted-foreground" style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>Groupes</p>
          <p className={`${printStyles.fieldSize} line-clamp-1`} style={{ fontSize: `${Math.round(printStyles.fontSize * 0.8)}px` }}>{getGroupNames()}</p>
        </div>
      )}

      {showRelationships && getRelationshipCount(equipment) > 0 && (
        <div className="flex items-center text-xs text-muted-foreground" style={{ gap: `${4 * scaleFactor}px` }}>
          <Link style={{ width: `${12 * scaleFactor}px`, height: `${12 * scaleFactor}px` }} />
          <span style={{ fontSize: `${Math.round(printStyles.fontSize * 0.7)}px` }}>
            {getRelationshipCount(equipment)} relation{getRelationshipCount(equipment) > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </CustomCard>
  );
};

export default EquipmentCard;
