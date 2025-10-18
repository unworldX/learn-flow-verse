-- Migration: RLS Optimization for Remaining Tables
-- Description: Optimizes RLS policies for remaining tables with confirmed schemas
-- This fixes auth_rls_initplan warnings from the database linter
-- Pattern: Wrap auth.uid() in (SELECT auth.uid()) to prevent per-row re-evaluation

-- NOTE: This is a conservative migration. It only includes policies for tables
-- where we can confirm the exact column names from the linter report.
-- Additional tables may need optimization in a future migration.

-- =====================================================
-- BOOKMARKS - Optimize all operations
-- =====================================================
CREATE POLICY "bookmarks_manage_optimized"
  ON public.bookmarks
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- HIGHLIGHTS - Optimize all operations
-- =====================================================
CREATE POLICY "highlights_manage_optimized"
  ON public.highlights
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- MUTED CHATS - Optimize
-- =====================================================
CREATE POLICY "muted_chats_manage_optimized"
  ON public.muted_chats
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- ARCHIVED CHATS - Optimize
-- =====================================================
CREATE POLICY "archived_chats_manage_optimized"
  ON public.archived_chats
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- UNREAD OVERRIDES - Optimize
-- =====================================================
CREATE POLICY "unread_overrides_manage_optimized"
  ON public.unread_overrides
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- STARRED MESSAGES - Optimize
-- =====================================================
CREATE POLICY "starred_messages_select_optimized"
  ON public.starred_messages
  FOR SELECT
  TO public
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "starred_messages_insert_optimized"
  ON public.starred_messages
  FOR INSERT
  TO public
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "starred_messages_delete_optimized"
  ON public.starred_messages
  FOR DELETE
  TO public
  USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- Add performance indexes for optimized policies
-- =====================================================

-- Indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- Indexes for highlights
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);

-- Indexes for muted_chats policies
CREATE INDEX IF NOT EXISTS idx_muted_chats_user_id ON public.muted_chats(user_id);

-- Indexes for archived_chats policies
CREATE INDEX IF NOT EXISTS idx_archived_chats_user_id ON public.archived_chats(user_id);

-- Indexes for unread_overrides policies
CREATE INDEX IF NOT EXISTS idx_unread_overrides_user_id ON public.unread_overrides(user_id);

-- Indexes for starred_messages policies
CREATE INDEX IF NOT EXISTS idx_starred_messages_user_id ON public.starred_messages(user_id);
