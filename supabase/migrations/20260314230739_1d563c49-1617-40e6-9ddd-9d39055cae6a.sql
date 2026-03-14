CREATE POLICY "Anyone can select briefs by id"
ON public.briefs FOR SELECT
TO public
USING (true);