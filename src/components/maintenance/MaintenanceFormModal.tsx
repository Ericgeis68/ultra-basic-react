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

    onSave({ ...data, equipment_name: selectedEquipment?.name, created_by: currentUser?.id });
    onClose();
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
                {/* Date prévue (only for one-time or standard recurring, not custom multi-date) */}
                {formFrequencyType !== 'custom' && (
                  <FormField
                    control={form.control}
                    name="next_due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date prévue</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), 'PPP', { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              initialFocus
                              className="pointer-events-auto"
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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