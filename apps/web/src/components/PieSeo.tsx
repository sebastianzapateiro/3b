import Link from "next/link";
import { unstable_cache } from "next/cache";
import { CATEGORIAS, LOCALIDADES_BOGOTA, MARCA, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { GUIAS } from "@/lib/guias";
import { localidadesIndexables } from "@/lib/indexacion";
import { conteosPorOficio, conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";

/**
 * Bloque de enlaces internos del pie (SEO, RNF-03): oficios más buscados por localidad, categorías, localidades y guías.
 * Los enlaces a /servicios/oficio y /servicios/oficio/localidad solo se escriben si esa página ya cumple la regla de publicación
 * (lib/publicacion.ts); si no, serían 404. Lo demás es estático y siempre existe. Para todo el sitio, así que va en el Pie.
 */
const MAXIMO = 5;
const titulo = "mb-1 font-display text-sm font-bold text-tinta";
const enlace = "inline-flex min-h-8 items-center truncate text-[13px] leading-snug text-tinta-2 hover:text-tinta hover:underline sm:min-h-7";
const verMas = "inline-flex min-h-8 items-center text-[13px] font-semibold text-verde hover:underline sm:min-h-7";

type Publicadas = { oficios: Set<string>; combinaciones: Map<string, string[]>; localidades: string[] };

/** Qué páginas por oficio y por localidad existen hoy. Se guarda 1 hora: el pie sale en todas las páginas. */
const leerPublicadas = unstable_cache(
  async (): Promise<{ oficios: string[]; combinaciones: [string, string[]][]; localidades: string[] }> => {
    const minimo = await minProveedoresSeo();
    const oficios = (await conteosPorOficio()).filter((c) => c.total >= minimo).map((c) => c.oficio);
    const combinaciones = new Map<string, string[]>();
    for (const c of await conteosPorOficioYLocalidad()) {
      if (c.total < minimo) continue;
      combinaciones.set(c.oficio, [...(combinaciones.get(c.oficio) ?? []), c.localidad]);
    }
    const conOferta = await localidadesIndexables();
    return { oficios, combinaciones: [...combinaciones.entries()], localidades: conOferta ? [...conOferta] : [] };
  },
  ["pie-seo-publicadas"],
  { revalidate: 3600 },
);

async function publicadas(): Promise<Publicadas> {
  try {
    const d = await leerPublicadas();
    return { oficios: new Set(d.oficios), combinaciones: new Map(d.combinaciones), localidades: d.localidades };
  } catch {
    return { oficios: new Set(), combinaciones: new Map(), localidades: [] };
  }
}

const nombreLocalidad =(slug: string) => LOCALIDADES_BOGOTA.find((l) => l.slug === slug)?.nombre ?? slug;

export async function PieSeo() {
  const { oficios, combinaciones, localidades } = await publicadas();
  const localidadesConOferta = LOCALIDADES_BOGOTA.filter((l) => localidades.includes(l.slug)).slice(0, MAXIMO);
  const populares = TODAS_LAS_SUBCATEGORIAS.filter(({ sub }) => sub.popular);
  // Un bloque por oficio popular que ya tenga páginas por localidad (hasta 5, como mucho 5 localidades cada uno).
  const porLocalidad = populares.filter(({ sub }) => (combinaciones.get(sub.slug)?.length ?? 0) > 0).slice(0, 5);
  // Oficio: su página propia si existe; si no, los resultados ya filtrados.
  const rutaOficio = (slug: string) => (oficios.has(slug) ? `/servicios/${slug}` : `/proveedores?categoria=${slug}`);

  return (
    <section aria-labelledby="pie-seo" className="border-b border-borde-suave bg-crema/50">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex max-w-[680px] flex-col gap-1.5">
          <h2 id="pie-seo" className="font-display text-lg font-bold text-tinta">Servicios y oficios de confianza en Bogotá</h2>
          <p className="text-[13px] leading-relaxed text-gris">
            {MARCA.nombre} es un directorio gratuito de plomeros, electricistas, profesores particulares, acarreos, aseo y más oficios en Bogotá.
            Compara perfiles y reseñas reales y escríbele directo al proveedor por WhatsApp, sin comisiones.
          </p>
        </div>

        {porLocalidad.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde-suave pt-6 sm:grid-cols-3 lg:grid-cols-5">
            {porLocalidad.map(({ sub }) => (
              <nav key={sub.slug} aria-label={`${sub.nombre} por localidad`} className="flex flex-col">
                <h3 className={titulo}><Link href={`/servicios/${sub.slug}`} className="hover:underline">{sub.nombre} en Bogotá</Link></h3>
                {(combinaciones.get(sub.slug) ?? []).slice(0, MAXIMO).map((l) => (
                  <Link key={l} href={`/servicios/${sub.slug}/${l}`} className={enlace}>{sub.nombre} en {nombreLocalidad(l)}</Link>
                ))}
                <Link href={`/servicios/${sub.slug}`} className={verMas}>Ver más</Link>
              </nav>
            ))}
          </div>
        )}

        {/* Cinco enlaces por columna y «Ver más»: la lista completa vive en su página (/localidades, /guias, /proveedores). */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde-suave pt-6 lg:grid-cols-4">
          <nav aria-label="Oficios más buscados" className="flex min-w-0 flex-col">
            <h3 className={titulo}>Oficios más buscados</h3>
            {populares.slice(0, MAXIMO).map(({ sub }) => <Link key={sub.slug} href={rutaOficio(sub.slug)} className={enlace}>{sub.nombre} en Bogotá</Link>)}
            <Link href="/proveedores" className={verMas}>Ver más</Link>
          </nav>

          <nav aria-label="Categorías de servicios" className="flex min-w-0 flex-col">
            <h3 className={titulo}>Categorías</h3>
            {CATEGORIAS.slice(0, MAXIMO).map((c) => <Link key={c.slug} href={`/categorias/${c.slug}`} className={enlace}>{c.nombre}</Link>)}
            <Link href="/#categorias" className={verMas}>Ver más</Link>
          </nav>

          <nav aria-label="Servicios por localidad" className="flex min-w-0 flex-col">
            <h3 className={titulo}>Servicios por localidad</h3>
            {/* Solo localidades con proveedores reales: no se presenta como disponible una zona sin oferta. */}
            {localidadesConOferta.map((l) => <Link key={l.slug} href={`/localidades/${l.slug}`} className={enlace}>{l.nombre}</Link>)}
            <Link href="/localidades" className={verMas}>Ver localidades</Link>
          </nav>

          <nav aria-label="Guías para contratar" className="flex min-w-0 flex-col">
            <h3 className={titulo}>Guías para contratar</h3>
            {GUIAS.slice(0, MAXIMO).map((g) => <Link key={g.slug} href={`/guias/${g.slug}`} title={g.titulo} className={enlace}>{g.titulo}</Link>)}
            <Link href="/guias" className={verMas}>Ver más</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
