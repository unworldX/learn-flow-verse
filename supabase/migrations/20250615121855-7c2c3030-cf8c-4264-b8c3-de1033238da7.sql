
-- Enable Row Level Security on the user_api_keys table
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create a single policy for users to manage their own API keys
CREATE POLICY "Users can manage their own API keys"
ON public.user_api_keys
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
