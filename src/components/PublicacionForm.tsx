import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePublicacion, useUpdatePublicacion, REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, OBJETIVOS_POST, PILARES_CONTENIDO, ETAPAS_FUNNEL, TIPOS_PAUTA, COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useCuentas } from '@/hooks/useCuentas';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Props {
  open: boolean;
  onClose: () => void;
  editData?: Publicacion | null;
  defaultDate?: string;
}

export default function PublicacionForm({ open, onClose, editData, defaultDate }: Props) {
  const { user } = useAuth();
  const create = useCreatePublicacion();
  const update = useUpdatePublicacion();
  const { data: cuentas = [] } = useCuentas();

  const [form, setForm] = useState({
    titulo: '', descripcion: '', red_social: 'Instagram', tipo_contenido: 'Post',
    estado: 'En planeación', copy_arte: '', indicaciones_arte: '', link_referencia: '', color: '#3B82F6',
    fecha: defaultDate || new Date().toISOString().split('T')[0],
    cuenta_id: 'none' as string,
    campana: '', objetivo_post: 'Engagement', pilar_contenido: 'Comunidad',
    etapa_funnel: 'Descubrimiento', hook: '', cta_texto: '', tipo_pauta: 'Orgánico',
    copy_caption: '', referencia_visual: '', hashtags: '', duracion: '',
    presupuesto: '', segmentacion: '',
    arte_final_url: '',
  });

  useEffect(() => {
    if (editData) {
      const p = editData as any;
      setForm({
        titulo: p.titulo, descripcion: p.descripcion || '',
        red_social: p.red_social, tipo_contenido: p.tipo_contenido,
        estado: p.estado, copy_arte: p.copy_arte || '',
        indicaciones_arte: p.indicaciones_arte || '',
        link_referencia: p.link_referencia || '', color: p.color || '#3B82F6',
        fecha: p.fecha, cuenta_id: p.cuenta_id || 'none',
        campana: p.campana || '', objetivo_post: p.objetivo_post || 'Engagement',
        pilar_contenido: p.pilar_contenido || 'Comunidad',
        etapa_funnel: p.etapa_funnel || 'Descubrimiento',
        hook: p.hook || '', cta_texto: p.cta_texto || '',
        tipo_pauta: p.tipo_pauta || 'Orgánico',
        copy_caption: p.copy_caption || '', referencia_visual: p.referencia_visual || '',
        hashtags: p.hashtags || '', duracion: p.duracion || '',
        presupuesto: p.presupuesto != null ? String(p.presupuesto) : '',
        segmentacion: p.segmentacion || '',
        arte_final_url: p.arte_final_url || '',
      });
    } else {
      setForm(f => ({
        ...f, titulo: '', descripcion: '', copy_arte: '', indicaciones_arte: '',
        link_referencia: '', campana: '', hook: '', cta_texto: '',
        copy_caption: '', referencia_visual: '', hashtags: '', duracion: '',
        presupuesto: '', segmentacion: '', arte_final_url: '',
        fecha: defaultDate || new Date().toISOString().split('T')[0], cuenta_id: 'none',
      }));
    }
  }, [editData, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload: any = {
        ...form,
        cuenta_id: form.cuenta_id === 'none' ? null : form.cuenta_id,
        presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
        referencia_visual: form.referencia_visual || null,
        arte_final_url: form.arte_final_url || null,
      };
      if (editData) {
        await update.mutateAsync({ id: editData.id, ...payload });
        toast.success('Publicación actualizada');
      } else {
        await create.mutateAsync({ ...payload, user_id: user.id });
        toast.success('Publicación creada');
      }
      onClose();
    } catch { toast.error('Error al guardar'); }
  };

  const isPending = create.isPending || update.isPending;
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar publicación' : 'Nueva publicación'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── PLANIFICACIÓN ── */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">📋 Planificación</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cuenta / Cliente</Label>
                  <Select value={form.cuenta_id} onValueChange={v => set('cuenta_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta</SelectItem>
                      {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input value={form.titulo} onChange={e => set('titulo', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Campaña</Label>
                  <Input value={form.campana} onChange={e => set('campana', e.target.value)} placeholder="Nombre de la campaña…" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Objetivo del post</Label>
                  <Select value={form.objetivo_post} onValueChange={v => set('objetivo_post', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OBJETIVOS_POST.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pilar de contenido</Label>
                  <Select value={form.pilar_contenido} onValueChange={v => set('pilar_contenido', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PILARES_CONTENIDO.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa del funnel</Label>
                  <Select value={form.etapa_funnel} onValueChange={v => set('etapa_funnel', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS_FUNNEL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Formato</Label>
                  <Select value={form.tipo_contenido} onValueChange={v => set('tipo_contenido', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS_CONTENIDO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Canal</Label>
                  <Select value={form.red_social} onValueChange={v => set('red_social', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REDES_SOCIALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo (pauta)</Label>
                  <Select value={form.tipo_pauta} onValueChange={v => set('tipo_pauta', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS_PAUTA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hook</Label>
                  <Input value={form.hook} onChange={e => set('hook', e.target.value)} placeholder="Idea central de atracción…" />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA</Label>
                  <Input value={form.cta_texto} onChange={e => set('cta_texto', e.target.value)} placeholder="Acción que debe realizar el usuario…" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => set('estado', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── EJECUCIÓN ── */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">🎨 Ejecución</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Descripción / Copy</Label>
                <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Copy Arte</Label>
                  <Textarea value={form.copy_arte} onChange={e => set('copy_arte', e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Copy Caption</Label>
                  <Textarea value={form.copy_caption} onChange={e => set('copy_caption', e.target.value)} rows={2} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Indicaciones para el Arte</Label>
                <Textarea value={form.indicaciones_arte} onChange={e => set('indicaciones_arte', e.target.value)} rows={2} placeholder="Instrucciones para el diseñador…" />
              </div>

              {/* Imagen de referencia visual — UPLOAD */}
              <div className="space-y-1.5">
                <Label>Imagen de referencia visual</Label>
                <p className="text-xs text-muted-foreground">Sube una imagen de referencia para el diseñador</p>
                <ImageUpload
                  value={form.referencia_visual}
                  onChange={url => set('referencia_visual', url || '')}
                  label="referencia visual"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Link de referencia</Label>
                <Input value={form.link_referencia} onChange={e => set('link_referencia', e.target.value)} placeholder="https://…" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Hashtags</Label>
                  <Input value={form.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="#hashtag1 #hashtag2…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración</Label>
                  <Input value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="30s, 1min…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Presupuesto</Label>
                  <Input type="number" value={form.presupuesto} onChange={e => set('presupuesto', e.target.value)} placeholder="$0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Segmentación</Label>
                <Input value={form.segmentacion} onChange={e => set('segmentacion', e.target.value)} placeholder="Descripción de la segmentación…" />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── ARTE FINAL ── */}
          <div className="rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Arte Final Aprobado</p>
                <p className="text-xs text-muted-foreground">Sube el diseño final cuando esté listo y aprobado</p>
              </div>
            </div>
            <ImageUpload
              value={form.arte_final_url}
              onChange={url => set('arte_final_url', url || '')}
              label="arte final"
            />
          </div>

          <Separator />

          {/* ── COLOR ── */}
          <div className="space-y-1.5">
            <Label>Color de identificación</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORES_PREDEFINIDOS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <Input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="h-8 w-8 p-0 border-0 cursor-pointer" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editData ? 'Guardar cambios' : 'Crear publicación')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
