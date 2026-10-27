import type { MetadataRoute } from "next";
import { inArray } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { absoluta } from "@/lib/seo";

/**
 * sitemap.xml: home + portafolios publicados (regla 6: solo aprobado / en_revision).
 * Al construir P2, agregar las páginas "categoría + localidad" (RNF-03).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [{ url: absoluta("/"), changeFrequency: "daily", priority: 1 }];

  try {
    const proveedores = await db
      .select({ slug: schema.proveedores.slug, actualizado: schema.proveedores.updatedAt })
      .from(schema.proveedores)
      .where(inArray(schema.proveedores.estado, ["aprobado", "en_revision"]));
    for (const p of proveedores) {
      paginas.push({ url: absoluta(`/${p.slug}`), lastModified: p.actualizado, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch (e) {
    console.error("[sitemap] No se pudieron leer los proveedores", e);
  }

  return paginas;
}
