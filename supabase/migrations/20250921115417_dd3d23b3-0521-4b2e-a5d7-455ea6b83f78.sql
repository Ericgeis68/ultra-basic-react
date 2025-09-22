-- Create additional tables needed by the application

-- Create users table (for custom user management)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, this should be hashed
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician')),
  contact_info TEXT,
  specialization TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  equipment_ids TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'manual', 'warranty', 'certification', 'procedure', 'other')),
  fileurl TEXT,
  updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment_groups table
CREATE TABLE public.equipment_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  shared_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buildings table
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  building_id UUID REFERENCES public.buildings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables (public access for now)
CREATE POLICY "Public access for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public access for documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Public access for equipment_groups" ON public.equipment_groups FOR ALL USING (true);
CREATE POLICY "Public access for buildings" ON public.buildings FOR ALL USING (true);
CREATE POLICY "Public access for services" ON public.services FOR ALL USING (true);
CREATE POLICY "Public access for locations" ON public.locations FOR ALL USING (true);

-- Add triggers for timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_groups_updated_at
BEFORE UPDATE ON public.equipment_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at
BEFORE UPDATE ON public.buildings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();