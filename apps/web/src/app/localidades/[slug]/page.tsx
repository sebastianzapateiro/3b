import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIAS, LOCALIDADES_BOGOTA } from "@las3b/shared";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";
import { JsonLd } from "@/components/JsonLd";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import { buscarProveedores } from "@/lib/busqueda";
import { localidadesIndexables } from "@/lib/indexacion";
import { conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";
import { jsonLdLista, jsonLdMigas, meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { faqLocalidad } from "@/lib/faqs";

/**
 * Servicios por localidad (P2, SEO local). Solo Bogotá D.C.
 * Solo muestra lo que existe: los oficios con proveedores reales en esa localidad y esos proveedores. Sin oferta, la página
 * dice que aún no hay proveedores, lleva `noindex` y no sale en el sitemap ni en el pie (regla en lib/indexacion.ts).
 */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALIDADES_BOGOTA.map((l) => ({ slug: l.slug }));
}

export const revalidate = 900;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const localidad = LOCALIDADES_BOGOTA.find((l) => l.slug === slug);
  if (!localidad) return {};
  // Se indexa solo con oferta confirmada. Si no se puede comprobar (error de base), por prudencia no se indexa.
  const conOferta = await localidadesIndexables();
  return meta({
    noindex: conOferta === null || !conOferta.has(localidad.slug),
    titulo: `Servicios y oficios en ${localidad.nombre}, Bogotá`,
    descripcion: `Proveedores de oficios y servicios en ${localidad.nombre}, Bogotá. Compara reseñas reales y escríbeles directo por WhatsApp, sin comisiones.`,
    ruta: `/localidades/${localidad.slug}`,
  });
}

export default async function Localidad({ params }: Props) {
  const { slug } = await params;
  const localidad = LOCALIDADES_BOGOTA.find((l) => l.slug === slug);
  if (!localidad) notFound();

  const ruta = `/localidades/${localidad.slug}`;
  // Oferta real de esta localidad (nunca se inventa disponibilidad). Si la base falla, la página queda como «sin oferta» y noindex.
  const minimo = await minProveedoresSeo();
  const [conteos, proveedores, conOferta] = await Promise.all([
    conteosPorOficioYLocalidad().catch(() => []),
    buscarProveedores({ localidad: localidad.slug }).catch(() => null),
    localidadesIndexables(),
  ]);
  const aqui = new Map(conteos.filter((c) => c.localidad === localidad.slug).map((c) => [c.oficio, c.total]));
  // Con la página SEO del oficio en esta localidad solo si ya cumple la regla; si no, a los resultados filtrados.
  const buscar = (oficio: string) => ((aqui.get(oficio) ?? 0) >= minimo ? `/servicios/${oficio}/${localidad.slug}` : `/proveedores?categoria=${oficio}&localidad=${localidad.slug}`);
  const categorias = CATEGORIAS.map((c) => ({ ...c, oficios: c.subcategorias.filter((s) => aqui.has(s.slug)) })).filter((c) => c.oficios.length > 0);
  const total = proveedores?.total ?? 0;
  const hayOferta = categorias.length > 0 && total > 0;
  const otras = LOCALIDADES_BOGOTA.filter((l) => l.slug !== localidad.slug && conOferta?.has(l.slug));

  return (
    <>
      <JsonLd
        datos={jsonLdMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Localidades", ruta: "/localidades" },
          { nombre: localidad.nombre, ruta },
        ])}
      />
      {hayOferta && <JsonLd datos={jsonLdLista(`Servicios en ${localidad.nombre}, Bogotá`, categorias.flatMap((c) => c.oficios).map((s) => ({ nombre: s.nombre, ruta: buscar(s.slug) })))} />}
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-2 sm:gap-7 sm:px-6 sm:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/localidades" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Localidades</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-tinta">{localidad.nombre}</li>
          </ol>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Servicios y oficios en {localidad.nombre}</h1>
          <p className="max-w-[640px] text-base leading-normal text-tinta-2 sm:text-lg">
            {hayOferta
              ? `En ${localidad.nombre} hay ${total} ${total === 1 ? "proveedor" : "proveedores"} en ${categorias.flatMap((c) => c.oficios).length} ${categorias.flatMap((c) => c.oficios).length === 1 ? "oficio" : "oficios"}. Elige uno y escríbele directo por WhatsApp.`
              : `Todavía no tenemos proveedores que atiendan ${localidad.nombre}.`}
          </p>
        </div>

        {hayOferta ? (
          <>
            <section aria-labelledby="oficios-localidad" className="flex flex-col gap-4">
              <h2 id="oficios-localidad" className="font-display text-2xl font-bold">Oficios disponibles en {localidad.nombre}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {categorias.map((c) => (
                  <section key={c.slug} className={`flex min-w-0 flex-col gap-4 rounded-[22px] p-5 ${TONO_CATEGORIA[c.icono]}`}>
                    <div className="flex items-center gap-3">
                      <IconoCategoria icono={c.icono} className="size-8 flex-none" />
                      <h3 className="font-display text-xl font-bold">{c.nombre}</h3>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {c.oficios.map((s) => (
                        <li key={s.slug}>
                          <Link href={buscar(s.slug)} className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium text-tinta">
                            {s.nombre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>

            <section aria-labelledby="proveedores-localidad" className="flex flex-col gap-4 border-t border-borde-suave pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="proveedores-localidad" className="font-display text-2xl font-bold">Proveedores en {localidad.nombre}</h2>
                {total > (proveedores?.items.length ?? 0) && <Link href={`/proveedores?localidad=${localidad.slug}&vista=proveedores`} className="text-sm font-semibold text-verde underline">Ver los {total} proveedores</Link>}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {(proveedores?.items ?? []).slice(0, 6).map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
              </div>
            </section>
          </>
        ) : (
          <section className="flex flex-col gap-3 rounded-[18px] bg-amarillo-suave p-5 text-amarillo-oscuro">
            <b className="text-[15px]">Aún no hay proveedores en {localidad.nombre}.</b>
            <p className="text-sm leading-[1.45]">Mira los resultados de toda Bogotá o, si ofreces un servicio aquí, inscríbete gratis.</p>
            <div className="flex flex-wrap gap-x-4">
              <Link href="/proveedores" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Ver proveedores en Bogotá</Link>
              <Link href="/ingreso" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Registrar mi servicio</Link>
            </div>
          </section>
        )}

        <nav aria-label="Otras localidades" className="flex flex-col gap-2 border-t border-borde-suave pt-6">
          <h2 className="font-display text-xl font-bold">{otras.length > 0 ? "Otras localidades con proveedores" : "Más localidades"}</h2>
          <ul className="flex flex-wrap gap-x-5">
            {otras.map((l) => (
              <li key={l.slug}>
                <Link href={`/localidades/${l.slug}`} className="inline-flex min-h-9 items-center text-[15px] text-verde hover:text-verde-oscuro">{l.nombre}</Link>
              </li>
            ))}
            <li><Link href="/localidades" className="inline-flex min-h-9 items-center text-[15px] font-semibold text-verde hover:text-verde-oscuro">Ver todas las localidades</Link></li>
          </ul>
        </nav>
      </main>
      {hayOferta && <Faq preguntas={faqLocalidad(localidad.nombre)} />}
    </>
  );
}
