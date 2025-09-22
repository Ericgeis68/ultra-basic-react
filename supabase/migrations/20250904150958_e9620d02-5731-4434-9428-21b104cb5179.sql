-- Ajouter un champ persistent à la table user_notifications pour contrôler la durée d'affichage
ALTER TABLE public.user_notifications 
ADD COLUMN persistent boolean NOT NULL DEFAULT true;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN public.user_notifications.persistent IS 'Si true, la notification reste affichée jusqu'\''à suppression manuelle. Si false, elle disparaît automatiquement après un délai.';