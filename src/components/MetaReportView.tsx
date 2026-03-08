import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Eye, MousePointerClick, Heart, Users, DollarSign, Share2, Bookmark, BarChart3, PencilLine, ChevronDown, ChevronUp, Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { Publicacion } from '@/hooks/usePublicaciones';
import MetaAccountForm from './MetaAccountForm';
import MetaPostMetricsForm from './MetaPostMetricsForm';
import { useMetaMetricasCuenta } from '@/hooks/useMetaMetricasCuenta';
import { exportMetaToExcel, exportMetaToPDF } from '@/lib/exportMeta';

interface MetaReportViewProps {
  publicaciones: Publicacion[];
  month: number;
  year: number;
  prevPublicaciones: Publicacion[];
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

function sumField(pubs: Publicacion[], field: keyof Publicacion): number {
  return pubs.reduce((acc, p) => acc + (Number(p[field]) || 0), 0);
}

function avgField(pubs: Publicacion[], field: keyof Publicacion): number {
  const vals = pubs.map(p => Number(p[field]) || 0).filter(v => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  const change = pctChange(current, previous);
  if (change === null) return null;
  const isPositive = change >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{change.toFixed(1)}%
    </span>
  );
}

export default function MetaReportView({ publicaciones, month, year, prevPublicaciones }: MetaReportViewProps) {
  const [showForms, setShowForms] = useState(false);
  const { data: accountMetrics } = useMetaMetricasCuenta(month, year);
  const metaPubs = useMemo(() => publicaciones.filter(p =>
    ['Facebook', 'Instagram', 'facebook', 'instagram', 'Meta'].some(s => p.red_social?.toLowerCase().includes(s.toLowerCase()))
  ), [publicaciones]);

  const prevMetaPubs = useMemo(() => prevPublicaciones.filter(p =>
    ['Facebook', 'Instagram', 'facebook', 'instagram', 'Meta'].some(s => p.red_social?.toLowerCase().includes(s.toLowerCase()))
  ), [prevPublicaciones]);

  // Current month metrics
  const alcance = sumField(metaPubs, 'alcance');
  const impresiones = sumField(metaPubs, 'impresiones');
  const engagement = sumField(metaPubs, 'engagement');
  const clics = sumField(metaPubs, 'clics');
  const guardados = sumField(metaPubs, 'guardados');
  const compartidos = sumField(metaPubs, 'compartidos');
  const seguidoresNuevos = sumField(metaPubs, 'seguidores_nuevos');
  const costo = sumField(metaPubs, 'costo');
  const erPromedio = avgField(metaPubs, 'er_porcentaje');
  const costoResultado = avgField(metaPubs, 'costo_por_resultado');

  // Previous month metrics
  const prevAlcance = sumField(prevMetaPubs, 'alcance');
  const prevImpresiones = sumField(prevMetaPubs, 'impresiones');
  const prevEngagement = sumField(prevMetaPubs, 'engagement');
  const prevClics = sumField(prevMetaPubs, 'clics');
  const prevSeguidores = sumField(prevMetaPubs, 'seguidores_nuevos');
  const prevCosto = sumField(prevMetaPubs, 'costo');

  const kpis = [
    { label: 'Alcance', value: alcance, prev: prevAlcance, icon: Eye, format: (v: number) => v.toLocaleString() },
    { label: 'Impresiones', value: impresiones, prev: prevImpresiones, icon: BarChart3, format: (v: number) => v.toLocaleString() },
    { label: 'Engagement', value: engagement, prev: prevEngagement, icon: Heart, format: (v: number) => v.toLocaleString() },
    { label: 'Clics', value: clics, prev: prevClics, icon: MousePointerClick, format: (v: number) => v.toLocaleString() },
    { label: 'Seguidores nuevos', value: seguidoresNuevos, prev: prevSeguidores, icon: Users, format: (v: number) => v.toLocaleString() },
    { label: 'Inversión', value: costo, prev: prevCosto, icon: DollarSign, format: (v: number) => `$${v.toLocaleString()}` },
  ];

  // Charts data
  const byRedSocial = useMemo(() => {
    const map: Record<string, { red: string; alcance: number; engagement: number; clics: number; posts: number }> = {};
    metaPubs.forEach(p => {
      const red = p.red_social || 'Otro';
      if (!map[red]) map[red] = { red, alcance: 0, engagement: 0, clics: 0, posts: 0 };
      map[red].alcance += Number(p.alcance) || 0;
      map[red].engagement += Number(p.engagement) || 0;
      map[red].clics += Number(p.clics) || 0;
      map[red].posts += 1;
    });
    return Object.values(map);
  }, [metaPubs]);

  const byTipoContenido = useMemo(() => {
    const map: Record<string, number> = {};
    metaPubs.forEach(p => {
      const tipo = p.tipo_contenido || 'Otro';
      map[tipo] = (map[tipo] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [metaPubs]);

  const byPauta = useMemo(() => {
    const org = metaPubs.filter(p => p.tipo_pauta === 'Orgánico' || !p.tipo_pauta);
    const paid = metaPubs.filter(p => p.tipo_pauta && p.tipo_pauta !== 'Orgánico');
    return [
      { name: 'Orgánico', posts: org.length, alcance: sumField(org, 'alcance'), engagement: sumField(org, 'engagement') },
      { name: 'Pauta', posts: paid.length, alcance: sumField(paid, 'alcance'), engagement: sumField(paid, 'engagement') },
    ];
  }, [metaPubs]);

  // Previous month info
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reporte Meta</h2>
          <p className="text-sm text-muted-foreground">
            {MESES[month]} {year} · Comparado con {MESES[prevMonth]} {prevYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportMetaToExcel({ metaPubs, month, year, accountMetrics, kpis, byPauta })}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMetaToPDF({ metaPubs, month, year, accountMetrics, kpis, byPauta })}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setShowForms(f => !f)}>
            <PencilLine className="h-4 w-4 mr-1" />
            {showForms ? 'Ocultar formularios' : 'Cargar métricas'}
            {showForms ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
          <Badge variant="outline" className="text-xs">
            {metaPubs.length} publicación{metaPubs.length !== 1 ? 'es' : ''} Meta
          </Badge>
        </div>
      </div>

      {/* Manual input forms */}
      {showForms && (
        <div className="space-y-4">
          <MetaAccountForm month={month} year={year} />
          <MetaPostMetricsForm publicaciones={metaPubs} />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{kpi.format(kpi.value)}</p>
                <ChangeIndicator current={kpi.value} previous={kpi.prev} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Guardados</span>
            </div>
            <p className="text-lg font-bold text-foreground">{guardados.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Compartidos</span>
            </div>
            <p className="text-lg font-bold text-foreground">{compartidos.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ER Promedio</span>
            </div>
            <p className="text-lg font-bold text-foreground">{erPromedio.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Costo/Resultado</span>
            </div>
            <p className="text-lg font-bold text-foreground">${costoResultado.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar chart - Métricas por red social */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Métricas por red social</CardTitle>
          </CardHeader>
          <CardContent>
            {byRedSocial.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byRedSocial}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="red" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="alcance" name="Alcance" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagement" name="Engagement" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clics" name="Clics" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sin datos de métricas</p>
            )}
          </CardContent>
        </Card>

        {/* Pie chart - Tipo de contenido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución por tipo de contenido</CardTitle>
          </CardHeader>
          <CardContent>
            {byTipoContenido.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byTipoContenido} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {byTipoContenido.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sin publicaciones</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orgánico vs Pauta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Orgánico vs Pauta</CardTitle>
        </CardHeader>
        <CardContent>
          {byPauta.some(b => b.posts > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byPauta} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={70} />
                <Tooltip />
                <Bar dataKey="alcance" name="Alcance" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                <Bar dataKey="engagement" name="Engagement" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Detalle por publicación</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs">Red</TableHead>
                  <TableHead className="text-xs">Título</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs text-right">Alcance</TableHead>
                  <TableHead className="text-xs text-right">Impresiones</TableHead>
                  <TableHead className="text-xs text-right">Engagement</TableHead>
                  <TableHead className="text-xs text-right">ER%</TableHead>
                  <TableHead className="text-xs text-right">Clics</TableHead>
                  <TableHead className="text-xs text-right">Guardados</TableHead>
                  <TableHead className="text-xs text-right">Compartidos</TableHead>
                  <TableHead className="text-xs text-right">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metaPubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground text-sm">
                      No hay publicaciones de Meta en este mes
                    </TableCell>
                  </TableRow>
                ) : (
                  metaPubs.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs whitespace-nowrap">{p.fecha}</TableCell>
                      <TableCell className="text-xs">{p.red_social}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{p.titulo}</TableCell>
                      <TableCell className="text-xs">{p.tipo_contenido}</TableCell>
                      <TableCell className="text-xs text-right">{(p.alcance || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{(p.impresiones || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{(p.engagement || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{p.er_porcentaje ? `${Number(p.er_porcentaje).toFixed(2)}%` : '-'}</TableCell>
                      <TableCell className="text-xs text-right">{(p.clics || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{(p.guardados || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{(p.compartidos || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right">{p.costo ? `$${Number(p.costo).toLocaleString()}` : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
                {metaPubs.length > 0 && (
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={4} className="text-xs">Total</TableCell>
                    <TableCell className="text-xs text-right">{alcance.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{impresiones.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{engagement.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{erPromedio.toFixed(2)}%</TableCell>
                    <TableCell className="text-xs text-right">{clics.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{guardados.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{compartidos.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">${costo.toLocaleString()}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
