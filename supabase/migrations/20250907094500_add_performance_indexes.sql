-- Performance & access pattern indexes
-- Safely create indexes if they don't already exist.
-- For large tables in production, consider dropping CONCURRENTLY (Supabase CLI may not allow inside transaction).

-- Reminders: per-user ordered by reminder_date
create index if not exists reminders_user_id_reminder_date_idx
  on public.reminders (user_id, reminder_date);

-- Study plans: listing user plans by recency
create index if not exists study_plans_user_id_created_at_idx
  on public.study_plans (user_id, created_at);

-- Study plan tasks: tasks within a plan ordered by due date
create index if not exists study_plan_tasks_plan_id_due_date_idx
  on public.study_plan_tasks (plan_id, due_date);

-- Direct messages: fetch messages where sender OR receiver is the user ordered by time.
create index if not exists direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at);
create index if not exists direct_messages_receiver_created_idx
  on public.direct_messages (receiver_id, created_at);

-- Optional conversation key (enables fast unique pair queries)
-- create index if not exists direct_messages_conversation_pair_idx
--   on public.direct_messages (
--     least(sender_id, receiver_id),
--     greatest(sender_id, receiver_id),
--     created_at
--   );

-- Group messages: per group recent messages
create index if not exists group_messages_group_id_created_at_idx
  on public.group_messages (group_id, created_at);

-- Chat sessions: list sessions per user, sort by updated_at
create index if not exists chat_sessions_user_id_updated_at_idx
  on public.chat_sessions (user_id, updated_at);

-- Chat messages: messages within a session ordered by creation
create index if not exists chat_messages_session_id_created_at_idx
  on public.chat_messages (session_id, created_at);

-- Add any missing foreign key helper indexes (common pattern)
-- Example (uncomment if needed):
-- create index if not exists study_group_members_user_id_idx on public.study_group_members(user_id);
-- create index if not exists study_group_members_group_id_idx on public.study_group_members(group_id);

-- Diagnostics: show new indexes (Postgres 15+ syntax)
-- select indexname, indexdef from pg_indexes where schemaname='public' and indexname like '%_idx';
