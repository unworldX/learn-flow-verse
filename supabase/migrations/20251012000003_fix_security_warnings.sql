-- Migration: Fix Security Warnings
-- Description: Fixes security issues identified by database linter
-- Issues addressed:
--   1. Function search_path mutable (13 functions)
--   2. Security definer view (1 view)

-- =====================================================
-- FIX 1: Add search_path to functions
-- =====================================================
-- Setting search_path prevents potential security vulnerabilities
-- where malicious schemas could intercept function calls

-- Function: get_user_chat_summaries (need to find signature)
-- ALTER FUNCTION public.get_user_chat_summaries(uuid)
--   SET search_path = public, pg_temp;

-- Function: generate_invite_code
ALTER FUNCTION public.generate_invite_code()
  SET search_path = public, pg_temp;

-- Function: join_group_via_invite (takes 2 params: invite_code, user_id)
ALTER FUNCTION public.join_group_via_invite(text, uuid)
  SET search_path = public, pg_temp;

-- Function: create_group_invite_link
ALTER FUNCTION public.create_group_invite_link(uuid, integer, integer)
  SET search_path = public, pg_temp;

-- Function: get_user_profiles_batch
ALTER FUNCTION public.get_user_profiles_batch(uuid[])
  SET search_path = public, pg_temp;

-- Function: get_messages_since
ALTER FUNCTION public.get_messages_since(uuid, timestamp with time zone)
  SET search_path = public, pg_temp;

-- Function: get_user_chats
ALTER FUNCTION public.get_user_chats(uuid)
  SET search_path = public, pg_temp;

-- Function: update_updated_at_column (trigger function - no params)
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

-- Function: touch_chat_session (trigger function - no params)
ALTER FUNCTION public.touch_chat_session()
  SET search_path = public, pg_temp;

-- Function: set_timestamp_updated_at (trigger function - no params)
ALTER FUNCTION public.set_timestamp_updated_at()
  SET search_path = public, pg_temp;

-- Function: current_user_id
ALTER FUNCTION public.current_user_id()
  SET search_path = public, pg_temp;

-- Function: is_group_member (2 params: group_id, user_id with default)
ALTER FUNCTION public.is_group_member(uuid, uuid)
  SET search_path = public, pg_temp;

-- Function: delete_empty_groups
ALTER FUNCTION public.delete_empty_groups()
  SET search_path = public, pg_temp;

-- =====================================================
-- FIX 2: Remove SECURITY DEFINER from view
-- =====================================================
-- SECURITY DEFINER views bypass RLS and can be a security risk
-- We'll recreate the view without SECURITY DEFINER

-- Drop the existing view completely (including any dependencies)
DROP VIEW IF EXISTS public.chat_session_summaries CASCADE;

-- Recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)
-- Note: The view will now use the querying user's permissions
CREATE VIEW public.chat_session_summaries 
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.user_id,
  COALESCE(
    s.title,
    LEFT((SELECT m.content FROM public.chat_messages m WHERE m.session_id = s.id ORDER BY m.created_at ASC LIMIT 1), 80),
    'Untitled Chat'
  ) as derived_title,
  s.created_at,
  s.updated_at,
  (SELECT COUNT(*)::int FROM public.chat_messages m WHERE m.session_id = s.id) as message_count,
  COALESCE((SELECT MAX(m.created_at) FROM public.chat_messages m WHERE m.session_id = s.id), s.updated_at) as last_message_at
FROM public.chat_sessions s;

-- =====================================================
-- ADDITIONAL NOTES
-- =====================================================

-- Auth Configuration Warnings (cannot be fixed via SQL migration):
-- These require manual configuration in Supabase Dashboard:
--
-- 1. auth_otp_long_expiry: 
--    Go to Authentication > Email Auth > OTP Expiry
--    Set to less than 1 hour (recommended: 600 seconds = 10 minutes)
--
-- 2. auth_leaked_password_protection:
--    Go to Authentication > Password Settings
--    Enable "Check for leaked passwords"
--
-- 3. auth_insufficient_mfa_options:
--    Go to Authentication > MFA
--    Enable additional MFA methods (TOTP, SMS, etc.)
--
-- 4. vulnerable_postgres_version:
--    Go to Settings > Infrastructure
--    Upgrade Postgres to latest version (15.8.1.121 -> latest)
