-- Ajouter un champ loan_status à la table equipments pour indiquer si un équipement est en prêt
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS loan_status boolean NOT NULL DEFAULT false;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN public.equipments.loan_status IS 'Indique si l''équipement est actuellement en prêt (true) ou non (false)';

-- Créer un index pour améliorer les performances des recherches sur le statut de prêt
CREATE INDEX IF NOT EXISTS idx_equipments_loan_status ON public.equipments(loan_status);
