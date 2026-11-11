import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { consultar } from "@las3b/db";
import { urlPublica } from "@/lib/almacenamiento";
import { FICHA_INDEXABLE_SQL, localidadesIndexables } from "@/lib/indexacion";
import { conteosPorOficio, conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";
import { construirSitemap, type DatosSitemap } from "@/lib/sitemap-construir";

/**
 * sitemap.xml (RNF-03): solo URLs que se pueden indexar (reglas en lib/indexacion.ts y lib/publicacion.ts; armado en lib/sitemap-construir.ts).
 * Se genera en cada solicitud (no al compilar: entonces la base no responde) y la lectura de la base se guarda 15 minutos, por lo que un
 * cambio de estado de un proveedor se refleja en ese plazo.
 * Si la base falla, el error se propaga (el sitemap responde 5xx): un sitemap incompleto con 200 haría creer a Google que las fichas
 * y servicios dejaron de existir. La lectura fallida no se guarda en el caché, así que la siguiente solicitud lo reintenta.
 */
export const dynamic = "force-dynamic";

/** URLs públicas de las fotos reales del proveedor (perfil y trabajos). Las imágenes son un extra: si falta SUPABASE_URL no se declaran, pero el sitemap sigue. */
function imagenesDe(perfil: string | null, trabajos: string[]): string[] {
  try {
    return [...(perfil ? [perfil] : []), ...trabajos].slice(0, 20).map(urlPublica);
  } catch {
    return [];
  }
}

const leerDatos = unstable_cache(
  async (): Promise<DatosSitemap> => {
    const proveedores = (await consultar(sql`
      SELECT p.slug, p.updated_at AS actualizado, p.foto_perfil,
             coalesce((SELECT array_agg(coalesce(f.ruta_miniatura, f.ruta) ORDER BY f.orden, f.id) FROM portafolio_fotos f WHERE f.proveedor_id = p.id AND f.estado = 'visible'), ARRAY[]::text[]) AS fotos,
             coalesce((SELECT array_agg(c.nombre) FROM proveedor_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE pc.proveedor_id = p.id AND c.activa), ARRAY[]::text[]) AS oficios
      FROM proveedores p
      WHERE ${FICHA_INDEXABLE_SQL}`)) as unknown as { slug: string; actualizado: Date; foto_perfil: string | null; fotos: string[]; oficios: string[] }[];
    const localidades = await localidadesIndexables();
    if (localidades === null) throw new Error("No se pudieron leer las localidades con oferta");
    const aTexto = (d: Date | null) => (d ? new Date(d).toISOString() : null);
    return {
      proveedores: proveedores.map((p) => ({ slug: p.slug, actualizado: new Date(p.actualizado).toISOString(), oficios: p.oficios, imagenes: imagenesDe(p.foto_perfil, p.fotos) })),
      localidades: [...localidades],
      oficios: (await conteosPorOficio()).map((c) => ({ ...c, modificado: aTexto(c.modificado) })),
      combinaciones: (await conteosPorOficioYLocalidad()).map((c) => ({ ...c, modificado: aTexto(c.modificado) })),
      minimo: await minProveedoresSeo(),
    };
  },
  ["sitemap-datos"],
  { revalidate: 900 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return construirSitemap(await leerDatos());
}
