/**
 * sitemap.xml (RNF-03) · Arma la lista de URLs a partir de los datos ya leídos. Es una función pura (sin base de datos) para poder
 * probar qué entra y qué no. Solo URLs indexables: lo fijo, más lo que depende de la oferta real (ver lib/indexacion.ts).
 */
import type { MetadataRoute } from "next";
import { CATEGORIAS, LOCALIDADES_BOGOTA, rutaPrincipalProveedor, subcategoriaPorSlug } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { absoluta } from "@/lib/seo";

export type DatosSitemap = {
  /** Proveedores con ficha indexable (FICHA_INDEXABLE_SQL), con los nombres de sus oficios. */
  proveedores: { slug: string; actualizado: string; oficios: string[] }[];
  /** Localidades con proveedores suficientes (localidadesIndexables). */
  localidades: string[];
  oficios: { oficio: string; total: number; urgentes: number; conPrecio: number; modificado: string | null }[];
  combinaciones: { oficio: string; localidad: string; total: number; modificado: string | null }[];
  /** Mínimo de proveedores para publicar una página de oficio (`min_proveedores_seo`). */
  minimo: number;
};

type Entrada = MetadataRoute.Sitemap[number];
const pagina = (ruta: string, prioridad: number, frecuencia: Entrada["changeFrequency"], modificado?: Date | string): Entrada => ({
  url: absoluta(ruta),
  changeFrequency: frecuencia,
  priority: prioridad,
  ...(modificado ? { lastModified: modificado } : {}),
});

/** Páginas que siempre se indexan, tengan o no oferta. */
export function paginasFijas(): MetadataRoute.Sitemap {
  return [
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
}

export function construirSitemap(d: DatosSitemap): MetadataRoute.Sitemap {
  const paginas = paginasFijas();

  // Localidades: solo las que tienen proveedores (las demás funcionan para el usuario, con noindex).
  for (const slug of d.localidades) if (LOCALIDADES_BOGOTA.some((l) => l.slug === slug)) paginas.push(pagina(`/localidades/${slug}`, 0.7, "weekly"));

  // Una sola URL por proveedor: la principal (oficio principal). Las de sus otros oficios tienen el mismo contenido y su canonical
  // apunta a esta, así que no van en el sitemap (lib/ficha-seo.ts).
  for (const p of d.proveedores) {
    if (p.oficios.length === 0) continue; // una ficha sin oficio no es indexable (lib/indexacion.ts)
    paginas.push(pagina(rutaPrincipalProveedor(p.slug, p.oficios), 0.8, "weekly", p.actualizado));
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

  // Sin repetidas: dos oficios del mismo proveedor pueden dar la misma ruta.
  const vistas = new Set<string>();
  return paginas.filter((e) => (vistas.has(e.url) ? false : (vistas.add(e.url), true)));
}
