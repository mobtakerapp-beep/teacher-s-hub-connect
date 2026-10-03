GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users insert own teacher role" ON public.user_roles;
CREATE POLICY "Users insert own teacher role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'teacher');