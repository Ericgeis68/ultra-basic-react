export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'technician'; // Changed from 'admin' | 'technician' to string
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  dark_mode?: boolean;
  menu_preferences?: any;
}

export interface AuthUser {
  id: string;
  username: string;
  profile: UserProfile;
}
