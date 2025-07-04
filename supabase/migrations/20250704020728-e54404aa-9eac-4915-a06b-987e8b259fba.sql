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

-- Insert default forum categories without conflict handling first
INSERT INTO public.forum_categories (name, description) 
SELECT 'General Discussion', 'General academic discussions'
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'General Discussion');

INSERT INTO public.forum_categories (name, description) 
SELECT 'Mathematics', 'Math-related discussions and help'
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Mathematics');

INSERT INTO public.forum_categories (name, description) 
SELECT 'Science', 'Science topics and experiments'
WHERE NOT EXISTS (SELECT 1 FROM public.forum_categories WHERE name = 'Science');