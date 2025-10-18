-- Migration: Drop Old RLS Policies (Batch 2)
-- Description: Drops the OLD unoptimized policies from 6 tables that were optimized in migration 20251011140400
-- This fixes the duplicate policy warnings where both old and new policies are executing
-- These policies should have been dropped BEFORE creating the optimized versions

-- =====================================================
-- BOOKMARKS - Drop old policy
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their bookmarks" ON public.bookmarks;

-- =====================================================
-- HIGHLIGHTS - Drop old policy
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their highlights" ON public.highlights;

-- =====================================================
-- MUTED_CHATS - Drop old policy
-- =====================================================
DROP POLICY IF EXISTS "User can manage own mutes" ON public.muted_chats;

-- =====================================================
-- ARCHIVED_CHATS - Drop old policy
-- =====================================================
DROP POLICY IF EXISTS "User can manage own archives" ON public.archived_chats;

-- =====================================================
-- UNREAD_OVERRIDES - Drop old policy
-- =====================================================
DROP POLICY IF EXISTS "User can manage own unread overrides" ON public.unread_overrides;

-- =====================================================
-- STARRED_MESSAGES - Drop old policies (3 separate ones)
-- =====================================================
DROP POLICY IF EXISTS "Users can star messages" ON public.starred_messages;
DROP POLICY IF EXISTS "Users can unstar messages" ON public.starred_messages;
DROP POLICY IF EXISTS "Users can view their starred messages" ON public.starred_messages;
