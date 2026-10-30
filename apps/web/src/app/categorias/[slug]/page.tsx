import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIAS, categoriaPorSlug } from "@las3b/shared";
import { BuscadorCategorias } from "@/components/categorias/Buscador";
import { FONDO_NEUTRO, Icono, OficiosAgrupados, TARJETA, TarjetaProveedores } from "@/components/categorias/Piezas";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { faqCategoria } from "@/lib/faqs";
import { absoluta, jsonLdMigas, meta } from "@/lib/seo";

/** Lista completa de oficios de una categoría (P2, CU-03). Mismo estilo que /categorias. Datos: CATEGORIAS de @las3b/shared. */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

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
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Categorías", ruta: "/categorias" }, { nombre: categoria.nombre, ruta }])} />
      <JsonLd datos={lista} />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-10 pt-2 sm:px-6 md:gap-8 md:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center hover:underline">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/categorias" className="inline-flex min-h-11 items-center hover:underline">Categorías</Link></li>
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

        <section aria-label={`Oficios de ${categoria.nombre}`} className={`${TARJETA} p-5 md:p-7`}>
          <OficiosAgrupados c={categoria} />
        </section>

        {(hayMenores || hayRut) && (
          <div className={`${TARJETA} flex flex-col gap-2 p-4 text-[15px] leading-normal text-tinta-2`}>
            {hayMenores && <p>Los proveedores de esta categoría que trabajan con menores tienen verificación de antecedentes (Ley 1918).</p>}
            {hayRut && <p>En servicios de mayor riesgo solo aparecen proveedores con RUT verificado.</p>}
          </div>
        )}

        <TarjetaProveedores />

        <Link href="/categorias" className="flex h-12 items-center justify-center self-start rounded-lg border-2 border-tinta px-6 text-base font-semibold text-tinta max-sm:self-stretch">Volver a categorías</Link>
      </main>
      <Faq preguntas={faqCategoria(categoria)} lateral />
    </div>
  );
}