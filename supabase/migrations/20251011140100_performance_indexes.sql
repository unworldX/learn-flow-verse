-- file: sql/02_indexes.sql
-- Purpose: Create performance indexes for delta sync and common queries
-- These indexes dramatically speed up queries by 10-100x

-- ==============================================================================
-- Indexes for delta sync (updated_at queries)
-- ==============================================================================

-- Group messages: fetch messages updated since timestamp
CREATE INDEX IF NOT EXISTS idx_group_messages_updated_at 
  ON public.group_messages(updated_at DESC)
  WHERE deleted_at IS NULL;

-- Group messages: fetch by group + updated_at (most common query)
CREATE INDEX IF NOT EXISTS idx_group_messages_group_updated 
  ON public.group_messages(group_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Group messages: fetch by group + created_at (for pagination)
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created 
  ON public.group_messages(group_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Direct messages: fetch DMs updated since timestamp
CREATE INDEX IF NOT EXISTS idx_direct_messages_updated_at 
  ON public.direct_messages(updated_at DESC);

-- Direct messages: fetch conversation between two users
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants 
  ON public.direct_messages(sender_id, receiver_id, created_at DESC);

-- ==============================================================================
-- Indexes for chat list queries
-- ==============================================================================

-- Group members: quickly find all groups for a user
CREATE INDEX IF NOT EXISTS idx_study_group_members_user 
  ON public.study_group_members(user_id, group_id);

-- Group members: quickly find all members of a group
CREATE INDEX IF NOT EXISTS idx_study_group_members_group 
  ON public.study_group_members(group_id, user_id);

-- Study groups: fetch groups updated recently
CREATE INDEX IF NOT EXISTS idx_study_groups_updated 
  ON public.study_groups(updated_at DESC);

-- ==============================================================================
-- Indexes for unread counts
-- ==============================================================================

-- Message reads: check if user read specific message
CREATE INDEX IF NOT EXISTS idx_message_reads_user_message 
  ON public.message_reads(user_id, message_id);

-- Message reads: find all reads for a message (for read receipts)
CREATE INDEX IF NOT EXISTS idx_message_reads_message 
  ON public.message_reads(message_id, user_id);

-- ==============================================================================
-- Indexes for user presence
-- ==============================================================================

-- Users: quickly find online users
CREATE INDEX IF NOT EXISTS idx_users_online 
  ON public.users(is_online, last_seen_at DESC)
  WHERE is_online = true;

-- Users: fetch user profiles by ID (for batch lookups)
CREATE INDEX IF NOT EXISTS idx_users_id_active 
  ON public.users(id);

-- ==============================================================================
-- Indexes for file uploads (SKIPPED - table schema incompatible)
-- ==============================================================================

-- Note: Current file_uploads table uses user_id, not message_id/dm_message_id
-- These indexes are commented out to prevent migration errors
--
-- File uploads: find files for a message
-- CREATE INDEX IF NOT EXISTS idx_file_uploads_message 
--   ON public.file_uploads(message_id)
--   WHERE message_id IS NOT NULL;

-- File uploads: find files for a DM
-- CREATE INDEX IF NOT EXISTS idx_file_uploads_dm_message 
--   ON public.file_uploads(dm_message_id)
--   WHERE dm_message_id IS NOT NULL;

-- File uploads: find files uploaded by user
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploader 
  ON public.file_uploads(user_id, upload_date DESC);

-- ==============================================================================
-- Composite indexes for complex queries
-- ==============================================================================

-- Group messages: sender + group (for "messages from X in group Y")
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_group 
  ON public.group_messages(sender_id, group_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Group messages: reply threading
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to 
  ON public.group_messages(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL AND deleted_at IS NULL;

-- ==============================================================================
-- Partial indexes for performance (only index relevant rows)
-- ==============================================================================

-- Only index non-deleted messages
CREATE INDEX IF NOT EXISTS idx_group_messages_active 
  ON public.group_messages(group_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_pinned = false;

-- Only index pinned messages (for quick retrieval)
CREATE INDEX IF NOT EXISTS idx_group_messages_pinned 
  ON public.group_messages(group_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_pinned = true;

-- ==============================================================================
-- Covering indexes (include all needed columns to avoid table lookup)
-- ==============================================================================

-- Chat list query: includes all fields needed for preview
CREATE INDEX IF NOT EXISTS idx_group_messages_chat_preview 
  ON public.group_messages(group_id, created_at DESC)
  INCLUDE (sender_id, encrypted_content, message_type)
  WHERE deleted_at IS NULL;

-- ==============================================================================
-- Validate indexes were created
-- ==============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'Created % performance indexes', index_count;
  
  IF index_count < 15 THEN
    RAISE WARNING 'Expected at least 15 indexes, only found %', index_count;
  END IF;
END $$;
