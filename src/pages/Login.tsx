import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, Sparkles, LayoutGrid, BarChart3, Calendar, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error('Email o contraseña incorrectos');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-white/[0.06] blur-xl" />
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="absolute top-[50%] left-[40%] w-48 h-48 rounded-full bg-white/[0.05]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center flex-1 px-16">
          {/* Icon */}
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-extrabold text-white tracking-tight text-center mb-4 leading-tight">
            Bienvenido a tu<br />
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              organizador virtual
            </span>
          </h1>

          <p className="text-white/60 text-lg text-center max-w-md mb-12">
            Planifica, ejecuta y mide todo tu contenido desde un solo lugar. Simple, potente y hecho para ti.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
            {[
              { icon: Calendar, label: 'Planificación', desc: 'Calendario visual' },
              { icon: LayoutGrid, label: 'Ejecución', desc: 'Parrilla de contenido' },
              { icon: BarChart3, label: 'Medición', desc: 'Métricas en tiempo real' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/10 p-5 transition-all hover:bg-white/[0.12] hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">{label}</span>
                <span className="text-white/50 text-xs text-center">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10 px-16 pb-8">
          <p className="text-white/30 text-xs text-center">Content Grid · Tu espacio de trabajo creativo</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile header */}
          <div className="flex lg:hidden flex-col items-center mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center">
              Tu organizador virtual
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Todo tu contenido en un solo lugar</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">Iniciar sesión</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder a tu espacio de trabajo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-base shadow-md shadow-primary/20 mt-2"
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Ingresando...</>
                : 'Entrar a mi espacio'
              }
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">¿Necesitas ayuda?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Contacta al administrador para obtener acceso o recuperar tu contraseña
          </p>
        </div>
      </div>
    </div>
  );
}
