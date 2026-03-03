import { useMemo } from 'react';
import type { Publicacion } from '@/hooks/usePublicaciones';

interface Props {
  publicaciones: Publicacion[];
  month: number;
  year: number;
  onDayClick: (date: string) => void;
  onEditPub: (pub: Publicacion) => void;
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView({ publicaciones, month, year, onDayClick, onEditPub }: Props) {
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

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-muted/30 rounded-lg" />);
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPubs = pubsByDay[d] || [];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    cells.push(
      <div key={d} onClick={() => onDayClick(dateStr)}
        className={`min-h-[100px] rounded-lg border p-2 cursor-pointer transition-colors hover:border-primary/50 ${isToday ? 'border-primary bg-accent/30' : 'border-border bg-card'}`}>
        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>{d}</div>
        <div className="space-y-1">
          {dayPubs.slice(0, 3).map(p => (
            <div key={p.id} onClick={e => { e.stopPropagation(); onEditPub(p); }}
              className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-80"
              style={{ backgroundColor: p.color || '#3B82F6' }}>
              {p.titulo}
            </div>
          ))}
          {dayPubs.length > 3 && <div className="text-xs text-muted-foreground">+{dayPubs.length - 3} más</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
