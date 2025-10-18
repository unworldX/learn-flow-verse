-- Migration: Remove Duplicate Indexes
-- Description: Removes duplicate indexes identified by the database linter
-- This fixes the 4 duplicate_index warnings
-- Duplicate indexes waste storage and slow down writes

-- =====================================================
-- DIRECT MESSAGES
-- =====================================================
-- Keep idx_direct_messages_updated (more descriptive name)
-- Drop idx_direct_messages_updated_at (duplicate)
DROP INDEX IF EXISTS public.idx_direct_messages_updated_at;

-- =====================================================
-- FILE UPLOADS
-- =====================================================
-- Keep idx_file_uploads_uploader (more descriptive name)
-- Drop idx_file_uploads_user_date (duplicate)
DROP INDEX IF EXISTS public.idx_file_uploads_user_date;

-- =====================================================
-- GROUP MESSAGES
-- =====================================================
-- Keep idx_group_messages_group_created (more descriptive name)
-- Drop idx_group_messages_group_time (duplicate)
DROP INDEX IF EXISTS public.idx_group_messages_group_time;

-- =====================================================
-- USERS
-- =====================================================
-- Keep idx_users_id (simpler, covers the same columns)
-- Drop idx_users_id_active (duplicate)
DROP INDEX IF EXISTS public.idx_users_id_active;
