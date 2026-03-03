import { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useUpdatePublicacion } from '@/hooks/usePublicaciones';
import { toast } from 'sonner';
import { TrendingUp, Eye, MousePointer, Heart } from 'lucide-react';

interface Props {
  publicaciones: Publicacion[];
}

type EditingCell = { id: string; field: string } | null;

const METRIC_FIELDS = [
  { key: 'titulo', label: 'Post', width: 'min-w-[150px]', type: 'text' },
  { key: 'fecha', label: 'Fecha', width: 'min-w-[90px]', type: 'text' },
  { key: 'alcance', label: 'Alcance', width: 'min-w-[90px]', type: 'number' },
  { key: 'impresiones', label: 'Impresiones', width: 'min-w-[100px]', type: 'number' },
  { key: 'engagement', label: 'Engagement', width: 'min-w-[100px]', type: 'number' },
  { key: 'er_porcentaje', label: 'ER %', width: 'min-w-[80px]', type: 'number' },
  { key: 'guardados', label: 'Guardados', width: 'min-w-[90px]', type: 'number' },
  { key: 'compartidos', label: 'Compartidos', width: 'min-w-[100px]', type: 'number' },
  { key: 'clics', label: 'Clics', width: 'min-w-[80px]', type: 'number' },
  { key: 'seguidores_nuevos', label: 'Seg. nuevos', width: 'min-w-[100px]', type: 'number' },
  { key: 'costo', label: 'Costo', width: 'min-w-[90px]', type: 'number' },
  { key: 'costo_por_resultado', label: 'CPR', width: 'min-w-[90px]', type: 'number' },
];

export default function MedicionView({ publicaciones }: Props) {
  const updateMut = useUpdatePublicacion();
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const totals = useMemo(() => {
    const sum = (key: string) => publicaciones.reduce((acc, p) => acc + (Number((p as any)[key]) || 0), 0);
    const totalAlcance = sum('alcance');
    const totalImpresiones = sum('impresiones');
    const totalEngagement = sum('engagement');
    const totalClics = sum('clics');
    const totalCosto = sum('costo');
    const avgER = publicaciones.length > 0
      ? publicaciones.reduce((acc, p) => acc + (Number((p as any).er_porcentaje) || 0), 0) / publicaciones.filter(p => (p as any).er_porcentaje).length || 0
      : 0;
    return { totalAlcance, totalImpresiones, totalEngagement, totalClics, totalCosto, avgER };
  }, [publicaciones]);

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      const val = editValue ? Number(editValue) : null;
      await updateMut.mutateAsync({ id: editingCell.id, [editingCell.field]: val });
      toast.success('Actualizado');
    } catch { toast.error('Error'); }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  };

  if (publicaciones.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">No hay publicaciones para medir en este período.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Eye className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Alcance</span></div>
          <p className="text-lg font-bold">{totals.totalAlcance.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Impresiones</span></div>
          <p className="text-lg font-bold">{totals.totalImpresiones.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Heart className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Engagement</span></div>
          <p className="text-lg font-bold">{totals.totalEngagement.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><MousePointer className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Clics</span></div>
          <p className="text-lg font-bold">{totals.totalClics.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-muted-foreground">ER % promedio</span></div>
          <p className="text-lg font-bold">{totals.avgER.toFixed(2)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-muted-foreground">Costo total</span></div>
          <p className="text-lg font-bold">${totals.totalCosto.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground">Ingresa los resultados post-publicación. Click en cualquier celda numérica para editar.</p>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {METRIC_FIELDS.map(f => (
                <TableHead key={f.key} className={f.width}>{f.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {publicaciones.map(p => (
              <TableRow key={p.id} className="hover:bg-accent/20">
                {METRIC_FIELDS.map(f => {
                  const val = (p as any)[f.key];
                  const displayVal = val != null ? String(val) : '';
                  const isEditing = editingCell?.id === p.id && editingCell?.field === f.key;

                  if (f.key === 'titulo') {
                    return (
                      <TableCell key={f.key}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
                          <span className="text-sm font-medium truncate">{p.titulo}</span>
                        </div>
                      </TableCell>
                    );
                  }

                  if (f.key === 'fecha') {
                    return <TableCell key={f.key}><span className="text-sm">{p.fecha}</span></TableCell>;
                  }

                  if (isEditing) {
                    return (
                      <TableCell key={f.key}>
                        <Input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown} onBlur={saveEdit} type="number" step={f.key === 'er_porcentaje' ? '0.01' : '1'}
                          className="h-8 text-xs w-full" />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={f.key}>
                      <div className="cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center"
                        onClick={() => { setEditingCell({ id: p.id, field: f.key }); setEditValue(displayVal); }}
                        title="Click para editar">
                        <span className="text-sm">{displayVal || <span className="text-muted-foreground italic">—</span>}</span>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
