import { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Copy, Plus, Check, X, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays } from 'lucide-react';
import { REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, OBJETIVOS_POST, PILARES_CONTENIDO, ETAPAS_FUNNEL, TIPOS_PAUTA, COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';
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
  if (e === 'Programado') return 'secondary';
  if (e === 'En revisión') return 'outline';
  if (e === 'En diseño') return 'outline';
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
  campana: string;
  objetivo_post: string;
  pilar_contenido: string;
  etapa_funnel: string;
  hook: string;
  cta_texto: string;
  tipo_pauta: string;
  estado: string;
  color: string;
  cuenta_id: string;
}

const emptyRow = (): NewRow => ({
  fecha: new Date().toISOString().split('T')[0],
  red_social: 'Instagram',
  tipo_contenido: 'Post',
  titulo: '',
  campana: '',
  objetivo_post: 'Engagement',
  pilar_contenido: 'Comunidad',
  etapa_funnel: 'Descubrimiento',
  hook: '',
  cta_texto: '',
  tipo_pauta: 'Orgánico',
  estado: 'En planeación',
  color: '#3B82F6',
  cuenta_id: 'none',
});

const SORTABLE_FIELDS: { key: string; label: string }[] = [
  { key: 'cuenta_id', label: 'Cuenta' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'campana', label: 'Campaña' },
  { key: 'objetivo_post', label: 'Objetivo' },
  { key: 'pilar_contenido', label: 'Pilar' },
  { key: 'tipo_contenido', label: 'Formato' },
  { key: 'red_social', label: 'Canal' },
  { key: 'tipo_pauta', label: 'Tipo' },
  { key: 'etapa_funnel', label: 'Funnel' },
  { key: 'hook', label: 'Hook' },
  { key: 'cta_texto', label: 'CTA' },
  { key: 'estado', label: 'Estado' },
];

// Select-based fields and their options
const SELECT_FIELDS: Record<string, readonly string[]> = {
  red_social: REDES_SOCIALES,
  tipo_contenido: TIPOS_CONTENIDO,
  estado: ESTADOS,
  objetivo_post: OBJETIVOS_POST,
  pilar_contenido: PILARES_CONTENIDO,
  etapa_funnel: ETAPAS_FUNNEL,
  tipo_pauta: TIPOS_PAUTA,
};

export default function TableView({ publicaciones, onEdit, filterDate, onClearFilterDate, onDateClick }: Props) {
  const { user } = useAuth();
  const { data: cuentas = [] } = useCuentas();
  const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));
  const [filterRed, setFilterRed] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterFunnel, setFilterFunnel] = useState('all');
  const deleteMut = useDeletePublicacion();
  const dupMut = useDuplicatePublicacion();
  const updateMut = useUpdatePublicacion();
  const createMut = useCreatePublicacion();

  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');
  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<SortConfig>({ field: 'fecha', dir: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = publicaciones.filter(p => {
      if (filterRed !== 'all' && p.red_social !== filterRed) return false;
      if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
      if (filterFunnel !== 'all' && (p as any).etapa_funnel !== filterFunnel) return false;
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
  }, [publicaciones, filterRed, filterEstado, filterFunnel, filterDate, sort]);

  useEffect(() => { setSelectedIds(new Set()); }, [publicaciones]);
  useEffect(() => { if (editingCell && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editingCell]);

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

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const toggleAll = () => { allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(p => p.id))); };
  const toggleOne = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} publicaciones?`)) return;
    try { await Promise.all([...selectedIds].map(id => deleteMut.mutateAsync(id))); toast.success(`${selectedIds.size} eliminadas`); setSelectedIds(new Set()); } catch { toast.error('Error'); }
  };
  const bulkChangeStatus = async (status: string) => {
    try { await Promise.all([...selectedIds].map(id => updateMut.mutateAsync({ id, estado: status }))); toast.success(`${selectedIds.size} actualizadas`); setSelectedIds(new Set()); } catch { toast.error('Error'); }
  };

  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!editingCell) return;
    try { await updateMut.mutateAsync({ id: editingCell.id, [editingCell.field]: editValue || null }); toast.success('Actualizado'); } catch { toast.error('Error'); }
    cancelEdit();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); };
  const handleDelete = async (id: string) => { if (!confirm('¿Eliminar?')) return; try { await deleteMut.mutateAsync(id); toast.success('Eliminada'); } catch { toast.error('Error'); } };

  const addNewRow = () => setNewRows(prev => [...prev, emptyRow()]);
  const updateNewRow = (i: number, field: keyof NewRow, value: string) => setNewRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const saveNewRow = async (index: number) => {
    const row = newRows[index];
    if (!row.titulo.trim()) { toast.error('El título es obligatorio'); return; }
    if (!user) return;
    try {
      await createMut.mutateAsync({ ...row, cuenta_id: row.cuenta_id === 'none' ? null : row.cuenta_id, user_id: user.id } as any);
      setNewRows(prev => prev.filter((_, i) => i !== index));
      toast.success('Creada');
    } catch { toast.error('Error'); }
  };
  const removeNewRow = (index: number) => setNewRows(prev => prev.filter((_, i) => i !== index));

  const renderEditableCell = (pub: Publicacion, field: string, value: string, className?: string) => {
    const isEditing = editingCell?.id === pub.id && editingCell?.field === field;

    if (isEditing) {
      if (field in SELECT_FIELDS) {
        return (
          <Select value={editValue} onValueChange={async (v) => {
            try { await updateMut.mutateAsync({ id: pub.id, [field]: v }); toast.success('Actualizado'); } catch { toast.error('Error'); }
            cancelEdit();
          }}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{SELECT_FIELDS[field].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      }
      if (field === 'cuenta_id') {
        return (
          <Select value={editValue || 'none'} onValueChange={async (v) => {
            try { await updateMut.mutateAsync({ id: pub.id, cuenta_id: v === 'none' ? null : v }); toast.success('Actualizado'); } catch { toast.error('Error'); }
            cancelEdit();
          }}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
            <SelectContent><SelectItem value="none">Sin cuenta</SelectItem>{cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
          </Select>
        );
      }
      return <Input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={saveEdit} type={field === 'fecha' ? 'date' : 'text'} className="h-8 text-xs w-full" />;
    }

    if (field === 'fecha' && onDateClick) {
      return (
        <div className="cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center gap-1"
          onClick={() => onDateClick(value)} onDoubleClick={(e) => { e.stopPropagation(); setEditingCell({ id: pub.id, field }); setEditValue(value || ''); }}>
          <CalendarDays className="h-3 w-3 text-primary shrink-0" /><span className="text-sm truncate">{value}</span>
        </div>
      );
    }
    if (field === 'cuenta_id') {
      const nombre = value ? cuentasMap[value] || 'Desconocida' : '';
      return (
        <div className="cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center" onClick={() => { setEditingCell({ id: pub.id, field }); setEditValue(value || ''); }}>
          <span className="text-sm truncate">{nombre || <span className="text-muted-foreground italic">sin cuenta</span>}</span>
        </div>
      );
    }

    return (
      <div className={`cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center ${className || ''}`} onClick={() => { setEditingCell({ id: pub.id, field }); setEditValue(value || ''); }} title="Click para editar">
        {field === 'estado' ? <Badge variant={estadoVariant(value)} className="cursor-pointer">{value}</Badge> :
          <span className="text-sm truncate">{value || <span className="text-muted-foreground italic">vacío</span>}</span>}
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
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterRed} onValueChange={setFilterRed}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos los canales</SelectItem>{REDES_SOCIALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos los estados</SelectItem>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterFunnel} onValueChange={setFilterFunnel}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Funnel" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas las etapas</SelectItem>{ETAPAS_FUNNEL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
        {filterDate && (
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={onClearFilterDate}>
            <CalendarDays className="h-3 w-3" /> {filterDate} <X className="h-3 w-3" />
          </Badge>
        )}
        <Button onClick={addNewRow} size="sm" variant="outline" className="gap-1.5 ml-auto"><Plus className="h-4 w-4" /> Agregar fila</Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-primary/20">
          <span className="text-sm font-medium">{selectedIds.size} seleccionadas</span>
          <Select onValueChange={bulkChangeStatus}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Cambiar estado..." /></SelectTrigger>
            <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={bulkDelete} className="gap-1.5"><Trash2 className="h-4 w-4" /> Eliminar</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Deseleccionar</Button>
        </div>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="w-[40px]"></TableHead>
              {SORTABLE_FIELDS.map(sf => (
                <TableHead key={sf.key} className="min-w-[90px] cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort(sf.key)}>
                  <div className="flex items-center gap-1">{sf.label} <SortIcon field={sf.key} /></div>
                </TableHead>
              ))}
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRows.map((row, idx) => (
              <TableRow key={`new-${idx}`} className="bg-primary/5 border-primary/20">
                <TableCell></TableCell>
                <TableCell><input type="color" value={row.color} onChange={e => updateNewRow(idx, 'color', e.target.value)} className="h-6 w-6 rounded-full cursor-pointer border-0 p-0" /></TableCell>
                <TableCell>
                  <Select value={newRows[idx].cuenta_id} onValueChange={v => updateNewRow(idx, 'cuenta_id', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Cuenta..." /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sin cuenta</SelectItem>{cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="date" value={row.fecha} onChange={e => updateNewRow(idx, 'fecha', e.target.value)} className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.campana} onChange={e => updateNewRow(idx, 'campana', e.target.value)} placeholder="Campaña..." className="h-8 text-xs" /></TableCell>
                <TableCell>{renderNewRowSelect(idx, 'objetivo_post', OBJETIVOS_POST)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'pilar_contenido', PILARES_CONTENIDO)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'tipo_contenido', TIPOS_CONTENIDO)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'red_social', REDES_SOCIALES)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'tipo_pauta', TIPOS_PAUTA)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'etapa_funnel', ETAPAS_FUNNEL)}</TableCell>
                <TableCell><Input value={row.hook} onChange={e => updateNewRow(idx, 'hook', e.target.value)} placeholder="Hook..." className="h-8 text-xs" /></TableCell>
                <TableCell><Input value={row.cta_texto} onChange={e => updateNewRow(idx, 'cta_texto', e.target.value)} placeholder="CTA..." className="h-8 text-xs" /></TableCell>
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
              <TableRow><TableCell colSpan={15} className="text-center py-8 text-muted-foreground">No hay publicaciones. Haz click en "Agregar fila" para comenzar.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className={`hover:bg-accent/20 ${selectedIds.has(p.id) ? 'bg-accent/30' : ''}`}>
                <TableCell><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} /></TableCell>
                <TableCell>
                  <div className="h-5 w-5 rounded-full cursor-pointer border border-border" style={{ backgroundColor: p.color || '#3B82F6' }}
                    onClick={() => { const input = document.createElement('input'); input.type = 'color'; input.value = p.color || '#3B82F6'; input.addEventListener('change', async (e) => { try { await updateMut.mutateAsync({ id: p.id, color: (e.target as HTMLInputElement).value }); } catch {} }); input.click(); }} />
                </TableCell>
                <TableCell>{renderEditableCell(p, 'cuenta_id', (p as any).cuenta_id || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'fecha', p.fecha)}</TableCell>
                <TableCell>{renderEditableCell(p, 'campana', (p as any).campana || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'objetivo_post', (p as any).objetivo_post || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'pilar_contenido', (p as any).pilar_contenido || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'tipo_contenido', p.tipo_contenido)}</TableCell>
                <TableCell>{renderEditableCell(p, 'red_social', p.red_social)}</TableCell>
                <TableCell>{renderEditableCell(p, 'tipo_pauta', (p as any).tipo_pauta || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'etapa_funnel', (p as any).etapa_funnel || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'hook', (p as any).hook || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'cta_texto', (p as any).cta_texto || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'estado', p.estado)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { try { await dupMut.mutateAsync(p); toast.success('Duplicada'); } catch { toast.error('Error'); } }}><Copy className="h-4 w-4" /></Button>
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
