import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePublicacion, useUpdatePublicacion, REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useCuentas } from '@/hooks/useCuentas';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
    estado: 'Borrador', copy_arte: '', indicaciones_arte: '', link_referencia: '', color: '#3B82F6',
    fecha: defaultDate || new Date().toISOString().split('T')[0],
    cuenta_id: 'none' as string,
  });

  useEffect(() => {
    if (editData) {
      setForm({
        titulo: editData.titulo, descripcion: editData.descripcion || '',
        red_social: editData.red_social, tipo_contenido: editData.tipo_contenido,
        estado: editData.estado, copy_arte: editData.copy_arte || '',
        indicaciones_arte: (editData as any).indicaciones_arte || '',
        link_referencia: editData.link_referencia || '', color: editData.color || '#3B82F6',
        fecha: editData.fecha,
        cuenta_id: (editData as any).cuenta_id || 'none',
      });
    } else {
      setForm(f => ({ ...f, fecha: defaultDate || new Date().toISOString().split('T')[0], cuenta_id: 'none' }));
    }
  }, [editData, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { ...form, cuenta_id: form.cuenta_id === 'none' ? null : form.cuenta_id };
      if (editData) {
        await update.mutateAsync({ id: editData.id, ...payload });
        toast.success('Publicación actualizada');
      } else {
        await create.mutateAsync({ ...payload, user_id: user.id });
        toast.success('Publicación creada');
      }
      onClose();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar publicación' : 'Nueva publicación'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cuenta */}
          <div className="space-y-2">
            <Label>Cuenta / Cliente</Label>
            <Select value={form.cuenta_id} onValueChange={v => setForm(f => ({ ...f, cuenta_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cuenta..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cuenta</SelectItem>
                {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Descripción / Copy</Label>
            <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Red Social</Label>
              <Select value={form.red_social} onValueChange={v => setForm(f => ({ ...f, red_social: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REDES_SOCIALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de contenido</Label>
              <Select value={form.tipo_contenido} onValueChange={v => setForm(f => ({ ...f, tipo_contenido: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_CONTENIDO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Copy del arte</Label>
            <Textarea value={form.copy_arte} onChange={e => setForm(f => ({ ...f, copy_arte: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Indicaciones para el Arte</Label>
            <Textarea value={form.indicaciones_arte} onChange={e => setForm(f => ({ ...f, indicaciones_arte: e.target.value }))} rows={2} placeholder="Instrucciones para el diseñador..." />
          </div>
          <div className="space-y-2">
            <Label>Link de referencia</Label>
            <Input value={form.link_referencia} onChange={e => setForm(f => ({ ...f, link_referencia: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORES_PREDEFINIDOS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-8 w-8 p-0 border-0 cursor-pointer" />
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
