import type { MetadataRoute } from "next";
import { absoluta, INDEXABLE } from "@/lib/seo";

/**
 * Rutas que Google no debe rastrear: el backoffice, la API y las zonas con sesión (panel y cuenta), que solo devuelven un
 * redireccionamiento al ingreso. Las pantallas públicas que no queremos en el índice (ingreso, formularios, calificar, resultados
 * filtrados) NO se bloquean aquí: llevan `noindex` y Google solo puede leer esa directiva si puede rastrearlas.
 */
export const RUTAS_BLOQUEADAS = ["/admin", "/api/", "/panel", "/cuenta"];

/**
 * Rastreadores de IA que se invitan expresamente (buscadores con IA y asistentes): OpenAI (GPTBot, OAI-SearchBot, ChatGPT-User),
 * Anthropic (ClaudeBot, Claude-User, Claude-SearchBot), Perplexity, Google (Google-Extended para Gemini), Apple, Common Crawl, Meta y Amazon.
 * Es una decisión del negocio: contenido público abierto para que la IA lo lea y recomiende a los proveedores. Se bloquean las mismas rutas privadas.
 */
export const RASTREADORES_IA = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Amazonbot", "cohere-ai",
];

/** robots.txt: abierto solo en producción. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: RUTAS_BLOQUEADAS },
      { userAgent: RASTREADORES_IA, allow: "/", disallow: RUTAS_BLOQUEADAS },
    ],
    sitemap: absoluta("/sitemap.xml"),
    host: absoluta("/"),
  };
}
