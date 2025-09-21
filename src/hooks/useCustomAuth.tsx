import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/auth';

interface CustomUser extends User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'technician';
  avatar_url?: string | null;
  contact_info?: string;
  specialization?: string;
  dark_mode?: boolean;
  created_at: string;
  updated_at?: string;
}

interface CustomAuthContextType {
  user: CustomUser | null;
  profile: CustomUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string, full_name: string, role: 'admin' | 'technician') => Promise<void>;
  updateUser: (updates: Partial<CustomUser>) => Promise<void>;
  isAdmin: () => boolean;
  isTechnician: () => boolean;
}

const CustomAuthContext = createContext<CustomAuthContextType | undefined>(undefined);

export const CustomAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage)
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // INSECURE
        .single();

      if (error || !data) {
        throw new Error('Identifiant ou mot de passe incorrect');
      }

      const userData = data as CustomUser;

      setUser(userData);
      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application GMAO",
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiant ou mot de passe incorrect",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      sessionStorage.removeItem('currentUser');
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signUp = async (username: string, password: string, full_name: string, role: 'admin' | 'technician') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          password,
          full_name,
          role
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Utilisateur créé",
        description: "Le compte a été créé avec succès",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (updates: Partial<CustomUser>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées",
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Erreur de mise à jour",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isTechnician = () => user?.role === 'technician';

  return (
    <CustomAuthContext.Provider value={{
      user,
      profile: user, // For compatibility
      loading,
      signIn,
      signOut,
      signUp,
      updateUser,
      isAdmin,
      isTechnician,
    }}>
      {children}
    </CustomAuthContext.Provider>
  );
};

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};
