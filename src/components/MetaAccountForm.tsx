import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useMetaMetricasCuenta, useUpsertMetaMetricasCuenta } from '@/hooks/useMetaMetricasCuenta';
import { Save, Loader2, Users, Eye, BarChart3, MousePointerClick, Globe, Heart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface MetaAccountFormProps {
  month: number;
  year: number;
}

const FIELDS = [
  { key: 'seguidores_totales', label: 'Seguidores totales', icon: Users },
  { key: 'seguidores_nuevos', label: 'Seguidores nuevos', icon: Users },
  { key: 'alcance_cuenta', label: 'Alcance de cuenta', icon: Eye },
  { key: 'impresiones_cuenta', label: 'Impresiones de cuenta', icon: BarChart3 },
  { key: 'visitas_perfil', label: 'Visitas al perfil', icon: Globe },
  { key: 'clics_sitio_web', label: 'Clics sitio web', icon: MousePointerClick },
  { key: 'engagement_cuenta', label: 'Engagement total', icon: Heart },
  { key: 'er_cuenta', label: 'ER% cuenta', icon: Heart },
  { key: 'inversion_total', label: 'Inversión total ($)', icon: DollarSign },
] as const;

type FieldKey = typeof FIELDS[number]['key'];

export default function MetaAccountForm({ month, year }: MetaAccountFormProps) {
  const { user } = useAuth();
  const { data: existing, isLoading } = useMetaMetricasCuenta(month, year);
  const upsert = useUpsertMetaMetricasCuenta();
  const [values, setValues] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize from existing data
  if (existing && !initialized) {
    const init: Record<string, number> = {};
    FIELDS.forEach(f => { init[f.key] = Number((existing as any)[f.key]) || 0; });
    setValues(init);
    setNotas(existing.notas || '');
    setInitialized(true);
  }
  if (!existing && !initialized && !isLoading) {
    const init: Record<string, number> = {};
    FIELDS.forEach(f => { init[f.key] = 0; });
    setValues(init);
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!user) return;
    try {
      await upsert.mutateAsync({
        user_id: user.id,
        mes: month,
        anio: year,
        seguidores_totales: values.seguidores_totales || 0,
        seguidores_nuevos: values.seguidores_nuevos || 0,
        alcance_cuenta: values.alcance_cuenta || 0,
        impresiones_cuenta: values.impresiones_cuenta || 0,
        visitas_perfil: values.visitas_perfil || 0,
        clics_sitio_web: values.clics_sitio_web || 0,
        engagement_cuenta: values.engagement_cuenta || 0,
        er_cuenta: values.er_cuenta || 0,
        inversion_total: values.inversion_total || 0,
        notas: notas || null,
      });
      toast.success('Métricas de cuenta guardadas');
    } catch {
      toast.error('Error al guardar métricas');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Métricas generales de cuenta Meta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FIELDS.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  {f.label}
                </Label>
                <Input
                  type="number"
                  step={f.key === 'er_cuenta' || f.key === 'inversion_total' ? '0.01' : '1'}
                  value={values[f.key] || ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
            );
          })}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notas</Label>
          <Textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones del mes..."
            className="min-h-[60px] text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending} size="sm" className="w-full">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar métricas de cuenta
        </Button>
      </CardContent>
    </Card>
  );
}
