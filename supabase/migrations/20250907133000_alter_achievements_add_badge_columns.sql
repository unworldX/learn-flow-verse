-- Add visual badge columns to achievements (idempotent)
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS tier text, -- e.g., bronze, silver, gold
  ADD COLUMN IF NOT EXISTS image_url text, -- custom uploaded image
  ADD COLUMN IF NOT EXISTS color text; -- fallback color theme

-- Optional: seed tier/color defaults where null
UPDATE public.achievements
SET tier = COALESCE(tier, CASE
  WHEN name ILIKE '%first%' THEN 'bronze'
  WHEN name ILIKE '%quick%' THEN 'silver'
  WHEN name ILIKE '%pro%' THEN 'gold'
  WHEN name ILIKE '%master%' THEN 'gold'
  ELSE 'bronze'
END),
color = COALESCE(color, CASE tier
  WHEN 'gold' THEN '#FACC15'
  WHEN 'silver' THEN '#9CA3AF'
  WHEN 'bronze' THEN '#D97706'
  ELSE '#6366F1'
END);
