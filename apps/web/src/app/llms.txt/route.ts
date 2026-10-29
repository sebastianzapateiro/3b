/**
 * /llms.txt · Resumen del sitio para buscadores con IA (ChatGPT, Perplexity, Gemini, Claude…).
 * Estándar propuesto en llmstxt.org: describe qué es el sitio y enlaza lo más útil, en Markdown.
 */
import { CATEGORIAS } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { absoluta } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const l = (t: string, ruta: string, d?: string) => `- [${t}](${absoluta(ruta)})${d ? `: ${d}` : ""}`;
  const cuerpo = [
    "# LasTresB (LasTresB)",
    "",
    "> Directorio gratuito de servicios y oficios en Bogotá, Colombia. La persona busca por servicio y localidad, compara reseñas de clientes reales y contacta al proveedor directo por WhatsApp. Sin comisiones. LasTresB es un portal de contacto: no intermedia pagos ni garantiza el servicio.",
    "",
    "Datos clave: solo Bogotá (20 localidades). Proveedores con identidad y WhatsApp verificados. Una reseña por contacto. Idioma: español de Colombia.",
    "",
    "## Categorías y servicios",
    ...CATEGORIAS.flatMap((c) => [l(c.nombre, `/categorias/${c.slug}`, c.descripcion), ...c.subcategorias.map((s) => `  ${l(`${s.nombre} en Bogotá`, `/servicios/${s.slug}`)}`)]),
    "",
    "## Cómo funciona",
    l("¿Cómo funciona LasTresB?", "/como-funciona", "paso a paso para buscar y para ofrecer servicios"),
    l("Servicios por localidad", "/localidades"),
    l("Nosotros", "/nosotros", "qué es LasTresB y qué no es"),
    l("Contacto", "/contacto"),
    "",
    "## Guías para contratar con confianza",
    ...GUIAS.map((g) => l(g.titulo, `/guias/${g.slug}`, g.resumen)),
    "",
    "## Legal",
    l("Términos de uso", "/terminos"),
    l("Términos para proveedores", "/terminos-proveedores"),
    l("Tratamiento de datos personales", "/privacidad"),
    l("Retiro de contenido y derechos de autor", "/retiro-de-contenido"),
    l("Política de reseñas", "/resenas"),
    l("Política de cookies", "/cookies"),
    l("Reclamos", "/reclamos"),
    "",
    `Mapa del sitio: ${absoluta("/sitemap.xml")}`,
    "",
  ].join("\n");
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
