-- Create a trigger to automatically create user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create any missing user records for existing auth users
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Add discussion forums tables
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description) VALUES
('General Discussion', 'General academic discussions'),
('Mathematics', 'Math-related discussions and help'),
('Science', 'Science topics and experiments'),
('Literature', 'Book discussions and literary analysis'),
('Study Groups', 'Organize and discuss study groups')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on forum categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for forum categories
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT USING (true);