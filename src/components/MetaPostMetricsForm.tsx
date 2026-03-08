import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUpdatePublicacion } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { Save, Loader2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface MetaPostMetricsFormProps {
  publicaciones: Publicacion[];
}

const METRIC_FIELDS = [
  { key: 'alcance', label: 'Alcance' },
  { key: 'impresiones', label: 'Impresiones' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'er_porcentaje', label: 'ER%' },
  { key: 'clics', label: 'Clics' },
  { key: 'guardados', label: 'Guardados' },
  { key: 'compartidos', label: 'Compartidos' },
  { key: 'seguidores_nuevos', label: 'Seg. nuevos' },
  { key: 'costo', label: 'Costo' },
  { key: 'costo_por_resultado', label: 'Costo/Res.' },
] as const;

export default function MetaPostMetricsForm({ publicaciones }: MetaPostMetricsFormProps) {
  const updatePub = useUpdatePublicacion();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number | null>>({});

  const startEdit = (pub: Publicacion) => {
    setEditingId(pub.id);
    const vals: Record<string, number | null> = {};
    METRIC_FIELDS.forEach(f => { vals[f.key] = (pub as any)[f.key] ?? null; });
    setEditValues(vals);
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updatePub.mutateAsync({ id: editingId, ...editValues } as any);
      toast.success('Métricas actualizadas');
      setEditingId(null);
    } catch {
      toast.error('Error al guardar');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Métricas por publicación (editar)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[100px]">Fecha</TableHead>
                <TableHead className="text-xs">Título</TableHead>
                <TableHead className="text-xs">Red</TableHead>
                {METRIC_FIELDS.map(f => (
                  <TableHead key={f.key} className="text-xs text-right whitespace-nowrap">{f.label}</TableHead>
                ))}
                <TableHead className="text-xs w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={METRIC_FIELDS.length + 4} className="text-center py-8 text-sm text-muted-foreground">
                    No hay publicaciones Meta este mes
                  </TableCell>
                </TableRow>
              ) : publicaciones.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs whitespace-nowrap">{p.fecha}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{p.titulo}</TableCell>
                  <TableCell className="text-xs">{p.red_social}</TableCell>
                  {METRIC_FIELDS.map(f => (
                    <TableCell key={f.key} className="text-xs text-right p-1">
                      {editingId === p.id ? (
                        <Input
                          type="number"
                          step={f.key === 'er_porcentaje' || f.key === 'costo' || f.key === 'costo_por_resultado' ? '0.01' : '1'}
                          value={editValues[f.key] ?? ''}
                          onChange={e => setEditValues(v => ({ ...v, [f.key]: e.target.value ? Number(e.target.value) : null }))}
                          className="h-7 w-20 text-xs text-right"
                        />
                      ) : (
                        <span>{(p as any)[f.key] != null ? (f.key === 'er_porcentaje' ? `${Number((p as any)[f.key]).toFixed(2)}%` : f.key === 'costo' || f.key === 'costo_por_resultado' ? `$${Number((p as any)[f.key]).toLocaleString()}` : Number((p as any)[f.key]).toLocaleString()) : '-'}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="p-1">
                    {editingId === p.id ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit} disabled={updatePub.isPending}>
                          {updatePub.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-500" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(p)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
