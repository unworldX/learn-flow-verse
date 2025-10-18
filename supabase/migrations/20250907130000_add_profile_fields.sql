-- Add missing profile columns if they do not exist
DO $$
BEGIN
    -- regions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='regions'
    ) THEN
        ALTER TABLE public.users ADD COLUMN regions text;
    END IF;

    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN status text;
    END IF;

    -- profession
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='profession'
    ) THEN
        ALTER TABLE public.users ADD COLUMN profession text;
    END IF;

    -- location
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='location'
    ) THEN
        ALTER TABLE public.users ADD COLUMN location text;
    END IF;

    -- bio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='bio'
    ) THEN
        ALTER TABLE public.users ADD COLUMN bio text;
    END IF;
END $$;

-- Achievements tables (idempotent creation)
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Seed sample achievements if table empty
INSERT INTO public.achievements (name, description)
SELECT * FROM (VALUES
    ('First Study Plan', 'Create your first study plan'),
    ('Resource Collector', 'Add 5 resources'),
    ('Reminder Setter', 'Create 3 reminders'),
    ('Uploader', 'Upload your first file')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements);
