/** /guias/feed.xml · Canal RSS de las guías (lectores, agregadores y descubrimiento de contenido). */
import { MARCA } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { absoluta } from "@/lib/seo";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = GUIAS.map(
    (g) => `    <item>
      <title>${esc(g.titulo)}</title>
      <link>${absoluta(`/guias/${g.slug}`)}</link>
      <guid isPermaLink="true">${absoluta(`/guias/${g.slug}`)}</guid>
      <pubDate>${new Date(g.fecha).toUTCString()}</pubDate>
      <description>${esc(g.resumen)}</description>
    </item>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Guías de ${esc(MARCA.nombre)}</title>
    <link>${absoluta("/guias")}</link>
    <atom:link href="${absoluta("/guias/feed.xml")}" rel="self" type="application/rss+xml" />
    <description>Consejos para contratar servicios y oficios en Bogotá con confianza.</description>
    <language>es-co</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
