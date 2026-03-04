import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, ImageIcon, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BUCKET = 'publicaciones-media';

function isImageUrl(val: string | null | undefined): boolean {
  if (!val) return false;
  if (val.includes('/storage/v1/object/public/')) return true;
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(val);
}

export { isImageUrl };

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  disabled?: boolean;
  compact?: boolean;
}

export default function ImageUpload({ value, onChange, label = 'imagen', disabled = false, compact = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 10 MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      onChange(data.publicUrl);
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error('Error al subir: ' + (err.message || 'intenta de nuevo'));
    }
    setUploading(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) upload(file);
  };

  // ── Has image ────────────────────────────────────────────────────────────
  if (value && isImageUrl(value)) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-md overflow-hidden border cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
            onClick={() => setLightbox(true)}
          >
            <img src={value} alt={label} className="h-full w-full object-cover" />
          </div>
          {!disabled && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-primary hover:underline"
              >
                Cambiar
              </button>
              <button type="button" onClick={() => onChange(null)} className="text-xs text-destructive hover:underline">
                Quitar
              </button>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {lightbox && <Lightbox src={value} label={label} onClose={() => setLightbox(false)} />}
        </div>
      );
    }

    return (
      <>
        <div className="relative group rounded-xl overflow-hidden border shadow-sm bg-muted/20">
          <img
            src={value}
            alt={label}
            className="w-full max-h-56 object-cover cursor-zoom-in"
            onClick={() => setLightbox(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button type="button" size="sm" variant="secondary" className="gap-1.5 shadow" onClick={() => setLightbox(true)}>
              <ZoomIn className="h-4 w-4" /> Ver
            </Button>
            {!disabled && (
              <>
                <Button type="button" size="sm" variant="secondary" className="gap-1.5 shadow" onClick={() => inputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Cambiar
                </Button>
                <Button type="button" size="sm" variant="destructive" className="shadow" onClick={() => onChange(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {lightbox && <Lightbox src={value} label={label} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  // ── No image yet ─────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-dashed transition-colors',
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
          )}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? 'Subiendo…' : 'Subir'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={disabled || uploading} />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-center transition-colors',
        disabled || uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40 hover:bg-primary/3'
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Subiendo imagen…</p>
        </>
      ) : (
        <>
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Arrastra una imagen aquí</p>
            <p className="text-xs text-muted-foreground mt-0.5">o haz click para seleccionar</p>
          </div>
          <p className="text-xs text-muted-foreground/50">PNG, JPG, WEBP — máx. 10 MB</p>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={disabled || uploading} />
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <X className="h-5 w-5 text-white" />
      </button>
      <img
        src={src}
        alt={label}
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
