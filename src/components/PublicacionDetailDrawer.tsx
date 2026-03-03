import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Target, Layers, Film, Globe, Zap, TrendingUp, Type, MessageSquare, Palette, Link2, Hash, Clock, DollarSign, Users } from 'lucide-react';
import type { Publicacion } from '@/hooks/usePublicaciones';

interface Props {
  open: boolean;
  onClose: () => void;
  publicacion: Publicacion | null;
  highlightField?: string | null;
  visibleSections?: ('Planificación' | 'Ejecución' | 'Medición')[];
}

const SECTIONS = [
  {
    title: 'Planificación',
    fields: [
      { key: 'fecha', label: 'Fecha', icon: CalendarDays },
      { key: 'campana', label: 'Campaña', icon: Target },
      { key: 'objetivo_post', label: 'Objetivo del Post', icon: Target },
      { key: 'pilar_contenido', label: 'Pilar de Contenido', icon: Layers },
      { key: 'tipo_contenido', label: 'Formato', icon: Film },
      { key: 'red_social', label: 'Canal', icon: Globe },
      { key: 'tipo_pauta', label: 'Tipo', icon: Zap },
      { key: 'etapa_funnel', label: 'Etapa del Funnel', icon: TrendingUp },
      { key: 'hook', label: 'Hook', icon: Type },
      { key: 'cta_texto', label: 'CTA', icon: MessageSquare },
      { key: 'estado', label: 'Estado', icon: Zap },
    ],
  },
  {
    title: 'Ejecución',
    fields: [
      { key: 'copy_arte', label: 'Copy Arte', icon: Palette },
      { key: 'copy_caption', label: 'Copy Caption', icon: MessageSquare },
      { key: 'descripcion', label: 'Descripción', icon: Type },
      { key: 'indicaciones_arte', label: 'Indicaciones Arte', icon: Palette },
      { key: 'referencia_visual', label: 'Referencia Visual', icon: Link2 },
      { key: 'hashtags', label: 'Hashtags', icon: Hash },
      { key: 'duracion', label: 'Duración', icon: Clock },
      { key: 'presupuesto', label: 'Presupuesto', icon: DollarSign },
      { key: 'segmentacion', label: 'Segmentación', icon: Users },
      { key: 'link_referencia', label: 'Link Referencia', icon: Link2 },
    ],
  },
  {
    title: 'Medición',
    fields: [
      { key: 'alcance', label: 'Alcance' },
      { key: 'impresiones', label: 'Impresiones' },
      { key: 'engagement', label: 'Engagement' },
      { key: 'er_porcentaje', label: 'ER %' },
      { key: 'guardados', label: 'Guardados' },
      { key: 'compartidos', label: 'Compartidos' },
      { key: 'clics', label: 'Clics' },
      { key: 'seguidores_nuevos', label: 'Seguidores nuevos' },
      { key: 'costo', label: 'Costo' },
      { key: 'costo_por_resultado', label: 'Costo por resultado' },
    ],
  },
];

export default function PublicacionDetailDrawer({ open, onClose, publicacion, highlightField, visibleSections }: Props) {
  if (!publicacion) return null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: publicacion.color || '#3B82F6' }} />
            <SheetTitle className="text-left truncate">{publicacion.titulo}</SheetTitle>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{publicacion.red_social}</Badge>
            <Badge variant="outline">{publicacion.tipo_contenido}</Badge>
            <Badge>{publicacion.estado}</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-4 space-y-6">
            {SECTIONS.filter(s => !visibleSections || visibleSections.includes(s.title as any)).map(section => {
              const hasData = section.fields.some(f => {
                const val = (publicacion as any)[f.key];
                return val != null && val !== '';
              });

              return (
                <div key={section.title}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.fields.map(f => {
                      const val = (publicacion as any)[f.key];
                      const displayVal = val != null && val !== '' ? String(val) : null;
                      const isHighlighted = highlightField === f.key;
                      const Icon = (f as any).icon;

                      return (
                        <div
                          key={f.key}
                          className={`rounded-lg px-3 py-2.5 transition-colors ${
                            isHighlighted
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-accent/40'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {Icon && <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                              {displayVal ? (
                                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{displayVal}</p>
                              ) : (
                                <p className="text-sm mt-0.5 text-muted-foreground/50 italic">Sin datos</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
