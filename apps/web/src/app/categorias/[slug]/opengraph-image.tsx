import { imagenOg, TAM_OG } from "@/lib/og";
import { categoriaPorSlug } from "@las3b/shared";

export const alt = "Las 3B";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const c = categoriaPorSlug((await params).slug);
  return imagenOg({ etiqueta: "Categoría", titulo: `${c?.nombre ?? "Categorías"} en Bogotá`, detalle: c?.descripcion });
}
