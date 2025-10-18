-- Ensure RPC functions for invites are executable by client roles

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.create_group_invite_link(p_group_id uuid, p_expires_in_hours integer, p_max_uses integer) TO anon, authenticated;
EXCEPTION WHEN undefined_function THEN
  -- Older Postgres may treat named parameters differently; try without names/signature variants
  BEGIN
    GRANT EXECUTE ON FUNCTION public.create_group_invite_link(uuid, integer, integer) TO anon, authenticated;
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.join_group_via_invite(p_invite_code text, p_user_id uuid) TO anon, authenticated;
EXCEPTION WHEN undefined_function THEN
  BEGIN
    GRANT EXECUTE ON FUNCTION public.join_group_via_invite(text, uuid) TO anon, authenticated;
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
END $$;
