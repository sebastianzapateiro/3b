import type { MetadataRoute } from "next";
import { inArray, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { CATEGORIAS, LOCALIDADES_BOGOTA, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { absoluta } from "@/lib/seo";

/**
 * sitemap.xml (RNF-03): páginas fijas, categorías, servicios, localidades, guías, portafolios publicados (regla 6)
 * y las combinaciones servicio + localidad que ya tienen al menos un proveedor real.
 */
export const revalidate = 3600;

type Entrada = MetadataRoute.Sitemap[number];
const pagina = (ruta: string, prioridad: number, frecuencia: Entrada["changeFrequency"], modificado?: Date | string): Entrada => ({
  url: absoluta(ruta),
  changeFrequency: frecuencia,
  priority: prioridad,
  ...(modificado ? { lastModified: modificado } : {}),
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [
    pagina("/", 1, "daily"),
    pagina("/categorias", 0.8, "weekly"),
    pagina("/como-funciona", 0.7, "monthly"),
    pagina("/localidades", 0.8, "weekly"),
    pagina("/guias", 0.7, "weekly"),
    pagina("/terminos", 0.3, "yearly"),
    pagina("/privacidad", 0.3, "yearly"),
    pagina("/terminos-proveedores", 0.3, "yearly"),
    pagina("/retiro-de-contenido", 0.2, "yearly"),
    pagina("/cookies", 0.2, "yearly"),
    pagina("/resenas", 0.3, "yearly"),
    pagina("/reclamos", 0.3, "yearly"),
    ...CATEGORIAS.map((c) => pagina(`/categorias/${c.slug}`, 0.8, "weekly")),
    ...TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => pagina(`/servicios/${sub.slug}`, 0.8, "weekly")),
    ...LOCALIDADES_BOGOTA.map((l) => pagina(`/localidades/${l.slug}`, 0.7, "weekly")),
    ...GUIAS.map((g) => pagina(`/guias/${g.slug}`, 0.6, "monthly", g.fecha)),
  ];

  try {
    const proveedores = await db
      .select({ slug: schema.proveedores.slug, actualizado: schema.proveedores.updatedAt })
      .from(schema.proveedores)
      .where(inArray(schema.proveedores.estado, ["aprobado", "en_revision"]));
    for (const p of proveedores) paginas.push(pagina(`/${p.slug}`, 0.8, "weekly", p.actualizado));

    const combos = (await db.execute(sql`
      SELECT DISTINCT c.slug AS sub, l.slug AS localidad
      FROM proveedores p
      JOIN proveedor_categorias pc ON pc.proveedor_id = p.id
      JOIN categorias c ON c.id = pc.categoria_id
      JOIN proveedor_localidades pl ON pl.proveedor_id = p.id
      JOIN localidades l ON l.id = pl.localidad_id
      WHERE p.estado IN ('aprobado','en_revision')`)) as unknown as { sub: string; localidad: string }[];
    for (const c of combos) paginas.push(pagina(`/servicios/${c.sub}/${c.localidad}`, 0.7, "weekly"));
  } catch (e) {
    console.error("[sitemap] No se pudieron leer los proveedores", e);
  }

  return paginas;
}
