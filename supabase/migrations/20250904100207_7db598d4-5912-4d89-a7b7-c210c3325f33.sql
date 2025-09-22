-- Ajouter une colonne pour supporter plusieurs destinataires
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS recipients jsonb DEFAULT '[]'::jsonb;

-- Créer un index pour améliorer les performances des recherches sur les destinataires
CREATE INDEX IF NOT EXISTS idx_user_notifications_recipients ON user_notifications USING GIN (recipients);

-- Fonction pour vérifier si un utilisateur est dans la liste des destinataires
CREATE OR REPLACE FUNCTION is_recipient(user_id_check uuid, recipients_list jsonb, original_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Si pas de liste de destinataires (ancien format), utiliser l'user_id original
    IF recipients_list IS NULL OR jsonb_array_length(recipients_list) = 0 THEN
        RETURN user_id_check = original_user_id;
    END IF;
    
    -- Vérifier si l'utilisateur est dans la liste des destinataires
    RETURN recipients_list ? user_id_check::text;
END;
$$ LANGUAGE plpgsql;