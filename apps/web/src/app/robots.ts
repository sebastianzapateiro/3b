import type { MetadataRoute } from "next";
import { absoluta, INDEXABLE } from "@/lib/seo";

/**
 * Rutas que Google no debe rastrear: el backoffice, la API y las zonas con sesión (panel y cuenta), que solo devuelven un
 * redireccionamiento al ingreso. Las pantallas públicas que no queremos en el índice (ingreso, formularios, calificar, resultados
 * filtrados) NO se bloquean aquí: llevan `noindex` y Google solo puede leer esa directiva si puede rastrearlas.
 */
export const RUTAS_BLOQUEADAS = ["/admin", "/api/", "/panel", "/cuenta"];

/** robots.txt: abierto solo en producción. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: RUTAS_BLOQUEADAS },
    sitemap: absoluta("/sitemap.xml"),
    host: absoluta("/"),
  };
}
