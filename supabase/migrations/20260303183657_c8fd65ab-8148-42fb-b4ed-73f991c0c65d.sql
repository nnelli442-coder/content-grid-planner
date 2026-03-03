
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table FIRST
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create publicaciones table
CREATE TABLE public.publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  red_social TEXT NOT NULL,
  tipo_contenido TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador',
  copy_arte TEXT,
  link_referencia TEXT,
  color TEXT DEFAULT '#3B82F6',
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.publicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publicaciones" ON public.publicaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own publicaciones" ON public.publicaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own publicaciones" ON public.publicaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own publicaciones" ON public.publicaciones FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all publicaciones" ON public.publicaciones FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all publicaciones" ON public.publicaciones FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete all publicaciones" ON public.publicaciones FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_publicaciones_updated_at BEFORE UPDATE ON public.publicaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
