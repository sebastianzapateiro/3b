/**
 * P2 · Regla de publicación de las páginas SEO por oficio (evita páginas vacías).
 * Una página solo se genera, se indexa y entra al sitemap si hay al menos MIN_PROVEEDORES_SEO proveedores
 * aprobados que cumplan su condición. El mínimo es un parámetro de `configuracion` (clave `min_proveedores_seo`, CU-79).
 */
import { eq, sql } from "drizzle-orm";
import { db, schema, consultar } from "@las3b/db";

export const MIN_PROVEEDORES_SEO_POR_DEFECTO = 3;

export async function minProveedoresSeo(): Promise<number> {
  try {
    const [c] = await db.select({ valor: schema.configuracion.valor }).from(schema.configuracion).where(eq(schema.configuracion.clave, "min_proveedores_seo")).limit(1);
    const n = Number(c?.valor);
    return Number.isFinite(n) && n > 0 ? n : MIN_PROVEEDORES_SEO_POR_DEFECTO;
  } catch {
    return MIN_PROVEEDORES_SEO_POR_DEFECTO;
  }
}

const filas = <T,>(r: unknown) => r as T[];

export type ConteoOficio = { oficio: string; total: number; urgentes: number; conPrecio: number; modificado: Date | null };
export type ConteoLocal = { oficio: string; localidad: string; total: number; modificado: Date | null };

const TIENE_PRECIO = sql`EXISTS (SELECT 1 FROM servicios_proveedor s WHERE s.proveedor_id = p.id AND s.visible AND s.precio_desde IS NOT NULL)`;

/** Conteos por oficio de proveedores aprobados (visibles): total, con urgencias/24 h y con precio publicado. */
export async function conteosPorOficio(): Promise<ConteoOficio[]> {
  return filas<ConteoOficio>(
    await consultar(sql`
      SELECT c.slug AS oficio,
             count(DISTINCT p.id)::int AS total,
             count(DISTINCT p.id) FILTER (WHERE p.atiende_urgencias OR p.disponible_24h)::int AS urgentes,
             count(DISTINCT p.id) FILTER (WHERE ${TIENE_PRECIO})::int AS "conPrecio",
             max(p.updated_at) AS modificado
      FROM proveedores p
      JOIN proveedor_categorias pc ON pc.proveedor_id = p.id
      JOIN categorias c ON c.id = pc.categoria_id
      WHERE p.estado IN ('aprobado','en_revision') AND c.activa
      GROUP BY c.slug`),
  );
}

/** Conteos por oficio y localidad. */
export async function conteosPorOficioYLocalidad(): Promise<ConteoLocal[]> {
  return filas<ConteoLocal>(
    await consultar(sql`
      SELECT c.slug AS oficio, l.slug AS localidad, count(DISTINCT p.id)::int AS total, max(p.updated_at) AS modificado
      FROM proveedores p
      JOIN proveedor_categorias pc ON pc.proveedor_id = p.id
      JOIN categorias c ON c.id = pc.categoria_id
      JOIN proveedor_localidades pl ON pl.proveedor_id = p.id
      JOIN localidades l ON l.id = pl.localidad_id
      WHERE p.estado IN ('aprobado','en_revision') AND c.activa
      GROUP BY c.slug, l.slug`),
  );
}

/** Localidades con más proveedores para un oficio (solo las que ya cumplen el mínimo): enlaces internos seguros. */
export async function localidadesConProveedores(oficio: string, minimo: number, limite = 6) {
  const filasLocales = await conteosPorOficioYLocalidad();
  return filasLocales
    .filter((f) => f.oficio === oficio && f.total >= minimo)
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)
    .map((f) => f.localidad);
}

/** «Precio desde» más bajo de cada proveedor visible del oficio (para el rango de las preguntas frecuentes). */
export async function preciosDesde(oficio: string, localidad?: string): Promise<number[]> {
  const r = filas<{ precio: string }>(
    await consultar(sql`
      SELECT min(s.precio_desde)::text AS precio
      FROM proveedores p
      JOIN proveedor_categorias pc ON pc.proveedor_id = p.id
      JOIN categorias c ON c.id = pc.categoria_id AND c.slug = ${oficio}
      JOIN servicios_proveedor s ON s.proveedor_id = p.id AND s.visible AND s.precio_desde IS NOT NULL
      ${localidad ? sql`JOIN proveedor_localidades pl ON pl.proveedor_id = p.id JOIN localidades l ON l.id = pl.localidad_id AND l.slug = ${localidad}` : sql``}
      WHERE p.estado IN ('aprobado','en_revision')
      GROUP BY p.id`),
  );
  return r.map((x) => Number(x.precio)).filter((n) => Number.isFinite(n));
}
