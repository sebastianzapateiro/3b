import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaServicio } from "@/components/PaginaServicio";
import { cargarPaginaServicio } from "@/lib/servicios-pagina";
import { descripcion, titulo, type Variante } from "@/lib/seo-servicios";
import { meta } from "@/lib/seo";

/** SEO programático (P2). Regla de publicación: lib/publicacion.ts. ISR diario: las páginas aparecen solas al haber proveedores. */
export const revalidate = 86400;
type Props = { params: Promise<{ sub: string }> };
const VARIANTE: Variante = "urgente";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await cargarPaginaServicio({ oficio: (await params).sub, variante: VARIANTE });
  if (!d || d.publicar === "no") return {};
  return meta({ titulo: titulo(d.sub, VARIANTE), descripcion: descripcion(d.sub, VARIANTE), ruta: `/servicios/${d.sub.slug}/urgente` });
}

export default async function Servicio_urgente({ params }: Props) {
  const d = await cargarPaginaServicio({ oficio: (await params).sub, variante: VARIANTE });
  if (!d || d.publicar === "no") notFound();
  return <PaginaServicio {...d} />;
}