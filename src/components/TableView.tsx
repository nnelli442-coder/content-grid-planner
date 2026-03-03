import { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Copy, Plus, Check, X, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays } from 'lucide-react';
import { REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useDeletePublicacion, useDuplicatePublicacion, useUpdatePublicacion, useCreatePublicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { useCuentas } from '@/hooks/useCuentas';
import { toast } from 'sonner';

interface Props {
  publicaciones: Publicacion[];
  onEdit: (pub: Publicacion) => void;
  filterDate?: string | null;
  onClearFilterDate?: () => void;
  onDateClick?: (date: string) => void;
}

const estadoVariant = (e: string) => {
  if (e === 'Publicado') return 'default';
  if (e === 'Aprobado') return 'secondary';
  if (e === 'Rechazado') return 'destructive';
  return 'outline';
};

type SortDir = 'asc' | 'desc' | null;
type SortConfig = { field: string; dir: SortDir };
type EditingCell = { id: string; field: string } | null;

interface NewRow {
  fecha: string;
  red_social: string;
  tipo_contenido: string;
  titulo: string;
  descripcion: string;
  copy_arte: string;
  indicaciones_arte: string;
  link_referencia: string;
  estado: string;
  color: string;
  cuenta_id: string;
}

const emptyRow = (): NewRow => ({
  fecha: new Date().toISOString().split('T')[0],
  red_social: 'Instagram',
  tipo_contenido: 'Post',
  titulo: '',
  descripcion: '',
  copy_arte: '',
  indicaciones_arte: '',
  link_referencia: '',
  estado: 'Borrador',
  color: '#3B82F6',
  cuenta_id: 'none',
});

const SORTABLE_FIELDS: { key: string; label: string }[] = [
  { key: 'cuenta_id', label: 'Cuenta' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'red_social', label: 'Red Social' },
  { key: 'tipo_contenido', label: 'Tipo' },
  { key: 'titulo', label: 'Título' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'copy_arte', label: 'Copy Arte' },
  { key: 'indicaciones_arte', label: 'Indicaciones Arte' },
  { key: 'link_referencia', label: 'Link Ref.' },
  { key: 'estado', label: 'Estado' },
];

export default function TableView({ publicaciones, onEdit, filterDate, onClearFilterDate, onDateClick }: Props) {
  const { user } = useAuth();
  const { data: cuentas = [] } = useCuentas();
  const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));
  const [filterRed, setFilterRed] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const deleteMut = useDeletePublicacion();
  const dupMut = useDuplicatePublicacion();
  const updateMut = useUpdatePublicacion();
  const createMut = useCreatePublicacion();

  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorting
  const [sort, setSort] = useState<SortConfig>({ field: 'fecha', dir: 'asc' });

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = publicaciones.filter(p => {
      if (filterRed !== 'all' && p.red_social !== filterRed) return false;
      if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
      if (filterTipo !== 'all' && p.tipo_contenido !== filterTipo) return false;
      if (filterDate && p.fecha !== filterDate) return false;
      return true;
    });

    if (sort.dir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sort.field] || '';
        const bVal = (b as any)[sort.field] || '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [publicaciones, filterRed, filterEstado, filterTipo, filterDate, sort]);

  // Clear selection when data changes
  useEffect(() => { setSelectedIds(new Set()); }, [publicaciones]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const toggleSort = (field: string) => {
    setSort(prev => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      if (prev.dir === 'desc') return { field: 'fecha', dir: null };
      return { field, dir: 'asc' };
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field || !sort.dir) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  // Selection helpers
  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const someSelected = filtered.some(p => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} publicaciones?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => deleteMut.mutateAsync(id)));
      toast.success(`${selectedIds.size} publicaciones eliminadas`);
      setSelectedIds(new Set());
    } catch { toast.error('Error al eliminar'); }
  };

  const bulkChangeStatus = async (status: string) => {
    try {
      await Promise.all([...selectedIds].map(id => updateMut.mutateAsync({ id, estado: status })));
      toast.success(`${selectedIds.size} publicaciones actualizadas a "${status}"`);
      setSelectedIds(new Set());
    } catch { toast.error('Error al actualizar'); }
  };

  const startEdit = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      await updateMut.mutateAsync({ id: editingCell.id, [editingCell.field]: editValue });
      toast.success('Actualizado');
    } catch { toast.error('Error al actualizar'); }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try { await deleteMut.mutateAsync(id); toast.success('Eliminada'); } catch { toast.error('Error'); }
  };

  const addNewRow = () => { setNewRows(prev => [...prev, emptyRow()]); };
  const updateNewRow = (index: number, field: keyof NewRow, value: string) => {
    setNewRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };
  const saveNewRow = async (index: number) => {
    const row = newRows[index];
    if (!row.titulo.trim()) { toast.error('El título es obligatorio'); return; }
    if (!user) return;
    try {
      await createMut.mutateAsync({ ...row, cuenta_id: row.cuenta_id === 'none' ? null : row.cuenta_id, user_id: user.id });
      setNewRows(prev => prev.filter((_, i) => i !== index));
      toast.success('Publicación creada');
    } catch { toast.error('Error al crear'); }
  };
  const removeNewRow = (index: number) => { setNewRows(prev => prev.filter((_, i) => i !== index)); };

  const renderEditableCell = (pub: Publicacion, field: string, value: string, className?: string) => {
    const isEditing = editingCell?.id === pub.id && editingCell?.field === field;

    if (isEditing) {
      if (field === 'red_social' || field === 'tipo_contenido' || field === 'estado') {
        const options = field === 'red_social' ? REDES_SOCIALES : field === 'tipo_contenido' ? TIPOS_CONTENIDO : ESTADOS;
        return (
          <Select value={editValue} onValueChange={async (v) => {
            try { await updateMut.mutateAsync({ id: pub.id, [field]: v }); toast.success('Actualizado'); } catch { toast.error('Error'); }
            setEditingCell(null);
          }}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      }
      if (field === 'cuenta_id') {
        return (
          <Select value={editValue || 'none'} onValueChange={async (v) => {
            try { await updateMut.mutateAsync({ id: pub.id, cuenta_id: v === 'none' ? null : v }); toast.success('Actualizado'); } catch { toast.error('Error'); }
            setEditingCell(null);
          }}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cuenta</SelectItem>
              {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={saveEdit} type={field === 'fecha' ? 'date' : 'text'} className="h-8 text-xs w-full" />
      );
    }

    // Date field: clickable to navigate to calendar
    if (field === 'fecha' && onDateClick) {
      return (
        <div className={`cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center gap-1 ${className || ''}`} title="Click para ver en calendario / doble click para editar"
          onClick={() => onDateClick(value)}
          onDoubleClick={(e) => { e.stopPropagation(); startEdit(pub.id, field, value || ''); }}>
          <CalendarDays className="h-3 w-3 text-primary shrink-0" />
          <span className="text-sm truncate">{value}</span>
        </div>
      );
    }

    // Cuenta field: show name
    if (field === 'cuenta_id') {
      const nombre = value ? cuentasMap[value] || 'Desconocida' : '';
      return (
        <div className={`cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center ${className || ''}`} onClick={() => startEdit(pub.id, field, value || '')} title="Click para editar">
          <span className="text-sm truncate">{nombre || <span className="text-muted-foreground italic">sin cuenta</span>}</span>
        </div>
      );
    }

    return (
      <div className={`cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center ${className || ''}`} onClick={() => startEdit(pub.id, field, value || '')} title="Click para editar">
        {field === 'estado' ? (
          <Badge variant={estadoVariant(value)} className="cursor-pointer">{value}</Badge>
        ) : (
          <span className="text-sm truncate">{value || <span className="text-muted-foreground italic">vacío</span>}</span>
        )}
      </div>
    );
  };

  const renderNewRowSelect = (index: number, field: keyof NewRow, options: readonly string[]) => (
    <Select value={newRows[index][field]} onValueChange={v => updateNewRow(index, field, v)}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      {/* Filters + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterRed} onValueChange={setFilterRed}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Red social" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las redes</SelectItem>
            {REDES_SOCIALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TIPOS_CONTENIDO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {filterDate && (
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={onClearFilterDate}>
            <CalendarDays className="h-3 w-3" /> {filterDate} <X className="h-3 w-3" />
          </Badge>
        )}

        <Button onClick={addNewRow} size="sm" variant="outline" className="gap-1.5 ml-auto">
          <Plus className="h-4 w-4" /> Agregar fila
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-primary/20">
          <span className="text-sm font-medium">{selectedIds.size} seleccionadas</span>
          <Select onValueChange={bulkChangeStatus}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Cambiar estado..." /></SelectTrigger>
            <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={bulkDelete} className="gap-1.5">
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Deseleccionar</Button>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Seleccionar todo" />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              {SORTABLE_FIELDS.map(sf => (
                <TableHead key={sf.key} className="min-w-[100px] cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort(sf.key)}>
                  <div className="flex items-center gap-1">
                    {sf.label} <SortIcon field={sf.key} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRows.map((row, idx) => (
              <TableRow key={`new-${idx}`} className="bg-primary/5 border-primary/20">
                <TableCell></TableCell>
                <TableCell>
                  <input type="color" value={row.color} onChange={e => updateNewRow(idx, 'color', e.target.value)} className="h-6 w-6 rounded-full cursor-pointer border-0 p-0" />
                </TableCell>
                <TableCell>
                  <Select value={newRows[idx].cuenta_id} onValueChange={v => updateNewRow(idx, 'cuenta_id', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Cuenta..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta</SelectItem>
                      {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="date" value={row.fecha} onChange={e => updateNewRow(idx, 'fecha', e.target.value)} className="h-8 text-xs" /></TableCell>
                <TableCell>{renderNewRowSelect(idx, 'red_social', REDES_SOCIALES)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'tipo_contenido', TIPOS_CONTENIDO)}</TableCell>
                <TableCell><Input value={row.titulo} onChange={e => updateNewRow(idx, 'titulo', e.target.value)} placeholder="Título..." className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.descripcion} onChange={e => updateNewRow(idx, 'descripcion', e.target.value)} placeholder="Descripción..." className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.copy_arte} onChange={e => updateNewRow(idx, 'copy_arte', e.target.value)} placeholder="Copy arte..." className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.indicaciones_arte} onChange={e => updateNewRow(idx, 'indicaciones_arte', e.target.value)} placeholder="Indicaciones..." className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.link_referencia} onChange={e => updateNewRow(idx, 'link_referencia', e.target.value)} placeholder="https://..." className="h-8 text-xs" /></TableCell>
                <TableCell>{renderNewRowSelect(idx, 'estado', ESTADOS)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => saveNewRow(idx)} className="h-8 w-8 text-primary"><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeNewRow(idx)} className="h-8 w-8"><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && newRows.length === 0 ? (
              <TableRow><TableCell colSpan={13} className="text-center py-8 text-muted-foreground">No hay publicaciones. Haz click en "Agregar fila" para comenzar.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className={`hover:bg-accent/20 ${selectedIds.has(p.id) ? 'bg-accent/30' : ''}`}>
                <TableCell>
                  <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} aria-label="Seleccionar" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-5 rounded-full cursor-pointer border border-border" style={{ backgroundColor: p.color || '#3B82F6' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color'; input.value = p.color || '#3B82F6';
                      input.addEventListener('change', async (e) => { try { await updateMut.mutateAsync({ id: p.id, color: (e.target as HTMLInputElement).value }); } catch {} });
                      input.click();
                    }} />
                </TableCell>
                <TableCell>{renderEditableCell(p, 'cuenta_id', (p as any).cuenta_id || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'fecha', p.fecha)}</TableCell>
                <TableCell>{renderEditableCell(p, 'red_social', p.red_social)}</TableCell>
                <TableCell>{renderEditableCell(p, 'tipo_contenido', p.tipo_contenido)}</TableCell>
                <TableCell>{renderEditableCell(p, 'titulo', p.titulo, 'font-medium')}</TableCell>
                <TableCell>{renderEditableCell(p, 'descripcion', p.descripcion || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'copy_arte', p.copy_arte || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'indicaciones_arte', (p as any).indicaciones_arte || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'link_referencia', p.link_referencia || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'estado', p.estado)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { try { await dupMut.mutateAsync(p); toast.success('Duplicada'); } catch { toast.error('Error'); } }} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
