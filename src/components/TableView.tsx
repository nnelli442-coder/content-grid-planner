import { useState, useRef, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, ExternalLink, Copy, Plus, Check, X, Save } from 'lucide-react';
import { REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS, COLORES_PREDEFINIDOS } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useDeletePublicacion, useDuplicatePublicacion, useUpdatePublicacion, useCreatePublicacion } from '@/hooks/usePublicaciones';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  publicaciones: Publicacion[];
  onEdit: (pub: Publicacion) => void;
}

const estadoVariant = (e: string) => {
  if (e === 'Publicado') return 'default';
  if (e === 'Aprobado') return 'secondary';
  if (e === 'Rechazado') return 'destructive';
  return 'outline';
};

type EditingCell = { id: string; field: string } | null;

interface NewRow {
  fecha: string;
  red_social: string;
  tipo_contenido: string;
  titulo: string;
  descripcion: string;
  copy_arte: string;
  link_referencia: string;
  estado: string;
  color: string;
}

const emptyRow = (): NewRow => ({
  fecha: new Date().toISOString().split('T')[0],
  red_social: 'Instagram',
  tipo_contenido: 'Post',
  titulo: '',
  descripcion: '',
  copy_arte: '',
  link_referencia: '',
  estado: 'Borrador',
  color: '#3B82F6',
});

export default function TableView({ publicaciones, onEdit }: Props) {
  const { user } = useAuth();
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

  const filtered = publicaciones.filter(p => {
    if (filterRed !== 'all' && p.red_social !== filterRed) return false;
    if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
    if (filterTipo !== 'all' && p.tipo_contenido !== filterTipo) return false;
    return true;
  });

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const startEdit = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      await updateMut.mutateAsync({ id: editingCell.id, [editingCell.field]: editValue });
      toast.success('Actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Publicación eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const addNewRow = () => {
    setNewRows(prev => [...prev, emptyRow()]);
  };

  const updateNewRow = (index: number, field: keyof NewRow, value: string) => {
    setNewRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const saveNewRow = async (index: number) => {
    const row = newRows[index];
    if (!row.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!user) return;
    try {
      await createMut.mutateAsync({ ...row, user_id: user.id });
      setNewRows(prev => prev.filter((_, i) => i !== index));
      toast.success('Publicación creada');
    } catch {
      toast.error('Error al crear');
    }
  };

  const removeNewRow = (index: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== index));
  };

  const renderEditableCell = (pub: Publicacion, field: string, value: string, className?: string) => {
    const isEditing = editingCell?.id === pub.id && editingCell?.field === field;

    if (isEditing) {
      if (field === 'red_social' || field === 'tipo_contenido' || field === 'estado') {
        const options = field === 'red_social' ? REDES_SOCIALES : field === 'tipo_contenido' ? TIPOS_CONTENIDO : ESTADOS;
        return (
          <Select value={editValue} onValueChange={async (v) => {
            try {
              await updateMut.mutateAsync({ id: pub.id, [field]: v });
              toast.success('Actualizado');
            } catch { toast.error('Error'); }
            setEditingCell(null);
          }}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      }

      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          type={field === 'fecha' ? 'date' : 'text'}
          className="h-8 text-xs w-full"
        />
      );
    }

    return (
      <div
        className={`cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5 min-h-[28px] flex items-center ${className || ''}`}
        onClick={() => startEdit(pub.id, field, value || '')}
        title="Click para editar"
      >
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
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
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
        <Button onClick={addNewRow} size="sm" variant="outline" className="gap-1.5 ml-auto">
          <Plus className="h-4 w-4" /> Agregar fila
        </Button>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="min-w-[110px]">Fecha</TableHead>
              <TableHead className="min-w-[120px]">Red Social</TableHead>
              <TableHead className="min-w-[100px]">Tipo</TableHead>
              <TableHead className="min-w-[150px]">Título</TableHead>
              <TableHead className="min-w-[150px]">Descripción</TableHead>
              <TableHead className="min-w-[120px]">Copy Arte</TableHead>
              <TableHead className="min-w-[120px]">Link Ref.</TableHead>
              <TableHead className="min-w-[110px]">Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newRows.map((row, idx) => (
              <TableRow key={`new-${idx}`} className="bg-primary/5 border-primary/20">
                <TableCell>
                  <input
                    type="color"
                    value={row.color}
                    onChange={e => updateNewRow(idx, 'color', e.target.value)}
                    className="h-6 w-6 rounded-full cursor-pointer border-0 p-0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.fecha}
                    onChange={e => updateNewRow(idx, 'fecha', e.target.value)}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>{renderNewRowSelect(idx, 'red_social', REDES_SOCIALES)}</TableCell>
                <TableCell>{renderNewRowSelect(idx, 'tipo_contenido', TIPOS_CONTENIDO)}</TableCell>
                <TableCell>
                  <Input
                    value={row.titulo}
                    onChange={e => updateNewRow(idx, 'titulo', e.target.value)}
                    placeholder="Título..."
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.descripcion}
                    onChange={e => updateNewRow(idx, 'descripcion', e.target.value)}
                    placeholder="Descripción..."
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.copy_arte}
                    onChange={e => updateNewRow(idx, 'copy_arte', e.target.value)}
                    placeholder="Copy arte..."
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.link_referencia}
                    onChange={e => updateNewRow(idx, 'link_referencia', e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>{renderNewRowSelect(idx, 'estado', ESTADOS)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => saveNewRow(idx)} className="h-8 w-8 text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeNewRow(idx)} className="h-8 w-8">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && newRows.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No hay publicaciones. Haz click en "Agregar fila" para comenzar.</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-accent/20">
                <TableCell>
                  <div
                    className="h-5 w-5 rounded-full cursor-pointer border border-border"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = p.color || '#3B82F6';
                      input.addEventListener('change', async (e) => {
                        try {
                          await updateMut.mutateAsync({ id: p.id, color: (e.target as HTMLInputElement).value });
                        } catch {}
                      });
                      input.click();
                    }}
                  />
                </TableCell>
                <TableCell>{renderEditableCell(p, 'fecha', p.fecha)}</TableCell>
                <TableCell>{renderEditableCell(p, 'red_social', p.red_social)}</TableCell>
                <TableCell>{renderEditableCell(p, 'tipo_contenido', p.tipo_contenido)}</TableCell>
                <TableCell>{renderEditableCell(p, 'titulo', p.titulo, 'font-medium')}</TableCell>
                <TableCell>{renderEditableCell(p, 'descripcion', p.descripcion || '')}</TableCell>
                <TableCell>{renderEditableCell(p, 'copy_arte', p.copy_arte || '')}</TableCell>
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
