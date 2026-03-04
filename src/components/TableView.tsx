import { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Copy, Plus, Check, X, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays, Filter } from 'lucide-react';
import { REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, OBJETIVOS_POST, PILARES_CONTENIDO, ETAPAS_FUNNEL, TIPOS_PAUTA } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useDeletePublicacion, useDuplicatePublicacion, useUpdatePublicacion, useCreatePublicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useCuentas } from '@/hooks/useCuentas';
import { toast } from 'sonner';
import PublicacionDetailDrawer from '@/components/PublicacionDetailDrawer';

interface Props {
  publicaciones: Publicacion[];
  onEdit: (pub: Publicacion) => void;
  filterDate?: string | null;
  onClearFilterDate?: () => void;
  onDateClick?: (date: string) => void;
}

// ── Visual helpers ──────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function parseFecha(fecha: string) {
  const [y, m, d] = fecha.split('-');
  return { day: d, month: MONTHS_SHORT[parseInt(m) - 1] || '', year: y };
}

const estadoClasses = (e: string) => {
  if (e === 'Publicado')   return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/30';
  if (e === 'Programado')  return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-400/30';
  if (e === 'En revisión') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30';
  if (e === 'En diseño')   return 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-400/30';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300/30';
};

const canalClasses = (r: string) => {
  if (r === 'Instagram')  return 'bg-pink-500/10 text-pink-700 dark:text-pink-300';
  if (r === 'Facebook')   return 'bg-blue-600/10 text-blue-700 dark:text-blue-300';
  if (r === 'TikTok')     return 'bg-slate-800/10 text-slate-700 dark:text-slate-300';
  if (r === 'Twitter/X')  return 'bg-sky-500/10 text-sky-700 dark:text-sky-300';
  if (r === 'LinkedIn')   return 'bg-sky-700/10 text-sky-800 dark:text-sky-300';
  if (r === 'YouTube')    return 'bg-red-500/10 text-red-700 dark:text-red-300';
  if (r === 'Pinterest')  return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
  return 'bg-muted text-muted-foreground';
};

const formatoClasses = (f: string) => {
  if (f === 'Reel')       return 'bg-violet-500/10 text-violet-700 dark:text-violet-300';
  if (f === 'Story')      return 'bg-pink-400/10 text-pink-600 dark:text-pink-300';
  if (f === 'Carrusel')   return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
  if (f === 'Video')      return 'bg-red-400/10 text-red-600 dark:text-red-300';
  if (f === 'Live')       return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (f === 'Blog')       return 'bg-amber-400/10 text-amber-700 dark:text-amber-300';
  if (f === 'Newsletter') return 'bg-teal-500/10 text-teal-700 dark:text-teal-300';
  return 'bg-blue-400/10 text-blue-600 dark:text-blue-300'; // Post
};

function Pill({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>
      {label}
    </span>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null;
type SortConfig = { field: string; dir: SortDir };
type EditingCell = { id: string; field: string } | null;

interface NewRow {
  fecha: string; red_social: string; tipo_contenido: string; titulo: string;
  campana: string; objetivo_post: string; pilar_contenido: string; etapa_funnel: string;
  hook: string; cta_texto: string; tipo_pauta: string; estado: string;
  color: string; cuenta_id: string;
}

const emptyRow = (): NewRow => ({
  fecha: new Date().toISOString().split('T')[0], red_social: 'Instagram', tipo_contenido: 'Post',
  titulo: '', campana: '', objetivo_post: 'Engagement', pilar_contenido: 'Comunidad',
  etapa_funnel: 'Descubrimiento', hook: '', cta_texto: '', tipo_pauta: 'Orgánico',
  estado: 'En planeación', color: '#3B82F6', cuenta_id: 'none',
});

const SELECT_FIELDS: Record<string, readonly string[]> = {
  red_social: REDES_SOCIALES, tipo_contenido: TIPOS_CONTENIDO, estado: ESTADOS,
  objetivo_post: OBJETIVOS_POST, pilar_contenido: PILARES_CONTENIDO,
  etapa_funnel: ETAPAS_FUNNEL, tipo_pauta: TIPOS_PAUTA,
};

const COLS: { key: string; label: string; width?: string }[] = [
  { key: 'cuenta_id',      label: 'Cliente',  width: 'min-w-[130px]' },
  { key: 'fecha',          label: 'Fecha',    width: 'min-w-[90px]'  },
  { key: 'campana',        label: 'Campaña',  width: 'min-w-[130px]' },
  { key: 'objetivo_post',  label: 'Objetivo', width: 'min-w-[110px]' },
  { key: 'pilar_contenido',label: 'Pilar',    width: 'min-w-[110px]' },
  { key: 'tipo_contenido', label: 'Formato',  width: 'min-w-[90px]'  },
  { key: 'red_social',     label: 'Canal',    width: 'min-w-[100px]' },
  { key: 'tipo_pauta',     label: 'Pauta',    width: 'min-w-[90px]'  },
  { key: 'etapa_funnel',   label: 'Funnel',   width: 'min-w-[110px]' },
  { key: 'hook',           label: 'Hook',     width: 'min-w-[160px]' },
  { key: 'cta_texto',      label: 'CTA',      width: 'min-w-[130px]' },
  { key: 'estado',         label: 'Estado',   width: 'min-w-[120px]' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function TableView({ publicaciones, onEdit, filterDate, onClearFilterDate, onDateClick }: Props) {
  const { user, isAdmin, isSupervisor } = useAuth();
  const { data: cuentas = [] } = useCuentas();
  const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));

  const [filterRed, setFilterRed] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterFunnel, setFilterFunnel] = useState('all');
  const [filterCuenta, setFilterCuenta] = useState('all');

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
  const [drawerPub, setDrawerPub] = useState<Publicacion | null>(null);
  const [drawerField, setDrawerField] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = publicaciones.filter(p => {
      if (filterRed !== 'all' && p.red_social !== filterRed) return false;
      if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
      if (filterFunnel !== 'all' && (p as any).etapa_funnel !== filterFunnel) return false;
      if (filterCuenta !== 'all' && (p as any).cuenta_id !== filterCuenta) return false;
      if (filterDate && p.fecha !== filterDate) return false;
      return true;
    });
    if (sort.dir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sort.field] || '';
        const bVal = (b as any)[sort.field] || '';
        return sort.dir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return result;
  }, [publicaciones, filterRed, filterEstado, filterFunnel, filterCuenta, filterDate, sort]);

  useEffect(() => { setSelectedIds(new Set()); }, [publicaciones]);
  useEffect(() => {
    if (editingCell && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
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
    if (sort.field !== field || !sort.dir) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const toggleAll = () => allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(p => p.id)));
  const toggleOne = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} publicaciones?`)) return;
    try { await Promise.all([...selectedIds].map(id => deleteMut.mutateAsync(id))); toast.success(`${selectedIds.size} eliminadas`); setSelectedIds(new Set()); }
    catch { toast.error('Error'); }
  };
  const bulkChangeStatus = async (status: string) => {
    try { await Promise.all([...selectedIds].map(id => updateMut.mutateAsync({ id, estado: status }))); toast.success(`${selectedIds.size} actualizadas`); setSelectedIds(new Set()); }
    catch { toast.error('Error'); }
  };

  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!editingCell) return;
    try { await updateMut.mutateAsync({ id: editingCell.id, [editingCell.field]: editValue || null }); toast.success('Guardado'); }
    catch { toast.error('Error'); }
    cancelEdit();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); };
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try { await deleteMut.mutateAsync(id); toast.success('Eliminada'); } catch { toast.error('Error'); }
  };

  const addNewRow = () => setNewRows(prev => [...prev, emptyRow()]);
  const updateNewRow = (i: number, field: keyof NewRow, value: string) =>
    setNewRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
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

  // ── Inline edit cell renderer ─────────────────────────────────────────────
  const renderCell = (pub: Publicacion, field: string, value: string) => {
    const isEditing = editingCell?.id === pub.id && editingCell?.field === field;

    if (isEditing) {
      if (field in SELECT_FIELDS) {
        return (
          <Select value={editValue} onValueChange={async v => {
            try { await updateMut.mutateAsync({ id: pub.id, [field]: v }); toast.success('Guardado'); } catch { toast.error('Error'); }
            cancelEdit();
          }}>
            <SelectTrigger className="h-7 text-xs w-full min-w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{SELECT_FIELDS[field].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      }
      if (field === 'cuenta_id') {
        return (
          <Select value={editValue || 'none'} onValueChange={async v => {
            try { await updateMut.mutateAsync({ id: pub.id, cuenta_id: v === 'none' ? null : v }); toast.success('Guardado'); } catch { toast.error('Error'); }
            cancelEdit();
          }}>
            <SelectTrigger className="h-7 text-xs w-full min-w-[110px]"><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cuenta</SelectItem>
              {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown} onBlur={saveEdit}
          type={field === 'fecha' ? 'date' : 'text'} className="h-7 text-xs w-full" />
      );
    }

    const handleClick = () => { setDrawerPub(pub); setDrawerField(field); };
    const handleDblClick = () => { if (isAdmin) { setEditingCell({ id: pub.id, field }); setEditValue(value || ''); } };
    const title = isAdmin ? 'Click: detalles · Doble click: editar' : 'Click para ver detalles';

    // ── Fecha ──
    if (field === 'fecha') {
      const { day, month } = parseFecha(value);
      return (
        <div className="cursor-pointer" onClick={handleClick} onDoubleClick={e => { e.stopPropagation(); handleDblClick(); }} title={title}>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-center justify-center w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 text-center shrink-0">
              <span className="text-sm font-bold text-foreground leading-none">{day}</span>
              <span className="text-[9px] uppercase font-semibold text-primary leading-none mt-0.5">{month}</span>
            </div>
          </div>
        </div>
      );
    }

    // ── Cuenta ──
    if (field === 'cuenta_id') {
      const nombre = value ? cuentasMap[value] || 'Desconocida' : '';
      const initial = nombre.charAt(0).toUpperCase();
      return (
        <div className="cursor-pointer flex items-center gap-1.5 group/cell" onClick={handleClick} onDoubleClick={handleDblClick} title={title}>
          {nombre ? (
            <>
              <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {initial}
              </div>
              <span className="text-xs font-medium truncate max-w-[90px]">{nombre}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">sin cuenta</span>
          )}
        </div>
      );
    }

    // ── Canal ──
    if (field === 'red_social') {
      return (
        <div className="cursor-pointer" onClick={handleClick} onDoubleClick={handleDblClick} title={title}>
          {value ? <Pill label={value} className={canalClasses(value)} /> : <span className="text-xs text-muted-foreground/50">—</span>}
        </div>
      );
    }

    // ── Formato ──
    if (field === 'tipo_contenido') {
      return (
        <div className="cursor-pointer" onClick={handleClick} onDoubleClick={handleDblClick} title={title}>
          {value ? <Pill label={value} className={formatoClasses(value)} /> : <span className="text-xs text-muted-foreground/50">—</span>}
        </div>
      );
    }

    // ── Estado ──
    if (field === 'estado') {
      return (
        <div className="cursor-pointer" onClick={handleClick} onDoubleClick={handleDblClick} title={title}>
          {value
            ? <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', estadoClasses(value))}>{value}</span>
            : <span className="text-xs text-muted-foreground/50">—</span>}
        </div>
      );
    }

    // ── Tipo Pauta ──
    if (field === 'tipo_pauta') {
      const cls = value === 'Pauta' ? 'bg-amber-400/15 text-amber-700 dark:text-amber-400'
        : value === 'Mixto' ? 'bg-teal-400/15 text-teal-700 dark:text-teal-400'
        : 'bg-muted text-muted-foreground';
      return (
        <div className="cursor-pointer" onClick={handleClick} onDoubleClick={handleDblClick} title={title}>
          {value ? <Pill label={value} className={cls} /> : <span className="text-xs text-muted-foreground/50">—</span>}
        </div>
      );
    }

    // ── Hook & CTA — italic truncated ──
    if (field === 'hook' || field === 'cta_texto') {
      return (
        <div className="cursor-pointer max-w-[200px]" onClick={handleClick} onDoubleClick={handleDblClick} title={value || title}>
          {value
            ? <span className="text-xs text-foreground/80 italic truncate block">{value}</span>
            : <span className="text-xs text-muted-foreground/40">—</span>}
        </div>
      );
    }

    // ── Default text cell ──
    return (
      <div className="cursor-pointer" onClick={handleClick} onDoubleClick={handleDblClick} title={value || title}>
        {value
          ? <span className="text-xs text-foreground/90 truncate block max-w-[130px]">{value}</span>
          : <span className="text-xs text-muted-foreground/40">—</span>}
      </div>
    );
  };

  const renderNewRowSelect = (index: number, field: keyof NewRow, options: readonly string[]) => (
    <Select value={newRows[index][field]} onValueChange={v => updateNewRow(index, field, v)}>
      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );

  const activeFilters = [filterRed !== 'all', filterEstado !== 'all', filterFunnel !== 'all', filterCuenta !== 'all', !!filterDate].filter(Boolean).length;

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filtrar
          {activeFilters > 0 && (
            <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </div>

        {cuentas.length > 0 && (
          <Select value={filterCuenta} onValueChange={setFilterCuenta}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={filterRed} onValueChange={setFilterRed}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {REDES_SOCIALES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterFunnel} onValueChange={setFilterFunnel}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Funnel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {ETAPAS_FUNNEL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        {filterDate && (
          <button
            onClick={onClearFilterDate}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <CalendarDays className="h-3 w-3" /> {filterDate} <X className="h-3 w-3" />
          </button>
        )}

        {activeFilters > 0 && (
          <button
            onClick={() => { setFilterRed('all'); setFilterEstado('all'); setFilterFunnel('all'); setFilterCuenta('all'); onClearFilterDate?.(); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Limpiar filtros
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {publicaciones.length}
          </span>
          {!isSupervisor && (
            <Button onClick={addNewRow} size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Agregar fila
            </Button>
          )}
        </div>
      </div>

      {/* ── Bulk actions ── */}
      {selectedIds.size > 0 && !isSupervisor && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 shadow-sm">
          <span className="text-sm font-semibold text-primary">{selectedIds.size} seleccionadas</span>
          <div className="h-4 w-px bg-border" />
          <Select onValueChange={bulkChangeStatus}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue placeholder="Cambiar estado…" /></SelectTrigger>
            <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={bulkDelete} className="h-8 gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())}>
            Deseleccionar
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border shadow-sm overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 pl-3">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              {/* Color col */}
              <TableHead className="w-6 p-0" />
              {COLS.map(col => (
                <TableHead
                  key={col.key}
                  className={cn('cursor-pointer select-none hover:bg-muted/70 transition-colors py-3', col.width)}
                  onClick={() => toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label} <SortIcon field={col.key} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-16 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-3">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* ── New rows ── */}
            {newRows.map((row, idx) => (
              <TableRow key={`new-${idx}`} className="bg-primary/3 border-l-4 border-l-primary">
                <TableCell className="pl-3" />
                <TableCell className="p-1">
                  <input type="color" value={row.color} onChange={e => updateNewRow(idx, 'color', e.target.value)}
                    className="h-5 w-5 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
                </TableCell>
                {/* cuenta */}
                <TableCell className="p-1.5">
                  <Select value={row.cuenta_id} onValueChange={v => updateNewRow(idx, 'cuenta_id', v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Cliente…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta</SelectItem>
                      {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                {/* fecha */}
                <TableCell className="p-1.5">
                  <Input type="date" value={row.fecha} onChange={e => updateNewRow(idx, 'fecha', e.target.value)} className="h-7 text-xs" />
                </TableCell>
                {/* campaña */}
                <TableCell className="p-1.5">
                  <Input value={row.campana} onChange={e => updateNewRow(idx, 'campana', e.target.value)} placeholder="Campaña…" className="h-7 text-xs" />
                </TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'objetivo_post', OBJETIVOS_POST)}</TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'pilar_contenido', PILARES_CONTENIDO)}</TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'tipo_contenido', TIPOS_CONTENIDO)}</TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'red_social', REDES_SOCIALES)}</TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'tipo_pauta', TIPOS_PAUTA)}</TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'etapa_funnel', ETAPAS_FUNNEL)}</TableCell>
                <TableCell className="p-1.5">
                  <Input value={row.hook} onChange={e => updateNewRow(idx, 'hook', e.target.value)} placeholder="Hook…" className="h-7 text-xs" />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input value={row.cta_texto} onChange={e => updateNewRow(idx, 'cta_texto', e.target.value)} placeholder="CTA…" className="h-7 text-xs" />
                </TableCell>
                <TableCell className="p-1.5">{renderNewRowSelect(idx, 'estado', ESTADOS)}</TableCell>
                <TableCell className="p-1.5">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => saveNewRow(idx)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => removeNewRow(idx)}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* ── Empty state ── */}
            {filtered.length === 0 && newRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Sin publicaciones</p>
                    <p className="text-xs text-muted-foreground/60">
                      {activeFilters > 0 ? 'Prueba ajustando los filtros' : 'Haz click en "Agregar fila" para comenzar'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* ── Data rows ── */}
            {filtered.map((p, rowIdx) => (
              <TableRow
                key={p.id}
                className={cn(
                  'group border-b border-border/40 transition-colors',
                  selectedIds.has(p.id) ? 'bg-primary/5' : rowIdx % 2 === 0 ? 'hover:bg-accent/20' : 'bg-muted/20 hover:bg-accent/20'
                )}
                style={{ borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: p.color || '#3B82F6' }}
              >
                <TableCell className="pl-3">
                  <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                </TableCell>

                {/* Color dot — click to change */}
                <TableCell className="p-1">
                  <div
                    className="h-4 w-4 rounded-full cursor-pointer ring-2 ring-background shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                    title="Click para cambiar color"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = p.color || '#3B82F6';
                      input.addEventListener('change', async e => {
                        try { await updateMut.mutateAsync({ id: p.id, color: (e.target as HTMLInputElement).value }); }
                        catch { toast.error('Error'); }
                      });
                      input.click();
                    }}
                  />
                </TableCell>

                <TableCell className="py-3 px-2">{renderCell(p, 'cuenta_id', (p as any).cuenta_id || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'fecha', p.fecha)}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'campana', (p as any).campana || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'objetivo_post', (p as any).objetivo_post || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'pilar_contenido', (p as any).pilar_contenido || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'tipo_contenido', p.tipo_contenido)}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'red_social', p.red_social)}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'tipo_pauta', (p as any).tipo_pauta || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'etapa_funnel', (p as any).etapa_funnel || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'hook', (p as any).hook || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'cta_texto', (p as any).cta_texto || '')}</TableCell>
                <TableCell className="py-3 px-2">{renderCell(p, 'estado', p.estado)}</TableCell>

                {/* Actions — visible on hover */}
                <TableCell className="py-3 px-2">
                  {!isSupervisor && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted"
                        title="Duplicar"
                        onClick={async () => { try { await dupMut.mutateAsync(p); toast.success('Duplicada'); } catch { toast.error('Error'); } }}
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10"
                        title="Eliminar"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                      </Button>
                    </div>
                  )}
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
      />
    </div>
  );
}
