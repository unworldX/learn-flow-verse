-- Create notifications table for the application
-- Supports various notification types: conversations, reminders, updates, forums, subscriptions, video courses

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('conversation', 'reminder', 'update', 'forum', 'subscription', 'video_course', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  link TEXT, -- URL to navigate to when notification is clicked
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data specific to notification type
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own notifications

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Allow system to insert notifications for any user (service role only)
-- Note: Regular users cannot create notifications directly
CREATE POLICY "Service role can insert notifications" 
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to automatically update read_at timestamp
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update read_at
CREATE TRIGGER trigger_update_notification_read_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Function to create conversation notifications
CREATE OR REPLACE FUNCTION create_conversation_notification(
  p_user_id UUID,
  p_sender_name TEXT,
  p_conversation_id TEXT,
  p_preview TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    p_user_id,
    'conversation',
    'New message from ' || p_sender_name,
    p_preview,
    '/conversations?id=' || p_conversation_id,
    jsonb_build_object('sender', p_sender_name, 'conversation_id', p_conversation_id)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create reminder notifications
CREATE OR REPLACE FUNCTION create_reminder_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_reminder_time TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    p_user_id,
    'reminder',
    p_title,
    p_message,
    jsonb_build_object('reminder_time', p_reminder_time)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create forum notifications
CREATE OR REPLACE FUNCTION create_forum_notification(
  p_user_id UUID,
  p_forum_title TEXT,
  p_action TEXT,
  p_actor_name TEXT,
  p_forum_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    p_user_id,
    'forum',
    p_action || ' in ' || p_forum_title,
    p_actor_name || ' ' || p_action,
    '/forums/' || p_forum_id,
    jsonb_build_object('forum_id', p_forum_id, 'actor', p_actor_name, 'action', p_action)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create subscription notifications
CREATE OR REPLACE FUNCTION create_subscription_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_subscription_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    p_user_id,
    'subscription',
    p_title,
    p_message,
    '/subscription',
    jsonb_build_object('subscription_type', p_subscription_type)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create video course notifications
CREATE OR REPLACE FUNCTION create_video_course_notification(
  p_user_id UUID,
  p_course_title TEXT,
  p_message TEXT,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    p_user_id,
    'video_course',
    p_course_title,
    p_message,
    '/courses/' || p_course_id,
    jsonb_build_object('course_id', p_course_id)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = now()
  WHERE user_id = p_user_id AND read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.notifications WHERE user_id = p_user_id AND read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
