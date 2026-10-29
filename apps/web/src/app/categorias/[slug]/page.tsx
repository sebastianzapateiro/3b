import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIAS, categoriaPorSlug } from "@las3b/shared";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";
import { JsonLd } from "@/components/JsonLd";
import { absoluta, jsonLdMigas, meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { faqCategoria } from "@/lib/faqs";

/** Subcategorías de una categoría (P2, CU-03). Datos: CATEGORIAS de @las3b/shared. */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return {};
  return meta({
    titulo: `${categoria.nombre} en Bogotá: proveedores verificados`,
    descripcion: `${categoria.descripcion}. Proveedores verificados en Bogotá: compara reseñas y escríbeles directo por WhatsApp.`,
    ruta: `/categorias/${categoria.slug}`,
  });
}

export default async function Categoria({ params }: Props) {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const ruta = `/categorias/${categoria.slug}`;
  const hayMenores = categoria.subcategorias.some((s) => s.exigeInsigniaMenores);
  const hayRut = categoria.subcategorias.some((s) => s.exigeRutDesdeAlta);

  const lista = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoria.nombre} en Bogotá`,
    itemListElement: categoria.subcategorias.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.nombre,
      url: absoluta(`/servicios/${s.slug}`),
    })),
  };

  return (
    <>
      <JsonLd
        datos={jsonLdMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Categorías", ruta: "/categorias" },
          { nombre: categoria.nombre, ruta },
        ])}
      />
      <JsonLd datos={lista} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-2 sm:gap-7 sm:px-6 sm:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/categorias" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Categorías</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-tinta">{categoria.nombre}</li>
          </ol>
        </nav>

        <div className={`flex items-center gap-4 rounded-[22px] p-5 sm:p-7 ${TONO_CATEGORIA[categoria.icono]}`}>
          <IconoCategoria icono={categoria.icono} className="size-10 flex-none" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">{categoria.nombre}</h1>
            <p className="text-base leading-normal">{categoria.descripcion}</p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoria.subcategorias.map((s) => (
            <li key={s.slug} id={s.slug}>
              <Link
                href={`/servicios/${s.slug}`}
                className="flex min-h-14 flex-col justify-center rounded-2xl border border-borde-suave bg-white px-4 py-3 text-tinta"
              >
                <b className="text-base">{s.nombre}</b>
                {s.detalle && <span className="text-sm leading-snug text-gris">{s.detalle}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {(hayMenores || hayRut) && (
          <div className="flex flex-col gap-2 rounded-2xl border border-borde-suave bg-white p-4 text-[15px] leading-normal text-tinta-2">
            {hayMenores && <p>Los proveedores de esta categoría que trabajan con menores tienen verificación de antecedentes (Ley 1918).</p>}
            {hayRut && <p>En servicios de mayor riesgo solo aparecen proveedores con RUT verificado.</p>}
          </div>
        )}

        <Link
          href="/categorias"
          className="flex h-13 items-center justify-center self-start rounded-campo border-2 border-tinta px-6 text-base font-semibold text-tinta"
        >
          Volver a categorías
        </Link>
      </main>
      <Faq preguntas={faqCategoria(categoria)} />
    </>
  );
}
