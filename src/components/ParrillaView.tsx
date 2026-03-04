import { useState, useRef, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Check, X, Copy } from 'lucide-react';
import {
  REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, OBJETIVOS_POST,
  useDeletePublicacion, useDuplicatePublicacion, useUpdatePublicacion, useCreatePublicacion,
} from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { useCuentas } from '@/hooks/useCuentas';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  publicaciones: Publicacion[];
}

// ── Status colors (Excel-like) ───────────────────────────────────────────────
const statusStyle = (e: string) => {
  if (e === 'Publicado')   return 'bg-[#C6EFCE] text-[#276221] dark:bg-emerald-900/50 dark:text-emerald-300';
  if (e === 'Programado')  return 'bg-[#DDEBF7] text-[#1F497D] dark:bg-blue-900/50 dark:text-blue-300';
  if (e === 'En revisión') return 'bg-[#FFEB9C] text-[#9C6500] dark:bg-amber-900/50 dark:text-amber-300';
  if (e === 'En diseño')   return 'bg-[#E2D0F0] text-[#5B2182] dark:bg-violet-900/50 dark:text-violet-300';
  return 'bg-[#F2F2F2] text-[#595959] dark:bg-gray-700 dark:text-gray-400';
};

const formatoStyle = (f: string) => {
  if (f === 'Reel')     return 'bg-[#E2D0F0] text-[#5B2182]';
  if (f === 'Story')    return 'bg-[#FCE4EC] text-[#880E4F]';
  if (f === 'Carrusel') return 'bg-[#FFF3E0] text-[#E65100]';
  if (f === 'Video')    return 'bg-[#FFEBEE] text-[#B71C1C]';
  if (f === 'Live')     return 'bg-[#E8F5E9] text-[#1B5E20]';
  return 'bg-[#E3F2FD] text-[#0D47A1]'; // Post
};

function formatDate(fecha: string) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

// Column definitions — exactly matching the Excel structure
const COLS = [
  { key: 'fecha',          label: 'FECHA DE PUBLICACIÓN', w: 'w-[110px] min-w-[110px]' },
  { key: 'objetivo_post',  label: 'OBJETIVO',             w: 'w-[120px] min-w-[120px]' },
  { key: 'tipo_contenido', label: 'FORMATO',              w: 'w-[100px] min-w-[100px]' },
  { key: 'red_social',     label: 'CANAL',                w: 'w-[100px] min-w-[100px]' },
  { key: 'copy_arte',      label: 'COPY ARTE',            w: 'w-[240px] min-w-[240px]' },
  { key: 'copy_caption',   label: 'COPY OUT',             w: 'w-[260px] min-w-[260px]' },
  { key: 'estado',         label: 'ESTADO',               w: 'w-[110px] min-w-[110px]' },
  { key: 'descripcion',    label: 'NOTAS',                w: 'w-[180px] min-w-[180px]' },
] as const;

type ColKey = typeof COLS[number]['key'];

interface NewRowState {
  campana: string;
  fecha: string; objetivo_post: string; tipo_contenido: string; red_social: string;
  copy_arte: string; copy_caption: string; estado: string; descripcion: string;
  cuenta_id: string;
}

const emptyNewRow = (campana: string, cuentaId: string): NewRowState => ({
  campana, fecha: new Date().toISOString().split('T')[0],
  objetivo_post: 'Engagement', tipo_contenido: 'Post', red_social: 'Instagram',
  copy_arte: '', copy_caption: '', estado: 'En planeación', descripcion: '',
  cuenta_id: cuentaId,
});

// ── Cell ─────────────────────────────────────────────────────────────────────
function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn(
      'border border-[#D9D9D9] dark:border-gray-700 px-2 py-1.5 text-xs align-top',
      className
    )}>
      {children}
    </td>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn(
      'border border-[#BDC3C7] dark:border-gray-600 px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-left',
      'bg-[#1F3864] text-white dark:bg-indigo-950',
      className
    )}>
      {children}
    </th>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ParrillaView({ publicaciones }: Props) {
  const { user, isAdmin, isSupervisor } = useAuth();
  const { data: cuentas = [] } = useCuentas();
  const deleteMut = useDeletePublicacion();
  const dupMut = useDuplicatePublicacion();
  const updateMut = useUpdatePublicacion();
  const createMut = useCreatePublicacion();

  const [filterCuenta, setFilterCuenta] = useState('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; col: ColKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newRows, setNewRows] = useState<Record<string, NewRowState[]>>({});
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell) {
      textareaRef.current?.focus();
      inputRef.current?.focus();
    }
  }, [editingCell]);

  const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));
  const selectedCuentaId = filterCuenta === 'all' ? '' : filterCuenta;

  // Filter by cuenta then group by campaña
  const filtered = useMemo(() => {
    return publicaciones.filter(p => {
      if (filterCuenta === 'all') return true;
      return (p as any).cuenta_id === filterCuenta;
    });
  }, [publicaciones, filterCuenta]);

  const groups = useMemo(() => {
    const map = new Map<string, Publicacion[]>();
    for (const p of filtered) {
      const key = (p as any).campana || 'Sin campaña';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Sort within each group by date
    for (const [, pubs] of map) {
      pubs.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }
    return map;
  }, [filtered]);

  // All campaign names present
  const allCampanas = Array.from(groups.keys());

  const toggleCollapse = (name: string) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  // Inline editing
  const startEdit = (id: string, col: ColKey, value: string) => {
    if (!isAdmin) return;
    setEditingCell({ id, col });
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      const val = editValue.trim() || null;
      await updateMut.mutateAsync({ id: editingCell.id, [editingCell.col]: val });
      toast.success('Guardado');
    } catch { toast.error('Error'); }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancelEdit();
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
  };

  // New row management
  const addNewRow = (campana: string) => {
    setNewRows(prev => ({
      ...prev,
      [campana]: [...(prev[campana] || []), emptyNewRow(campana, selectedCuentaId)],
    }));
  };

  const updateNewRow = (campana: string, idx: number, field: keyof NewRowState, value: string) => {
    setNewRows(prev => ({
      ...prev,
      [campana]: prev[campana].map((r, i) => i === idx ? { ...r, [field]: value } : r),
    }));
  };

  const saveNewRow = async (campana: string, idx: number) => {
    const row = newRows[campana]?.[idx];
    if (!row || !user) return;
    try {
      await createMut.mutateAsync({
        ...row,
        titulo: row.copy_arte ? row.copy_arte.slice(0, 80) : `Post ${row.fecha}`,
        cuenta_id: row.cuenta_id || null,
        user_id: user.id,
      } as any);
      setNewRows(prev => ({
        ...prev,
        [campana]: prev[campana].filter((_, i) => i !== idx),
      }));
      toast.success('Creado');
    } catch { toast.error('Error'); }
  };

  const removeNewRow = (campana: string, idx: number) => {
    setNewRows(prev => ({
      ...prev,
      [campana]: prev[campana].filter((_, i) => i !== idx),
    }));
  };

  // Add new group (campaign)
  const createGroup = () => {
    if (!newGroupName.trim()) return;
    addNewRow(newGroupName.trim());
    setNewGroupName('');
    setAddingGroup(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try { await deleteMut.mutateAsync(id); toast.success('Eliminada'); } catch { toast.error('Error'); }
  };

  // Render a data cell
  const renderCell = (pub: Publicacion, col: ColKey) => {
    const isEditing = editingCell?.id === pub.id && editingCell?.col === col;
    const raw = (pub as any)[col];
    const val = raw != null ? String(raw) : '';

    if (isEditing) {
      if (col === 'estado') {
        return (
          <select
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            className="w-full text-xs border-0 bg-transparent outline-none"
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        );
      }
      if (col === 'tipo_contenido') {
        return (
          <select autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit}
            className="w-full text-xs border-0 bg-transparent outline-none">
            {TIPOS_CONTENIDO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      }
      if (col === 'objetivo_post') {
        return (
          <select autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit}
            className="w-full text-xs border-0 bg-transparent outline-none">
            {OBJETIVOS_POST.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      if (col === 'red_social') {
        return (
          <select autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit}
            className="w-full text-xs border-0 bg-transparent outline-none">
            {REDES_SOCIALES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        );
      }
      if (col === 'fecha') {
        return (
          <input ref={inputRef} autoFocus type="date" value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit} onKeyDown={handleKeyDown}
            className="w-full text-xs border-0 bg-transparent outline-none" />
        );
      }
      // Text/textarea for long content
      return (
        <textarea
          ref={textareaRef}
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full text-xs border-0 bg-transparent outline-none resize-none"
        />
      );
    }

    // Display mode
    if (col === 'estado') {
      return (
        <div className="cursor-pointer" onDoubleClick={() => startEdit(pub.id, col, val)} title={isAdmin ? 'Doble click para editar' : ''}>
          <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold', statusStyle(val))}>
            {val || '—'}
          </span>
        </div>
      );
    }

    if (col === 'tipo_contenido') {
      return (
        <div className="cursor-pointer" onDoubleClick={() => startEdit(pub.id, col, val)} title={isAdmin ? 'Doble click para editar' : ''}>
          <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold', formatoStyle(val))}>
            {val || '—'}
          </span>
        </div>
      );
    }

    if (col === 'fecha') {
      return (
        <div className="cursor-pointer font-medium text-center" onDoubleClick={() => startEdit(pub.id, col, val)}>
          {formatDate(val) || '—'}
        </div>
      );
    }

    // Long text (copy_arte, copy_caption, descripcion)
    if (['copy_arte', 'copy_caption', 'descripcion'].includes(col)) {
      return (
        <div
          className="cursor-pointer leading-relaxed max-h-[80px] overflow-y-auto text-xs whitespace-pre-wrap"
          onDoubleClick={() => startEdit(pub.id, col, val)}
          title={isAdmin ? 'Doble click para editar' : val}
        >
          {val || <span className="text-gray-400 italic">—</span>}
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer text-xs"
        onDoubleClick={() => startEdit(pub.id, col, val)}
        title={isAdmin ? 'Doble click para editar' : val}
      >
        {val || <span className="text-gray-400 italic">—</span>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border rounded-xl shadow-sm">
        {cuentas.length > 0 && (
          <Select value={filterCuenta} onValueChange={setFilterCuenta}>
            <SelectTrigger className="h-8 w-[180px] text-xs font-medium"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <span className="text-xs text-muted-foreground">
          {filtered.length} publicación{filtered.length !== 1 ? 'es' : ''} · {groups.size} campaña{groups.size !== 1 ? 's' : ''}
        </span>
        {!isSupervisor && (
          <div className="ml-auto flex gap-2">
            {addingGroup ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Nombre de la campaña…"
                  className="h-8 text-xs w-[200px]"
                  onKeyDown={e => { if (e.key === 'Enter') createGroup(); if (e.key === 'Escape') { setAddingGroup(false); setNewGroupName(''); } }}
                />
                <Button size="sm" className="h-8 text-xs" onClick={createGroup}>Crear</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAddingGroup(false); setNewGroupName(''); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setAddingGroup(true)}>
                <Plus className="h-3.5 w-3.5" /> Nueva campaña
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Spreadsheet ── */}
      <div className="rounded-xl border-2 border-[#1F3864] dark:border-indigo-900 overflow-hidden shadow-md overflow-x-auto bg-white dark:bg-gray-950">
        <table className="w-full border-collapse text-xs" style={{ fontFamily: 'Calibri, "Segoe UI", sans-serif' }}>
          <thead>
            <tr>
              {/* Row number col */}
              <th className="border border-[#BDC3C7] bg-[#1F3864] dark:bg-indigo-950 w-8 text-[10px] text-white/60 py-2" />
              <HeaderCell className="w-[160px] min-w-[160px]">FASE / CAMPAÑA</HeaderCell>
              {COLS.map(c => <HeaderCell key={c.key} className={c.w}>{c.label}</HeaderCell>)}
              {!isSupervisor && <HeaderCell className="w-[70px] min-w-[70px]" />}
            </tr>
          </thead>

          <tbody>
            {allCampanas.length === 0 && Object.keys(newRows).length === 0 && (
              <tr>
                <td colSpan={COLS.length + 3} className="text-center py-16 text-gray-400 text-sm">
                  No hay contenido para este período.
                  {!isSupervisor && ' Usa "Nueva campaña" para comenzar.'}
                </td>
              </tr>
            )}

            {/* For each campaign group */}
            {[...new Set([...allCampanas, ...Object.keys(newRows)])].map((campana, groupIdx) => {
              const pubs = groups.get(campana) || [];
              const pendingRows = newRows[campana] || [];
              const isCollapsed = collapsed.has(campana);
              const rowCount = pubs.length + pendingRows.length;

              // Campaign color — cycle through palettes
              const PALETTE = [
                { bg: '#BDD7EE', text: '#1F3864', border: '#2E75B6' },
                { bg: '#E2EFDA', text: '#375623', border: '#548235' },
                { bg: '#FCE4D6', text: '#833C0B', border: '#C55A11' },
                { bg: '#EAD1DC', text: '#4A235A', border: '#7030A0' },
                { bg: '#FFF2CC', text: '#7F6000', border: '#BF8F00' },
                { bg: '#DEEAF1', text: '#1F3864', border: '#2E75B6' },
              ];
              const pal = PALETTE[groupIdx % PALETTE.length];

              return (
                <>
                  {/* ── Campaign header row ── */}
                  <tr key={`header-${campana}`} className="cursor-pointer" onClick={() => toggleCollapse(campana)}>
                    <td
                      className="border border-[#D9D9D9] dark:border-gray-700 text-[10px] text-center font-bold"
                      style={{ backgroundColor: pal.bg, color: pal.text }}
                    >
                      {isCollapsed
                        ? <ChevronRight className="h-3 w-3 mx-auto" />
                        : <ChevronDown className="h-3 w-3 mx-auto" />}
                    </td>
                    <td
                      colSpan={COLS.length + 2}
                      className="border-y border-r"
                      style={{
                        backgroundColor: pal.bg,
                        borderLeftColor: pal.border,
                        borderLeftWidth: 4,
                        borderLeftStyle: 'solid',
                      }}
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="font-bold text-xs uppercase tracking-wide" style={{ color: pal.text }}>
                          {campana}
                        </span>
                        <span className="text-[10px] opacity-60" style={{ color: pal.text }}>
                          {rowCount} publicación{rowCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* ── Data rows ── */}
                  {!isCollapsed && (
                    <>
                      {pubs.map((pub, rowIdx) => (
                        <tr
                          key={pub.id}
                          className="group"
                          style={{
                            backgroundColor: rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FBFF',
                            borderLeftColor: pal.border,
                            borderLeftWidth: 3,
                            borderLeftStyle: 'solid',
                          }}
                        >
                          {/* Row number */}
                          <td className="border border-[#D9D9D9] dark:border-gray-700 text-[10px] text-center text-gray-400 bg-[#F2F2F2] dark:bg-gray-800 w-8">
                            {rowIdx + 1}
                          </td>

                          {/* Campaign name cell (first data column) */}
                          <Cell>
                            <span className="text-[10px] font-semibold" style={{ color: pal.text }}>
                              {campana}
                            </span>
                          </Cell>

                          {/* Data columns */}
                          {COLS.map(col => (
                            <Cell key={col.key} className={col.key === 'estado' ? 'text-center' : ''}>
                              {renderCell(pub, col.key as ColKey)}
                            </Cell>
                          ))}

                          {/* Actions */}
                          {!isSupervisor && (
                            <Cell>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  title="Duplicar"
                                  onClick={async () => { try { await dupMut.mutateAsync(pub); toast.success('Duplicada'); } catch { toast.error('Error'); } }}
                                >
                                  <Copy className="h-3 w-3 text-gray-500" />
                                </button>
                                <button
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Eliminar"
                                  onClick={() => handleDelete(pub.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </button>
                              </div>
                            </Cell>
                          )}
                        </tr>
                      ))}

                      {/* ── Pending new rows ── */}
                      {pendingRows.map((row, idx) => (
                        <tr key={`new-${campana}-${idx}`} style={{ backgroundColor: '#FFFBE6', borderLeft: `3px solid ${pal.border}` }}>
                          <td className="border border-[#D9D9D9] w-8 text-center text-[10px] text-yellow-600 bg-yellow-50">+</td>
                          <Cell>
                            <span className="text-[10px] text-yellow-700 font-medium">{campana}</span>
                          </Cell>
                          {/* fecha */}
                          <Cell>
                            <input type="date" value={row.fecha} onChange={e => updateNewRow(campana, idx, 'fecha', e.target.value)}
                              className="w-full text-xs bg-transparent outline-none border-b border-yellow-300" />
                          </Cell>
                          {/* objetivo */}
                          <Cell>
                            <select value={row.objetivo_post} onChange={e => updateNewRow(campana, idx, 'objetivo_post', e.target.value)}
                              className="w-full text-xs bg-transparent outline-none">
                              {OBJETIVOS_POST.map(o => <option key={o}>{o}</option>)}
                            </select>
                          </Cell>
                          {/* formato */}
                          <Cell>
                            <select value={row.tipo_contenido} onChange={e => updateNewRow(campana, idx, 'tipo_contenido', e.target.value)}
                              className="w-full text-xs bg-transparent outline-none">
                              {TIPOS_CONTENIDO.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </Cell>
                          {/* canal */}
                          <Cell>
                            <select value={row.red_social} onChange={e => updateNewRow(campana, idx, 'red_social', e.target.value)}
                              className="w-full text-xs bg-transparent outline-none">
                              {REDES_SOCIALES.map(r => <option key={r}>{r}</option>)}
                            </select>
                          </Cell>
                          {/* copy arte */}
                          <Cell>
                            <textarea value={row.copy_arte} onChange={e => updateNewRow(campana, idx, 'copy_arte', e.target.value)}
                              placeholder="Copy Arte…" rows={2}
                              className="w-full text-xs bg-transparent outline-none resize-none border-b border-yellow-300" />
                          </Cell>
                          {/* copy out */}
                          <Cell>
                            <textarea value={row.copy_caption} onChange={e => updateNewRow(campana, idx, 'copy_caption', e.target.value)}
                              placeholder="Copy Out…" rows={2}
                              className="w-full text-xs bg-transparent outline-none resize-none border-b border-yellow-300" />
                          </Cell>
                          {/* estado */}
                          <Cell>
                            <select value={row.estado} onChange={e => updateNewRow(campana, idx, 'estado', e.target.value)}
                              className="w-full text-xs bg-transparent outline-none">
                              {ESTADOS.map(e => <option key={e}>{e}</option>)}
                            </select>
                          </Cell>
                          {/* notas */}
                          <Cell>
                            <input value={row.descripcion} onChange={e => updateNewRow(campana, idx, 'descripcion', e.target.value)}
                              placeholder="Notas…"
                              className="w-full text-xs bg-transparent outline-none border-b border-yellow-300" />
                          </Cell>
                          {/* save/cancel */}
                          <Cell>
                            <div className="flex gap-1">
                              <button onClick={() => saveNewRow(campana, idx)}
                                className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700 transition-colors">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => removeNewRow(campana, idx)}
                                className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </Cell>
                        </tr>
                      ))}

                      {/* ── Add row button ── */}
                      {!isSupervisor && (
                        <tr style={{ borderLeft: `3px solid ${pal.border}` }}>
                          <td colSpan={COLS.length + 3}
                            className="border border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            onClick={() => addNewRow(campana)}
                          >
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                              <Plus className="h-3 w-3" />
                              Agregar fila en {campana}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isSupervisor && (
        <p className="text-xs text-muted-foreground text-center">
          Doble click en cualquier celda para editar · Los cambios se guardan automáticamente
        </p>
      )}
    </div>
  );
}
