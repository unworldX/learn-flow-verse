-- Drop ALL existing study_group_members policies completely
DROP POLICY IF EXISTS "Users can join study groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave study groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can view study group memberships" ON study_group_members;
DROP POLICY IF EXISTS "Users can view group memberships" ON study_group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove members" ON study_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON study_group_members;
DROP POLICY IF EXISTS "Allow users to join groups" ON study_group_members;
DROP POLICY IF EXISTS "Allow users to leave groups" ON study_group_members;
DROP POLICY IF EXISTS "Allow viewing group memberships" ON study_group_members;

-- Create simple non-recursive policies
CREATE POLICY "users_can_join_groups" 
ON study_group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_leave_groups" 
ON study_group_members 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_view_memberships" 
ON study_group_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add search & filters tables
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resource_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  page_number INTEGER,
  position JSONB,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view categories" ON public.resource_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view tags" ON public.resource_tags FOR SELECT USING (true);
CREATE POLICY "Users can manage their bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);