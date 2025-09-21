-- Cette fonction sera utilisée comme RPC (Remote Procedure Call) 
-- pour insérer dans equipment_history tout en contournant les politiques RLS
CREATE OR REPLACE FUNCTION public.log_equipment_change(
  p_equipment_id TEXT,
  p_field_name TEXT,
  p_old_value JSONB,
  p_new_value JSONB,
  p_changed_by TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Très important : exécute la fonction avec les privilèges du créateur
AS $$
BEGIN
  INSERT INTO public.equipment_history (
    equipment_id,
    field_name,
    old_value,
    new_value,
    changed_by
  ) VALUES (
    p_equipment_id,
    p_field_name,
    p_old_value,
    p_new_value,
    p_changed_by
  );
END;
$$;

-- Assurez-vous que la fonction est exécutable par le rôle anon
GRANT EXECUTE ON FUNCTION public.log_equipment_change TO anon, authenticated;
