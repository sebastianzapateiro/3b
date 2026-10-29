import type { MetadataRoute } from "next";
import { inArray } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { CATEGORIAS, LOCALIDADES_BOGOTA, subcategoriaPorSlug } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { conteosPorOficio, conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";
import { absoluta } from "@/lib/seo";

/**
 * sitemap.xml (RNF-03): páginas fijas, categorías, servicios, localidades, guías, portafolios publicados (regla 6)
 * y las combinaciones servicio + localidad que ya tienen al menos un proveedor real.
 */
export const revalidate = 86400;

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
    ...LOCALIDADES_BOGOTA.map((l) => pagina(`/localidades/${l.slug}`, 0.7, "weekly")),
    ...GUIAS.map((g) => pagina(`/guias/${g.slug}`, 0.6, "monthly", g.fecha)),
  ];

  try {
    const proveedores = await db
      .select({ slug: schema.proveedores.slug, actualizado: schema.proveedores.updatedAt })
      .from(schema.proveedores)
      .where(inArray(schema.proveedores.estado, ["aprobado", "en_revision"]));
    for (const p of proveedores) paginas.push(pagina(`/${p.slug}`, 0.8, "weekly", p.actualizado));

    // Páginas por oficio: solo las que cumplen la regla de publicación (lib/publicacion.ts).
    const minimo = await minProveedoresSeo();
    for (const c of await conteosPorOficio()) {
      const hallado = subcategoriaPorSlug(c.oficio);
      if (!hallado) continue;
      if (c.total >= minimo) paginas.push(pagina(`/servicios/${c.oficio}`, 0.8, "weekly", c.modificado ?? undefined));
      if (hallado.sub.atiendeUrgencias && c.urgentes >= minimo) paginas.push(pagina(`/servicios/${c.oficio}/urgente`, 0.7, "weekly", c.modificado ?? undefined));
      if (c.conPrecio >= minimo) paginas.push(pagina(`/servicios/${c.oficio}/economico`, 0.7, "weekly", c.modificado ?? undefined));
    }
    for (const c of await conteosPorOficioYLocalidad()) {
      if (c.total >= minimo) paginas.push(pagina(`/servicios/${c.oficio}/${c.localidad}`, 0.7, "weekly", c.modificado ?? undefined));
    }
  } catch (e) {
    console.error("[sitemap] No se pudieron leer los proveedores", e);
  }
  return paginas;
}
