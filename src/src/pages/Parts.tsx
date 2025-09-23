import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Plus,
  Search,
  AlertCircle,
  Package,
  Grid,
  List,
  Users,
  WrenchIcon,
  X,
  Edit,
  MoreHorizontal,
  CheckCircle2,
  Barcode,
  Warehouse,
  Truck,
  ArrowUp,
  ArrowDown,
  ListFilter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PartWithStock, Part } from '@/types/part';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Checkbox } from "@/components/ui/checkbox"
import { useEquipmentContext } from '@/contexts/EquipmentContext';
import { EquipmentGroup } from '@/types/equipmentGroup';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useDeviceType } from '@/hooks/use-mobile';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import GroupSelector from '@/components/equipment-groups/GroupSelector';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { Equipment } from '@/types/equipment';
import { junctionTableManager } from '@/lib/junction-tables';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PartFormData {
  name: string;
  reference: string;
  equipmentIds: string[];
  groupIds: string[];
  quantity: number;
  minQuantity: number;
  location: string;
  supplier: string;
}

type PartSortColumn = 'reference' | 'name' | 'quantity' | 'min_quantity' | 'status' | 'equipment_names' | 'group_names';

const Parts = () => {
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parts, setParts] = useState<PartWithStock[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<PartWithStock | null>(null);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile || isTablet ? 'grid' : 'list');
  const [associationTab, setAssociationTab] = useState<'individual' | 'groups'>('individual');

  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [isFilterEquipmentSelectorOpen, setIsFilterEquipmentSelectorOpen] = useState(false);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<PartSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Consommer les données du contexte au lieu de faire de nouveaux appels useCollection
  const {
    equipments,
    equipmentGroups,
    buildings,
    services,
    locations,
    loadingGroups, // Utiliser le loading des groupes du contexte
  } = useEquipmentContext();

  const {
    data: firebaseParts,
    loading,
    error,
    addDocument,
    updateDocument,
    refetch: refetchParts
  } = useCollection<Part>({ tableName: 'parts' }); // Cet appel reste ici car il est spécifique aux pièces

  const initialFormState: PartFormData = {
    name: '',
    reference: '',
    equipmentIds: [],
    groupIds: [],
    quantity: 0,
    minQuantity: 0,
    location: '',
    supplier: '',
  };

  const [formData, setFormData] = useState<PartFormData>(initialFormState);

  useEffect(() => {
    if (!loading && firebaseParts) {
      const fetchAndSetParts = async () => {
        const partsWithStatusAndGroups = await Promise.all(firebaseParts.map(async (part) => {
          const status =
            part.quantity === 0 ? 'critical' as const :
              part.quantity <= part.min_quantity ? 'warning' as const : 'normal' as const;
          const associatedGroupIds = await junctionTableManager.getGroupsForPart(part.id);
          return {
            ...part,
            status,
            equipment_ids: part.equipment_ids || [],
            associatedGroupIds: associatedGroupIds || []
          } as PartWithStock;
        }));
        setParts(partsWithStatusAndGroups);
      };
      fetchAndSetParts();
    } else if (loading) {
      console.log("Loading parts from Supabase...");
    } else if (error) {
      console.error("Error fetching parts from Supabase:", error);
      toast({
        title: "Erreur de chargement",
        description: "Erreur lors du chargement des pièces depuis Supabase.",
        variant: "destructive"
      });
      setParts([]);
    }
  }, [firebaseParts, loading, error, toast]);

  useEffect(() => {
    if (!openDialog) {
      setEquipmentSearchTerm('');
      setGroupSearchTerm('');
    } else {
      setEquipmentSearchTerm('');
      setGroupSearchTerm('');

      if (editingPart) {
        if (editingPart.associatedGroupIds && editingPart.associatedGroupIds.length > 0) {
          setAssociationTab('groups');
        } else {
          setAssociationTab('individual');
        }
      } else {
         setAssociationTab('individual');
      }
    }
  }, [openDialog, editingPart]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'minQuantity'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipmentSelected = (equipment: Equipment) => {
    setFormData(prev => {
      const currentIds = prev.equipmentIds || [];
      if (!currentIds.includes(equipment.id)) {
        return {
          ...prev,
          equipmentIds: [...currentIds, equipment.id]
        };
      }
      return prev;
    });
    setIsEquipmentSelectorOpen(false);
  };

  const handleFilterEquipmentSelect = (equipment: Equipment) => {
    setEquipmentFilter(equipment.id);
    setIsFilterEquipmentSelectorOpen(false);
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentIds: (prev.equipmentIds || []).filter(id => id !== equipmentId)
    }));
  };

  const handleGroupSelected = (groupId: string, isChecked: boolean) => {
    setFormData(prev => {
      const currentIds = prev.groupIds || [];
      if (isChecked) {
        return {
          ...prev,
          groupIds: [...currentIds, groupId]
        };
      } else {
        return {
          ...prev,
          groupIds: currentIds.filter(id => id !== groupId)
        };
      }
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: (prev.groupIds || []).filter(id => id !== groupId)
    }));
  };

  const getEquipmentName = (equipmentId: string) => {
    const equipment = equipments?.find(e => e.id === equipmentId);
    return equipment?.name;
  };

  const getGroupName = (groupId: string) => {
    const group = equipmentGroups?.find(g => g.id === groupId);
    return group?.name || 'Groupe inconnu';
  };

  const filteredParts = parts?.filter(part => {
    const matchesSearch = searchTerm === '' ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEquipment = equipmentFilter === 'all' ||
      (part.equipment_ids && part.equipment_ids.includes(equipmentFilter));
    const matchesStatus = statusFilter === 'all' || part.status === statusFilter;

    return matchesSearch && matchesEquipment && matchesStatus;
  }) || [];

  const sortedParts = useMemo(() => {
    if (!sortColumn) return filteredParts;

    const sorted = [...filteredParts].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'reference':
          valA = a.reference?.toLowerCase() || '';
          valB = b.reference?.toLowerCase() || '';
          break;
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'quantity':
          valA = a.quantity || 0;
          valB = b.quantity || 0;
          break;
        case 'min_quantity':
          valA = a.min_quantity || 0;
          valB = b.min_quantity || 0;
          break;
        case 'status':
          const statusOrder = { 'critical': 1, 'warning': 2, 'normal': 3 };
          valA = statusOrder[a.status] || 99;
          valB = statusOrder[b.status] || 99;
          break;
        case 'equipment_names':
          const aEquipmentName = a.equipment_ids && a.equipment_ids.length > 0 ? getEquipmentName(a.equipment_ids[0]) : '';
          const bEquipmentName = b.equipment_ids && b.equipment_ids.length > 0 ? getEquipmentName(b.equipment_ids[0]) : '';
          valA = aEquipmentName?.toLowerCase() || '';
          valB = bEquipmentName?.toLowerCase() || '';
          break;
        case 'group_names':
          const aGroupName = a.associatedGroupIds && a.associatedGroupIds.length > 0 ? getGroupName(a.associatedGroupIds[0]) : '';
          const bGroupName = b.associatedGroupIds && b.associatedGroupIds.length > 0 ? getGroupName(b.associatedGroupIds[0]) : '';
          valA = aGroupName?.toLowerCase() || '';
          valB = bGroupName?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredParts, sortColumn, sortDirection, getEquipmentName, getGroupName]);

  const handleSortChange = (column: PartSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSavePart = async () => {
    if (!formData.name || !formData.reference) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir le nom et la référence.",
        variant: "destructive"
      });
      return;
    }

    let allEquipmentIds = [...(formData.equipmentIds || [])];

    // Combine equipment IDs from groups for the part data (denormalization for parts.equipment_ids)
    if (formData.groupIds && formData.groupIds.length > 0 && equipmentGroups) {
      formData.groupIds.forEach(groupId => {
        const group = equipmentGroups.find(g => g.id === groupId);
        if (group && group.equipment_ids) {
          group.equipment_ids.forEach(eqId => {
            if (!allEquipmentIds.includes(eqId)) {
              allEquipmentIds.push(eqId);
            }
          });
        }
      });
    }

    const partDataToSave: Omit<Part, 'id' | 'status' | 'equipmentName'> = {
      name: formData.name,
      reference: formData.reference,
      quantity: formData.quantity,
      min_quantity: formData.minQuantity,
      location: formData.location,
      supplier: formData.supplier,
      last_restock_date: new Date().toISOString().split('T')[0],
      equipment_ids: allEquipmentIds,
    };

    let partId: string | undefined;

    if (editingPart) {
      if (updateDocument) {
        try {
          const updatedData = await updateDocument(editingPart.id, partDataToSave as Partial<Part>);
          if (updatedData) {
            partId = editingPart.id;
            toast({
              title: "Pièce mise à jour",
              description: `La pièce ${formData.name} a été mise à jour avec succès.`,
            });
          } else {
            throw new Error("Failed to update part in Supabase.");
          }
        } catch (updateError) {
          console.error("Error updating part in Supabase:", updateError);
          toast({
            title: "Erreur de mise à jour",
            description: `Erreur lors de la mise à jour de la pièce ${formData.name}.`,
            variant: "destructive",
          });
          return;
        }
      }
    } else {
      if (addDocument) {
        try {
          const newPartData = await addDocument(partDataToSave);
          if (newPartData && newPartData.length > 0) {
            partId = newPartData[0].id;
            toast({
              title: "Pièce ajoutée",
              description: `La pièce ${formData.name} a été ajoutée avec succès.`,
            });
          } else {
            throw new Error("Failed to add part to Supabase.");
          }
        } catch (addError) {
          console.error("Error adding part to Supabase:", addError);
          toast({
            title: "Erreur d'ajout",
            description: `Erreur lors de l'ajout de la pièce ${formData.name}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (partId) {
      await junctionTableManager.updatePartGroupMembers(partId, formData.groupIds || []);
      console.log(`Part ${partId} associated with groups:`, formData.groupIds);
    }

    setFormData(initialFormState);
    setEditingPart(null);
    setOpenDialog(false);
    refetchParts();
  };

  const handleEditPart = async (part: PartWithStock) => {
    const associatedGroupIds = await junctionTableManager.getGroupsForPart(part.id);

    setEditingPart(part);
    setFormData({
      name: part.name,
      reference: part.reference,
      equipmentIds: part.equipment_ids || [],
      groupIds: associatedGroupIds,
      quantity: part.quantity,
      minQuantity: part.min_quantity,
      location: part.location,
      supplier: part.supplier,
    });
    setOpenDialog(true);
  };

  const handleRestockPart = async (partId: string, quantity: number) => {
    const partToUpdate = parts.find(p => p.id === partId);

    if (!partToUpdate) {
      toast({
        title: "Erreur",
        description: "Pièce introuvable.",
        variant: "destructive"
      });
      return;
    }

    const newQuantity = partToUpdate.quantity + quantity;

    try {
      if (updateDocument) {
        await updateDocument(partId, {
          quantity: newQuantity,
          last_restock_date: new Date().toISOString().split('T')[0]
        });
        toast({
          title: "Stock mis à jour",
          description: `L'approvisionnement de ${quantity} unité(s) a été enregistré pour ${partToUpdate.name}.`
        });
        refetchParts();
      }
    } catch (error) {
      console.error("Error restocking part:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du stock.",
        variant: "destructive"
      });
    }
  };

  const handleUsePartsForIntervention = async (partId: string, quantity: number) => {
    const partToUpdate = parts.find(p => p.id === partId);

    if (!partToUpdate) {
      toast({
        title: "Erreur",
        description: "Pièce introuvable.",
        variant: "destructive"
      });
      return;
    }

    if (partToUpdate.quantity < quantity) {
      toast({
        title: "Stock insuffisant",
        description: `Il n'y a que ${partToUpdate.quantity} disponible(s).`,
        variant: "destructive"
      });
      return;
    }

    const newQuantity = partToUpdate.quantity - quantity;

    try {
      if (updateDocument) {
        await updateDocument(partId, {
          quantity: newQuantity,
        });
        toast({
          title: "Pièces utilisées",
          description: `${quantity} unité(s) de ${partToUpdate.name} ont été utilisées pour l'intervention.`
        });
        refetchParts();
      }
    } catch (error) {
      console.error("Error using part:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du stock après utilisation.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Stock OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Stock Bas</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rupture</Badge>;
      default:
        return null;
    }
  };

  const criticalPartsCount = parts?.filter(part => part.status === 'critical').length || 0;
  const warningPartsCount = parts?.filter(part => part.status === 'warning').length || 0;

  const filteredEquipmentsForModal = equipments?.filter(equipment => {
    return equipment && equipment.name && equipment.name.toLowerCase().includes((equipmentSearchTerm || '').toLowerCase());
  }) || [];

  const filteredGroupsForModal = equipmentGroups?.filter(group => {
    return group && group.name && group.name.toLowerCase().includes((groupSearchTerm || '').toLowerCase());
  }) || [];

  const selectedFilterEquipment = equipments?.find(e => e.id === equipmentFilter);

  return (
    <div className="container mx-auto py-6 md:py-10 lg:py-20 px-2 md:px-4">
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">Gestion des Pièces Détachées</h1>
            <p className="text-sm md:text-base text-muted-foreground">Suivez et gérez votre inventaire de pièces détachées par équipement</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-secondary' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-secondary' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  {!isMobile && "Trier"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortColumn || ''} onValueChange={(value) => handleSortChange(value as PartSortColumn)}>
                  <DropdownMenuRadioItem value="name">
                    Nom
                    {sortColumn === 'name' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="reference">
                    Référence
                    {sortColumn === 'reference' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="quantity">
                    Stock
                    {sortColumn === 'quantity' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="min_quantity">
                    Seuil min.
                    {sortColumn === 'min_quantity' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="status">
                    Statut
                    {sortColumn === 'status' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="equipment_names">
                    Équipements
                    {sortColumn === 'equipment_names' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="group_names">
                    Groupes
                    {sortColumn === 'group_names' && (sortDirection === 'asc' ? <ArrowUp className="ml-auto h-3 w-3" /> : <ArrowDown className="ml-auto h-3 w-3" />)}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size={isMobile ? "sm" : "default"}
              onClick={() => {
                setEditingPart(null);
                setFormData(initialFormState);
                setOpenDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {!isMobile && "Ajouter une pièce"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-800 text-xs md:text-sm font-medium">Stock Normal</p>
              <h3 className="text-xl md:text-2xl font-bold text-green-800">
                {(parts || []).filter(part => part.status === 'normal').length}
              </h3>
            </div>
            <div className="bg-green-100 p-2 md:p-3 rounded-full">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-800" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-yellow-800 text-xs md:text-sm font-medium">Stock Bas</p>
              <h3 className="text-xl md:text-2xl font-bold text-yellow-800">
                {parts?.filter(part => part.status === 'warning').length || 0}
              </h3>
            </div>
            <div className="bg-yellow-100 p-2 md:p-3 rounded-full">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-yellow-800" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-800 text-xs md:text-sm font-medium">Rupture de Stock</p>
              <h3 className="text-xl md:text-2xl font-bold text-red-800">
                {parts?.filter(part => part.status === 'critical').length || 0}
              </h3>
            </div>
            <div className="bg-red-100 p-2 md:p-3 rounded-full">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-3 md:p-4 mb-4 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="text-xs md:text-sm font-medium mb-1 block">Recherche</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une pièce..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs md:text-sm font-medium mb-1 block">Équipement</label>
            <div className="relative">
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-start text-left font-normal"
                onClick={() => setIsFilterEquipmentSelectorOpen(true)}
              >
                <span className="truncate pr-5">
                  {selectedFilterEquipment ? selectedFilterEquipment.name : "Tous les équipements"}
                </span>
              </Button>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {equipmentFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                    onClick={() => setEquipmentFilter('all')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                 <Search className="h-4 w-4 ml-1 opacity-50" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs md:text-sm font-medium mb-1 block">Statut</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="normal">Stock OK</SelectItem>
                <SelectItem value="warning">Stock Bas</SelectItem>
                <SelectItem value="critical">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
         <div className="flex items-center justify-center h-40">
           <p>Chargement des pièces...</p>
         </div>
       ) : error ? (
         <div className="p-4 border border-red-300 bg-red-50 rounded-md">
           <p className="text-red-500">Erreur lors du chargement des pièces.</p>
         </div>
       ) : viewMode === 'list' ? (
        <div className="bg-white border rounded-lg overflow-hidden mb-4 md:mb-8">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange('reference')}
                  >
                    <div className="flex items-center">
                      Référence
                      {sortColumn === 'reference' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center">
                      Nom
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  {!isMobile && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange('equipment_names')}
                    >
                      <div className="flex items-center">
                        Équipement(s)
                        {sortColumn === 'equipment_names' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  )}
                  {!isMobile && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange('group_names')}
                    >
                      <div className="flex items-center">
                        Groupe(s)
                        {sortColumn === 'group_names' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  )}
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange('quantity')}
                  >
                    <div className="flex items-center">
                      Stock
                      {sortColumn === 'quantity' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  {!isMobile && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSortChange('min_quantity')}
                    >
                      <div className="flex items-center">
                        Min
                        {sortColumn === 'min_quantity' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  )}
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortChange('status')}
                  >
                    <div className="flex items-center">
                      Statut
                      {sortColumn === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParts?.length > 0 ? (
                  sortedParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.reference}</TableCell>
                      <TableCell>{part.name}</TableCell>
                      {!isMobile && (
                        <TableCell>
                           <div className="flex flex-wrap gap-1">
                            {part.equipment_ids && part.equipment_ids.length > 0 ? (
                              <>
                                {(() => {
                                  const validEquipmentIds = part.equipment_ids.filter(id => 
                                    equipments?.some(e => e.id === id)
                                  );
                                  if (validEquipmentIds.length === 0) {
                                    return <span className="text-xs text-muted-foreground">Aucun</span>;
                                  }
                                  return (
                                    <>
                                      <Badge variant="secondary" className="text-xs">
                                        {getEquipmentName(validEquipmentIds[0])}
                                      </Badge>
                                      {validEquipmentIds.length > 1 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{validEquipmentIds.length - 1}
                                        </Badge>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Aucun</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {part.associatedGroupIds && part.associatedGroupIds.length > 0 ? (
                              <>
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {getGroupName(part.associatedGroupIds[0])}
                                </Badge>
                                {part.associatedGroupIds.length > 1 && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    +{part.associatedGroupIds.length - 1}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Aucun</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{part.quantity}</TableCell>
                      {!isMobile && <TableCell>{part.min_quantity}</TableCell>}
                      <TableCell>{getStatusBadge(part.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1 md:space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditPart(part)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Éditer
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">Actions <MoreHorizontal className="ml-2 h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Actions pour {part.name}</DialogTitle>
                              </DialogHeader>
                              <Tabs defaultValue="restock">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="restock">Approvisionner</TabsTrigger>
                                  <TabsTrigger value="use">Utiliser</TabsTrigger>
                                </TabsList>
                                <TabsContent value="restock" className="space-y-4 pt-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Quantité à ajouter</label>
                                    <Input type="number" min="1" defaultValue="1" id={`restockQuantity-${part.id}`} />
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={() => {
                                      const qty = parseInt((document.getElementById(`restockQuantity-${part.id}`) as HTMLInputElement).value);
                                      if (!isNaN(qty) && qty > 0) handleRestockPart(part.id, qty);
                                    }}>
                                      Approvisionner
                                    </Button>
                                  </DialogFooter>
                                </TabsContent>
                                <TabsContent value="use" className="space-y-4 pt-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Quantité à utiliser</label>
                                    <Input type="number" min="1" max={part.quantity.toString()} defaultValue="1" id={`useQuantity-${part.id}`} />
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={() => {
                                      const qty = parseInt((document.getElementById(`useQuantity-${part.id}`) as HTMLInputElement).value);
                                       if (!isNaN(qty) && qty > 0) handleUsePartsForIntervention(part.id, qty);
                                    }}>
                                      Utiliser
                                    </Button>
                                  </DialogFooter>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Aucune pièce trouvée avec les critères de recherche actuels.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedParts?.length > 0 ? (
            sortedParts.map((part) => (
              <Card key={part.id} className={`overflow-hidden border-l-4 ${
                part.status === 'critical' ? 'border-l-red-500' :
                part.status === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardHeader className="pb-2 p-3 md:p-6">
                  <div className="flex justify-between">
                    <CardTitle className="text-base md:text-lg">{part.name}</CardTitle>
                    {getStatusBadge(part.status)}
                  </div>
                  <CardDescription className="text-xs">
                    Réf: {part.reference}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="text-base md:text-lg font-semibold">{part.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Seuil min.</p>
                      <p>{part.min_quantity}</p>
                    </div>
                  </div>

                  {part.equipment_ids && part.equipment_ids.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Équipement(s) associé(s)</p>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const validEquipmentIds = part.equipment_ids?.filter(id => 
                            equipments?.some(e => e.id === id)
                          ) || [];
                          if (validEquipmentIds.length === 0) {
                            return null;
                          }
                          return (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                {getEquipmentName(validEquipmentIds[0])}
                              </Badge>
                              {validEquipmentIds.length > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{validEquipmentIds.length - 1}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                   {part.associatedGroupIds && part.associatedGroupIds.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Groupe(s) associé(s)</p>
                      <div className="flex flex-wrap gap-1">
                        <> {/* Use React Fragment here */}
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {getGroupName(part.associatedGroupIds[0])}
                          </Badge>
                          {part.associatedGroupIds.length > 1 && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              +{part.associatedGroupIds.length - 1}
                            </Badge>
                          )}
                        </>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-0 p-3 md:p-6">
                  <Button size="sm" variant="outline" onClick={() => handleEditPart(part)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Éditer
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">Actions <MoreHorizontal className="ml-2 h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] md:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Actions pour {part.name}</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="restock">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="restock">Approvisionner</TabsTrigger>
                          <TabsTrigger value="use">Utiliser</TabsTrigger>
                        </TabsList>
                        <TabsContent value="restock" className="space-y-4 pt-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Quantité à ajouter</label>
                            <Input type="number" min="1" defaultValue="1" id={`restockQuantity-${part.id}`} />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              const qty = parseInt((document.getElementById(`restockQuantity-${part.id}`) as HTMLInputElement).value);
                              if (!isNaN(qty) && qty > 0) handleRestockPart(part.id, qty);
                            }}>
                              Approvisionner
                            </Button>
                          </DialogFooter>
                        </TabsContent>
                        <TabsContent value="use" className="space-y-4 pt-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Quantité à utiliser</label>
                            <Input type="number" min="1" max={part.quantity.toString()} defaultValue="1" id={`useQuantity-${part.id}`} />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => {
                              const qty = parseInt((document.getElementById(`useQuantity-${part.id}`) as HTMLInputElement).value);
                               if (!isNaN(qty) && qty > 0) handleUsePartsForIntervention(part.id, qty);
                            }}>
                              Utiliser
                            </Button>
                          </DialogFooter>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 border rounded-md text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Aucune pièce trouvée</h3>
              <p className="mt-2 text-muted-foreground">
                Aucune pièce ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Modifier la pièce" : "Ajouter une nouvelle pièce"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <div className="relative">
                <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Nom de la pièce"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Référence *</label>
              <div className="relative">
                <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="reference"
                  value={formData.reference}
                  onChange={handleFormChange}
                  placeholder="Référence"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <Input
                name="quantity"
                type="number"
                value={formData.quantity.toString()}
                onChange={handleFormChange}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Seuil minimal</label>
              <Input
                name="minQuantity"
                type="number"
                value={formData.minQuantity.toString()}
                onChange={handleFormChange}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Emplacement</label>
              <div className="relative">
                <Warehouse className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="Emplacement de stockage"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fournisseur</label>
              <div className="relative">
                <Truck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleFormChange}
                  placeholder="Nom du fournisseur"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Association</label>
              </div>

              <Tabs value={associationTab} onValueChange={(value) => setAssociationTab(value as 'individual' | 'groups')} className="w-full">
                <TabsList className="grid grid-cols-2 mb-2">
                  <TabsTrigger value="individual">Équipements individuels</TabsTrigger>
                  <TabsTrigger value="groups">Groupes d'équipements</TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="mt-0">
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <WrenchIcon className="h-4 w-4" />
                        Équipements associés
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEquipmentSelectorOpen(true)}
                        className="flex items-center gap-2"
                        disabled={!equipments?.length}
                      >
                        <Search className="h-4 w-4" />
                        Sélectionner
                      </Button>
                    </div>

                    {formData.equipmentIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center p-4">Aucun équipement sélectionné</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.equipmentIds.map((equipmentId) => (
                          <Badge key={equipmentId} variant="outline" className="bg-green-50 text-green-700 border-green-200 pr-1">
                            <WrenchIcon className="w-3 h-3 mr-1" />
                            {getEquipmentName(equipmentId)}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEquipment(equipmentId)}
                              className="ml-1 p-0 h-auto hover:bg-red-100"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="mt-0">
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Groupes associés
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsGroupSelectorOpen(true)}
                        className="flex items-center gap-2"
                        disabled={!equipmentGroups?.length}
                      >
                        <Search className="h-4 w-4" />
                        Sélectionner
                      </Button>
                    </div>

                    {formData.groupIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center p-4">Aucun groupe sélectionné</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.groupIds.map((groupId) => (
                          <Badge key={groupId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 pr-1">
                            <Users className="w-3 h-3 mr-1" />
                            {getGroupName(groupId)}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveGroup(groupId)}
                              className="ml-1 p-0 h-auto hover:bg-red-100"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSavePart}>
              {editingPart ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EquipmentSelector
        isOpen={isFilterEquipmentSelectorOpen}
        onClose={() => setIsFilterEquipmentSelectorOpen(false)}
        onSelect={handleFilterEquipmentSelect}
        equipments={equipments}
        groups={equipmentGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        title="Sélectionner un équipement pour filtrer"
        placeholder="Rechercher un équipement..."
      />

      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onSelect={handleEquipmentSelected}
        equipments={equipments}
        groups={equipmentGroups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
        title="Sélectionner un équipement pour la pièce"
        placeholder="Rechercher un équipement à associer..."
      />

      <GroupSelector
        isOpen={isGroupSelectorOpen}
        onClose={() => setIsGroupSelectorOpen(false)}
        onSelect={handleGroupSelected}
        selectedGroupIds={formData.groupIds || []}
        groups={equipmentGroups || []}
        title="Sélectionner des groupes pour la pièce"
        placeholder="Rechercher un groupe à associer..."
      />
    </div>
  );
};

export default Parts;
