-- Create missing UF table
CREATE TABLE public.ufs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ufs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Public access for ufs" ON public.ufs FOR ALL USING (true);

-- Add trigger for timestamp updates
CREATE TRIGGER update_ufs_updated_at
BEFORE UPDATE ON public.ufs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();