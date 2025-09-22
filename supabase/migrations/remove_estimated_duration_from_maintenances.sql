/*
  # Remove estimated_duration from maintenances table
  1. Alter Table: maintenances (DROP COLUMN estimated_duration)
*/
ALTER TABLE maintenances
DROP COLUMN IF EXISTS estimated_duration;
