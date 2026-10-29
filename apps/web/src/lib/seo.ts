/**
 * SEO (RNF-03): URL canónica, indexación por ambiente y datos estructurados (schema.org).
 * Solo producción se indexa; preview, staging y local llevan noindex y robots.txt cerrado.
 */
import type { Metadata } from "next";
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
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: absoluta("/reclamos"), areaServed: "CO", availableLanguage: "es" },
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
  /** Reseñas reales publicadas en la página (se muestran al visitante). */
  resenas?: { autor: string; estrellas: number; texto: string | null; fecha: Date }[];
  /** Servicios con precio orientativo («desde»). */
  ofertas?: { nombre: string; precioDesde: string | null }[];
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
    inLanguage: "es-CO",
    hasOfferCatalog: p.ofertas?.length
      ? {
          "@type": "OfferCatalog",
          name: `Servicios de ${p.nombre}`,
          itemListElement: p.ofertas.map((o) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: o.nombre, areaServed: "Bogotá, Colombia" },
            ...(o.precioDesde ? { priceSpecification: { "@type": "PriceSpecification", minPrice: Number(o.precioDesde), priceCurrency: "COP" } } : {}),
          })),
        }
      : undefined,
    review: p.resenas?.length
      ? p.resenas.map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.autor },
          datePublished: r.fecha.toISOString().slice(0, 10),
          reviewBody: r.texto ?? undefined,
          reviewRating: { "@type": "Rating", ratingValue: r.estrellas, bestRating: 5, worstRating: 1 },
        }))
      : undefined,
    areaServed: p.localidades.map((nombre) => ({ "@type": "AdministrativeArea", name: `${nombre}, Bogotá` })),
    address: { "@type": "PostalAddress", addressLocality: "Bogotá", addressRegion: "Bogotá D.C.", addressCountry: "CO" },
    aggregateRating:
      p.calificacion && p.calificacion.total > 0
        ? { "@type": "AggregateRating", ratingValue: p.calificacion.promedio.toFixed(1), reviewCount: p.calificacion.total, bestRating: 5, worstRating: 1 }
        : undefined,
  };
}

/** Guía (artículo editorial): habilita fragmentos de artículo en Google. */
export function jsonLdArticulo(a: { titulo: string; resumen: string; ruta: string; fecha: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titulo,
    description: a.resumen,
    url: absoluta(a.ruta),
    mainEntityOfPage: absoluta(a.ruta),
    datePublished: a.fecha,
    dateModified: a.fecha,
    inLanguage: "es-CO",
    author: { "@id": absoluta("/#organizacion") },
    publisher: { "@id": absoluta("/#organizacion") },
  };
}

/** Listado de enlaces (categorías, localidades, guías) como página de colección. */
export function jsonLdLista(nombre: string, items: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nombre,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.nombre, url: absoluta(it.ruta) })),
  };
}

export function jsonLdMigas(items: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.nombre, item: absoluta(it.ruta) })),
  };
}

/** Metadatos completos y consistentes para una página: título, descripción, canonical, Open Graph, X y robots. */
export function meta(o: { titulo: string; descripcion: string; ruta: string; tipo?: "website" | "article" | "profile"; noindex?: boolean; fecha?: string }): Metadata {
  const titulo = o.titulo.includes(MARCA.nombre) || o.titulo.includes("LasTresB") ? o.titulo : `${o.titulo} | LasTresB`;
  return {
    title: { absolute: titulo },
    description: o.descripcion,
    alternates: { canonical: o.ruta, languages: { "es-CO": o.ruta } },
    openGraph: { type: o.tipo ?? "website", locale: "es_CO", siteName: MARCA.nombre, title: titulo, description: o.descripcion, url: o.ruta, ...(o.fecha ? { publishedTime: o.fecha } : {}) },
    twitter: { card: "summary_large_image", title: titulo, description: o.descripcion },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Servicio ofrecido en Bogotá (o en una localidad): habilita la comprensión del tema de la página. */
export function jsonLdServicio(s: { nombre: string; descripcion: string; ruta: string; categoria: string; localidad?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluta(s.ruta)}#servicio`,
    name: s.nombre,
    description: s.descripcion,
    url: absoluta(s.ruta),
    serviceType: s.categoria,
    inLanguage: "es-CO",
    provider: { "@id": absoluta("/#organizacion") },
    areaServed: s.localidad
      ? { "@type": "AdministrativeArea", name: `${s.localidad}, Bogotá`, containedInPlace: { "@type": "City", name: "Bogotá" } }
      : { "@type": "City", name: "Bogotá", containedInPlace: { "@type": "Country", name: "Colombia" } },
  };
}

/** Página de colección (listados de categorías, localidades, guías, servicios). */
export function jsonLdColeccion(c: { nombre: string; descripcion: string; ruta: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c.nombre,
    description: c.descripcion,
    url: absoluta(c.ruta),
    inLanguage: "es-CO",
    isPartOf: { "@id": absoluta("/#sitio") },
  };
}