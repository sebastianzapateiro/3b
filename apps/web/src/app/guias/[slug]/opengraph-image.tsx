import { imagenOg, TAM_OG } from "@/lib/og";
import { guiaPorSlug } from "@/lib/guias";

export const alt = "Las 3B";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const g = guiaPorSlug((await params).slug);
  return imagenOg({ etiqueta: "Guía", titulo: g?.titulo ?? "Guías para contratar", detalle: g?.resumen });
}
