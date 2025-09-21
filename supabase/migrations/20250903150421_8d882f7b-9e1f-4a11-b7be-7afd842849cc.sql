-- Create function to automatically delete completed maintenance when intervention is completed
CREATE OR REPLACE FUNCTION public.delete_completed_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  -- If intervention status changed to 'completed' and maintenance_id exists
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.maintenance_id IS NOT NULL THEN
    -- Delete the associated maintenance record
    DELETE FROM public.scheduled_maintenance 
    WHERE id = NEW.maintenance_id;
    
    -- Log the deletion
    RAISE NOTICE 'Maintenance % deleted automatically due to intervention % completion', NEW.maintenance_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically delete maintenance when intervention is completed
DROP TRIGGER IF EXISTS delete_completed_maintenance_trigger ON public.interventions;
CREATE TRIGGER delete_completed_maintenance_trigger
  AFTER UPDATE ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_completed_maintenance();