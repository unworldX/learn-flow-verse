-- Comprehensive RLS Fix Migration
-- Fixes ALL critical errors in one migration:
-- 1. study_group_members infinite recursion (42P17)
-- 2. subscribers missing/duplicate policies (42501, 403, 406)
-- 3. chat_sessions/chat_messages missing policies (500 error)
-- 4. Remaining auth_rls_initplan warnings (5)
-- 5. Duplicate index warning (1)

BEGIN;

-- ==============================================================================
-- FIX 1: STUDY_GROUP_MEMBERS - Remove infinite recursion
-- ==============================================================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "study_group_members_select_optimized" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_insert_optimized" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_delete_optimized" ON public.study_group_members;

-- Recreate without self-reference (use direct user_id check + study_groups check)
CREATE POLICY "study_group_members_select_optimized"
ON public.study_group_members
FOR SELECT
USING (
  -- Can always view your own membership
  user_id = (SELECT auth.uid())
);

CREATE POLICY "study_group_members_insert_optimized"
ON public.study_group_members
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    -- Can join if group is public
    EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND is_private = false
    )
    -- Or if you're the creator
    OR EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE id = group_id AND created_by = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "study_group_members_delete_optimized"
ON public.study_group_members
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ==============================================================================
-- FIX 2: SUBSCRIBERS - Consolidate policies to avoid duplicates
-- ==============================================================================

-- Drop ALL existing subscriber policies (old + new)
DROP POLICY IF EXISTS "subscribers_service_role" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_select_optimized" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_optimized" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_optimized" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Allow service role full access to subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Insert subscription" ON public.subscribers;

-- Create single optimized policy per action (includes service_role via OR)
CREATE POLICY "subscribers_select_optimized"
ON public.subscribers
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR email = (SELECT auth.email())
  OR (SELECT auth.role()) = 'service_role'
);

CREATE POLICY "subscribers_insert_optimized"
ON public.subscribers
FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR (SELECT auth.role()) = 'service_role'
);

CREATE POLICY "subscribers_update_optimized"
ON public.subscribers
FOR UPDATE
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT auth.role()) = 'service_role'
);

-- ==============================================================================
-- FIX 3: CHAT TABLES - Add missing RLS policies
-- ==============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "chat_sessions_select_optimized" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_optimized" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_optimized" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_delete_optimized" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_messages_select_optimized" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_optimized" ON public.chat_messages;

-- Create optimized policies for chat_sessions
CREATE POLICY "chat_sessions_select_optimized"
ON public.chat_sessions
FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_insert_optimized"
ON public.chat_sessions
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_update_optimized"
ON public.chat_sessions
FOR UPDATE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "chat_sessions_delete_optimized"
ON public.chat_sessions
FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- Create optimized policies for chat_messages
CREATE POLICY "chat_messages_select_optimized"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = chat_messages.session_id
    AND user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "chat_messages_insert_optimized"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = session_id
    AND user_id = (SELECT auth.uid())
  )
);

-- ==============================================================================
-- FIX 4: COLLABORATIVE_NOTES_VERSIONS - Fix auth_rls_initplan
-- ==============================================================================

DROP POLICY IF EXISTS "Users can create note versions" ON public.collaborative_notes_versions;

CREATE POLICY "Users can create note versions"
ON public.collaborative_notes_versions
FOR INSERT
WITH CHECK (updated_by = (SELECT auth.uid()));

-- ==============================================================================
-- FIX 5: CALL_RECORDS - Fix all 3 auth_rls_initplan warnings
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view calls in their chats" ON public.call_records;
DROP POLICY IF EXISTS "Users can create calls" ON public.call_records;
DROP POLICY IF EXISTS "Users can update calls they initiated" ON public.call_records;

-- Recreate with wrapped auth.uid() and proper JSONB handling
CREATE POLICY "Users can view calls in their chats"
ON public.call_records
FOR SELECT
USING (
  initiated_by = (SELECT auth.uid())
  OR participants @> jsonb_build_array((SELECT auth.uid())::text)
);

CREATE POLICY "Users can create calls"
ON public.call_records
FOR INSERT
WITH CHECK (initiated_by = (SELECT auth.uid()));

CREATE POLICY "Users can update calls they initiated"
ON public.call_records
FOR UPDATE
USING (initiated_by = (SELECT auth.uid()));

-- ==============================================================================
-- FIX 6: GROUP_INVITE_LOGS - Drop duplicate index
-- ==============================================================================

DROP INDEX IF EXISTS public.idx_invite_logs_group_id;
-- Keep: idx_group_invite_logs_group_id (more descriptive name)

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify study_group_members policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'study_group_members'
  AND policyname LIKE '%_optimized';
  
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'study_group_members should have 3 optimized policies, found %', v_count;
  END IF;

  -- Verify subscribers policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'subscribers'
  AND policyname LIKE '%_optimized';
  
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'subscribers should have 3 optimized policies, found %', v_count;
  END IF;

  -- Verify chat_sessions policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'chat_sessions'
  AND policyname LIKE '%_optimized';
  
  IF v_count <> 4 THEN
    RAISE EXCEPTION 'chat_sessions should have 4 optimized policies, found %', v_count;
  END IF;

  -- Verify chat_messages policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'chat_messages'
  AND policyname LIKE '%_optimized';
  
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'chat_messages should have 2 optimized policies, found %', v_count;
  END IF;

  RAISE NOTICE '✅ Comprehensive RLS fix completed successfully';
  RAISE NOTICE 'Fixed: study_group_members recursion, subscribers policies, chat tables, call_records, duplicate index';
  RAISE NOTICE 'Expected linter warnings: 0 critical errors, 0-4 minor warnings';
END $$;

COMMIT;
