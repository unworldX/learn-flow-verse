-- Migration: Optimize RLS policies to avoid per-row re-evaluation of auth.* / current_setting() calls
-- Date: 2025-10-04
-- Goal: Replace occurrences of auth.uid(), auth.jwt(), auth.role(), auth.email(), current_setting('request.jwt.claims', true)
--       inside USING / WITH CHECK expressions with a subselect wrapper e.g. (select auth.uid()).
--       This prevents PostgreSQL from placing the call in the per-row InitPlan and improves performance at scale.
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Safety notes:
-- 1. We only touch policies in the public schema whose definition text contains 'auth.' or 'current_setting'.
-- 2. We create a temporary table to store original definitions for potential rollback/manual inspection.
-- 3. For complex expressions we do a regex replace; verify after deployment using \d+p <table> in psql or the dashboard linter.

-- Rollback guidance (manual): Use the stored copy in rls_policy_backup to recreate the original policy if needed.

begin;

-- Store existing matching policies
create table if not exists _rls_policy_backup (
  saved_at timestamptz default now(),
  schemaname text,
  tablename text,
  policyname text,
  permissive boolean,
  roles text[],
  cmd text,
  qual text,
  with_check text
);

insert into _rls_policy_backup (schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
select p.schemaname, p.tablename, p.policyname, p.permissive, p.roles, p.cmd,
       p.qual::text as qual,
       p.with_check::text as with_check
from pg_policies p
where p.schemaname = 'public'
  and (
    p.qual::text ilike '%auth.%' or
    coalesce(p.with_check::text, '') ilike '%auth.%' or
    p.qual::text ilike '%current_setting%' or
    coalesce(p.with_check::text, '') ilike '%current_setting%'
  );

-- Function to wrap direct calls: simplistic textual approach; handles common auth.* patterns.
create or replace function _wrap_auth_calls(expr text) returns text language plpgsql as $$
declare
  out_expr text := expr;
begin
  if out_expr is null then
    return null;
  end if;
  -- Avoid double wrapping: only replace auth.<name>() not already inside (select auth.<name>())
  out_expr := regexp_replace(out_expr, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'gi');
  out_expr := regexp_replace(out_expr, '(?<!select )auth\.role\(\)', '(select auth.role())', 'gi');
  out_expr := regexp_replace(out_expr, '(?<!select )auth\.email\(\)', '(select auth.email())', 'gi');
  out_expr := regexp_replace(out_expr, '(?<!select )auth\.jwt\(\)', '(select auth.jwt())', 'gi');
  -- current_setting examples that often show up
  out_expr := regexp_replace(out_expr, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'gi');
  return out_expr;
end;$$;

-- Iterate affected policies and recreate them
DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  role_list text;
  permissive text;
  cmd text;
BEGIN
  FOR r IN (
    select p.*,
           p.qual::text as qual_expr,
           p.with_check::text as check_expr
    from pg_policies p
    where p.schemaname = 'public'
      and (
        p.qual::text ilike '%auth.%' or
        coalesce(p.with_check::text, '') ilike '%auth.%' or
        p.qual::text ilike '%current_setting%' or
        coalesce(p.with_check::text, '') ilike '%current_setting%'
      )
  ) LOOP
    new_qual := _wrap_auth_calls(r.qual_expr);
    new_check := _wrap_auth_calls(r.check_expr);

    -- Compose role list
    role_list := array_to_string(r.roles, ', ');
    if role_list = '' or role_list is null then
      role_list := 'public';
    end if;

    permissive := case when r.permissive then 'PERMISSIVE' else 'RESTRICTIVE' end;
    cmd := upper(r.cmd);

    -- Drop existing policy
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);

    -- Build create statement pieces
    EXECUTE (
      'create ' || permissive || ' policy ' || quote_ident(r.policyname) || ' on ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) ||
      ' for ' || cmd ||
      ' to ' || role_list ||
      (case when new_qual is not null then ' using (' || new_qual || ')' else '' end) ||
      (case when new_check is not null then ' with check (' || new_check || ')' else '' end)
    );
  END LOOP;
END $$;

-- Cleanup helper function (optional keep for inspection). Comment out drop if you prefer to keep it.
drop function if exists _wrap_auth_calls(text);

commit;

-- Verification suggestions (run manually):
-- select policyname, qual, with_check from pg_policies where schemaname='public' and policyname like '%messages%';
-- Rerun the Supabase Linter after deployment.

/* Rollback (manual): Example for one policy
BEGIN;
select * from _rls_policy_backup where policyname = 'Users can view messages';
-- Recreate original policy using saved qual/with_check from backup table.
COMMIT; */
