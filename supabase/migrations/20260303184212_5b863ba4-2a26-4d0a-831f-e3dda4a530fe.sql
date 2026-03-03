
-- Drop all restrictive policies and recreate as permissive

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- publicaciones
DROP POLICY IF EXISTS "Users can view own publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Users can insert own publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Users can update own publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Users can delete own publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Admin can view all publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Admin can update all publicaciones" ON public.publicaciones;
DROP POLICY IF EXISTS "Admin can delete all publicaciones" ON public.publicaciones;

CREATE POLICY "Users can view own publicaciones" ON public.publicaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own publicaciones" ON public.publicaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own publicaciones" ON public.publicaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own publicaciones" ON public.publicaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all publicaciones" ON public.publicaciones FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all publicaciones" ON public.publicaciones FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete all publicaciones" ON public.publicaciones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
