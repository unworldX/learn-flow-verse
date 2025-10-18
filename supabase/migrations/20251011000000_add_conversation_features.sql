-- Add missing columns and tables for conversation features

-- 1. Add starred/pinned message columns to messages tables
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_pinned_by_sender BOOLEAN DEFAULT false;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_pinned_by_receiver BOOLEAN DEFAULT false;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS forwarded_from_message_id UUID;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID;

ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS forwarded_from_message_id UUID;
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID;

-- 2. Table for starred messages
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  starred_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, message_id, chat_type)
);

-- 3. Table for polls
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  created_by UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id, text, votes: [user_ids]}
  allow_multiple BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  is_closed BOOLEAN DEFAULT false
);

-- 4. Table for poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id VARCHAR NOT NULL,
  voted_at TIMESTAMP DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

-- 5. Table for call records
CREATE TABLE IF NOT EXISTS public.call_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  call_type VARCHAR NOT NULL CHECK (call_type IN ('voice', 'video')),
  initiated_by UUID NOT NULL,
  started_at TIMESTAMP DEFAULT now(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  participants JSONB, -- Array of user IDs
  status VARCHAR DEFAULT 'ringing' CHECK (status IN ('ringing', 'ongoing', 'ended', 'missed', 'declined'))
);

-- 6. Table for disappearing message settings
CREATE TABLE IF NOT EXISTS public.disappearing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  mode VARCHAR DEFAULT 'off' CHECK (mode IN ('off', '24h', '7d', '30d', '90d')),
  updated_by UUID NOT NULL,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(chat_id, chat_type)
);

-- 7. Table for group admin settings
CREATE TABLE IF NOT EXISTS public.group_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE UNIQUE,
  send_permission VARCHAR DEFAULT 'everyone' CHECK (send_permission IN ('everyone', 'admins')),
  edit_info_permission VARCHAR DEFAULT 'admins' CHECK (edit_info_permission IN ('everyone', 'admins')),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS Policies for starred_messages
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their starred messages" ON public.starred_messages 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can star messages" ON public.starred_messages 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unstar messages" ON public.starred_messages 
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view polls in their chats" ON public.polls 
  FOR SELECT USING (
    (chat_type = 'group' AND EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = chat_id::uuid AND user_id = auth.uid()
    )) OR
    (chat_type = 'direct' AND auth.uid() IS NOT NULL)
  );
CREATE POLICY "Users can create polls" ON public.polls 
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Poll creators can update polls" ON public.polls 
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view poll votes" ON public.poll_votes 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id)
  );
CREATE POLICY "Users can vote on polls" ON public.poll_votes 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can change their votes" ON public.poll_votes 
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for call_records
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view calls in their chats" ON public.call_records 
  FOR SELECT USING (
    (chat_type = 'group' AND EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = chat_id::uuid AND user_id = auth.uid()
    )) OR
    (chat_type = 'direct' AND auth.uid() IS NOT NULL)
  );
CREATE POLICY "Users can create calls" ON public.call_records 
  FOR INSERT WITH CHECK (initiated_by = auth.uid());
CREATE POLICY "Users can update calls they initiated" ON public.call_records 
  FOR UPDATE USING (initiated_by = auth.uid());

-- RLS Policies for disappearing_settings
ALTER TABLE public.disappearing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view disappearing settings" ON public.disappearing_settings 
  FOR SELECT USING (
    (chat_type = 'group' AND EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = chat_id::uuid AND user_id = auth.uid()
    )) OR
    (chat_type = 'direct' AND auth.uid() IS NOT NULL)
  );
CREATE POLICY "Users can update disappearing settings" ON public.disappearing_settings 
  FOR ALL USING (
    (chat_type = 'group' AND EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = chat_id::uuid AND user_id = auth.uid() AND role = 'admin'
    )) OR
    (chat_type = 'direct' AND auth.uid() IS NOT NULL)
  );

-- RLS Policies for group_settings
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view settings" ON public.group_settings 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = group_settings.group_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Group admins can update settings" ON public.group_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE group_id = group_settings.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.starred_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disappearing_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_settings;
