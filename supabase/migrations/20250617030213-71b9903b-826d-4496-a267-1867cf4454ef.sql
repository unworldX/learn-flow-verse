
-- Create gamification table that's missing (use IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.gamification (
  user_id UUID NOT NULL PRIMARY KEY,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on gamification (safe to run multiple times)
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;

-- Drop and recreate gamification policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can update their own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can insert their own gamification data" ON public.gamification;

CREATE POLICY "Users can view their own gamification data" ON public.gamification
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own gamification data" ON public.gamification
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own gamification data" ON public.gamification
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix the infinite recursion in study_group_members by dropping and recreating policies
DROP POLICY IF EXISTS "Members can view group membership" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can view study group memberships" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can join study groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can leave study groups" ON public.study_group_members;

-- Create proper RLS policies for study_group_members
CREATE POLICY "Users can view study group memberships" ON public.study_group_members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join study groups" ON public.study_group_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave study groups" ON public.study_group_members
FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key constraints for better data integrity (use IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_gamification_user' 
        AND table_name = 'gamification'
    ) THEN
        ALTER TABLE public.gamification ADD CONSTRAINT fk_gamification_user 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_notes_user' 
        AND table_name = 'notes'
    ) THEN
        ALTER TABLE public.notes ADD CONSTRAINT fk_notes_user 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;
