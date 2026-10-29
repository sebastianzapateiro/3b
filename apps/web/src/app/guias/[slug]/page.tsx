import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoriaPorSlug } from "@las3b/shared";
import { JsonLd } from "@/components/JsonLd";
import { GUIAS, guiaPorSlug } from "@/lib/guias";
import { jsonLdArticulo, jsonLdMigas, meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { faqGuia } from "@/lib/faqs";

/** Guía individual (P2, SEO de contenido). Datos: lib/guias.ts. */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guia = guiaPorSlug((await params).slug);
  if (!guia) return {};
  return meta({ titulo: guia.titulo, descripcion: guia.resumen, ruta: `/guias/${guia.slug}`, tipo: "article", fecha: guia.fecha });
}

export default async function Guia({ params }: Props) {
  const guia = guiaPorSlug((await params).slug);
  if (!guia) notFound();

  const ruta = `/guias/${guia.slug}`;
  const categoria = guia.categoria ? categoriaPorSlug(guia.categoria) : undefined;
  const otras = GUIAS.filter((g) => g.slug !== guia.slug).slice(0, 3);

  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Guías", ruta: "/guias" }, { nombre: guia.titulo, ruta }])} />
      <JsonLd datos={jsonLdArticulo({ titulo: guia.titulo, resumen: guia.resumen, ruta, fecha: guia.fecha })} />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pb-14 pt-2 sm:px-6 sm:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/guias" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Guías</Link></li>
          </ol>
        </nav>

        <article className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-balance font-display text-[32px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-5xl">{guia.titulo}</h1>
            <p className="text-lg leading-normal text-tinta-2">{guia.resumen}</p>
            <p className="text-sm text-gris">
              <time dateTime={guia.fecha}>{new Date(guia.fecha).toLocaleDateString("es-CO", { dateStyle: "long", timeZone: "UTC" })}</time> · {guia.minutos} min de lectura
            </p>
          </header>

          {guia.secciones.map((s) => (
            <section key={s.titulo} className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-bold">{s.titulo}</h2>
              {s.parrafos?.map((p) => <p key={p} className="text-base leading-relaxed text-tinta-2">{p}</p>)}
              {s.lista && (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-tinta-2">
                  {s.lista.map((i) => <li key={i}>{i}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="flex flex-col gap-3 rounded-[22px] bg-verde-claro p-5 text-verde-oscuro">
          <b className="font-display text-lg">¿Listo para contratar?</b>
          <div className="flex flex-wrap gap-2">
            {categoria && (
              <Link href={`/categorias/${categoria.slug}`} className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-tinta">
                Ver {categoria.nombre}
              </Link>
            )}
            <Link href="/categorias" className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-tinta">Todas las categorías</Link>
            <Link href="/localidades" className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-tinta">Buscar por localidad</Link>
          </div>
        </aside>

        <section aria-labelledby="mas-guias" className="flex flex-col gap-2">
          <h2 id="mas-guias" className="font-display text-xl font-bold">Sigue leyendo</h2>
          {otras.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="inline-flex min-h-11 items-center text-[15px] text-verde hover:text-verde-oscuro">{g.titulo}</Link>
          ))}
        </section>
      </main>
      <Faq preguntas={faqGuia(guia.slug)} />
    </>
  );
}
