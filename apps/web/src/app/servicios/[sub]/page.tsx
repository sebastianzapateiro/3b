import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { subcategoriaPorSlug, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { PaginaServicio } from "@/components/PaginaServicio";
import { buscarProveedores, type PaginaResultados } from "@/lib/busqueda";
import { meta } from "@/lib/seo";

/** SEO programático (P2): /servicios/plomeria → «Plomería en Bogotá». Se regenera cada hora con los proveedores reales. */
export const revalidate = 3600;

type Props = { params: Promise<{ sub: string }> };

export function generateStaticParams() {
  return TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => ({ sub: sub.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hallado = subcategoriaPorSlug((await params).sub);
  if (!hallado) return {};
  const { sub, padre } = hallado;
  return meta({
    titulo: `${sub.nombre} en Bogotá: proveedores verificados`,
    descripcion: `Encuentra ${sub.nombre.toLowerCase()} en Bogotá${sub.detalle ? ` (${sub.detalle.toLowerCase()})` : ""}. Compara reseñas reales de ${padre.nombre.toLowerCase()} y escríbeles por WhatsApp, sin comisiones.`,
    ruta: `/servicios/${sub.slug}`,
  });
}

const VACIO: PaginaResultados = { items: [], total: 0, pagina: 1, porPagina: 6, categoriaNombre: null };

export default async function Servicio({ params }: Props) {
  const hallado = subcategoriaPorSlug((await params).sub);
  if (!hallado) notFound();
  const resultado = await buscarProveedores({ categoria: hallado.sub.slug }).catch(() => VACIO);
  return <PaginaServicio sub={hallado.sub} padre={hallado.padre} resultado={{ ...resultado, items: resultado.items.slice(0, 6) }} />;
}
