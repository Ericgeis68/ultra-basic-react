-- Ajouter un champ persistent à la table user_notifications pour contrôler la durée d'affichage
ALTER TABLE public.user_notifications 
ADD COLUMN persistent boolean NOT NULL DEFAULT true;