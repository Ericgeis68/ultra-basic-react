-- Ajouter le champ assigned_technicians aux maintenances pour permettre l'assignation
ALTER TABLE public.maintenances 
ADD COLUMN assigned_technicians text[] DEFAULT '{}';

-- Mettre à jour le trigger pour gérer le nouveau champ
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;