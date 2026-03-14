
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Saved briefs table
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT,
  brief_data JSONB NOT NULL DEFAULT '{}',
  full_data JSONB,
  chat_history JSONB NOT NULL DEFAULT '[]',
  phase TEXT NOT NULL DEFAULT 'brief',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read briefs
CREATE POLICY "Authenticated users can read all briefs" ON public.briefs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete briefs" ON public.briefs
  FOR DELETE TO authenticated USING (true);

-- Anyone can insert briefs (public chat)
CREATE POLICY "Anyone can insert briefs" ON public.briefs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update briefs" ON public.briefs
  FOR UPDATE USING (true);
