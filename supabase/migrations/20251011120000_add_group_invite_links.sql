-- Add invite link functionality to study_groups

-- 1. Add columns for invite links
ALTER TABLE public.study_groups 
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_link TEXT,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS invite_max_uses INTEGER,
  ADD COLUMN IF NOT EXISTS invite_uses INTEGER DEFAULT 0;

-- 2. Create function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to generate invite link for a group
CREATE OR REPLACE FUNCTION create_group_invite_link(
  p_group_id UUID,
  p_expires_in_hours INTEGER DEFAULT 168, -- Default 7 days
  p_max_uses INTEGER DEFAULT NULL
)
RETURNS TABLE(invite_code TEXT, invite_link TEXT, expires_at TIMESTAMP) AS $$
DECLARE
  v_code TEXT;
  v_link TEXT;
  v_expires TIMESTAMP;
  v_base_url TEXT := 'https://yourapp.com/join/'; -- Update with your actual domain
BEGIN
  -- Generate unique code
  LOOP
    v_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.study_groups WHERE invite_code = v_code);
  END LOOP;
  
  -- Calculate expiration
  v_expires := now() + (p_expires_in_hours || ' hours')::interval;
  
  -- Create invite link
  v_link := v_base_url || v_code;
  
  -- Update group
  UPDATE public.study_groups
  SET 
    invite_code = v_code,
    invite_link = v_link,
    invite_expires_at = v_expires,
    invite_max_uses = p_max_uses,
    invite_uses = 0
  WHERE id = p_group_id;
  
  RETURN QUERY SELECT v_code, v_link, v_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to validate and use invite code
CREATE OR REPLACE FUNCTION join_group_via_invite(
  p_invite_code TEXT,
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, group_id UUID, group_name TEXT) AS $$
DECLARE
  v_group RECORD;
  v_member_exists BOOLEAN;
  v_member_count INTEGER;
BEGIN
  -- Find group by invite code
  SELECT * INTO v_group
  FROM public.study_groups
  WHERE invite_code = p_invite_code;
  
  -- Check if invite code exists
  IF v_group IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid invite code'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if invite is expired
  IF v_group.invite_expires_at IS NOT NULL AND v_group.invite_expires_at < now() THEN
    RETURN QUERY SELECT false, 'Invite link has expired'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if invite has reached max uses
  IF v_group.invite_max_uses IS NOT NULL AND v_group.invite_uses >= v_group.invite_max_uses THEN
    RETURN QUERY SELECT false, 'Invite link has reached maximum uses'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE group_id = v_group.id AND user_id = p_user_id
  ) INTO v_member_exists;
  
  IF v_member_exists THEN
    RETURN QUERY SELECT false, 'You are already a member of this group'::TEXT, v_group.id, v_group.name;
    RETURN;
  END IF;
  
  -- Check if group is at max capacity
  SELECT COUNT(*) INTO v_member_count
  FROM public.study_group_members
  WHERE group_id = v_group.id;
  
  IF v_group.max_members IS NOT NULL AND v_member_count >= v_group.max_members THEN
    RETURN QUERY SELECT false, 'Group is at maximum capacity'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Add user to group
  INSERT INTO public.study_group_members (group_id, user_id, role)
  VALUES (v_group.id, p_user_id, 'member');
  
  -- Increment invite uses
  UPDATE public.study_groups
  SET invite_uses = invite_uses + 1
  WHERE id = v_group.id;
  
  RETURN QUERY SELECT true, 'Successfully joined group'::TEXT, v_group.id, v_group.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create table for invite link analytics (optional)
CREATE TABLE IF NOT EXISTS public.group_invite_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  invite_code VARCHAR(10) NOT NULL,
  used_by UUID,
  used_at TIMESTAMP DEFAULT now(),
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- RLS for invite logs
ALTER TABLE public.group_invite_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group admins can view invite logs" ON public.group_invite_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = group_invite_logs.group_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "System can insert invite logs" ON public.group_invite_logs
  FOR INSERT WITH CHECK (true);

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_study_groups_invite_code ON public.study_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_logs_group_id ON public.group_invite_logs(group_id);

-- 7. Update RLS policies to allow invite link viewing
DROP POLICY IF EXISTS "Public can view group invite links" ON public.study_groups;
CREATE POLICY "Anyone can view public group invite links" ON public.study_groups
  FOR SELECT USING (is_private = false OR invite_code IS NOT NULL);

COMMENT ON COLUMN public.study_groups.invite_code IS 'Unique 8-character code for group invites';
COMMENT ON COLUMN public.study_groups.invite_link IS 'Full invite URL for the group';
COMMENT ON COLUMN public.study_groups.invite_expires_at IS 'When the invite link expires';
COMMENT ON COLUMN public.study_groups.invite_max_uses IS 'Maximum number of times the invite can be used (NULL = unlimited)';
COMMENT ON COLUMN public.study_groups.invite_uses IS 'Number of times the invite has been used';
