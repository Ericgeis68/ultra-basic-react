import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, X, User, WrenchIcon, Clock, AlertTriangle, Settings, Bell, BellOff } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import EquipmentSelector from '@/components/equipment/EquipmentSelector';
import { useCollection } from '@/hooks/use-supabase-collection';
import { Equipment } from '@/types/equipment';
import { EquipmentGroup } from '@/types/equipmentGroup';
import { Building as BuildingType } from '@/types/building';
import { Service } from '@/types/service';
import { Location } from '@/types/location';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MultiDatePicker } from '@/components/ui/multi-date-picker';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface MaintenanceFormData {
  title: string;
  description?: string;
  equipment_id?: string;
  equipment_name?: string;
  type: 'preventive' | 'corrective' | 'regulatory' | 'improvement';
  frequency_type?: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  frequency_value?: number;
  next_due_date: string;
  assigned_technicians?: string[];
  notes?: string;
  selected_dates?: string[];
  created_by?: string;
  notification_enabled?: boolean;
  notification_time_before_value?: number;
  notification_time_before_unit?: 'hours' | 'days' | 'weeks';
}

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (maintenance: MaintenanceFormData) => void;
  maintenance?: any;
  currentUser?: any;
  prefillEquipment?: {
    equipment_id: string;
    equipment_name: string;
  };
}

const maintenanceTypes = [
  { id: "preventive", name: "Préventive", icon: Settings, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "corrective", name: "Corrective", icon: WrenchIcon, color: "bg-red-100 text-red-800 border-red-200" },
  { id: "regulatory", name: "Réglementaire", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "improvement", name: "Amélioration", icon: Plus, color: "bg-green-100 text-green-800 border-green-200" }
];

const frequencyTypes = [
  { id: "one-time", name: "Une seule fois" },
  { id: "daily", name: "Quotidien" },
  { id: "weekly", name: "Hebdomadaire" },
  { id: "monthly", name: "Mensuel" },
  { id: "quarterly", name: "Trimestriel" },
  { id: "yearly", name: "Annuel" },
  { id: "custom", name: "Personnalisé" }
];

const timeUnits = [
  { id: "hours", name: "Heure(s)" },
  { id: "days", name: "Jour(s)" },
  { id: "weeks", name: "Semaine(s)" }
];

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  maintenance,
  currentUser,
  prefillEquipment
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [showOtherUsers, setShowOtherUsers] = useState(false);
  const { user } = useCustomAuth();

  // Fetch data
  const { data: equipments } = useCollection<Equipment>({ tableName: 'equipments' });
  const { data: groups } = useCollection<EquipmentGroup>({ tableName: 'equipment_groups' });
  const { data: buildings } = useCollection<BuildingType>({ tableName: 'buildings' });
  const { data: services } = useCollection<Service>({ tableName: 'services' });
  const { data: locations } = useCollection<Location>({ tableName: 'locations' });

  const form = useForm<MaintenanceFormData>({
    defaultValues: {
      title: "",
      description: "",
      equipment_id: "",
      type: "preventive",
      frequency_type: "one-time",
      frequency_value: 1,
      next_due_date: format(new Date(), 'yyyy-MM-dd'),
      assigned_technicians: currentUser ? [currentUser.id] : [],
      notes: "",
      selected_dates: [],
      created_by: currentUser?.id,
      notification_enabled: true,
      notification_time_before_value: 1,
      notification_time_before_unit: 'days',
    }
  });

  const formFrequencyType = form.watch('frequency_type');

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, username, role')
          .order('full_name');

        if (error) {
          console.error('Erreur chargement utilisateurs:', error);
          return;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (maintenance) {
      form.reset({
        title: maintenance.title || "",
        description: maintenance.description || "",
        equipment_id: maintenance.equipment_id || "",
        type: maintenance.type || "preventive",
        frequency_type: maintenance.frequency_type || "one-time",
        frequency_value: maintenance.frequency_value || 1,
        next_due_date: maintenance.next_due_date || format(new Date(), 'yyyy-MM-dd'),
        assigned_technicians: maintenance.assigned_technicians || (currentUser ? [currentUser.id] : []),
        notes: maintenance.notes || "",
        selected_dates: maintenance.selected_dates || [],
        created_by: maintenance.created_by || currentUser?.id,
        notification_enabled: maintenance.notification_enabled ?? true,
        notification_time_before_value: maintenance.notification_time_before_value || 1,
        notification_time_before_unit: maintenance.notification_time_before_unit || 'days',
      });
      setSelectedTechnicians(maintenance.assigned_technicians || (currentUser ? [currentUser.id] : []));
      setSelectedEquipmentId(maintenance.equipment_id || "");
      if (maintenance.equipment_id && equipments) {
        const eq = equipments.find(e => e.id === maintenance.equipment_id);
        setSelectedEquipment(eq || null);
      }
    } else {
      // Si prefillEquipment est fourni, pré-remplir avec cet équipement
      const equipmentId = prefillEquipment?.equipment_id || "";
      const equipmentName = prefillEquipment?.equipment_name || "";
      
      form.reset({
        title: "",
        description: "",
        equipment_id: equipmentId,
        type: "preventive",
        frequency_type: "one-time",
        frequency_value: 1,
        next_due_date: format(new Date(), 'yyyy-MM-dd'),
        assigned_technicians: currentUser ? [currentUser.id] : [],
        notes: "",
        selected_dates: [],
        created_by: currentUser?.id,
        notification_enabled: true,
        notification_time_before_value: 1,
        notification_time_before_unit: 'days',
      });
      
      setSelectedEquipmentId(equipmentId);
      setSelectedTechnicians(currentUser ? [currentUser.id] : []);
      
      // Si on a un équipement pré-rempli, le sélectionner
      if (equipmentId && equipments) {
        const eq = equipments.find(e => e.id === equipmentId);
        setSelectedEquipment(eq || null);
      } else if (prefillEquipment) {
        // Créer un objet équipement temporaire pour l'affichage
        setSelectedEquipment({
          id: equipmentId,
          name: equipmentName,
        } as Equipment);
      } else {
        setSelectedEquipment(null);
      }
    }
  }, [maintenance, currentUser, form, isOpen, equipments, prefillEquipment]);

  const handleEquipmentSelected = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setSelectedEquipmentId(equipment.id);
    form.setValue('equipment_id', equipment.id);
  };

  const handleSubmit = (data: MaintenanceFormData) => {
    if (!data.equipment_id) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un équipement",
        variant: "destructive"
      });
      return;
    }

    if (selectedTechnicians.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez assigner au moins un technicien",
        variant: "destructive"
      });
      return;
    }

    onSave({ 
      ...data, 
      equipment_name: selectedEquipment?.name, 
      created_by: currentUser?.id,
      assigned_technicians: selectedTechnicians
    });
    onClose();
  };

  const toggleTechnician = (userId: string) => {
    setSelectedTechnicians(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getTypeBadgeInfo = (type: string) => {
    return maintenanceTypes.find(t => t.id === type) || maintenanceTypes[0];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="maintenance-form-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {maintenance ? "Modifier la maintenance" : "Nouvelle maintenance planifiée"}
            </DialogTitle>
            <DialogDescription id="maintenance-form-description">
              {maintenance ? "Modifiez les détails de la maintenance existante." : "Remplissez les informations pour planifier une nouvelle tâche de maintenance."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Titre */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Vérification mensuelle du groupe électrogène"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Équipement */}
                <FormItem>
                  <FormLabel>Équipement *</FormLabel>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedEquipmentId && "text-muted-foreground"
                      )}
                      onClick={() => setIsEquipmentSelectorOpen(true)}
                    >
                      <WrenchIcon className="mr-2 h-4 w-4" />
                      {selectedEquipmentId && selectedEquipment ? (
                        selectedEquipment.name
                      ) : (
                        "Sélectionner un équipement"
                      )}
                    </Button>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez les tâches à effectuer..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de maintenance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fréquence */}
                <FormField
                  control={form.control}
                  name="frequency_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fréquence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyTypes.map((freq) => (
                            <SelectItem key={freq.id} value={freq.id}>
                              {freq.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valeur de fréquence */}
                {formFrequencyType !== 'one-time' && formFrequencyType !== 'custom' && (
                  <FormField
                    control={form.control}
                    name="frequency_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Répéter tous les</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Multi-date picker for custom frequency */}
                {formFrequencyType === 'custom' && (
                  <FormField
                    control={form.control}
                    name="selected_dates"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Dates personnalisées</FormLabel>
                        <MultiDatePicker
                          selected={field.value?.map(d => new Date(d))}
                          onSelect={(dates) => {
                            const sortedDates = dates ? dates.sort((a, b) => a.getTime() - b.getTime()) : [];
                            field.onChange(sortedDates.map(d => format(d, 'yyyy-MM-dd')));
                            // Update next_due_date to the earliest selected date
                            if (sortedDates.length > 0) {
                              form.setValue('next_due_date', format(sortedDates[0], 'yyyy-MM-dd'));
                            } else {
                              // If no dates selected, reset next_due_date to current date
                              form.setValue('next_due_date', format(new Date(), 'yyyy-MM-dd'));
                            }
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date prévue (responsive: mobile natif, desktop popover calendrier + heure/minutes) */}
                {formFrequencyType !== 'custom' && (
                  <FormField
                    control={form.control}
                    name="next_due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date et heure prévues</FormLabel>
                        {/* Mobile: input natif */}
                        <div className="block sm:hidden">
                          <FormControl>
                            <Input
                              type="datetime-local"
                              min={(() => { const now = new Date(); const off = now.getTimezoneOffset(); const local = new Date(now.getTime() - off*60000); return local.toISOString().slice(0,16); })()}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </div>
                        {/* Desktop: popover calendrier + heures/minutes */}
                        <div className="hidden sm:block">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <span>
                                    {field.value
                                      ? new Date(field.value).toLocaleString()
                                      : 'Choisir une date et une heure'}
                                  </span>
                                  <CalendarIcon className="h-4 w-4 opacity-70" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] sm:w-[360px] p-3" align="start">
                              <div className="space-y-3">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                  onSelect={(day) => {
                                    const current = field.value ? new Date(field.value) : new Date();
                                    if (day) {
                                      const merged = new Date(day);
                                      merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
                                      const yyyy = merged.getFullYear();
                                      const mm = String(merged.getMonth() + 1).padStart(2, '0');
                                      const dd = String(merged.getDate()).padStart(2, '0');
                                      const hh = String(merged.getHours()).padStart(2, '0');
                                      const mi = String(merged.getMinutes()).padStart(2, '0');
                                      field.onChange(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
                                    }
                                  }}
                                  initialFocus
                                  className="pointer-events-auto"
                                  locale={fr}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <FormLabel className="text-xs">Heures</FormLabel>
                                    <Select
                                      value={(field.value ? new Date(field.value).getHours() : 9).toString()}
                                      onValueChange={(val) => {
                                        const date = field.value ? new Date(field.value) : new Date();
                                        date.setHours(parseInt(val), date.getMinutes(), 0, 0);
                                        const yyyy = date.getFullYear();
                                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                                        const dd = String(date.getDate()).padStart(2, '0');
                                        const hh = String(date.getHours()).padStart(2, '0');
                                        const mi = String(date.getMinutes()).padStart(2, '0');
                                        field.onChange(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-56">
                                        {Array.from({ length: 24 }).map((_, h) => (
                                          <SelectItem key={h} value={h.toString()}>{String(h).padStart(2, '0')} h</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <FormLabel className="text-xs">Minutes</FormLabel>
                                    <Select
                                      value={(field.value ? new Date(field.value).getMinutes() : 0).toString()}
                                      onValueChange={(val) => {
                                        const date = field.value ? new Date(field.value) : new Date();
                                        date.setMinutes(parseInt(val), 0, 0);
                                        const yyyy = date.getFullYear();
                                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                                        const dd = String(date.getDate()).padStart(2, '0');
                                        const hh = String(date.getHours()).padStart(2, '0');
                                        const mi = String(date.getMinutes()).padStart(2, '0');
                                        field.onChange(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-56">
                                        {[0, 5, 10, 15, 20, 30, 40, 45, 50, 55].map((m) => (
                                          <SelectItem key={m} value={m.toString()}>{String(m).padStart(2, '0')} min</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Techniciens assignés */}
              <div className="space-y-3">
                <Label>
                  <User className="h-4 w-4 inline mr-1" />
                  Techniciens assignés * ({selectedTechnicians.length} sélectionné{selectedTechnicians.length > 1 ? 's' : ''})
                </Label>
                
                <div className="border rounded-md p-3 space-y-2">
                  {/* Utilisateur connecté (toujours visible) */}
                  {user && users.find(u => u.id === user.id) && (
                    <div 
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedTechnicians.includes(user.id) 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleTechnician(user.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTechnicians.includes(user.id)}
                        onChange={() => toggleTechnician(user.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{users.find(u => u.id === user.id)?.full_name}</span>
                          <span className="text-sm text-muted-foreground">({users.find(u => u.id === user.id)?.username})</span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Moi</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bouton pour afficher/masquer les autres utilisateurs */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOtherUsers(!showOtherUsers)}
                  >
                    {showOtherUsers ? (
                      <>
                        <X className="h-4 w-4" />
                        Masquer les autres techniciens
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Ajouter d'autres techniciens ({users.filter(u => u.id !== user?.id).length})
                      </>
                    )}
                  </Button>

                  {/* Autres utilisateurs (cachés par défaut) */}
                  {showOtherUsers && (
                    <div className="max-h-48 overflow-y-auto space-y-2 border-t pt-2">
                      {users.filter(u => u.id !== user?.id).map(otherUser => (
                        <div 
                          key={otherUser.id} 
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            selectedTechnicians.includes(otherUser.id) 
                              ? 'bg-primary/10 border border-primary' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleTechnician(otherUser.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTechnicians.includes(otherUser.id)}
                            onChange={() => toggleTechnician(otherUser.id)}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{otherUser.full_name}</span>
                              <span className="text-sm text-muted-foreground">({otherUser.username})</span>
                              <span className="text-xs bg-muted px-1 rounded">{otherUser.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedTechnicians.length === 0 && (
                  <p className="text-sm text-destructive">Au moins un technicien doit être assigné</p>
                )}
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes supplémentaires..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section Notifications */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Configuration des notifications</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Activer les notifications */}
                  <FormField
                    control={form.control}
                    name="notification_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Notifications activées
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Recevoir des rappels pour cette maintenance
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Délai de notification */}
                  {form.watch('notification_enabled') && (
                    <>
                      <FormField
                        control={form.control}
                        name="notification_time_before_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rappel avant échéance</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="365"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notification_time_before_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unité de temps</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeUnits.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                {form.watch('notification_enabled') && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Notification programmée {form.watch('notification_time_before_value')} {' '}
                      {timeUnits.find(u => u.id === form.watch('notification_time_before_unit'))?.name.toLowerCase()} avant l'échéance
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit">
                  {maintenance ? "Mettre à jour" : "Créer la maintenance"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Equipment Selector Modal */}
      <EquipmentSelector
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        onSelect={(equipment) => {
          if (equipment) {
            handleEquipmentSelected(equipment);
          }
          setIsEquipmentSelectorOpen(false);
        }}
        equipments={equipments || []}
        groups={groups || []}
        buildings={buildings || []}
        services={services || []}
        locations={locations || []}
      />
    </>
  );
};

export default MaintenanceFormModal;
