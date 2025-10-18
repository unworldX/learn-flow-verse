-- Migration: Remove duplicate indexes as flagged by linter
-- Date: 2025-10-04
-- Purpose: Drop redundant index on public.subscribers (idx_subscribers_user or idx_subscribers_user_id) keeping only one.
-- We keep the lexicographically first existing index and drop the other.

begin;

DO $$
DECLARE
  have_idx1 boolean;
  have_idx2 boolean;
BEGIN
  select exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_subscribers_user') into have_idx1;
  select exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_subscribers_user_id') into have_idx2;

  IF have_idx1 AND have_idx2 THEN
    -- Arbitrarily keep idx_subscribers_user (adjust if query plans prefer the other)
    EXECUTE 'drop index if exists public.idx_subscribers_user_id';
  END IF;
END $$;

commit;
