
-- Add better indexing and relationships for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_time ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_date ON public.file_uploads(user_id, upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_resources_search ON public.resources(subject, class, resource_type);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON public.user_api_keys(user_id, provider);

-- Add app cache table for storing frequently accessed data
CREATE TABLE IF NOT EXISTS public.app_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS for app_cache
ALTER TABLE public.app_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on app_cache" ON public.app_cache FOR ALL USING (true);

-- Create indexes for cache performance
CREATE INDEX IF NOT EXISTS idx_app_cache_key ON public.app_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_app_cache_expires ON public.app_cache(expires_at);

-- Add user sessions table for better user state management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_data JSONB DEFAULT '{}',
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions 
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for session performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON public.user_sessions(last_activity DESC);

-- Add notification settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  new_messages BOOLEAN DEFAULT true,
  profile_visibility BOOLEAN DEFAULT true,
  activity_status BOOLEAN DEFAULT true,
  data_collection BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  ai_suggestions BOOLEAN DEFAULT true,
  ai_autocomplete BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON public.user_settings 
FOR ALL USING (auth.uid() = user_id);

-- Add function to cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.app_cache WHERE expires_at < now();
END;
$$;

-- Add function to get or set cache
CREATE OR REPLACE FUNCTION get_cache(cache_key_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION set_cache(cache_key_param TEXT, cache_value_param JSONB, ttl_minutes INTEGER DEFAULT 60)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add trigger to update user_settings updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Add better foreign key relationships
ALTER TABLE public.file_uploads ADD CONSTRAINT fk_file_uploads_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.resources ADD CONSTRAINT fk_resources_uploader 
  FOREIGN KEY (uploader_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.user_api_keys ADD CONSTRAINT fk_user_api_keys_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_settings ADD CONSTRAINT fk_user_settings_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_sessions ADD CONSTRAINT fk_user_sessions_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
