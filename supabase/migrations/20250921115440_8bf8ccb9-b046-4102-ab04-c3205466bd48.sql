-- Create remaining tables needed by the application

-- Create parts table
CREATE TABLE public.parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interventions table
CREATE TABLE public.interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipments(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction tables for many-to-many relationships
CREATE TABLE public.equipment_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.equipment_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipment_id, group_id)
);

CREATE TABLE public.document_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.equipment_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, group_id)
);

CREATE TABLE public.part_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.equipment_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(part_id, group_id)
);

-- Enable RLS on new tables
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_group_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Public access for parts" ON public.parts FOR ALL USING (true);
CREATE POLICY "Public access for interventions" ON public.interventions FOR ALL USING (true);
CREATE POLICY "Public access for equipment_group_members" ON public.equipment_group_members FOR ALL USING (true);
CREATE POLICY "Public access for document_group_members" ON public.document_group_members FOR ALL USING (true);
CREATE POLICY "Public access for part_group_members" ON public.part_group_members FOR ALL USING (true);

-- Add triggers for timestamp updates
CREATE TRIGGER update_parts_updated_at
BEFORE UPDATE ON public.parts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
BEFORE UPDATE ON public.interventions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();