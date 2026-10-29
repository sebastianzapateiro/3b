import { imagenOg, TAM_OG } from "@/lib/og";
import { subcategoriaPorSlug } from "@las3b/shared";

export const alt = "LasTresB";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ sub: string }> }) {
  const s = subcategoriaPorSlug((await params).sub);
  return imagenOg({ etiqueta: s?.padre.nombre ?? "Servicios", titulo: `${s?.sub.nombre ?? "Servicios"} en Bogotá`, detalle: "Proveedores verificados, reseñas reales y contacto directo por WhatsApp." });
}
