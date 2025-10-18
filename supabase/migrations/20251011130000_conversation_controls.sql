-- Conversation controls: mute, archive, mark unread overrides
-- Create tables with simple per-user RLS policies

-- Mutes
create table if not exists public.muted_chats (
  id bigserial primary key,
  user_id uuid not null,
  chat_type text not null check (chat_type in ('direct','group')),
  chat_id text not null,
  muted_until timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, chat_type, chat_id)
);

alter table public.muted_chats enable row level security;
do $$ begin
  create policy "User can manage own mutes" on public.muted_chats
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when others then null; end $$;

-- Archives
create table if not exists public.archived_chats (
  id bigserial primary key,
  user_id uuid not null,
  chat_type text not null check (chat_type in ('direct','group')),
  chat_id text not null,
  archived_at timestamptz not null default now(),
  unique(user_id, chat_type, chat_id)
);

alter table public.archived_chats enable row level security;
do $$ begin
  create policy "User can manage own archives" on public.archived_chats
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when others then null; end $$;

-- Unread overrides
create table if not exists public.unread_overrides (
  user_id uuid not null,
  chat_type text not null check (chat_type in ('direct','group')),
  chat_id text not null,
  force_unread boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, chat_type, chat_id)
);

alter table public.unread_overrides enable row level security;
do $$ begin
  create policy "User can manage own unread overrides" on public.unread_overrides
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when others then null; end $$;
