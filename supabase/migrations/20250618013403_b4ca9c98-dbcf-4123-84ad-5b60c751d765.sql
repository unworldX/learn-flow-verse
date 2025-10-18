
-- Fix subscribers table RLS policies
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Allow service role full access to subscribers" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Allow service role full access to subscribers" ON public.subscribers
FOR ALL USING (auth.role() = 'service_role');

-- Fix direct_messages RLS policies
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;

CREATE POLICY "Users can view their own messages" ON public.direct_messages
FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.direct_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON public.direct_messages
FOR UPDATE USING (sender_id = auth.uid());

-- Fix study_groups RLS policies
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public groups" ON public.study_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;
DROP POLICY IF EXISTS "Creators can update their groups" ON public.study_groups;

CREATE POLICY "Anyone can view public groups" ON public.study_groups
FOR SELECT USING (NOT is_private OR created_by = auth.uid());

CREATE POLICY "Users can create groups" ON public.study_groups
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their groups" ON public.study_groups
FOR UPDATE USING (created_by = auth.uid());

-- Fix resources RLS policies
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can upload resources" ON public.resources;
DROP POLICY IF EXISTS "Uploaders can update their resources" ON public.resources;

CREATE POLICY "Anyone can view resources" ON public.resources
FOR SELECT USING (true);

CREATE POLICY "Users can upload resources" ON public.resources
FOR INSERT WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Uploaders can update their resources" ON public.resources
FOR UPDATE USING (uploader_id = auth.uid());

-- Fix user_downloads RLS policies
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can add downloads" ON public.user_downloads;

CREATE POLICY "Users can view their downloads" ON public.user_downloads
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add downloads" ON public.user_downloads
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix user_favorites RLS policies
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.user_favorites;

CREATE POLICY "Users can view their favorites" ON public.user_favorites
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites" ON public.user_favorites
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites" ON public.user_favorites
FOR DELETE USING (user_id = auth.uid());

-- Fix group_messages RLS policies
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;

CREATE POLICY "Group members can view messages" ON public.group_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Group members can send messages" ON public.group_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE group_id = group_messages.group_id 
    AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_group ON public.study_group_members(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON public.user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);
