import { useState, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useUpdatePublicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PublicacionDetailDrawer from '@/components/PublicacionDetailDrawer';

interface Props {
  publicaciones: Publicacion[];
}

type EditingCell = { id: string; field: string } | null;

const FIELDS = [
  { key: 'titulo', label: 'Post / Título', width: 'min-w-[150px]' },
  { key: 'fecha', label: 'Fecha', width: 'min-w-[100px]' },
  { key: 'copy_arte', label: 'Copy Arte', width: 'min-w-[180px]' },
  { key: 'copy_caption', label: 'Copy Caption', width: 'min-w-[180px]' },
  { key: 'descripcion', label: 'Descripción', width: 'min-w-[180px]' },
  { key: 'indicaciones_arte', label: 'Indicaciones Arte', width: 'min-w-[180px]' },
  { key: 'referencia_visual', label: 'Referencia Visual', width: 'min-w-[150px]' },
  { key: 'hashtags', label: 'Hashtags', width: 'min-w-[150px]' },
  { key: 'duracion', label: 'Duración', width: 'min-w-[100px]' },
  { key: 'presupuesto', label: 'Presupuesto', width: 'min-w-[100px]' },
  { key: 'segmentacion', label: 'Segmentación', width: 'min-w-[180px]' },
  { key: 'link_referencia', label: 'Link Ref.', width: 'min-w-[150px]' },
];

export default function EjecucionView({ publicaciones }: Props) {
  const { isAdmin } = useAuth();
  const updateMut = useUpdatePublicacion();
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [drawerPub, setDrawerPub] = useState<Publicacion | null>(null);
  const [drawerField, setDrawerField] = useState<string | null>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      const val = editingCell.field === 'presupuesto' ? (editValue ? Number(editValue) : null) : editValue;
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
    return <div className="text-center py-16 text-muted-foreground">No hay publicaciones en este período. Crea publicaciones desde el Calendario o la Tabla.</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Nivel operativo: copys, referencias visuales, hashtags, presupuesto y segmentación.
        {isAdmin ? ' Doble click para editar, click para ver detalles.' : ' Click en cualquier celda para ver detalles.'}
      </p>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {FIELDS.map(f => (
                <TableHead key={f.key} className={f.width}>{f.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {publicaciones.map(p => (
              <TableRow key={p.id} className="hover:bg-accent/20">
                {FIELDS.map(f => {
                  const val = String((p as any)[f.key] ?? '');
                  const isEditing = editingCell?.id === p.id && editingCell?.field === f.key;

                  if (f.key === 'titulo') {
                    return (
                      <TableCell key={f.key}>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setDrawerPub(p); setDrawerField('titulo'); }}>
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
                          onKeyDown={handleKeyDown} onBlur={saveEdit}
                          type={f.key === 'presupuesto' ? 'number' : 'text'}
                          className="h-8 text-xs w-full" />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={f.key}>
                      <div
                        className="cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center"
                        onClick={() => { setDrawerPub(p); setDrawerField(f.key); }}
                        onDoubleClick={() => { if (isAdmin) { setEditingCell({ id: p.id, field: f.key }); setEditValue(val); } }}
                        title={isAdmin ? 'Click para ver, doble click para editar' : 'Click para ver detalles'}
                      >
                        <span className="text-sm truncate max-w-[200px]">
                          {val || <span className="text-muted-foreground italic">vacío</span>}
                        </span>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PublicacionDetailDrawer
        open={!!drawerPub}
        onClose={() => { setDrawerPub(null); setDrawerField(null); }}
        publicacion={drawerPub}
        highlightField={drawerField}
      />
    </div>
  );
}
