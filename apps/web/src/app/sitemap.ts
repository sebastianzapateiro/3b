import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { consultar } from "@las3b/db";
import { CATEGORIAS, LOCALIDADES_BOGOTA, rutaProveedor, subcategoriaPorSlug } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { FICHA_INDEXABLE_SQL, localidadesIndexables } from "@/lib/indexacion";
import { conteosPorOficio, conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";
import { absoluta } from "@/lib/seo";

/**
 * sitemap.xml (RNF-03): solo URLs que se pueden indexar. Páginas fijas, categorías, guías, y lo que depende de la oferta real:
 * localidades con proveedores, servicios que cumplen el mínimo, y fichas de proveedores aprobados con perfil completo (lib/indexacion.ts).
 * Se genera en cada solicitud (no al compilar: entonces la base no responde y salía sin proveedores) y se guarda 15 minutos.
 * Si la base falla, la consulta lanza el error y NO se guarda: sale solo lo estático y se reintenta en la siguiente solicitud.
 */
export const dynamic = "force-dynamic";

type Entrada = MetadataRoute.Sitemap[number];
const pagina = (ruta: string, prioridad: number, frecuencia: Entrada["changeFrequency"], modificado?: Date | string): Entrada => ({
  url: absoluta(ruta),
  changeFrequency: frecuencia,
  priority: prioridad,
  ...(modificado ? { lastModified: modificado } : {}),
});

type Dinamico = {
  proveedores: { slug: string; actualizado: string; oficios: string[] }[];
  localidades: string[];
  oficios: { oficio: string; total: number; urgentes: number; conPrecio: number; modificado: string | null }[];
  combinaciones: { oficio: string; localidad: string; total: number; modificado: string | null }[];
  minimo: number;
};

const leerDinamico = unstable_cache(
  async (): Promise<Dinamico> => {
    const proveedores = (await consultar(sql`
      SELECT p.slug, p.updated_at AS actualizado,
             coalesce((SELECT array_agg(c.nombre) FROM proveedor_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.proveedor_id = p.id AND c.activa), ARRAY[]::text[]) AS oficios
      FROM proveedores p
      WHERE ${FICHA_INDEXABLE_SQL}`)) as unknown as { slug: string; actualizado: Date; oficios: string[] }[];
    const localidades = await localidadesIndexables();
    if (localidades === null) throw new Error("No se pudieron leer las localidades");
    const aTexto = (d: Date | null) => (d ? new Date(d).toISOString() : null);
    return {
      proveedores: proveedores.map((p) => ({ slug: p.slug, actualizado: new Date(p.actualizado).toISOString(), oficios: p.oficios })),
      localidades: [...localidades],
      oficios: (await conteosPorOficio()).map((c) => ({ ...c, modificado: aTexto(c.modificado) })),
      combinaciones: (await conteosPorOficioYLocalidad()).map((c) => ({ ...c, modificado: aTexto(c.modificado) })),
      minimo: await minProveedoresSeo(),
    };
  },
  ["sitemap-dinamico"],
  { revalidate: 900 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = [
    pagina("/", 1, "daily"),
    pagina("/proveedores", 0.8, "weekly"),
    pagina("/como-funciona", 0.7, "monthly"),
    pagina("/localidades", 0.8, "weekly"),
    pagina("/guias", 0.7, "weekly"),
    pagina("/nosotros", 0.6, "yearly"),
    pagina("/contacto", 0.5, "yearly"),
    pagina("/terminos", 0.3, "yearly"),
    pagina("/privacidad", 0.3, "yearly"),
    pagina("/terminos-proveedores", 0.3, "yearly"),
    pagina("/retiro-de-contenido", 0.2, "yearly"),
    pagina("/cookies", 0.2, "yearly"),
    pagina("/resenas", 0.3, "yearly"),
    pagina("/reclamos", 0.3, "yearly"),
    ...CATEGORIAS.map((c) => pagina(`/categorias/${c.slug}`, 0.8, "weekly")),
    ...GUIAS.map((g) => pagina(`/guias/${g.slug}`, 0.6, "monthly", g.fecha)),
  ];

  try {
    const d = await leerDinamico();

    // Localidades: solo las que tienen proveedores (las demás siguen funcionando para el usuario, con noindex).
    for (const slug of d.localidades) if (LOCALIDADES_BOGOTA.some((l) => l.slug === slug)) paginas.push(pagina(`/localidades/${slug}`, 0.7, "weekly"));

    // URL estándar /nombre/oficio: una por cada oficio del proveedor.
    for (const p of d.proveedores) {
      if (p.oficios.length === 0) paginas.push(pagina(`/${p.slug}`, 0.8, "weekly", p.actualizado));
      for (const o of p.oficios) paginas.push(pagina(rutaProveedor(p.slug, o), 0.8, "weekly", p.actualizado));
    }

    // Páginas por oficio: solo las que cumplen la regla de publicación (lib/publicacion.ts).
    for (const c of d.oficios) {
      const hallado = subcategoriaPorSlug(c.oficio);
      if (!hallado) continue;
      const mod = c.modificado ?? undefined;
      if (c.total >= d.minimo) paginas.push(pagina(`/servicios/${c.oficio}`, 0.8, "weekly", mod));
      if (hallado.sub.atiendeUrgencias && c.urgentes >= d.minimo) paginas.push(pagina(`/servicios/${c.oficio}/urgente`, 0.7, "weekly", mod));
      if (c.conPrecio >= d.minimo) paginas.push(pagina(`/servicios/${c.oficio}/economico`, 0.7, "weekly", mod));
    }
    for (const c of d.combinaciones) {
      if (c.total < d.minimo || !subcategoriaPorSlug(c.oficio) || !LOCALIDADES_BOGOTA.some((l) => l.slug === c.localidad)) continue;
      paginas.push(pagina(`/servicios/${c.oficio}/${c.localidad}`, 0.7, "weekly", c.modificado ?? undefined));
    }
  } catch (e) {
    console.warn("[sitemap] No se pudo leer la oferta; sale solo lo estático:", e instanceof Error ? e.message : e);
  }
  return paginas;
}
