/*
  # Add created_by column to maintenances table and update RLS policies
  1. New Columns: maintenances (created_by uuid)
  2. Security: Update RLS policies for insert, update, and delete to leverage created_by.
  3. Foreign Keys: created_by references public.users(id).
*/

-- Add created_by column
ALTER TABLE maintenances
ADD COLUMN created_by uuid REFERENCES public.users(id) DEFAULT auth.uid();

-- Update RLS policies
-- Allow authenticated users to view all maintenances (no change)
-- CREATE POLICY "Allow authenticated users to view maintenances" ON maintenances FOR SELECT TO authenticated USING (true);

-- Update INSERT policy to ensure created_by is set to the current user
DROP POLICY IF EXISTS "Allow authenticated users to create maintenances" ON maintenances;
CREATE POLICY "Allow authenticated users to create maintenances"
ON maintenances FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update UPDATE policy to allow authenticated users to update their own maintenances
DROP POLICY IF EXISTS "Allow authenticated users to update maintenances" ON maintenances;
CREATE POLICY "Allow authenticated users to update maintenances"
ON maintenances FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Update DELETE policy to allow admin users to delete any maintenance, or authenticated users to delete their own
DROP POLICY IF EXISTS "Allow admin users to delete maintenances" ON maintenances;
CREATE POLICY "Allow admin users to delete maintenances"
ON maintenances FOR DELETE TO authenticated
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Ensure existing rows have created_by set if possible (for existing data before this migration)
-- This might fail if auth.uid() is not available during migration, but it's a best effort.
-- For new rows, the DEFAULT auth.uid() will handle it.
UPDATE maintenances SET created_by = auth.uid() WHERE created_by IS NULL;
