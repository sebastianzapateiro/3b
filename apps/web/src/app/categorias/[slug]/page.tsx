import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIAS, categoriaPorSlug } from "@las3b/shared";
import { BuscadorCategorias } from "@/components/categorias/Buscador";
import { FONDO_NEUTRO, Icono, OficiosComoFiltro, TARJETA, TarjetaProveedores } from "@/components/categorias/Piezas";
import { Faq } from "@/components/Faq";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import { TarjetaServicio } from "@/components/TarjetaServicio";
import { buscarProveedores, buscarServicios } from "@/lib/busqueda";
import { JsonLd } from "@/components/JsonLd";
import { faqCategoria } from "@/lib/faqs";
import { absoluta, jsonLdMigas, meta } from "@/lib/seo";

/** Lista completa de oficios de una categoría (P2, CU-03). Mismo estilo que /categorias. Datos: CATEGORIAS de @las3b/shared. */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
/** Los servicios y proveedores cambian: la página se regenera cada 5 minutos (antes se congelaba al compilar). */
export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoria = categoriaPorSlug((await params).slug);
  if (!categoria) return {};
  return meta({
    titulo: `${categoria.nombre} en Bogotá: proveedores verificados`,
    descripcion: `${categoria.descripcion}. Proveedores verificados en Bogotá: compara reseñas y escríbeles directo por WhatsApp.`,
    ruta: `/categorias/${categoria.slug}`,
  });
}

export default async function Categoria({ params }: Props) {
  const categoria = categoriaPorSlug((await params).slug);
  if (!categoria) notFound();

  // Servicios y proveedores reales de la categoría (incluye todos sus oficios). Si la base falla, la página sigue con los oficios.
  let sinBase = false;
  const vacio = { items: [], total: 0, pagina: 1, porPagina: 6, categoriaNombre: categoria.nombre };
  const [servicios, proveedoresCat] = await Promise.all([
    buscarServicios({ categoria: categoria.slug }).then((r) => ({ ...r, items: r.items.slice(0, 6) })),
    buscarProveedores({ categoria: categoria.slug }).then((r) => ({ ...r, items: r.items.slice(0, 6) })),
  ]).catch((e) => {
    sinBase = true;
    console.warn("[categoria] No se pudieron leer los proveedores:", e instanceof Error ? e.message : e);
    return [vacio, vacio] as const;
  });

  const ruta = `/categorias/${categoria.slug}`;
  const hayMenores = categoria.subcategorias.some((s) => s.exigeInsigniaMenores);
  const hayRut = categoria.subcategorias.some((s) => s.exigeRutDesdeAlta);
  const lista = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoria.nombre} en Bogotá`,
    itemListElement: categoria.subcategorias.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.nombre, url: absoluta(`/servicios/${s.slug}`) })),
  };

  return (
    <div className={FONDO_NEUTRO}>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Proveedores", ruta: "/proveedores" }, { nombre: categoria.nombre, ruta }])} />
      <JsonLd datos={lista} />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-10 pt-2 sm:px-6 md:gap-8 md:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center hover:underline">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/#categorias" className="inline-flex min-h-11 items-center hover:underline">Categorías</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-tinta">{categoria.nombre}</li>
          </ol>
        </nav>

        <header className="flex flex-col items-start gap-3 md:items-center md:text-center">
          <Icono icono={categoria.icono} className="size-14" />
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.8px] md:text-5xl md:tracking-[-1.5px]">{categoria.nombre}</h1>
          <p className="text-base text-tinta-2 md:text-lg">{categoria.descripcion}</p>
        </header>

        <BuscadorCategorias />

        {/* Primero el camino: elegir un oficio lleva directo a los resultados de /proveedores con ese filtro. */}
        <section className={`${TARJETA} p-5 md:p-6`}>
          <OficiosComoFiltro c={categoria} />
        </section>

        {/* 1 · Lo que hay ahora: servicios reales de proveedores en esta categoría. */}
        <section aria-labelledby="titulo-servicios" className="flex flex-col gap-4 border-t border-borde-suave pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-servicios" className="font-display text-2xl font-bold">Servicios de {categoria.nombre}</h2>
            {servicios.total > servicios.items.length && <Link href={`/proveedores?categoria=${categoria.slug}`} className="text-sm font-semibold text-verde underline">Ver los {servicios.total} servicios</Link>}
          </div>
          {servicios.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {servicios.items.map((s, i) => <TarjetaServicio key={s.id} s={s} indice={i} />)}
            </div>
          ) : (
            <p className={`${TARJETA} p-5 text-[15px] leading-normal text-tinta-2`}>
              {sinBase ? "No pudimos cargar los servicios en este momento. Intenta de nuevo en un rato." : "Aún no hay servicios publicados en esta categoría. "}
              {!sinBase && <Link href="/ingreso" className="font-semibold text-verde underline">ofrece el tuyo gratis</Link>}
            </p>
          )}
        </section>

        {/* 2 · Quién los presta. */}
        {proveedoresCat.items.length > 0 && (
          <section aria-labelledby="titulo-proveedores" className="flex flex-col gap-4 border-t border-borde-suave pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titulo-proveedores" className="font-display text-2xl font-bold">Proveedores</h2>
              {proveedoresCat.total > proveedoresCat.items.length && <Link href={`/proveedores?categoria=${categoria.slug}&vista=proveedores`} className="text-sm font-semibold text-verde underline">Ver los {proveedoresCat.total} proveedores</Link>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {proveedoresCat.items.map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
            </div>
          </section>
        )}

        {(hayMenores || hayRut) && (
          <p className="text-sm leading-normal text-gris">
            {hayMenores && "Quienes trabajan con menores tienen verificación de antecedentes (Ley 1918). "}
            {hayRut && "En servicios de mayor riesgo solo aparecen proveedores con RUT verificado."}
          </p>
        )}

        <TarjetaProveedores />

        <Link href="/#categorias" className="flex h-12 items-center justify-center self-start rounded-lg border-2 border-tinta px-6 text-base font-semibold text-tinta max-sm:self-stretch">Volver a categorías</Link>
      </main>
      <Faq preguntas={faqCategoria(categoria)} lateral />
    </div>
  );
}