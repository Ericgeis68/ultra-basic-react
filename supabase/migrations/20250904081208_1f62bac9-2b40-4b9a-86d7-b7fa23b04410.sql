-- Créer la table pour les notifications/rappels généraux
CREATE TABLE public.user_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general', -- general, meeting, task, reminder, etc.
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_time INTEGER DEFAULT 15, -- minutes avant pour rappel
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les notifications utilisateur
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_scheduled_date ON public.user_notifications(scheduled_date);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX idx_user_notifications_category ON public.user_notifications(category);