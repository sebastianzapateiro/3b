import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { GUIAS } from "@/lib/guias";
import { jsonLdLista, jsonLdMigas , meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_GUIAS } from "@/lib/faqs";

/** Guías para contratar con confianza (P2, SEO de contenido). Datos: lib/guias.ts. */
export const metadata: Metadata = {
  ...meta({ titulo: "Guías para contratar servicios en Bogotá", descripcion: "Cómo elegir un buen proveedor, qué dejar por escrito, mantenimiento del hogar y más consejos para contratar servicios y oficios en Bogotá.", ruta: "/guias" }),
  alternates: { canonical: "/guias", types: { "application/rss+xml": "/guias/feed.xml" } },
};

export default function Guias() {
  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Guías", ruta: "/guias" }])} />
      <JsonLd datos={jsonLdLista("Guías de LasTresB", GUIAS.map((g) => ({ nombre: g.titulo, ruta: `/guias/${g.slug}` })))} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-4 sm:gap-7 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Guías</h1>
          <p className="max-w-[560px] text-base leading-normal text-tinta-2 sm:text-lg">
            Consejos para elegir bien, cuidar tu casa y saber qué hacer si algo sale mal.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {GUIAS.map((g) => (
            <li key={g.slug}>
              <article className="flex h-full flex-col gap-2 rounded-[22px] border border-borde-suave bg-white p-5">
                <h2 className="font-display text-xl font-bold">
                  <Link href={`/guias/${g.slug}`} className="hover:text-verde-oscuro">{g.titulo}</Link>
                </h2>
                <p className="text-[15px] leading-normal text-tinta-2">{g.resumen}</p>
                <span className="mt-auto text-sm text-gris">{g.minutos} min de lectura</span>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <Faq preguntas={FAQ_GUIAS} />
    </>
  );
}
