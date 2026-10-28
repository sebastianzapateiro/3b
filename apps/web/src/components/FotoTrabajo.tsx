import type { FotoTrabajo } from "@/lib/portafolio-completo";

/** Miniatura de foto de trabajo (mockup Perfil, sección "Trabajos"). */
export function FotoTrabajo({ foto }: { foto: FotoTrabajo }) {
  return (
    <div
      className="aspect-[4/5] rounded-[16px] overflow-hidden bg-borde-suave"
      style={{ aspectRatio: "4/5" }}
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
