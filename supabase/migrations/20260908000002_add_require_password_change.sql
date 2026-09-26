-- Add require_password_change column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT false;
