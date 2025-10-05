// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeCanvas } from 'qrcode.react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useCollection } from '@/hooks/use-supabase-collection';
import { toast } from '@/components/ui/use-toast';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { useEquipment } from '@/hooks/use-equipment';
import { Equipment, EquipmentRelationship, RelationshipType, EquipmentStatus } from '@/types/equipment';
import { Building } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { UF } from '@/types/uf';
import { v4 as uuidv4 } from 'uuid';
import { junctionTableManager } from '@/lib/junction-tables'; // Assurez-vous que c'est bien 'junctionTableManager'
import { Settings, MapPin, Calendar, Package, Image, Upload, Download, Printer } from 'lucide-react'; // Import missing icons

interface EquipmentDetailModalProps {
  equipment?: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (equipment: Equipment, imageFile?: File | null) => void;
  allEquipments?: Equipment[];
  equipmentGroups?: EquipmentGroup[];
  buildings: Building[];
  services: Service[];
  locations: Location[];
}

const generateEquipmentId = () => {
  return uuidv4();
};

const formatDateForSupabase = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
       const paddedMonth = month.padStart(2, '0');
       const paddedDay = day.padStart(2, '0');
       return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }
  console.warn("Unexpected date format for Supabase:", dateString);
  return null;
};

const parseDateFromSupabase = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const parts = dateString?.split('-');
  if (parts && parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  console.warn("Unexpected date format from Supabase:", dateString);
  return dateString || '';
};

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSave,
  allEquipments = [],
  equipmentGroups = [],
  buildings = [],
  services = [],
  locations = [],
}) => {
  const isNewEquipment = !equipment;
  const [currentTab, setCurrentTab] = useState('info');
  const { handleSaveEquipment, loading } = useEquipment();

  // Fetch UF data
  const { data: ufs, loading: loadingUfs, error: ufsError } = useCollection<UF>({
    tableName: 'ufs',
  });

  const [formData, setFormData] = useState<Equipment>(
    equipment ? {
      ...equipment,
      purchase_price: equipment.purchase_price ?? null,
      date_mise_en_service: parseDateFromSupabase(equipment.date_mise_en_service),
      purchase_date: parseDateFromSupabase(equipment.purchase_date),
      warranty_expiry: parseDateFromSupabase(equipment.warranty_expiry),
      // `equipment_group_ids` est maintenant `associated_group_ids` et sera peuplé via useEffect
      associated_group_ids: [], // Initialize as empty, will be fetched
      
      image_url: equipment.image_url || '',
      uf: equipment.uf || '',
      building_id: equipment.building_id || '',
      service_id: equipment.service_id || '',
      location_id: equipment.location_id || '',
      inventory_number: equipment.inventory_number || '',
      serial_number: equipment.serial_number || '',
      supplier: equipment.supplier || '',
      loan_status: equipment.loan_status || false,
      description: equipment.description || '',
      equipment_type: equipment.equipment_type || 'technique',
    } : {
      id: generateEquipmentId(),
      name: '',
      model: '',
      manufacturer: '',
      supplier: '',
      status: 'operational' as EquipmentStatus,
      health_percentage: 100,
      purchase_price: null,
      date_mise_en_service: '',
      purchase_date: '',
      warranty_expiry: '',
      uf: '',
      building_id: '',
      service_id: '',
      location_id: '',
      image_url: '',
      
      associated_group_ids: [], // Initialize as empty for new equipment
      inventory_number: '',
      serial_number: '',
      loan_status: false,
      description: '',
      equipment_type: 'technique',
    }
  );
  const [qrSize, setQrSize] = useState(128);
  const [printOptions, setPrintOptions] = useState({
    showName: true,
    showModel: true,
    showId: true,
    labelSize: 'medium',
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to manage dependent dropdowns
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(formData.building_id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(formData.service_id || '');

  useEffect(() => {
    console.log("EquipmentDetailModal received equipmentGroups:", equipmentGroups);
    console.log("Number of equipment groups:", equipmentGroups?.length || 0);
    console.log("EquipmentDetailModal received buildings:", buildings);
    console.log("EquipmentDetailModal received services:", services);
    console.log("EquipmentDetailModal received locations:", locations);
    console.log("EquipmentDetailModal fetched UFs:", ufs);
  }, [equipmentGroups, buildings, services, locations, ufs]);

  useEffect(() => {
    const initializeFormData = async () => {
      if (equipment) {
        const associatedGroupIds = await junctionTableManager.getGroupsForEquipment(equipment.id);
        const initialFormData = {
          ...equipment,
          purchase_price: equipment.purchase_price ?? null,
          date_mise_en_service: parseDateFromSupabase(equipment.date_mise_en_service),
          purchase_date: parseDateFromSupabase(equipment.purchase_date),
          warranty_expiry: parseDateFromSupabase(equipment.warranty_expiry),
          associated_group_ids: associatedGroupIds, // Populate with fetched IDs
          
          image_url: equipment.image_url || '',
          uf: equipment.uf || '',
          building_id: equipment.building_id || '',
          service_id: equipment.service_id || '',
          location_id: equipment.location_id || '',
          inventory_number: equipment.inventory_number || '',
          serial_number: equipment.serial_number || '',
          supplier: equipment.supplier || '',
          loan_status: equipment.loan_status || false,
          description: equipment.description || '',
          equipment_type: equipment.equipment_type || 'technique',
        };
        setFormData(initialFormData);
        setSelectedBuildingId(initialFormData.building_id || '');
        setSelectedServiceId(initialFormData.service_id || '');
        setSelectedImageFile(null);
      } else {
        const newFormData = {
          id: generateEquipmentId(),
          name: '',
          model: '',
          manufacturer: '',
          supplier: '',
          status: 'operational' as EquipmentStatus,
          health_percentage: 100,
          purchase_price: null,
          date_mise_en_service: '',
          purchase_date: '',
          warranty_expiry: '',
          uf: '',
          building_id: '',
          service_id: '',
          location_id: '',
          image_url: '',
          
          associated_group_ids: [], // Initialize as empty for new equipment
          inventory_number: '',
          serial_number: '',
          loan_status: false,
          description: '',
          category: null,
        };
        setFormData(newFormData);
        setSelectedBuildingId('');
        setSelectedServiceId('');
        setSelectedImageFile(null);
      }
    };

    if (isOpen) { // Only initialize when modal opens
      initializeFormData();
    }
  }, [equipment, isOpen]); // Re-run when equipment prop or isOpen changes

  const handleInputChange = (field: keyof Equipment, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedServiceId('');
    handleInputChange('building_id', buildingId || null);
    handleInputChange('service_id', null);
    handleInputChange('location_id', null);
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    handleInputChange('service_id', serviceId || null);
    handleInputChange('location_id', null);
  };

  const handleLocationChange = (locationId: string) => {
    handleInputChange('location_id', locationId || null);
  };

  const handleUfChange = (ufValue: string) => {
    handleInputChange('uf', ufValue || null);
  };

  const handleSubmit = async (): Promise<void> => {
    console.log("handleSubmit (Modal): Fonction appelée.");
    console.log("handleSubmit (Modal): Données du formulaire AVANT formatage:", formData);

    const formattedFormData = {
      ...formData,
      date_mise_en_service: formatDateForSupabase(formData.date_mise_en_service),
      purchase_date: formatDateForSupabase(formData.purchase_date),
      warranty_expiry: formatDateForSupabase(formData.warranty_expiry),
      health_percentage: formData.health_percentage !== undefined && formData.health_percentage !== null ? Number(formData.health_percentage) : (isNewEquipment ? 100 : null),
      purchase_price: formData.purchase_price !== undefined && formData.purchase_price !== null && formData.purchase_price !== '' ? Number(formData.purchase_price) : null,
      // `associated_group_ids` n'est pas envoyé directement à la table `equipments`
      // Il sera géré séparément via la table de jonction
      building_id: formData.building_id || null,
      service_id: formData.service_id || null,
      location_id: formData.location_id || null,
      uf: formData.uf || null,
      inventory_number: formData.inventory_number || null,
      serial_number: formData.serial_number || null,
      supplier: formData.supplier || null,
      loan_status: formData.loan_status || false,
    };

     // Ne pas supprimer `associated_group_ids` car nous en avons besoin pour la sauvegarde
     // const { associated_group_ids, ...equipmentDataToSave } = formattedFormData;
     
     // Ne plus envoyer equipment_group_ids; la jonction gère les groupes
     const equipmentDataToSave = {
       ...formattedFormData
     };

    console.log("handleSubmit (Modal): Données de l'équipement APRES formatage:", equipmentDataToSave);
    console.log("handleSubmit (Modal): Fichier image sélectionné:", selectedImageFile);
    console.log("handleSubmit (Modal): Groupes associés à sauvegarder:", formattedFormData.associated_group_ids);


    try {
      let success = false;
      let savedEquipmentId = formData.id;

      if (onSave) {
        // Si une fonction onSave est fournie, l'utiliser
        await onSave(equipmentDataToSave as Equipment, selectedImageFile);
        success = true;
      } else {
        // Sinon, utiliser le hook useEquipment qui gère automatiquement l'historique
        success = await handleSaveEquipment(equipmentDataToSave as Equipment);
      }

      if (success) {
        // Les groupes sont maintenant gérés automatiquement dans la fonction de sauvegarde
        // via les tables de jonction, donc plus besoin de les gérer ici
        onClose();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const getQrValue = () => {
    return `https://votre-app-gmao.com/equipment/${formData.id}`;
  };

  const printQrCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCanvas = document.getElementById('equipment-qrcode') as HTMLCanvasElement;
    if (!qrCanvas) return;

    const qrUrl = qrCanvas.toDataURL();

    let width, height;
    switch (printOptions.labelSize) {
      case 'small':
        width = '30mm';
        height = '30mm';
        break;
      case 'medium':
        width = '50mm';
        height = '50mm';
        break;
      case 'large':
        width = '70mm';
        height = '70mm';
        break;
      default:
        width = '50mm';
        height = '50mm';
    }

    let htmlContent = `
      <html>
        <head>
          <title>QR Code - ${formData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .qr-container { width: ${width}; height: ${height}; text-align: center; border: 1px dashed #ccc; padding: 5mm; }
            .qr-image { width: 100%; height: auto; }
            .equipment-info { font-size: 8pt; margin-top: 2mm; }
            @media print {
              body { margin: 0; padding: 0; }
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrUrl}" class="qr-image" />
    `;

    if (printOptions.showName || printOptions.showModel || printOptions.showId) {
      htmlContent += `<div class="equipment-info">`;

      if (printOptions.showName) {
        htmlContent += `<div><strong>${formData.name}</strong></div>`;
      }

      if (printOptions.showModel) {
        htmlContent += `<div>${formData.model || ''}</div>`;
      }

      if (printOptions.showId) {
        htmlContent += `<div>ID: ${formData.id}</div>`;
      }

      htmlContent += `</div>`;
    }

    htmlContent += `
          </div>
          <button class="print-button" onclick="window.print()">Imprimer</button>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const downloadQrCode = () => {
    const canvas = document.getElementById('equipment-qrcode') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qrcode-${formData.id}.png`;
    link.href = url;
    link.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('image_url', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    handleInputChange('image_url', '');
  };

  const handleGroupSelectionChange = (groupId: string, isChecked: boolean) => {
    const currentGroupIds = formData.associated_group_ids || [];
    if (isChecked) {
      if (!currentGroupIds.includes(groupId)) {
        handleInputChange('associated_group_ids', [...currentGroupIds, groupId]);
      }
      // Auto-fill description from group if empty
      if (!formData.description || formData.description.trim() === '') {
        const selectedGroup = equipmentGroups.find(g => g.id === groupId);
        if (selectedGroup && selectedGroup.description) {
          handleInputChange('description', selectedGroup.description);
        }
      } else {
        const selectedGroup = equipmentGroups.find(g => g.id === groupId);
        if (selectedGroup && selectedGroup.description && selectedGroup.description.trim() !== '') {
          toast({
            title: "Conflit de description",
            description: "Une description existe déjà pour l'équipement et une description est aussi définie au niveau du groupe. La description de l'équipement sera conservée.",
          });
        }
      }
    } else {
      handleInputChange('associated_group_ids', currentGroupIds.filter(id => id !== groupId));
    }
  };

  const filteredServices = services
    .filter(service => service.building_id === selectedBuildingId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  const filteredLocations = locations
    .filter(location => location.service_id === selectedServiceId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewEquipment ? 'Ajouter un nouvel équipement' : 'Modifier l\'équipement'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-4">
            {/* Informations de base */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Informations de base</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'équipement *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nom de l'équipement"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as EquipmentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Opérationnel</SelectItem>
                      <SelectItem value="maintenance">En maintenance</SelectItem>
                      <SelectItem value="faulty">En panne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut de prêt</Label>
                  <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
                    <Checkbox
                      id="loan_status"
                      checked={formData.loan_status}
                      onCheckedChange={(checked) => handleInputChange('loan_status', checked)}
                    />
                    <Label htmlFor="loan_status" className="text-sm cursor-pointer">
                      Cet équipement est en prêt
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description de l'équipement"
                    rows={4}
                  />
                </div>


                {!isNewEquipment && (
                  <div className="space-y-2">
                    <Label htmlFor="health_percentage">État de santé (%)</Label>
                    <Input
                      id="health_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.health_percentage ?? ''}
                      onChange={(e) => handleInputChange('health_percentage', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Informations techniques */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Informations techniques</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Modèle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Fabricant</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="Fabricant"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Fournisseur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Prix d'achat (€)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price ?? ''}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inventory_number">Inventaire</Label>
                  <Input
                    id="inventory_number"
                    value={formData.inventory_number || ''}
                    onChange={(e) => handleInputChange('inventory_number', e.target.value)}
                    placeholder="Numéro d'inventaire"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">Numéro de série</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number || ''}
                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    placeholder="Numéro de série"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment_type">Type d'équipement</Label>
                  <Select
                    value={formData.equipment_type || 'technique'}
                    onValueChange={(value) => handleInputChange('equipment_type', (value as any) || 'technique')}
                  >
                    <SelectTrigger id="equipment_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biomedical">Biomédical</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    value={formData.uf || ''}
                    onValueChange={handleUfChange}
                    disabled={loadingUfs}
                  >
                    <SelectTrigger id="uf">
                      <SelectValue placeholder={loadingUfs ? "Chargement..." : "Sélectionner un UF"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ufs && ufs.length > 0 ? (
                        ufs.map((ufItem) => (
                          <SelectItem key={ufItem.id} value={ufItem.name}>
                            {ufItem.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-uf" disabled>
                          {loadingUfs ? "Chargement..." : (ufsError ? "Erreur de chargement" : "Aucun UF disponible")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Localisation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building_id">Bâtiment</Label>
                  <Select
                    value={selectedBuildingId}
                    onValueChange={handleBuildingChange}
                  >
                    <SelectTrigger id="building_id">
                      <SelectValue placeholder="Sélectionner un bâtiment" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings
                        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
                        .map(building => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_id">Service</Label>
                  <Select
                    value={selectedServiceId}
                    onValueChange={handleServiceChange}
                    disabled={!selectedBuildingId || filteredServices.length === 0}
                  >
                    <SelectTrigger id="service_id">
                      <SelectValue placeholder={!selectedBuildingId ? "Sélectionner un bâtiment d'abord" : (filteredServices.length === 0 ? "Aucun service pour ce bâtiment" : "Sélectionner un service")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_id">Local</Label>
                   <Select
                    value={formData.location_id || ''}
                    onValueChange={handleLocationChange}
                    disabled={!selectedServiceId || filteredLocations.length === 0}
                  >
                    <SelectTrigger id="location_id">
                      <SelectValue placeholder={!selectedServiceId ? "Sélectionner un service d'abord" : (filteredLocations.length === 0 ? "Aucun local pour ce service" : "Sélectionner un local")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates importantes */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Dates importantes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Date d'achat (JJ/MM/AAAA)</Label>
                  <Input
                    id="purchase_date"
                    value={formData.purchase_date || ''}
                    onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    placeholder="JJ/MM/AAAA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_mise_en_service">Date de mise en service (JJ/MM/AAAA)</Label>
                  <Input
                    id="date_mise_en_service"
                    value={formData.date_mise_en_service || ''}
                    onChange={(e) => handleInputChange('date_mise_en_service', e.target.value)}
                    placeholder="JJ/MM/AAAA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_expiry">Fin de garantie (JJ/MM/AAAA)</Label>
                  <Input
                    id="warranty_expiry"
                    value={formData.warranty_expiry || ''}
                    onChange={(e) => handleInputChange('warranty_expiry', e.target.value)}
                    placeholder="JJ/MM/AAAA"
                  />
                </div>
              </div>
            </div>

            {/* Groupes d'équipement */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Groupes d'équipement</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {equipmentGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun groupe d'équipement disponible.</p>
                ) : (
                  equipmentGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={formData.associated_group_ids?.includes(group.id) || false}
                        onCheckedChange={(checked) => handleGroupSelectionChange(group.id, checked === true)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                        {group.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-6 mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-md border rounded-md overflow-hidden bg-muted/30">
                {formData.image_url ? (
                  <AspectRatio ratio={4/3} className="bg-muted">
                    <img
                      src={formData.image_url}
                      alt={formData.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error("Image failed to load:", formData.image_url);
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                      }}
                    />
                  </AspectRatio>
                ) : (
                  <AspectRatio ratio={4/3} className="bg-muted flex items-center justify-center">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Image className="h-10 w-10 mb-2" />
                      <p>Cliquez pour ajouter une photo</p>
                    </div>
                  </AspectRatio>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              <Button
                type="button"
                onClick={triggerFileInput}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {formData.image_url ? "Changer l'image" : "Télécharger une image"}
              </Button>

              {formData.image_url && (
                <Button
                  type="button"
                  onClick={handleRemoveImage}
                  variant="outline"
                  className="text-destructive"
                >
                  Supprimer l'image
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-6 mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="border p-4 rounded-lg bg-white">
                <QRCodeCanvas
                  id="equipment-qrcode"
                  value={getQrValue()}
                  size={qrSize}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="w-full max-w-xs">
                <Label htmlFor="qrSize">Taille du QR code</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrSize(Math.max(64, qrSize - 32))}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">{qrSize}px</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrSize(Math.min(320, qrSize + 32))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label>Options d'impression</Label>
                  <div className="space-y-2 border rounded-md p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showName"
                        checked={printOptions.showName}
                        onCheckedChange={(checked) =>
                          setPrintOptions(prev => ({ ...prev, showName: checked === true }))}
                      />
                      <Label htmlFor="showName" className="cursor-pointer">Inclure le nom</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showModel"
                        checked={printOptions.showModel}
                        onCheckedChange={(checked) =>
                          setPrintOptions(prev => ({ ...prev, showModel: checked === true }))}
                      />
                      <Label htmlFor="showModel" className="cursor-pointer">Inclure le modèle</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showId"
                        checked={printOptions.showId}
                        onCheckedChange={(checked) =>
                          setPrintOptions(prev => ({ ...prev, showId: checked === true }))}
                      />
                      <Label htmlFor="showId" className="cursor-pointer">Inclure l'ID</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labelSize">Format d'étiquette</Label>
                  <Select
                    value={printOptions.labelSize}
                    onValueChange={(value) =>
                      setPrintOptions(prev => ({ ...prev, labelSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Petit (30x30mm)</SelectItem>
                      <SelectItem value="medium">Moyen (50x50mm)</SelectItem>
                      <SelectItem value="large">Grand (70x70mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={downloadQrCode}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Télécharger
                </Button>

                <Button
                  onClick={printQrCode}
                  className="flex items-center gap-2"
                >
                  <Printer size={16} />
                  Imprimer
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : (isNewEquipment ? 'Ajouter' : 'Enregistrer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDetailModal;
