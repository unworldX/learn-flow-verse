-- Fix the authentication and users table structure to resolve fetch errors
-- Add foreign key constraints and indexes for better performance

-- First, ensure the users table has proper structure and foreign key to auth.users
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Add missing columns to users table for profile enhancement
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS regions TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create function to auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$;

-- Recreate trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to allow user creation via trigger
DROP POLICY IF EXISTS "Users can insert their profile" ON public.users;
CREATE POLICY "Users can insert their profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add index for better group message performance
CREATE INDEX IF NOT EXISTS idx_group_messages_group_sender ON public.group_messages(group_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(sender_id, receiver_id);