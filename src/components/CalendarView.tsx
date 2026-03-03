import { useMemo, useState, useCallback } from 'react';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useMovePublicacion, useDuplicatePublicacion } from '@/hooks/usePublicaciones';
import { Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  publicaciones: Publicacion[];
  month: number;
  year: number;
  onDayClick: (date: string) => void;
  onEditPub: (pub: Publicacion) => void;
  onNewPub?: (date: string) => void;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView({ publicaciones, month, year, onDayClick, onEditPub, onNewPub }: Props) {
  const moveMut = useMovePublicacion();
  const dupMut = useDuplicatePublicacion();
  const [draggedPub, setDraggedPub] = useState<Publicacion | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const { days, startOffset } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    return { days: daysInMonth, startOffset };
  }, [month, year]);

  const pubsByDay = useMemo(() => {
    const map: Record<number, Publicacion[]> = {};
    publicaciones.forEach(p => {
      const day = parseInt(p.fecha.split('-')[2]);
      if (!map[day]) map[day] = [];
      map[day].push(p);
    });
    return map;
  }, [publicaciones]);

  const handleDragStart = useCallback((e: React.DragEvent, pub: Publicacion) => {
    setDraggedPub(pub);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pub.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  }, []);

  const handleDragLeave = useCallback(() => { setDragOverDate(null); }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    if (draggedPub && draggedPub.fecha !== dateStr) {
      try { await moveMut.mutateAsync({ id: draggedPub.id, fecha: dateStr }); toast.success('Publicación movida'); } catch { toast.error('Error al mover'); }
    }
    setDraggedPub(null);
  }, [draggedPub, moveMut]);

  const handleDuplicate = async (e: React.MouseEvent, pub: Publicacion) => {
    e.stopPropagation();
    try { await dupMut.mutateAsync(pub); toast.success('Duplicada'); } catch { toast.error('Error'); }
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-muted/30 rounded-lg" />);
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPubs = pubsByDay[d] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const isDragOver = dragOverDate === dateStr;
    cells.push(
      <div key={d}
        onClick={() => onDayClick(dateStr)}
        onDragOver={e => handleDragOver(e, dateStr)}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, dateStr)}
        className={`min-h-[100px] rounded-lg border p-2 cursor-pointer transition-all ${
          isDragOver ? 'border-primary bg-accent/50 scale-[1.02]' :
          isToday ? 'border-primary bg-accent/30' : 'border-border bg-card'
        } hover:border-primary/50`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{d}</span>
          {onNewPub && (
            <button onClick={e => { e.stopPropagation(); onNewPub(dateStr); }} className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" title="Nueva publicación">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-1">
          {dayPubs.slice(0, 3).map(p => (
            <div key={p.id} draggable onDragStart={e => handleDragStart(e, p)} onClick={e => { e.stopPropagation(); onEditPub(p); }}
              className="group text-xs px-1.5 py-0.5 rounded truncate text-white font-medium cursor-grab active:cursor-grabbing hover:opacity-90 flex items-center justify-between"
              style={{ backgroundColor: p.color || '#3B82F6' }}>
              <span className="truncate">{p.titulo}</span>
              <button onClick={e => handleDuplicate(e, p)} className="opacity-0 group-hover:opacity-100 ml-1 hover:scale-110 transition-all" title="Duplicar">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          ))}
          {dayPubs.length > 3 && <div className="text-xs text-muted-foreground">+{dayPubs.length - 3} más</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Click en un día para ver sus publicaciones en la tabla. Arrastra publicaciones para mover de fecha.</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
