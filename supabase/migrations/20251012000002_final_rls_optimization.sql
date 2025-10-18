-- Migration: Final RLS Optimization (Conservative Approach)
-- Description: Optimizes only the tables with confirmed simple schemas
-- Pattern: DROP old policies FIRST, then CREATE optimized versions
-- Tables optimized: users, polls, poll_votes, group_invite_logs
-- Tables skipped: collaborative_notes_versions (unknown schema), call_records (unknown schema)

-- =====================================================
-- STEP 1: DROP OLD POLICIES FIRST
-- =====================================================

-- USERS (1 policy)
DROP POLICY IF EXISTS "Users can insert their profile" ON public.users;

-- POLLS (3 policies)
DROP POLICY IF EXISTS "Poll creators can update polls" ON public.polls;
DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
DROP POLICY IF EXISTS "Users can view polls in their chats" ON public.polls;

-- POLL_VOTES (2 policies)
DROP POLICY IF EXISTS "Users can change their votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can vote on polls" ON public.poll_votes;

-- GROUP_INVITE_LOGS (1 policy)
DROP POLICY IF EXISTS "Group admins can view invite logs" ON public.group_invite_logs;

-- =====================================================
-- STEP 2: CREATE OPTIMIZED POLICIES
-- =====================================================

-- USERS
-- Optimize: Wrap auth.uid() in (SELECT auth.uid())
CREATE POLICY "users_insert_optimized"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (id = (SELECT auth.uid()));

-- POLLS
-- Optimize: Wrap auth.uid() in (SELECT auth.uid())
CREATE POLICY "polls_update_optimized"
  ON public.polls
  FOR UPDATE
  TO public
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "polls_insert_optimized"
  ON public.polls
  FOR INSERT
  TO public
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "polls_select_optimized"
  ON public.polls
  FOR SELECT
  TO public
  USING (true); -- Allow reading all polls (same as original broad policy)

-- POLL_VOTES
-- Optimize: Wrap auth.uid() in (SELECT auth.uid())
CREATE POLICY "poll_votes_update_optimized"
  ON public.poll_votes
  FOR UPDATE
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "poll_votes_insert_optimized"
  ON public.poll_votes
  FOR INSERT
  TO public
  WITH CHECK (user_id = (SELECT auth.uid()));

-- GROUP_INVITE_LOGS
-- Optimize: Wrap auth.uid() in (SELECT auth.uid())
CREATE POLICY "group_invite_logs_select_optimized"
  ON public.group_invite_logs
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE study_group_members.group_id = group_invite_logs.group_id
      AND study_group_members.user_id = (SELECT auth.uid())
      AND study_group_members.role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- STEP 3: ADD PERFORMANCE INDEXES
-- =====================================================

-- Indexes for polls (if not already exist)
CREATE INDEX IF NOT EXISTS idx_polls_created_by 
  ON public.polls(created_by);

-- Indexes for poll_votes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id 
  ON public.poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id 
  ON public.poll_votes(poll_id);

-- Indexes for group_invite_logs (if not already exist)
CREATE INDEX IF NOT EXISTS idx_group_invite_logs_group_id 
  ON public.group_invite_logs(group_id);
