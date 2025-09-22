/*
  # Create maintenances table
  1. New Tables: maintenances (id uuid, title text, description text, equipment_id uuid, equipment_name text, type text, priority text, frequency_type text, frequency_value integer, next_due_date date, last_completed_date date, estimated_duration integer, assigned_technicians uuid[], notes text, status text, created_at timestamptz, updated_at timestamptz, selected_dates jsonb)
  2. Security: Enable RLS, add policies for authenticated users (select, insert, update) and admin (delete).
  3. Foreign Keys: equipment_id references equipments(id).
*/
CREATE TABLE IF NOT EXISTS maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  equipment_id uuid REFERENCES equipments(id) ON DELETE SET NULL,
  equipment_name text, -- Denormalized for easier display
  type text NOT NULL DEFAULT 'preventive', -- 'preventive', 'corrective', 'regulatory', 'improvement'
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  frequency_type text NOT NULL DEFAULT 'one-time', -- 'one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
  frequency_value integer DEFAULT 1,
  next_due_date date NOT NULL,
  last_completed_date date,
  estimated_duration integer DEFAULT 60, -- in minutes
  assigned_technicians uuid[], -- Array of user IDs
  notes text,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in-progress', 'completed', 'overdue'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  selected_dates jsonb DEFAULT '[]'::jsonb -- New column for custom frequency dates
);

-- Enable Row Level Security
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated users to view maintenances"
ON maintenances FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create maintenances"
ON maintenances FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenances"
ON maintenances FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for admin users to delete maintenances
CREATE POLICY "Allow admin users to delete maintenances"
ON maintenances FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_maintenances_equipment_id ON maintenances (equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_next_due_date ON maintenances (next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances (status);
