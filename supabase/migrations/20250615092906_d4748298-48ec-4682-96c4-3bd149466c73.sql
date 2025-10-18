
-- 1. Table for pinning chats
CREATE TABLE public.pinned_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')), -- direct or group
  chat_id UUID NOT NULL,
  pinned_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, chat_type, chat_id)
);

-- 2. Table for reactions on messages (supports direct and group)
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL, -- refers to either direct_messages.id or group_messages.id
  user_id UUID NOT NULL,
  reaction VARCHAR NOT NULL, -- e.g. emoji unicode
  created_at TIMESTAMP DEFAULT now(),
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  UNIQUE(message_id, user_id, reaction)
);

-- 3. Table for chat replies and forwarding (threading)
CREATE TABLE public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  parent_message_id UUID NOT NULL,
  reply_message_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(chat_type, parent_message_id, reply_message_id)
);

-- 4. Typing indicator for direct and group chats
CREATE TABLE public.typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_type VARCHAR NOT NULL CHECK (chat_type IN ('direct', 'group')),
  chat_id UUID NOT NULL, -- user_id (for direct), group_id (for group)
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, chat_type, chat_id)
);

-- 5. Online status table (for explicit tracking)
CREATE TABLE public.user_presence (
  user_id UUID PRIMARY KEY,
  online BOOLEAN DEFAULT false,
  last_online TIMESTAMP DEFAULT now()
);

-- 6. Add RLS for all tables
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can pin/unpin their own chats" ON public.pinned_chats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User can insert pins" ON public.pinned_chats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User can update/unpin their pins" ON public.pinned_chats FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "User can delete their own pins" ON public.pinned_chats FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can see reactions in their chats" ON public.message_reactions FOR SELECT USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.direct_messages dm WHERE (dm.id = message_id AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())))) ;
CREATE POLICY "User can react to messages" ON public.message_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User can delete their own reactions" ON public.message_reactions FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can reply to messages if participant" ON public.message_replies FOR SELECT USING (true); -- allow for now
CREATE POLICY "User can insert replies" ON public.message_replies FOR INSERT WITH CHECK (true);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage their own typing" ON public.typing_status FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User can report their own typing" ON public.typing_status FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User can delete their own typing" ON public.typing_status FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can see presence" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "User can update their own presence" ON public.user_presence FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "User can insert own presence" ON public.user_presence FOR INSERT WITH CHECK (user_id = auth.uid());

-- 7. Enable realtime for the new tables
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions, public.typing_status, public.user_presence;

-- Note: All referenced chat_id/message_id (for either groups or directs) should match UUIDs in their respective tables.
