import { useState, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useUpdatePublicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PublicacionDetailDrawer from '@/components/PublicacionDetailDrawer';
import ImageUpload, { isImageUrl } from '@/components/ImageUpload';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  publicaciones: Publicacion[];
}

type EditingCell = { id: string; field: string } | null;

const TEXT_FIELDS = [
  { key: 'titulo',            label: 'Título',              width: 'min-w-[160px]' },
  { key: 'fecha',             label: 'Fecha',               width: 'min-w-[90px]'  },
  { key: 'copy_arte',         label: 'Copy Arte',           width: 'min-w-[200px]' },
  { key: 'copy_caption',      label: 'Copy Caption',        width: 'min-w-[200px]' },
  { key: 'descripcion',       label: 'Descripción',         width: 'min-w-[180px]' },
  { key: 'indicaciones_arte', label: 'Indicaciones Arte',   width: 'min-w-[180px]' },
  { key: 'hashtags',          label: 'Hashtags',            width: 'min-w-[150px]' },
  { key: 'duracion',          label: 'Duración',            width: 'min-w-[90px]'  },
  { key: 'presupuesto',       label: 'Presupuesto',         width: 'min-w-[100px]' },
  { key: 'segmentacion',      label: 'Segmentación',        width: 'min-w-[180px]' },
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
    if (editingCell && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
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

  const handleImageUpdate = async (id: string, field: string, url: string | null) => {
    try {
      await updateMut.mutateAsync({ id, [field]: url });
      toast.success('Imagen actualizada');
    } catch { toast.error('Error al actualizar'); }
  };

  if (publicaciones.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No hay publicaciones en este período. Crea publicaciones desde el Calendario o la Tabla.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Nivel operativo: copys, referencias visuales, hashtags, presupuesto y segmentación.
        {isAdmin ? ' Doble click para editar texto, click para ver detalles.' : ' Click en cualquier celda para ver detalles.'}
      </p>

      <div className="rounded-xl border shadow-sm overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b-2">
              {TEXT_FIELDS.map(f => (
                <TableHead key={f.key} className={`${f.width} text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-3`}>
                  {f.label}
                </TableHead>
              ))}
              {/* Image columns */}
              <TableHead className="min-w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-3">
                Ref. Visual
              </TableHead>
              <TableHead className="min-w-[160px] text-[11px] font-semibold uppercase tracking-wide py-3">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Arte Final
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {publicaciones.map((p, rowIdx) => (
              <TableRow
                key={p.id}
                className={rowIdx % 2 === 0 ? 'hover:bg-accent/20' : 'bg-muted/10 hover:bg-accent/20'}
                style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: p.color || '#3B82F6' }}
              >
                {TEXT_FIELDS.map(f => {
                  const val = String((p as any)[f.key] ?? '');
                  const isEditing = editingCell?.id === p.id && editingCell?.field === f.key;

                  if (f.key === 'titulo') {
                    return (
                      <TableCell key={f.key} className="py-3 px-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => { setDrawerPub(p); setDrawerField('titulo'); }}
                        >
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
                          <span className="text-sm font-medium truncate max-w-[140px]">{p.titulo}</span>
                        </div>
                      </TableCell>
                    );
                  }

                  if (f.key === 'fecha') {
                    return (
                      <TableCell key={f.key} className="py-3 px-2">
                        <span className="text-xs text-muted-foreground">{p.fecha}</span>
                      </TableCell>
                    );
                  }

                  if (isEditing) {
                    return (
                      <TableCell key={f.key} className="py-1 px-1">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={saveEdit}
                          type={f.key === 'presupuesto' ? 'number' : 'text'}
                          className="h-8 text-xs w-full"
                        />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={f.key} className="py-2.5 px-2">
                      <div
                        className="cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5 min-h-[28px] flex items-center"
                        onClick={() => { setDrawerPub(p); setDrawerField(f.key); }}
                        onDoubleClick={() => { if (isAdmin) { setEditingCell({ id: p.id, field: f.key }); setEditValue(val); } }}
                        title={isAdmin ? 'Click: ver · Doble click: editar' : 'Click para ver detalles'}
                      >
                        <span className="text-xs truncate max-w-[180px]">
                          {val || <span className="text-muted-foreground/40 italic">—</span>}
                        </span>
                      </div>
                    </TableCell>
                  );
                })}

                {/* ── Referencia Visual — image upload ── */}
                <TableCell className="py-2 px-2">
                  <ImageUpload
                    compact
                    value={(p as any).referencia_visual}
                    onChange={url => handleImageUpdate(p.id, 'referencia_visual', url)}
                    label="referencia visual"
                    disabled={!isAdmin}
                  />
                </TableCell>

                {/* ── Arte Final — image upload ── */}
                <TableCell className="py-2 px-2">
                  <div className={`rounded-lg transition-colors ${(p as any).arte_final_url ? 'bg-emerald-500/5' : ''}`}>
                    <ImageUpload
                      compact
                      value={(p as any).arte_final_url}
                      onChange={url => handleImageUpdate(p.id, 'arte_final_url', url)}
                      label="arte final"
                      disabled={!isAdmin}
                    />
                  </div>
                </TableCell>
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
        visibleSections={['Ejecución', 'Arte Final']}
      />
    </div>
  );
}
