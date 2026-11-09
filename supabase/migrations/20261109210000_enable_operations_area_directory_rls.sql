-- Add defense-in-depth RLS to the private Operations area directory tables.
-- These tables intentionally have no client policies; app access remains through
-- the guarded Operations RPCs created by the directory migration.

alter table private.operations_area_groups
  enable row level security;

alter table private.operations_area_compatibility
  enable row level security;

alter table private.operations_area_sources
  enable row level security;
