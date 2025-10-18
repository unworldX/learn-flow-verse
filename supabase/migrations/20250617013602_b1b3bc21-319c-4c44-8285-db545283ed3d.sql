
-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  subscription_end TIMESTAMPTZ,
  download_limit INTEGER DEFAULT 5,
  downloads_used INTEGER DEFAULT 0,
  group_limit INTEGER DEFAULT 1,
  groups_joined INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscribers
CREATE POLICY "Users can view own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update own subscription" ON public.subscribers
FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Add download tracking to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS premium_content BOOLEAN DEFAULT false;

-- Create downloads table to track user downloads
CREATE TABLE public.user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Enable RLS for downloads
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for downloads
CREATE POLICY "Users can view own downloads" ON public.user_downloads
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track downloads" ON public.user_downloads
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON public.user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user ON public.subscribers(user_id);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_download_limit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record 
  FROM public.subscribers 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    -- No subscription, use default limits
    RETURN (SELECT COUNT(*) FROM public.user_downloads WHERE user_id = user_uuid) < 5;
  END IF;
  
  RETURN sub_record.downloads_used < sub_record.download_limit;
END;
$$;

-- Function to check group join limit
CREATE OR REPLACE FUNCTION check_group_limit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record 
  FROM public.subscribers 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    -- No subscription, use default limits
    RETURN (SELECT COUNT(*) FROM public.study_group_members WHERE user_id = user_uuid) < 1;
  END IF;
  
  RETURN sub_record.groups_joined < sub_record.group_limit;
END;
$$;

-- Update trigger for subscribers to set limits based on tier
CREATE OR REPLACE FUNCTION set_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER trigger_set_subscription_limits
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_limits();
