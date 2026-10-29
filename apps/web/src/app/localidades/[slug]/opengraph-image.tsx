import { imagenOg, TAM_OG } from "@/lib/og";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";

export const alt = "LasTresB";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const slugLocalidad = (await params).slug;
  const l = LOCALIDADES_BOGOTA.find((x) => x.slug === slugLocalidad);
  return imagenOg({ etiqueta: "Localidad", titulo: `Servicios y oficios en ${l?.nombre ?? "Bogotá"}`, detalle: "Plomería, electricidad, clases, acarreos y más. Escríbeles por WhatsApp, sin comisiones." });
}
