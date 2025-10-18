
-- Create tables for direct messages and study groups
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 50
);

CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  role VARCHAR DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  UNIQUE(group_id, user_id)
);

CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  encrypted_content TEXT, -- For text messages (encrypted)
  message_type VARCHAR NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
  file_url TEXT, -- For media files (unencrypted)
  file_name VARCHAR,
  file_size BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  is_read BOOLEAN DEFAULT false,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_receiver BOOLEAN DEFAULT false
);

CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  encrypted_content TEXT, -- For text messages (encrypted)
  message_type VARCHAR NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'file')),
  file_url TEXT, -- For media files (unencrypted)
  file_name VARCHAR,
  file_size BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  UNIQUE(message_id, user_id)
);

-- Add RLS policies for study groups
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view groups they are members of or public groups" ON public.study_groups FOR SELECT USING (
  NOT is_private OR 
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "Group creators and admins can update groups" ON public.study_groups FOR UPDATE USING (
  auth.uid() = created_by OR 
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Group creators can delete groups" ON public.study_groups FOR DELETE USING (auth.uid() = created_by);

-- Add RLS policies for study group members
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of groups they belong to" ON public.study_group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_group_members sm WHERE sm.group_id = study_group_members.group_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Group admins can add members" ON public.study_group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_members.group_id AND user_id = auth.uid() AND role IN ('admin')) OR
  EXISTS (SELECT 1 FROM public.study_groups WHERE id = study_group_members.group_id AND created_by = auth.uid())
);
CREATE POLICY "Users can leave groups or admins can remove members" ON public.study_group_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_members.group_id AND user_id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM public.study_groups WHERE id = study_group_members.group_id AND created_by = auth.uid())
);

-- Add RLS policies for direct messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own direct messages" ON public.direct_messages FOR SELECT USING (
  (auth.uid() = sender_id AND NOT deleted_by_sender) OR 
  (auth.uid() = receiver_id AND NOT deleted_by_receiver)
);
CREATE POLICY "Authenticated users can send direct messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own sent messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id);

-- Add RLS policies for group messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view group messages" ON public.group_messages FOR SELECT USING (
  deleted_at IS NULL AND
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "Group members can send messages" ON public.group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()) AND
  auth.uid() = sender_id
);
CREATE POLICY "Users can update their own group messages" ON public.group_messages FOR UPDATE USING (auth.uid() = sender_id);

-- Add RLS policies for message reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own read receipts" ON public.message_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark messages as read" ON public.message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

-- Storage policies for chat media bucket
CREATE POLICY "Authenticated users can upload chat media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat-media' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view chat media" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat-media'
);

CREATE POLICY "Users can delete their own chat media" ON storage.objects FOR DELETE USING (
  bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for live messaging
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.study_group_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_members;
