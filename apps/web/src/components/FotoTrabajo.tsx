import type { FotoTrabajo } from "@/lib/portafolio-completo";

/** Miniatura de foto de trabajo (mockup Perfil, sección "Trabajos"). */
export function FotoTrabajo({ foto }: { foto: FotoTrabajo }) {
  return (
    <div
      className="aspect-square rounded-[14px] lg:rounded-2xl overflow-hidden bg-borde-suave"
     
    >
      <img
        src={foto.rutaMiniatura ?? foto.ruta}
        alt={foto.descripcion ?? "Foto de trabajo"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
