-- Helper functions to reduce repeated auth lookups and set stable search_path
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.email();
$$;

-- Ensure existing functions have explicit search_path for safety
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.app_cache WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.check_download_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record 
  FROM public.subscribers 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN (SELECT COUNT(*) FROM public.user_downloads WHERE user_id = user_uuid) < 5;
  END IF;
  
  RETURN sub_record.downloads_used < sub_record.download_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_group_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record 
  FROM public.subscribers 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN (SELECT COUNT(*) FROM public.study_group_members WHERE user_id = user_uuid) < 1;
  END IF;
  
  RETURN sub_record.groups_joined < sub_record.group_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_cache(cache_key_param text, cache_value_param jsonb, ttl_minutes integer DEFAULT 60)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_cache (cache_key, cache_value, expires_at)
  VALUES (cache_key_param, cache_value_param, now() + (ttl_minutes || ' minutes')::interval)
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    cache_value = cache_value_param,
    expires_at = now() + (ttl_minutes || ' minutes')::interval,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cache(cache_key_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT cache_value INTO result 
  FROM public.app_cache 
  WHERE cache_key = cache_key_param AND expires_at > now();
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_subscription_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE NEW.subscription_tier
    WHEN 'basic' THEN
      NEW.download_limit := 20;
      NEW.group_limit := 3;
    WHEN 'premium' THEN
      NEW.download_limit := 50;
      NEW.group_limit := 10;
    WHEN 'enterprise' THEN
      NEW.download_limit := 9999;
      NEW.group_limit := 9999;
    ELSE
      NEW.download_limit := 5;
      NEW.group_limit := 1;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_time ON public.direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_time ON public.direct_messages (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_time ON public.group_messages (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_resources_upload_date ON public.resources (upload_date DESC);
