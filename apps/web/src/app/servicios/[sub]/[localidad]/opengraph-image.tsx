import { imagenOg, TAM_OG } from "@/lib/og";
import { LOCALIDADES_BOGOTA, subcategoriaPorSlug } from "@las3b/shared";

export const alt = "Las 3B";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ sub: string; localidad: string }> }) {
  const p = await params;
  const s = subcategoriaPorSlug(p.sub);
  const l = LOCALIDADES_BOGOTA.find((x) => x.slug === p.localidad);
  return imagenOg({ etiqueta: s?.padre.nombre ?? "Servicios", titulo: `${s?.sub.nombre ?? "Servicios"} en ${l?.nombre ?? "Bogotá"}`, detalle: "Proveedores verificados, reseñas reales y contacto directo por WhatsApp." });
}
