-- Fix the trigger to use the correct table name 'maintenances' instead of 'scheduled_maintenance'
DROP FUNCTION IF EXISTS public.delete_completed_maintenance() CASCADE;

CREATE OR REPLACE FUNCTION public.delete_completed_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  -- If intervention status changed to 'completed' and maintenance_id exists
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.maintenance_id IS NOT NULL THEN
    -- Delete the associated maintenance record from the correct table
    DELETE FROM public.maintenances 
    WHERE id = NEW.maintenance_id;
    
    -- Log the deletion
    RAISE NOTICE 'Maintenance % deleted automatically due to intervention % completion', NEW.maintenance_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER delete_completed_maintenance_trigger
  AFTER UPDATE ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_completed_maintenance();

-- Enable RLS on tables that have policies but RLS disabled (fixing security warnings)
ALTER TABLE public.scheduled_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;