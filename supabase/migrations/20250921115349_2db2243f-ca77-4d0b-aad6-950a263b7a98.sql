-- Create equipments table with loan_status field
CREATE TABLE public.equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  description TEXT,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  health_percentage INTEGER,
  date_mise_en_service DATE,
  purchase_date DATE,
  warranty_expiry DATE,
  uf TEXT,
  building_id UUID,
  service_id UUID,
  location_id UUID,
  image_url TEXT,
  relationships JSONB DEFAULT '[]'::jsonb,
  inventory_number TEXT,
  serial_number TEXT,
  tag_number TEXT,
  loan_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (can be restricted later)
CREATE POLICY "Equipments are viewable by everyone" 
ON public.equipments 
FOR SELECT 
USING (true);

CREATE POLICY "Equipments can be inserted by everyone" 
ON public.equipments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Equipments can be updated by everyone" 
ON public.equipments 
FOR UPDATE 
USING (true);

CREATE POLICY "Equipments can be deleted by everyone" 
ON public.equipments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_equipments_updated_at
BEFORE UPDATE ON public.equipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();