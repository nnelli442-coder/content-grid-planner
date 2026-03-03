import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Publicacion } from '@/hooks/usePublicaciones';
import { useDeletePublicacion } from '@/hooks/usePublicaciones';
import { toast } from 'sonner';

interface Props {
  publicaciones: Publicacion[];
  month: number;
  year: number;
  onDayClick: (date: string) => void;
  onEditPub: (pub: Publicacion) => void;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function WeeklyView({ publicaciones, month, year, onDayClick, onEditPub }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const deleteMut = useDeletePublicacion();

  const weekDays = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
    const startOfWeek = new Date(year, month, 1 - dayOfWeek + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [month, year, weekOffset]);

  const pubsByDate = useMemo(() => {
    const map: Record<string, Publicacion[]> = {};
    publicaciones.forEach(p => {
      if (!map[p.fecha]) map[p.fecha] = [];
      map[p.fecha].push(p);
    });
    return map;
  }, [publicaciones]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium">
          {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayPubs = pubsByDate[dateStr] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          return (
            <div key={i} className={`rounded-lg border p-3 min-h-[140px] cursor-pointer transition-colors hover:border-primary/50 ${isToday ? 'border-primary bg-accent/30' : 'bg-card'}`}
              onClick={() => onDayClick(dateStr)}>
              <div className="text-xs text-muted-foreground">{DIAS[i]}</div>
              <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{date.getDate()}</div>
              <div className="mt-2 space-y-2">
                {dayPubs.map(p => (
                  <div key={p.id} className="rounded-md p-2 text-xs text-white space-y-1" style={{ backgroundColor: p.color || '#3B82F6' }}
                    onClick={e => { e.stopPropagation(); onEditPub(p); }}>
                    <div className="font-semibold truncate">{p.titulo}</div>
                    <div className="opacity-80">{p.red_social} · {p.tipo_contenido}</div>
                    {(p as any).campana && <div className="opacity-70 truncate">{(p as any).campana}</div>}
                    <Badge variant="outline" className="text-[10px] border-white/40 text-white">{p.estado}</Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
