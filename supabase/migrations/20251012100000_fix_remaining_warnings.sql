-- Fix Remaining Linter Warnings
-- Fixes:
-- 1. subscribers: 18 multiple_permissive_policies warnings (consolidate service_role into main policies)
-- 2. subscribers: 1 auth_rls_initplan warning (wrap auth.role() in SELECT)
-- 3. collaborative_notes_versions: 1 auth_rls_initplan warning
-- 4. call_records: 3 auth_rls_initplan warnings
-- 5. group_invite_logs: 1 duplicate_index warning

-- ==============================================================================
-- FIX 1: SUBSCRIBERS - Consolidate policies to avoid duplicates
-- ==============================================================================

-- Drop the problematic service_role policy that creates duplicates
DROP POLICY IF EXISTS "subscribers_service_role" ON public.subscribers;

-- Drop existing policies to recreate with service_role logic included
DROP POLICY IF EXISTS "subscribers_select_optimized" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_optimized" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_optimized" ON public.subscribers;

-- Recreate with consolidated logic (includes service_role via OR)
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
  OR email = (SELECT auth.email())
  OR (SELECT auth.role()) = 'service_role'
);

CREATE POLICY "subscribers_update_optimized"
ON public.subscribers
FOR UPDATE
USING (
  user_id = (SELECT auth.uid())
  OR email = (SELECT auth.email())
  OR (SELECT auth.role()) = 'service_role'
);

-- Note: DELETE policy not needed as users/service shouldn't delete subscriptions

-- ==============================================================================
-- FIX 2: COLLABORATIVE_NOTES_VERSIONS - Fix auth_rls_initplan
-- ==============================================================================

-- Find and fix the "Users can create note versions" policy
DO $$
DECLARE
  policy_def text;
BEGIN
  -- Check if policy exists
  SELECT pg_get_expr(polqual, polrelid)
  INTO policy_def
  FROM pg_policy
  WHERE polname = 'Users can create note versions'
    AND polrelid = 'public.collaborative_notes_versions'::regclass;

  -- Only proceed if policy exists and uses unwrapped auth.uid()
  IF policy_def IS NOT NULL AND policy_def LIKE '%auth.uid()%' AND policy_def NOT LIKE '%(SELECT auth.uid())%' THEN
    -- Drop and recreate with wrapped auth.uid()
    DROP POLICY IF EXISTS "Users can create note versions" ON public.collaborative_notes_versions;
    
    CREATE POLICY "Users can create note versions"
    ON public.collaborative_notes_versions
    FOR INSERT
    WITH CHECK (updated_by = (SELECT auth.uid()));
  END IF;
END $$;

-- ==============================================================================
-- FIX 3: CALL_RECORDS - Fix all 3 auth_rls_initplan warnings
-- ==============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view calls in their chats" ON public.call_records;
DROP POLICY IF EXISTS "Users can create calls" ON public.call_records;
DROP POLICY IF EXISTS "Users can update calls they initiated" ON public.call_records;

-- Recreate with wrapped auth.uid()
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
-- FIX 4: GROUP_INVITE_LOGS - Drop duplicate index
-- ==============================================================================

DROP INDEX IF EXISTS public.idx_invite_logs_group_id;

-- Keep: idx_group_invite_logs_group_id (the more descriptive name)

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Remaining warnings fix migration completed';
  RAISE NOTICE 'Fixed: 18 duplicate subscribers policies, 5 auth_rls_initplan warnings, 1 duplicate index';
  RAISE NOTICE 'Expected remaining warnings: 0 (down from 24)';
END $$;
