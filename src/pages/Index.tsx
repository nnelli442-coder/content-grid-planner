import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Table2, CalendarRange, BarChart3, Plus, LogOut, Shield, Loader2, FileSpreadsheet, FileText, Moon, Sun } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/lib/export';
import { usePublicaciones } from '@/hooks/usePublicaciones';
import CalendarView from '@/components/CalendarView';
import TableView from '@/components/TableView';
import WeeklyView from '@/components/WeeklyView';
import MetricsView from '@/components/MetricsView';
import AdminPanel from '@/components/AdminPanel';
import PublicacionForm from '@/components/PublicacionForm';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Index() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const { data: publicaciones = [], isLoading } = usePublicaciones(month, year);

  const [formOpen, setFormOpen] = useState(false);
  const [editPub, setEditPub] = useState<Publicacion | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const openNew = (date?: string) => {
    setEditPub(null);
    setDefaultDate(date || '');
    setFormOpen(true);
  };
  const openEdit = (pub: Publicacion) => {
    setEditPub(pub);
    setFormOpen(true);
  };

  const handleCalendarDateClick = (date: string) => {
    setFilterDate(date);
    setActiveTab('table');
  };

  const handleTableDateClick = (date: string) => {
    // Parse date to set month/year and switch to calendar
    const [y, m] = date.split('-').map(Number);
    setYear(y);
    setMonth(m - 1);
    setActiveTab('calendar');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Content Grid</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark(d => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToExcel(publicaciones, month, year)} className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToPDF(publicaciones, month, year)} className="gap-1.5">
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => openNew()} className="gap-2"><Plus className="h-4 w-4" /> Nueva publicación</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'table') setFilterDate(null); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Calendario</TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5"><Table2 className="h-4 w-4" /> Tabla</TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5"><CalendarRange className="h-4 w-4" /> Semanal</TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Métricas</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="gap-1.5"><Shield className="h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <TabsContent value="calendar">
                <CalendarView publicaciones={publicaciones} month={month} year={year} onDayClick={handleCalendarDateClick} onEditPub={openEdit} onNewPub={openNew} />
              </TabsContent>
              <TabsContent value="table">
                <TableView publicaciones={publicaciones} onEdit={openEdit} filterDate={filterDate} onClearFilterDate={() => setFilterDate(null)} onDateClick={handleTableDateClick} />
              </TabsContent>
              <TabsContent value="weekly">
                <WeeklyView publicaciones={publicaciones} month={month} year={year} onDayClick={openNew} onEditPub={openEdit} />
              </TabsContent>
              <TabsContent value="metrics">
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
