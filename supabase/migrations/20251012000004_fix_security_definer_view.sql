-- Migration: Fix Security Definer View
-- Description: Removes SECURITY DEFINER from chat_session_summaries view
-- This is a security fix - SECURITY DEFINER bypasses RLS and uses view creator's permissions

-- Drop the existing view (CASCADE to remove dependencies)
DROP VIEW IF EXISTS public.chat_session_summaries CASCADE;

-- Recreate with SECURITY INVOKER (default, uses querying user's permissions)
-- Adding explicit security_invoker = true for clarity and compliance
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

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.chat_session_summaries TO authenticated;
GRANT SELECT ON public.chat_session_summaries TO anon;

-- Note: The view now respects RLS policies on chat_sessions and chat_messages tables
-- Users will only see sessions/messages they have permission to access
