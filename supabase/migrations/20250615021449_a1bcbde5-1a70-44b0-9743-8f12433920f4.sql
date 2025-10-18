
-- Create forums tables
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text)
);

-- Update forum_posts to reference categories properly
ALTER TABLE public.forum_posts 
DROP COLUMN IF EXISTS category,
ADD COLUMN category_id UUID REFERENCES public.forum_categories(id);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  reminder_type VARCHAR DEFAULT 'general',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text)
);

-- Create file_uploads table for upload functionality
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name VARCHAR NOT NULL,
  file_size BIGINT,
  file_type VARCHAR,
  file_path VARCHAR NOT NULL,
  upload_date TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text),
  is_processed BOOLEAN DEFAULT false
);

-- Add RLS policies for forums
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create categories" ON public.forum_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum comments" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own comments" ON public.forum_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.forum_comments FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for file uploads
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own uploads" ON public.file_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own uploads" ON public.file_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own uploads" ON public.file_uploads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own uploads" ON public.file_uploads FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for existing study plan tables
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.study_plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tasks for their study plans" ON public.study_plan_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = auth.uid())
);
CREATE POLICY "Users can create tasks for their study plans" ON public.study_plan_tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = auth.uid())
);
CREATE POLICY "Users can update tasks for their study plans" ON public.study_plan_tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = auth.uid())
);
CREATE POLICY "Users can delete tasks for their study plans" ON public.study_plan_tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = auth.uid())
);

-- Insert some default forum categories
INSERT INTO public.forum_categories (name, description) VALUES
('General Discussion', 'General topics and discussions'),
('Study Help', 'Ask for help with your studies'),
('Academic Questions', 'Questions about specific subjects'),
('Study Tips', 'Share and discover study techniques'),
('Announcements', 'Important announcements and updates');

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Storage policies for uploads bucket
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view all uploaded files" ON storage.objects FOR SELECT USING (
  bucket_id = 'uploads'
);

CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
);
