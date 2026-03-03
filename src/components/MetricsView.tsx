import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';

interface Props {
  publicaciones: Publicacion[];
}

const CHART_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function MetricsView({ publicaciones }: Props) {
  const byRedSocial = useMemo(() => {
    const counts: Record<string, number> = {};
    publicaciones.forEach(p => { counts[p.red_social] = (counts[p.red_social] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [publicaciones]);

  const byEstado = useMemo(() => {
    const counts: Record<string, number> = {};
    publicaciones.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [publicaciones]);

  const byTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    publicaciones.forEach(p => { counts[p.tipo_contenido] = (counts[p.tipo_contenido] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [publicaciones]);

  const byDay = useMemo(() => {
    const counts: Record<string, number> = {};
    publicaciones.forEach(p => { counts[p.fecha] = (counts[p.fecha] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), count,
    }));
  }, [publicaciones]);

  if (publicaciones.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No hay datos para mostrar métricas</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Por red social</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byRedSocial} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {byRedSocial.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Por estado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byEstado}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Por tipo de contenido</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byTipo} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" fontSize={12} width={80} /><Tooltip /><Bar dataKey="value" fill="hsl(243, 75%, 59%)" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Actividad por día</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={byDay}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={12} /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="hsl(243, 75%, 59%)" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
