import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Table2, CalendarRange, BarChart3, Plus, LogOut, Shield, Loader2, FileSpreadsheet, FileText, Moon, Sun, Target, Palette, TrendingUp, Grid3X3 } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/lib/export';
import { usePublicaciones } from '@/hooks/usePublicaciones';
import { useCuentas } from '@/hooks/useCuentas';
import CalendarView from '@/components/CalendarView';
import TableView from '@/components/TableView';
import WeeklyView from '@/components/WeeklyView';
import MetricsView from '@/components/MetricsView';
import AdminPanel from '@/components/AdminPanel';
import PublicacionForm from '@/components/PublicacionForm';
import EstrategiaView from '@/components/EstrategiaView';
import EjecucionView from '@/components/EjecucionView';
import MedicionView from '@/components/MedicionView';
import ParrillaView from '@/components/ParrillaView';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Index() {
  const { user, loading, isAdmin, isSupervisor, signOut } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const { data: publicaciones = [], isLoading } = usePublicaciones(month, year);
  const { data: cuentas = [] } = useCuentas();

  const [formOpen, setFormOpen] = useState(false);
  const [editPub, setEditPub] = useState<Publicacion | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('estrategia');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const openNew = (date?: string) => { setEditPub(null); setDefaultDate(date || ''); setFormOpen(true); };
  const openEdit = (pub: Publicacion) => { setEditPub(pub); setFormOpen(true); };
  const handleCalendarDateClick = (date: string) => { setFilterDate(date); setActiveTab('tabla'); };
  const handleTableDateClick = (date: string) => {
    const [y, m] = date.split('-').map(Number);
    setYear(y); setMonth(m - 1); setActiveTab('calendario');
  };

  const roleBadge = isAdmin
    ? <Badge className="bg-primary/10 text-primary border-primary/30 font-medium text-xs px-2 py-0.5">Admin</Badge>
    : isSupervisor
      ? <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium text-xs px-2 py-0.5">Supervisor</Badge>
      : <Badge className="bg-muted text-muted-foreground border-border font-medium text-xs px-2 py-0.5">Usuario</Badge>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Content Grid</h1>
              <p className="text-xs text-muted-foreground leading-tight hidden sm:block">{MESES[month]} {year}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <span className="text-xs text-muted-foreground truncate max-w-[160px]">{user.email}</span>
              {roleBadge}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setDark(d => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-[130px] h-9 text-sm font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[90px] h-9 text-sm font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            {publicaciones.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {publicaciones.length} publicación{publicaciones.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(publicaciones, month, year, cuentas)}
              className="gap-1.5 h-9 text-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(publicaciones, month, year, cuentas)}
              className="gap-1.5 h-9 text-sm"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            {!isSupervisor && (
              <Button onClick={() => openNew()} className="gap-2 h-9 text-sm shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva publicación</span>
                <span className="sm:hidden">Nueva</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'tabla') setFilterDate(null); }}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1 p-1 bg-muted/50 rounded-xl border">
            <TabsTrigger value="estrategia" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Target className="h-4 w-4" /> Estrategia
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <CalendarDays className="h-4 w-4" /> Calendario
            </TabsTrigger>
            <TabsTrigger value="tabla" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Table2 className="h-4 w-4" /> Tabla
            </TabsTrigger>
            <TabsTrigger value="semanal" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <CalendarRange className="h-4 w-4" /> Semanal
            </TabsTrigger>
            <TabsTrigger value="ejecucion" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4" /> Ejecución
            </TabsTrigger>
            <TabsTrigger value="medicion" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" /> Medición
            </TabsTrigger>
            <TabsTrigger value="excel" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <Grid3X3 className="h-4 w-4" /> Excel
            </TabsTrigger>
            <TabsTrigger value="metricas" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" /> Gráficos
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          {isLoading && activeTab !== 'estrategia' ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando publicaciones...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="estrategia">
                <EstrategiaView month={month} year={year} />
              </TabsContent>
              <TabsContent value="calendario">
                <CalendarView publicaciones={publicaciones} month={month} year={year} onDayClick={handleCalendarDateClick} onEditPub={openEdit} onNewPub={openNew} />
              </TabsContent>
              <TabsContent value="tabla">
                <TableView publicaciones={publicaciones} onEdit={openEdit} filterDate={filterDate} onClearFilterDate={() => setFilterDate(null)} onDateClick={handleTableDateClick} />
              </TabsContent>
              <TabsContent value="semanal">
                <WeeklyView publicaciones={publicaciones} month={month} year={year} onDayClick={openNew} onEditPub={openEdit} />
              </TabsContent>
              <TabsContent value="ejecucion">
                <EjecucionView publicaciones={publicaciones} />
              </TabsContent>
              <TabsContent value="medicion">
                <MedicionView publicaciones={publicaciones} />
              </TabsContent>
              <TabsContent value="excel">
                <ParrillaView publicaciones={publicaciones} />
              </TabsContent>
              <TabsContent value="metricas">
                <MetricsView publicaciones={publicaciones} />
              </TabsContent>
              {isAdmin && <TabsContent value="admin"><AdminPanel /></TabsContent>}
            </>
          )}
        </Tabs>
      </main>

      <PublicacionForm open={formOpen} onClose={() => setFormOpen(false)} editData={editPub} defaultDate={defaultDate} />
    </div>
  );
}
