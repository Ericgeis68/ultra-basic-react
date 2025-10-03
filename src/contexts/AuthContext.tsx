import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SupabaseUserRow = Database['public']['Tables']['users']['Row'];

export type UserMenuPreferences = {
  showDashboard?: boolean;
  showEquipment?: boolean;
  showParts?: boolean;
  showDocuments?: boolean;
  showMaintenance?: boolean;
  showInterventions?: boolean;
  showTasks?: boolean;
  showFacilities?: boolean;
  showEquipmentGroups?: boolean;
  showStaff?: boolean;
  showReports?: boolean;
  showNotifications?: boolean;
  showScanner?: boolean;
  showSettings?: boolean;
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  updateUserMenuPreferences: (userId: string, preferences: UserMenuPreferences) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupabaseUserRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.username) {
         fetchUserFromSupabase(userData.username);
      } else {
         console.warn('No username found in sessionStorage user data. Clearing local state.');
         logout();
         setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserFromSupabase = async (username: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user from Supabase:', error);
        throw error;
      }

      if (data) {
        setUser(data);
        sessionStorage.setItem('currentUser', JSON.stringify(data));
        applyUserTheme(data);
        try { window.dispatchEvent(new Event('auth:updated')); } catch {}
        return data;
      } else {
         console.warn('User not found in Supabase DB. Clearing local state.');
         logout();
         return null;
      }
    } catch (error) {
      console.error('Unexpected error fetching user from Supabase:', error);
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const applyUserTheme = (userData: SupabaseUserRow) => {
    if ((userData as any).dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Recherche de l'utilisateur sans vérifier is_active (colonne inexistante)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .eq('password', credentials.password) // INSECURE: En production, utiliser un hash
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase login query error:', error);
        setIsLoading(false);
        return false;
      }

      if (data) {
        // Utilisateur trouvé et authentifié
        setUser(data);
        sessionStorage.setItem('currentUser', JSON.stringify(data));
        applyUserTheme(data);
        try { window.dispatchEvent(new Event('auth:updated')); } catch {}
        setIsLoading(false);
        return true;
      } else {
        // Utilisateur non trouvé ou mot de passe incorrect
        console.log('Identifiants incorrects');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
    document.documentElement.classList.remove('dark');
    try { window.dispatchEvent(new Event('auth:updated')); } catch {}
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseUpdates: Partial<SupabaseUserRow> = { ...updates };
      delete supabaseUpdates.password; // Ne pas mettre à jour le mot de passe ici

      const { data: updatedData, error: updateError } = await supabase
        .from('users')
        .update(supabaseUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user in Supabase:', updateError);
        throw updateError;
      }

      if (updatedData) {
        setUser(updatedData);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedData));

        if ('dark_mode' in updates) {
          applyUserTheme(updatedData);
        }
        try { window.dispatchEvent(new Event('auth:updated')); } catch {}
        setIsLoading(false);
      } else {
         setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Utilisateur non connecté');

    setIsLoading(true);
    try {
      // Vérifier le mot de passe actuel
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .eq('password', currentPassword)
        .single();

      if (verifyError || !verifyData) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Mettre à jour le mot de passe
      const { data: updatedData, error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (updatedData) {
        setUser(updatedData);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedData));
        try { window.dispatchEvent(new Event('auth:updated')); } catch {}
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateUserMenuPreferences = async (userId: string, preferences: UserMenuPreferences) => {
     if (!user) {
        console.warn("Attempted to update menu preferences while not logged in.");
        return;
     }

     if (user.id !== userId && user.role !== 'admin') {
        console.warn("Attempted to update menu preferences for a different user without admin privileges.");
        return;
     }

     setIsLoading(true);
     try {
        const { data: updatedData, error: updateError } = await supabase
           .from('users')
           .update({ ...(preferences as any) })
           .eq('id', userId)
           .select()
           .single();

        if (updateError) {
           console.error('Error updating user menu preferences in Supabase:', updateError);
           throw updateError;
        }

        if (updatedData) {
           if (user.id === userId) {
              setUser(updatedData);
              sessionStorage.setItem('currentUser', JSON.stringify(updatedData));
           }
           try { window.dispatchEvent(new Event('auth:updated')); } catch {}
           setIsLoading(false);
        } else {
           setIsLoading(false);
        }
     } catch (error) {
        console.error('Erreur lors de la mise à jour des préférences de menu:', error);
        setIsLoading(false);
        throw error;
     }
  };

  const toggleDarkMode = async () => {
    if (!user) return;
    const newDarkMode = !(user as any).dark_mode;
    await updateUser({ dark_mode: newDarkMode });
  };

  return (
    <AuthContext.Provider value={{
      user: (user as any) as User,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
      toggleDarkMode,
      updateUserMenuPreferences,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
