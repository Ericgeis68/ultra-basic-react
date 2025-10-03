import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth, UserMenuPreferences } from '@/contexts/AuthContext';
import { navItems } from '@/components/layout/Sidebar';

// Define the type for the 'users' table rows from Supabase types
type SupabaseUserRow = Database['public']['Tables']['users']['Row'];

// Extend the Supabase user type to include a loading state for individual user updates
type UserWithLoading = SupabaseUserRow & { isUpdating?: boolean };

const UserMenuVisibilitySettings = () => {
  const [users, setUsers] = useState<UserWithLoading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser, updateUserMenuPreferences } = useAuth();

  // Filter navItems to only include those with a settingKey
  const configurableMenuItems = navItems.filter(item => item.settingKey);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      console.warn("Attempted to access User Menu Settings without admin role.");
      setIsLoading(false);
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setUsers(data as SupabaseUserRow[]);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuToggle = async (userId: string, settingKey: keyof UserMenuPreferences, isVisible: boolean) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    // Parse the current menu preferences
    const currentPreferences = (userToUpdate as any).menu_preferences as UserMenuPreferences || {};

    // Update the local state immediately for a responsive UI
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { 
              ...user, 
              menu_preferences: { ...currentPreferences, [settingKey]: isVisible }, 
              isUpdating: true 
            }
          : user
      )
    );

    // Prepare the updated preferences object
    const updatedPreferences: UserMenuPreferences = {
      ...currentPreferences,
      [settingKey]: isVisible
    };

    try {
      await updateUserMenuPreferences(userId, updatedPreferences);

      toast({
        title: "Préférences mises à jour",
        description: `Visibilité du menu "${settingKey}" mise à jour pour ${userToUpdate.full_name}.`,
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences de l'utilisateur.",
        variant: "destructive",
      });
      // Revert local state on error
            setUsers(prevUsers =>
              prevUsers.map(user =>
                user.id === userId
                  ? { ...user, menu_preferences: (userToUpdate as any).menu_preferences }
                  : user
              )
            );
    } finally {
       setUsers(prevUsers =>
         prevUsers.map(user =>
           user.id === userId
             ? { ...user, isUpdating: false }
             : user
         )
       );
    }
  };

  if (isLoading) {
    return <div>Chargement des utilisateurs...</div>;
  }

  if (currentUser?.role !== 'admin') {
     return (
        <Card>
           <CardHeader>
              <CardTitle>Accès Refusé</CardTitle>
           </CardHeader>
           <CardContent>
              <p>Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
           </CardContent>
        </Card>
     );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visibilité des Menus par Utilisateur</CardTitle>
          <CardDescription>
            Configurez quels menus sont visibles pour chaque utilisateur non-administrateur. Les administrateurs voient toujours tous les menus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {users.map(user => {
            const userPreferences = (user as any).menu_preferences as UserMenuPreferences || {};
            
            return (
              <div key={user.id} className="border rounded-md p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{user.full_name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username} ({user.role === 'admin' ? 'Administrateur' : 'Technicien'})</p>
                  </div>
                  {user.isUpdating && <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-2">Mise à jour...</span>}
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {configurableMenuItems.map(item => {
                     // Determine the current visibility state for this user and this menu item
                     const isVisible = userPreferences[item.settingKey as keyof UserMenuPreferences] !== false;

                     // Admins always see all menus, so their switches are disabled
                     const isDisabled = user.role === 'admin';

                     return (
                       <div key={item.settingKey} className="flex items-center justify-between space-x-2 p-2 sm:p-3 rounded-md border bg-card">
                         <Label htmlFor={`switch-${user.id}-${item.settingKey}`} className="flex-1 text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                           {item.label}
                         </Label>
                         <Switch
                           id={`switch-${user.id}-${item.settingKey}`}
                           checked={isVisible}
                           onCheckedChange={(checked) => handleMenuToggle(user.id, item.settingKey as keyof UserMenuPreferences, checked)}
                           disabled={isDisabled}
                           className="flex-shrink-0"
                         />
                       </div>
                     );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserMenuVisibilitySettings;
