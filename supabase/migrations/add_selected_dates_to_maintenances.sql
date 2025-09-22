/*
  # Add selected_dates column to maintenances table
  1. New Columns: selected_dates (jsonb) to store multiple custom maintenance dates.
  2. Data Preservation: Existing custom_frequency_pattern column is not dropped to prevent data loss.
*/
ALTER TABLE maintenances
ADD COLUMN IF NOT EXISTS selected_dates jsonb DEFAULT '[]'::jsonb;
