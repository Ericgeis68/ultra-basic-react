-- Create scheduled_maintenance table for maintenance scheduling and tracking
CREATE TABLE IF NOT EXISTS public.scheduled_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective', 'regulatory', 'safety')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  frequency_type TEXT CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom', 'one-time')),
  frequency_value INTEGER DEFAULT 1, -- For custom frequencies (every X days/weeks/months)
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  estimated_duration INTEGER, -- Duration in minutes
  assigned_technicians TEXT[], -- Array of technician IDs or names
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'overdue', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.scheduled_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all for scheduled_maintenance" 
ON public.scheduled_maintenance 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create maintenance_reminders table for notifications
CREATE TABLE IF NOT EXISTS public.maintenance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_id UUID REFERENCES public.scheduled_maintenance(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'push', 'in-app', 'sms')),
  days_before INTEGER NOT NULL DEFAULT 7, -- Days before due date to send reminder
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_user_ids TEXT[], -- Array of user IDs to notify
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all for maintenance_reminders" 
ON public.maintenance_reminders 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scheduled_maintenance_updated_at
    BEFORE UPDATE ON public.scheduled_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_maintenance_updated_at();

CREATE TRIGGER update_maintenance_reminders_updated_at
    BEFORE UPDATE ON public.maintenance_reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_maintenance_updated_at();

-- Create function to automatically calculate next due date based on frequency
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  last_date DATE,
  freq_type TEXT,
  freq_value INTEGER DEFAULT 1
) RETURNS DATE AS $$
BEGIN
  CASE freq_type
    WHEN 'daily' THEN
      RETURN last_date + (freq_value * INTERVAL '1 day');
    WHEN 'weekly' THEN
      RETURN last_date + (freq_value * INTERVAL '1 week');
    WHEN 'monthly' THEN
      RETURN last_date + (freq_value * INTERVAL '1 month');
    WHEN 'quarterly' THEN
      RETURN last_date + (freq_value * INTERVAL '3 months');
    WHEN 'yearly' THEN
      RETURN last_date + (freq_value * INTERVAL '1 year');
    ELSE
      RETURN last_date;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to update maintenance status based on dates
CREATE OR REPLACE FUNCTION public.update_maintenance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status to overdue if past due date and not completed
  IF NEW.next_due_date < CURRENT_DATE AND NEW.status IN ('scheduled', 'in-progress') THEN
    NEW.status = 'overdue';
  END IF;
  
  -- If marked as completed, update last_completed_date and calculate next due date
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.last_completed_date = CURRENT_DATE;
    
    -- Only recalculate next due date if it's not a one-time maintenance
    IF NEW.frequency_type != 'one-time' AND NEW.frequency_type IS NOT NULL THEN
      NEW.next_due_date = public.calculate_next_due_date(
        CURRENT_DATE,
        NEW.frequency_type,
        NEW.frequency_value
      );
      NEW.status = 'scheduled'; -- Reset to scheduled for recurring maintenance
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update maintenance status
CREATE TRIGGER maintenance_status_update
    BEFORE UPDATE ON public.scheduled_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_maintenance_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_maintenance_equipment_id ON public.scheduled_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_maintenance_next_due_date ON public.scheduled_maintenance(next_due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_maintenance_status ON public.scheduled_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_maintenance_id ON public.maintenance_reminders(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_is_sent ON public.maintenance_reminders(is_sent);