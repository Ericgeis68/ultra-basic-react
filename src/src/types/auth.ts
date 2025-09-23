export interface User {
  id: string;
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'technician'; // Changed from string for wider compatibility
  avatar_url?: string;
  contact_info?: string;
  specialization?: string;
  dark_mode?: boolean;
  menu_preferences?: any; // Changed from Record<string, boolean> to any
  created_at: string;
  updated_at?: string; // Made optional
  is_active?: boolean; // Added optional property
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
