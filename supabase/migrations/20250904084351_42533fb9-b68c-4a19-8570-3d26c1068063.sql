-- Activer RLS sur la table user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour user_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (user_id = current_setting('app.current_user_id')::uuid OR user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create their own notifications" 
ON public.user_notifications 
FOR INSERT 
WITH CHECK (user_id = current_setting('app.current_user_id')::uuid OR user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own notifications" 
ON public.user_notifications 
FOR UPDATE 
USING (user_id = current_setting('app.current_user_id')::uuid OR user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own notifications" 
ON public.user_notifications 
FOR DELETE 
USING (user_id = current_setting('app.current_user_id')::uuid OR user_id::text = current_setting('app.current_user_id', true));