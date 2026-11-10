import type { FotoTrabajo } from "@/lib/portafolio-completo";

/** Miniatura de foto de trabajo (mockup Perfil, sección "Trabajos"). */
export function FotoTrabajo({ foto, proveedor }: { foto: FotoTrabajo; proveedor?: string }) {
  return (
    <div
      className="aspect-square rounded-[14px] lg:rounded-2xl overflow-hidden bg-borde-suave"
     
    >
      <img
        src={foto.rutaMiniatura ?? foto.ruta}
        alt={foto.descripcion ?? (proveedor ? `Trabajo realizado por ${proveedor}` : "Foto de trabajo")}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
