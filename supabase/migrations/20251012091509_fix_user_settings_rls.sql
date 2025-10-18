-- Fix RLS policies for user_settings table
-- This migration creates the necessary policies for users to manage their settings

-- First, ensure RLS is enabled
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;

-- Create policies for user_settings

-- Allow users to view their own settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings" 
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own settings (optional, but good to have)
CREATE POLICY "Users can delete their own settings" 
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);
