-- Migration: Chat feature extensions (typing indicators, read receipts, reactions, quoted replies)
-- Idempotent guards

-- 1. Add parent_message_id for quoted replies
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL;

ALTER TABLE public.group_messages
ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES public.group_messages(id) ON DELETE SET NULL;

-- 2. Read receipts (direct): store per message read timestamp for receiver (sender always implicit)
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 3. Group read receipts: separate table (one row per user per message)
CREATE TABLE IF NOT EXISTS public.group_message_reads (
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- 4. Reactions tables
CREATE TABLE IF NOT EXISTS public.direct_message_reactions (
  message_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- 5. Conversation state for unread & mute preferences
CREATE TABLE IF NOT EXISTS public.conversation_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For direct chats: peer_user_id; for groups: group_id (one of them set)
  peer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  muted boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT conversation_state_one_side CHECK (
    (peer_user_id IS NOT NULL AND group_id IS NULL) OR (peer_user_id IS NULL AND group_id IS NOT NULL)
  ),
  UNIQUE(user_id, peer_user_id),
  UNIQUE(user_id, group_id)
);

-- 6. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_read_at ON public.direct_messages(read_at);
CREATE INDEX IF NOT EXISTS idx_group_message_reads_user ON public.group_message_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_message_reactions_message ON public.direct_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_group_message_reactions_message ON public.group_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_state_user ON public.conversation_state(user_id);

-- 7. RLS (leave permissive placeholders; adjust policies externally if already enabled)
-- NOTE: Adjust according to your existing RLS strategy. Here are permissive examples commented out.
-- ALTER TABLE public.group_message_reads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY read_group_message_reads ON public.group_message_reads FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY insert_group_message_reads ON public.group_message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ALTER TABLE public.direct_message_reactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY select_direct_message_reactions ON public.direct_message_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
-- CREATE POLICY modify_direct_message_reactions ON public.direct_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY delete_direct_message_reactions ON public.direct_message_reactions FOR DELETE USING (auth.uid() = user_id);

-- ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY select_group_message_reactions ON public.group_message_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
-- CREATE POLICY modify_group_message_reactions ON public.group_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY delete_group_message_reactions ON public.group_message_reactions FOR DELETE USING (auth.uid() = user_id);

-- ALTER TABLE public.conversation_state ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY select_conversation_state ON public.conversation_state FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY modify_conversation_state ON public.conversation_state FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY update_conversation_state ON public.conversation_state FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- End migration
