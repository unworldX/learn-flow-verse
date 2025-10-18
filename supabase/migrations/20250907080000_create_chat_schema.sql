-- Chat schema migration (proper filename pattern)
-- Creates chat_sessions, chat_messages, view, policies, extension safeguard.

create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx on public.chat_sessions(user_id, created_at desc);
create index if not exists chat_messages_session_idx on public.chat_messages(session_id, created_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists trg_chat_sessions_updated_at on public.chat_sessions;
create trigger trg_chat_sessions_updated_at before update on public.chat_sessions
for each row execute function public.set_updated_at();

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy if not exists chat_sessions_select on public.chat_sessions
  for select using (auth.uid() = user_id);
create policy if not exists chat_sessions_modify on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists chat_messages_select on public.chat_messages
  for select using (auth.uid() = user_id);
create policy if not exists chat_messages_modify on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.chat_session_summaries as
select s.id,
       s.user_id,
       coalesce(s.title, left((select content from chat_messages m where m.session_id = s.id order by created_at asc limit 1), 80)) as derived_title,
       s.created_at,
       s.updated_at,
       (select count(*) from chat_messages m where m.session_id = s.id) as message_count,
       (select max(created_at) from chat_messages m where m.session_id = s.id) as last_message_at
from chat_sessions s;

comment on view public.chat_session_summaries is 'Convenience summary for listing sessions';
