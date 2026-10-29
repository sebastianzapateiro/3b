import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALIDADES_BOGOTA, subcategoriaPorSlug } from "@las3b/shared";
import { PaginaServicio } from "@/components/PaginaServicio";
import { buscarProveedores, type PaginaResultados } from "@/lib/busqueda";
import { meta } from "@/lib/seo";

/**
 * SEO programático local (P2): /servicios/plomeria/suba → «Plomería en Suba, Bogotá».
 * Se genera bajo demanda y se indexa solo si hay al menos un proveedor real (evita páginas vacías o «thin content»).
 */
export const revalidate = 3600;

type Props = { params: Promise<{ sub: string; localidad: string }> };

const VACIO: PaginaResultados = { items: [], total: 0, pagina: 1, porPagina: 6, categoriaNombre: null };

async function cargar(p: { sub: string; localidad: string }) {
  const hallado = subcategoriaPorSlug(p.sub);
  const localidad = LOCALIDADES_BOGOTA.find((l) => l.slug === p.localidad);
  if (!hallado || !localidad) return null;
  const resultado = await buscarProveedores({ categoria: hallado.sub.slug, localidad: localidad.slug }).catch(() => VACIO);
  return { ...hallado, localidad, resultado };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await cargar(await params);
  if (!d) return {};
  const { sub } = d;
  return meta({
    titulo: `${sub.nombre} en ${d.localidad.nombre}, Bogotá: proveedores verificados`,
    descripcion: `Encuentra ${sub.nombre.toLowerCase()} en ${d.localidad.nombre}, Bogotá. Compara reseñas de clientes reales y escríbeles directo por WhatsApp, sin comisiones.`,
    ruta: `/servicios/${sub.slug}/${d.localidad.slug}`,
    noindex: d.resultado.total === 0,
  });
}

export default async function ServicioLocal({ params }: Props) {
  const d = await cargar(await params);
  if (!d) notFound();
  return <PaginaServicio sub={d.sub} padre={d.padre} localidad={d.localidad} resultado={{ ...d.resultado, items: d.resultado.items.slice(0, 6) }} />;
}
