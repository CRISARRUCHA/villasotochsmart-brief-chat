
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1488fc';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#0f0f0f';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS prompt text;
