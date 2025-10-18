-- file: sql/01_schema_setup.sql
-- Purpose: Add updated_at columns and triggers to all messaging tables
-- This enables delta sync (fetch only rows updated since last sync)

-- ==============================================================================
-- Add updated_at columns to existing tables
-- ==============================================================================

-- Study groups
ALTER TABLE IF EXISTS public.study_groups 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Group members
ALTER TABLE IF EXISTS public.study_group_members 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Group messages (main chat table)
ALTER TABLE IF EXISTS public.group_messages 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Direct messages
ALTER TABLE IF EXISTS public.direct_messages 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Message reads (for unread counts)
ALTER TABLE IF EXISTS public.message_reads 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Users (for presence tracking)
ALTER TABLE IF EXISTS public.users 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- File uploads
ALTER TABLE IF EXISTS public.file_uploads 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- Create trigger function to auto-update updated_at
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- Apply triggers to all tables
-- ==============================================================================

-- Study groups trigger
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON public.study_groups;
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Group members trigger
DROP TRIGGER IF EXISTS update_study_group_members_updated_at ON public.study_group_members;
CREATE TRIGGER update_study_group_members_updated_at
  BEFORE UPDATE ON public.study_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Group messages trigger
DROP TRIGGER IF EXISTS update_group_messages_updated_at ON public.group_messages;
CREATE TRIGGER update_group_messages_updated_at
  BEFORE UPDATE ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Direct messages trigger
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Message reads trigger
DROP TRIGGER IF EXISTS update_message_reads_updated_at ON public.message_reads;
CREATE TRIGGER update_message_reads_updated_at
  BEFORE UPDATE ON public.message_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Users trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- File uploads trigger
DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON public.file_uploads;
CREATE TRIGGER update_file_uploads_updated_at
  BEFORE UPDATE ON public.file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- Create file_uploads table if it doesn't exist
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.group_messages(id) ON DELETE CASCADE,
  dm_message_id UUID REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Storage paths
  storage_path TEXT NOT NULL, -- Full path in Supabase Storage
  thumbnail_path TEXT, -- Path to thumbnail (if image/video)
  
  -- URLs (signed or public)
  file_url TEXT,
  thumbnail_url TEXT,
  
  -- Status
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT file_message_check CHECK (
    (message_id IS NOT NULL AND dm_message_id IS NULL) OR
    (message_id IS NULL AND dm_message_id IS NOT NULL)
  )
);

-- ==============================================================================
-- Backfill existing updated_at values to created_at (only for tables that have created_at)
-- ==============================================================================

UPDATE public.study_groups SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
-- study_group_members doesn't have created_at, skip backfill
UPDATE public.group_messages SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE public.direct_messages SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE public.users SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;

-- ==============================================================================
-- Comments for documentation
-- ==============================================================================

COMMENT ON COLUMN public.study_groups.updated_at IS 'Auto-updated on any UPDATE. Used for delta sync.';
COMMENT ON COLUMN public.group_messages.updated_at IS 'Auto-updated on any UPDATE (e.g., message edited). Used for delta sync.';
COMMENT ON COLUMN public.users.last_seen_at IS 'Last activity timestamp for presence tracking.';
COMMENT ON COLUMN public.users.is_online IS 'Real-time presence indicator.';
COMMENT ON TABLE public.file_uploads IS 'Centralized file metadata for message attachments.';
