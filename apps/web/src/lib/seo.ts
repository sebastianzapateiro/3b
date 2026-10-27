/**
 * SEO (RNF-03): URL canónica, indexación por ambiente y datos estructurados (schema.org).
 * Solo producción se indexa; preview, staging y local llevan noindex y robots.txt cerrado.
 */
import { MARCA } from "@las3b/shared";

export const SITIO_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${MARCA.dominio}`).replace(/\/$/, "");

export const INDEXABLE = process.env.VERCEL_ENV === "production";

export const DESCRIPCION =
  "Encuentra plomeros, electricistas, profesores particulares, acarreos y oficios de confianza en tu localidad de Bogotá. Mira reseñas reales y escríbeles directo por WhatsApp, sin comisiones.";

export const absoluta = (ruta = "/") => `${SITIO_URL}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;

/** Organización + sitio web con buscador (sitelinks search box). Va en la home. */
export function jsonLdSitio() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluta("/#organizacion"),
        name: MARCA.nombre,
        alternateName: MARCA.wordmark,
        url: absoluta("/"),
        logo: absoluta("/iconos/512"),
        slogan: MARCA.lema,
        description: DESCRIPCION,
        areaServed: { "@type": "City", name: "Bogotá", containedInPlace: { "@type": "Country", name: "Colombia" } },
      },
      {
        "@type": "WebSite",
        "@id": absoluta("/#sitio"),
        url: absoluta("/"),
        name: MARCA.nombre,
        description: DESCRIPCION,
        inLanguage: "es-CO",
        publisher: { "@id": absoluta("/#organizacion") },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absoluta("/buscar")}?q={q}` },
          "query-input": "required name=q",
        },
      },
    ],
  };
}

type ProveedorSeo = {
  slug: string;
  nombre: string;
  descripcion?: string | null;
  servicios: string[];
  localidades: string[];
  imagen?: string | null;
  /** Solo con reseñas reales y verificadas (pautas de Google: nada de calificaciones de ejemplo). */
  calificacion?: { promedio: number; total: number } | null;
};

/** Portafolio del proveedor (P7): negocio local con zona de servicio y calificación agregada. */
export function jsonLdProveedor(p: ProveedorSeo) {
  const url = absoluta(`/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#negocio`,
    name: p.nombre,
    url,
    description: p.descripcion ?? undefined,
    image: p.imagen ?? undefined,
    knowsAbout: p.servicios,
    areaServed: p.localidades.map((nombre) => ({ "@type": "AdministrativeArea", name: `${nombre}, Bogotá` })),
    address: { "@type": "PostalAddress", addressLocality: "Bogotá", addressRegion: "Bogotá D.C.", addressCountry: "CO" },
    aggregateRating:
      p.calificacion && p.calificacion.total > 0
        ? { "@type": "AggregateRating", ratingValue: p.calificacion.promedio.toFixed(1), reviewCount: p.calificacion.total, bestRating: 5, worstRating: 1 }
        : undefined,
  };
}

export function jsonLdMigas(items: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.nombre, item: absoluta(it.ruta) })),
  };
}
