import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEstrategia, useUpsertEstrategia } from '@/hooks/useEstrategias';
import { toast } from 'sonner';
import { Loader2, Save, Target, Users, MessageSquare } from 'lucide-react';

interface Props {
  month: number;
  year: number;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EstrategiaView({ month, year }: Props) {
  const { data: estrategia, isLoading } = useEstrategia(month, year);
  const upsert = useUpsertEstrategia();

  const [form, setForm] = useState({
    objetivo_general: '',
    objetivos_especificos: '',
    segmento_principal: '',
    segmento_secundario: '',
    dolor_necesidad: '',
    mensaje_rector: '',
    concepto_creativo: '',
  });

  useEffect(() => {
    if (estrategia) {
      setForm({
        objetivo_general: estrategia.objetivo_general || '',
        objetivos_especificos: estrategia.objetivos_especificos || '',
        segmento_principal: estrategia.segmento_principal || '',
        segmento_secundario: estrategia.segmento_secundario || '',
        dolor_necesidad: estrategia.dolor_necesidad || '',
        mensaje_rector: estrategia.mensaje_rector || '',
        concepto_creativo: estrategia.concepto_creativo || '',
      });
    } else {
      setForm({ objetivo_general: '', objetivos_especificos: '', segmento_principal: '', segmento_secundario: '', dolor_necesidad: '', mensaje_rector: '', concepto_creativo: '' });
    }
  }, [estrategia]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ mes: month, anio: year, ...form });
      toast.success('Estrategia guardada');
    } catch {
      toast.error('Error al guardar');
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Estrategia — {MESES[month]} {year}</h2>
        <Button onClick={handleSave} disabled={upsert.isPending} className="gap-2">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar estrategia
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objetivo general */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Objetivo general del período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo general</Label>
              <Input value={form.objetivo_general} onChange={e => setForm(f => ({ ...f, objetivo_general: e.target.value }))} placeholder="Ej: Posicionamiento, leads, venta directa, awareness..." />
            </div>
            <div className="space-y-2">
              <Label>Objetivos específicos</Label>
              <Textarea value={form.objetivos_especificos} onChange={e => setForm(f => ({ ...f, objetivos_especificos: e.target.value }))} rows={4} placeholder="• Crecer X% en seguidores&#10;• Aumentar engagement a X%&#10;• Generar X registros&#10;• Reducir costo por resultado" />
            </div>
          </CardContent>
        </Card>

        {/* Público objetivo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Público objetivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Segmento principal</Label>
              <Input value={form.segmento_principal} onChange={e => setForm(f => ({ ...f, segmento_principal: e.target.value }))} placeholder="Descripción del segmento principal..." />
            </div>
            <div className="space-y-2">
              <Label>Segmento secundario</Label>
              <Input value={form.segmento_secundario} onChange={e => setForm(f => ({ ...f, segmento_secundario: e.target.value }))} placeholder="Descripción del segmento secundario..." />
            </div>
            <div className="space-y-2">
              <Label>Dolor / Necesidad principal</Label>
              <Textarea value={form.dolor_necesidad} onChange={e => setForm(f => ({ ...f, dolor_necesidad: e.target.value }))} rows={2} placeholder="¿Qué problema o necesidad tiene el público?" />
            </div>
          </CardContent>
        </Card>

        {/* Mensaje rector */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Mensaje rector del mes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mensaje rector</Label>
              <Textarea value={form.mensaje_rector} onChange={e => setForm(f => ({ ...f, mensaje_rector: e.target.value }))} rows={3} placeholder="Mensaje clave que guía toda la comunicación del mes..." />
            </div>
            <div className="space-y-2">
              <Label>Concepto creativo general</Label>
              <Textarea value={form.concepto_creativo} onChange={e => setForm(f => ({ ...f, concepto_creativo: e.target.value }))} rows={3} placeholder="Idea creativa general para el mes..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
