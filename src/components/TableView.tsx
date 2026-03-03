import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ExternalLink, Copy } from 'lucide-react';
import { REDES_SOCIALES, TIPOS_CONTENIDO, ESTADOS } from '@/hooks/usePublicaciones';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useDeletePublicacion, useDuplicatePublicacion } from '@/hooks/usePublicaciones';
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

export default function TableView({ publicaciones, onEdit }: Props) {
  const [filterRed, setFilterRed] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const deleteMut = useDeletePublicacion();
  const dupMut = useDuplicatePublicacion();

  const filtered = publicaciones.filter(p => {
    if (filterRed !== 'all' && p.red_social !== filterRed) return false;
    if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
    if (filterTipo !== 'all' && p.tipo_contenido !== filterTipo) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Publicación eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
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
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Red Social</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden lg:table-cell">Copy</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay publicaciones</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-accent/20">
                <TableCell><div className="h-4 w-4 rounded-full" style={{ backgroundColor: p.color || '#3B82F6' }} /></TableCell>
                <TableCell className="text-sm">{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</TableCell>
                <TableCell className="text-sm font-medium">{p.red_social}</TableCell>
                <TableCell className="text-sm">{p.tipo_contenido}</TableCell>
                <TableCell className="text-sm font-medium max-w-[200px] truncate">{p.titulo}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{p.descripcion}</TableCell>
                <TableCell><Badge variant={estadoVariant(p.estado)}>{p.estado}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={async () => { try { await dupMut.mutateAsync(p); toast.success('Duplicada'); } catch { toast.error('Error'); } }} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    {p.link_referencia && <a href={p.link_referencia} target="_blank" rel="noopener"><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button></a>}
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
