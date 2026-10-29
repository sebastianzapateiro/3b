import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaServicio } from "@/components/PaginaServicio";
import { cargarPaginaServicio } from "@/lib/servicios-pagina";
import { descripcion, titulo, type Variante } from "@/lib/seo-servicios";
import { meta } from "@/lib/seo";

/** SEO programático (P2). Regla de publicación: lib/publicacion.ts. ISR diario: las páginas aparecen solas al haber proveedores. */
export const revalidate = 86400;
type Props = { params: Promise<{ sub: string; localidad: string }> };
const VARIANTE: Variante = "localidad";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const d = await cargarPaginaServicio({ oficio: p.sub, variante: VARIANTE, localidad: p.localidad });
  if (!d || d.publicar === "no" || !d.localidad) return {};
  return meta({ titulo: titulo(d.sub, VARIANTE, d.localidad.nombre), descripcion: descripcion(d.sub, VARIANTE, d.localidad.nombre), ruta: `/servicios/${d.sub.slug}/${d.localidad.slug}` });
}

export default async function ServicioLocal({ params }: Props) {
  const p = await params;
  const d = await cargarPaginaServicio({ oficio: p.sub, variante: VARIANTE, localidad: p.localidad });
  if (!d || d.publicar === "no") notFound();
  return <PaginaServicio {...d} />;
}