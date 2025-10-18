-- ============================================
-- MIGRATION: Performance Optimization & Indexing
-- Date: 2025-01-12
-- Purpose: Add indexes, updated_at triggers, and optimize RLS policies
-- ============================================

-- ============================================
-- PART 1: Add updated_at columns and triggers
-- ============================================

-- Add updated_at to study_groups if not exists
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to group_messages if not exists
ALTER TABLE group_messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to direct_messages if not exists
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to users if not exists (for profile updates)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to study_group_members if not exists
ALTER TABLE study_group_members 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at 
  BEFORE UPDATE ON study_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_messages_updated_at ON group_messages;
CREATE TRIGGER update_group_messages_updated_at
  BEFORE UPDATE ON group_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_group_members_updated_at ON study_group_members;
CREATE TRIGGER update_study_group_members_updated_at
  BEFORE UPDATE ON study_group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 2: Add performance indexes
-- ============================================

-- Group messages: fetch by group + timestamp
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created 
  ON group_messages(group_id, created_at DESC);

-- Group messages: fetch by sender
CREATE INDEX IF NOT EXISTS idx_group_messages_sender 
  ON group_messages(sender_id, created_at DESC);

-- Group messages: delta sync by updated_at
CREATE INDEX IF NOT EXISTS idx_group_messages_updated 
  ON group_messages(updated_at DESC);

-- Direct messages: fetch between participants
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants 
  ON direct_messages(sender_id, receiver_id, created_at DESC);

-- Direct messages: unread messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_unread 
  ON direct_messages(receiver_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Direct messages: delta sync
CREATE INDEX IF NOT EXISTS idx_direct_messages_updated 
  ON direct_messages(updated_at DESC);

-- Study group members: user's groups
CREATE INDEX IF NOT EXISTS idx_study_group_members_user 
  ON study_group_members(user_id, group_id);

-- Study group members: group's members
CREATE INDEX IF NOT EXISTS idx_study_group_members_group 
  ON study_group_members(group_id, user_id);

-- Study groups: delta sync
CREATE INDEX IF NOT EXISTS idx_study_groups_updated 
  ON study_groups(updated_at DESC);

-- Message reads: check if user read message
CREATE INDEX IF NOT EXISTS idx_message_reads_user_message 
  ON message_reads(user_id, message_id);

-- Message reads: unread count per user
CREATE INDEX IF NOT EXISTS idx_message_reads_user 
  ON message_reads(user_id);

-- ============================================
-- PART 3: Optimize RLS policies
-- ============================================

-- Drop old group_messages policies
DROP POLICY IF EXISTS "Group members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can update their messages" ON group_messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON group_messages;

-- Optimized policies using IN subquery (faster than EXISTS)
CREATE POLICY "Group members can view messages" ON group_messages
FOR SELECT USING (
  group_id IN (
    SELECT group_id FROM study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Group members can send messages" ON group_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  group_id IN (
    SELECT group_id FROM study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their messages" ON group_messages
FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their messages" ON group_messages
FOR DELETE USING (sender_id = auth.uid());

-- Drop old direct_messages policies
DROP POLICY IF EXISTS "Users can view their direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON direct_messages;

-- Optimized direct messages policies
CREATE POLICY "Users can view their direct messages" ON direct_messages
FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send direct messages" ON direct_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their sent messages" ON direct_messages
FOR UPDATE USING (sender_id = auth.uid());

-- ============================================
-- PART 4: Batch query RPC functions
-- ============================================

-- RPC: Batch fetch user profiles
CREATE OR REPLACE FUNCTION get_user_profiles_batch(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT
) 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.avatar_url,
    u.status
  FROM users u
  WHERE u.id = ANY(user_ids);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profiles_batch(UUID[]) TO authenticated;

-- RPC: Delta sync messages (fetch only new/updated since timestamp)
CREATE OR REPLACE FUNCTION get_messages_since(
  p_group_id UUID,
  p_since_timestamp TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  encrypted_content TEXT,
  message_type VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  reply_to_message_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id,
    gm.sender_id,
    gm.encrypted_content,
    gm.message_type,
    gm.created_at,
    gm.updated_at,
    gm.reply_to_message_id
  FROM group_messages gm
  WHERE gm.group_id = p_group_id
    AND gm.group_id IN (
      SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
    )
    AND (gm.created_at > p_since_timestamp OR gm.updated_at > p_since_timestamp)
  ORDER BY gm.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_messages_since(UUID, TIMESTAMPTZ) TO authenticated;

-- RPC: Get user's chat list with metadata (single efficient query)
CREATE OR REPLACE FUNCTION get_user_chats(user_uuid UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  chat_name TEXT,
  chat_avatar TEXT,
  last_message_id UUID,
  last_message_content TEXT,
  last_message_type VARCHAR,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT,
  is_pinned BOOLEAN,
  member_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups AS (
    SELECT 
      sg.id,
      sg.name,
      sg.created_at,
      COUNT(sgm.user_id) as members
    FROM study_groups sg
    JOIN study_group_members sgm ON sg.id = sgm.group_id
    WHERE sg.id IN (
      SELECT group_id FROM study_group_members WHERE user_id = user_uuid
    )
    GROUP BY sg.id, sg.name, sg.created_at
  ),
  latest_group_messages AS (
    SELECT DISTINCT ON (gm.group_id)
      gm.group_id,
      gm.id,
      gm.encrypted_content,
      gm.message_type,
      gm.created_at
    FROM group_messages gm
    WHERE gm.group_id IN (SELECT id FROM user_groups)
    ORDER BY gm.group_id, gm.created_at DESC
  ),
  group_unread AS (
    SELECT 
      gm.group_id,
      COUNT(*) as unread
    FROM group_messages gm
    LEFT JOIN message_reads mr ON gm.id = mr.message_id AND mr.user_id = user_uuid
    WHERE gm.group_id IN (SELECT id FROM user_groups)
      AND mr.message_id IS NULL
      AND gm.sender_id != user_uuid
    GROUP BY gm.group_id
  )
  SELECT 
    ug.id,
    'group'::TEXT,
    ug.name,
    ('https://api.dicebear.com/7.x/shapes/svg?seed=' || ug.name)::TEXT,
    lgm.id,
    lgm.encrypted_content,
    lgm.message_type,
    lgm.created_at,
    COALESCE(gu.unread, 0),
    false::BOOLEAN,
    ug.members::INTEGER
  FROM user_groups ug
  LEFT JOIN latest_group_messages lgm ON ug.id = lgm.group_id
  LEFT JOIN group_unread gu ON ug.id = gu.group_id
  ORDER BY lgm.created_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_chats(UUID) TO authenticated;

-- ============================================
-- PART 5: Analyze tables for query planner
-- ============================================

ANALYZE study_groups;
ANALYZE group_messages;
ANALYZE direct_messages;
ANALYZE study_group_members;
ANALYZE message_reads;
ANALYZE users;

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Performance optimization migration completed successfully!';
  RAISE NOTICE '📊 Added indexes for: messages, groups, members, reads';
  RAISE NOTICE '⚡ Optimized RLS policies to reduce auth_rls_initplan warnings';
  RAISE NOTICE '🔄 Added updated_at triggers for delta sync';
  RAISE NOTICE '🚀 Created RPC functions for batch queries';
END $$;
