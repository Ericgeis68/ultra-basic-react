-- Supprimer les anciennes politiques RLS pour user_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.user_notifications;

-- Créer de nouvelles politiques RLS plus permissives pour user_notifications
-- (temporairement pour permettre l'accès avec le système d'auth personnalisé)
CREATE POLICY "Allow all for user_notifications" 
ON public.user_notifications 
FOR ALL 
USING (true) 
WITH CHECK (true);