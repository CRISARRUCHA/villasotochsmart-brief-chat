CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  phase1_prompt text NOT NULL,
  phase2_prompt text NOT NULL,
  initial_message text NOT NULL,
  landing_title text,
  landing_subtitle text,
  landing_cta text DEFAULT 'Compartir mi visión',
  steps jsonb DEFAULT '[]'::jsonb,
  tips jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read projects" ON public.projects FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);