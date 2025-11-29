-- create_supabase_drivers_table.sql
-- Create a "drivers" table for the client-side backup insert.
-- Run this in Supabase SQL editor or with psql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_id text,
  owner_uid text,
  owner_email text,
  name text,
  contact text,
  vehicle text,
  plate text,
  location text,
  availability timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_owner_uid ON public.drivers (owner_uid);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON public.drivers (created_at);