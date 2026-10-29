import { imagenOg, TAM_OG } from "@/lib/og";
import { obtenerPortafolioCompleto } from "@/lib/portafolio-completo";

export const alt = "Las 3B";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const r = await obtenerPortafolioCompleto((await params).slug).catch(() => null);
  const p = r?.tipo === "publicado" ? r.proveedor : null;
  return imagenOg({
    etiqueta: p?.categorias[0] ?? "Las 3B",
    titulo: p?.nombre ?? "Tu página en Las 3B",
    detalle: p ? `${p.categorias.join(" y ")} en ${p.localidades.slice(0, 3).join(", ") || "Bogotá"}${p.totalResenas ? ` · ${p.promedio.toFixed(1).replace(".", ",")} ★ (${p.totalResenas} reseñas)` : ""}` : undefined,
  });
}
