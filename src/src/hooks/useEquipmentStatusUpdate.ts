import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useEquipmentStatusUpdate = () => {
  const setEquipmentToFaulty = async (equipmentId: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .update({ status: 'faulty' })
        .eq('id', equipmentId);

      if (error) {
        console.error('Error setting equipment to faulty:', error);
        toast({
          title: "Erreur",
          description: "Impossible de marquer l'équipement comme défaillant",
          variant: "destructive"
        });
        return;
      }

      console.log(`Equipment ${equipmentId} set to faulty`);
    } catch (error) {
      console.error('Exception setting equipment to faulty:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    }
  };

  const setEquipmentToOperational = async (equipmentId: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .update({ status: 'operational' })
        .eq('id', equipmentId);

      if (error) {
        console.error('Error setting equipment to operational:', error);
        toast({
          title: "Erreur",
          description: "Impossible de marquer l'équipement comme opérationnel",
          variant: "destructive"
        });
        return;
      }

      console.log(`Equipment ${equipmentId} set to operational`);
    } catch (error) {
      console.error('Exception setting equipment to operational:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    }
  };

  const setEquipmentToMaintenance = async (equipmentId: string) => {
    try {
      const { error } = await supabase
        .from('equipments')
        .update({ status: 'maintenance' })
        .eq('id', equipmentId);

      if (error) {
        console.error('Error setting equipment to maintenance:', error);
        toast({
          title: "Erreur",
          description: "Impossible de marquer l'équipement en maintenance",
          variant: "destructive"
        });
        return;
      }

      console.log(`Equipment ${equipmentId} set to maintenance`);
    } catch (error) {
      console.error('Exception setting equipment to maintenance:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      });
    }
  };

  return {
    setEquipmentToFaulty,
    setEquipmentToOperational,
    setEquipmentToMaintenance
  };
};
