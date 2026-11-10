import { altFotoTrabajo } from "@/lib/alt-imagenes";
import type { FotoTrabajo } from "@/lib/portafolio-completo";

/** Miniatura de foto de trabajo (mockup Perfil, sección "Trabajos"). El ALT sale de lib/alt-imagenes.ts. */
export function FotoTrabajo({ foto, oficio, posicion, total }: { foto: FotoTrabajo; oficio?: string | null; posicion?: number; total?: number }) {
  return (
    <div className="aspect-square rounded-[14px] lg:rounded-2xl overflow-hidden bg-borde-suave">
      <img
        src={foto.rutaMiniatura ?? foto.ruta}
        alt={altFotoTrabajo(foto, oficio, posicion, total)}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
