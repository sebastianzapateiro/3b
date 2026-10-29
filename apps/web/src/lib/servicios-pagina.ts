/**
 * Carga de datos y regla de publicación de las páginas SEO /servicios/[oficio]... (ver lib/publicacion.ts).
 * Devuelve `publicar`: «si» (indexable), «noindex» (solo la página general de un oficio sin proveedores suficientes) o «no» (404).
 */
import { LOCALIDADES_BOGOTA, subcategoriaPorSlug } from "@las3b/shared";
import { buscarProveedores, type PaginaResultados } from "@/lib/busqueda";
import { conteosPorOficio, localidadesConProveedores, minProveedoresSeo, preciosDesde } from "@/lib/publicacion";
import type { Variante } from "@/lib/seo-servicios";

const VACIO: PaginaResultados = { items: [], total: 0, pagina: 1, porPagina: 10, categoriaNombre: null };

export async function cargarPaginaServicio(o: { oficio: string; variante: Variante; localidad?: string }) {
  const hallado = subcategoriaPorSlug(o.oficio);
  if (!hallado) return null;
  const localidad = o.localidad ? LOCALIDADES_BOGOTA.find((l) => l.slug === o.localidad) : undefined;
  if (o.localidad && !localidad) return null;
  if (o.variante === "urgente" && !hallado.sub.atiendeUrgencias) return null;

  const minimo = await minProveedoresSeo();
  const resultado = await buscarProveedores({
    categoria: o.oficio,
    localidad: localidad?.slug,
    urgencias: o.variante === "urgente",
    conPrecio: o.variante === "economico",
    orden: o.variante === "economico" ? "precio" : undefined,
  }).catch(() => VACIO);

  const suficiente = resultado.total >= minimo;
  const publicar: "si" | "noindex" | "no" = suficiente ? "si" : o.variante === "base" ? "noindex" : "no";

  const conteos = await conteosPorOficio().catch(() => []);
  const mio = conteos.find((c) => c.oficio === o.oficio);
  return {
    ...hallado,
    variante: o.variante,
    localidad,
    resultado,
    suficiente,
    publicar,
    minimo,
    precios: await preciosDesde(o.oficio, localidad?.slug).catch(() => []),
    localidadesFuertes: await localidadesConProveedores(o.oficio, minimo).catch(() => []),
    variantesPublicadas: {
      urgente: hallado.sub.atiendeUrgencias && (mio?.urgentes ?? 0) >= minimo,
      economico: (mio?.conPrecio ?? 0) >= minimo,
    },
  };
}