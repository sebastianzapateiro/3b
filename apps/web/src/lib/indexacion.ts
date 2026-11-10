/**
 * P7 / SEO · Cuándo una ficha de proveedor, o una localidad, se indexa y entra al sitemap (RNF-03).
 * Una sola regla para la ficha (metadatos y sitemap) y para la localidad, para que nunca se contradigan.
 *
 * Ficha: proveedor «aprobado» con perfil completo = al menos 1 oficio, 1 localidad, 1 servicio visible y una foto
 * (de perfil o de sus trabajos). Los demás (en revisión, incompletos) siguen visibles en el sitio pero con noindex y fuera del sitemap.
 * Localidad: al menos MIN_PROVEEDORES_LOCALIDAD proveedores aprobados con ficha indexable que la atiendan (1 a decisión del dueño, 10 nov 2026).
 */
import { sql } from "drizzle-orm";
import { consultar } from "@las3b/db";
import type { PortafolioCompleto } from "@/lib/portafolio-completo";

/** Mínimo de proveedores indexables para indexar la página de una localidad. */
export const MIN_PROVEEDORES_LOCALIDAD = 1;

/** Misma regla que `esFichaIndexable`, como condición SQL sobre la tabla `proveedores` con alias `p`. */
export const FICHA_INDEXABLE_SQL = sql`(
  p.estado = 'aprobado'
  AND EXISTS (SELECT 1 FROM proveedor_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.proveedor_id = p.id AND c.activa)
  AND EXISTS (SELECT 1 FROM proveedor_localidades pl WHERE pl.proveedor_id = p.id)
  AND EXISTS (SELECT 1 FROM servicios_proveedor s WHERE s.proveedor_id = p.id AND s.visible)
  AND (p.foto_perfil IS NOT NULL OR EXISTS (SELECT 1 FROM portafolio_fotos f WHERE f.proveedor_id = p.id AND f.estado = 'visible'))
)`;

export function esFichaIndexable(p: Pick<PortafolioCompleto, "estado" | "categorias" | "localidades" | "servicios" | "fotoPerfil" | "fotos">): boolean {
  return p.estado === "aprobado" && p.categorias.length > 0 && p.localidades.length > 0 && p.servicios.length > 0 && Boolean(p.fotoPerfil || p.fotos.length > 0);
}

/** Localidades con proveedores indexables suficientes. Si la consulta falla, devuelve null (no se cambia nada). */
export async function localidadesIndexables(): Promise<Set<string> | null> {
  try {
    const filas = (await consultar(sql`
      SELECT l.slug AS localidad, count(DISTINCT p.id)::int AS total
      FROM proveedores p
      JOIN proveedor_localidades pl ON pl.proveedor_id = p.id
      JOIN localidades l ON l.id = pl.localidad_id
      WHERE ${FICHA_INDEXABLE_SQL}
      GROUP BY l.slug`)) as unknown as { localidad: string; total: number }[];
    return new Set(filas.filter((f) => f.total >= MIN_PROVEEDORES_LOCALIDAD).map((f) => f.localidad));
  } catch (e) {
    console.warn("[indexacion] No se pudieron leer las localidades:", e instanceof Error ? e.message : e);
    return null;
  }
}
