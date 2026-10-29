import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIAS } from "@las3b/shared";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";
import { JsonLd } from "@/components/JsonLd";
import { jsonLdMigas , meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_CATEGORIAS } from "@/lib/faqs";

/** Explorar categorías (P2, CU-03). Datos: CATEGORIAS de @las3b/shared, la misma fuente del Home. */
export const metadata: Metadata = meta({ titulo: "Categorías de servicios en Bogotá", descripcion: "Plomería, electricidad, clases, acarreos y más. Encuentra proveedores verificados en Bogotá, recomendados por quienes ya los contrataron.", ruta: "/categorias" });

export default function Categorias() {
  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Categorías", ruta: "/categorias" }])} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-4 sm:gap-7 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Categorías</h1>
          <p className="max-w-[560px] text-base leading-normal text-tinta-2 sm:text-lg">
            Encuentra proveedores verificados en Bogotá, recomendados por quienes ya los contrataron.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORIAS.map((c) => (
            <section key={c.slug} className={`flex min-w-0 flex-col gap-4 rounded-[22px] p-5 ${TONO_CATEGORIA[c.icono]}`}>
              <div className="flex items-center gap-3">
                <IconoCategoria icono={c.icono} className="size-8 flex-none" />
                <div className="flex flex-col">
                  <h2 className="font-display text-xl font-bold">
                    <Link href={`/categorias/${c.slug}`} className="underline-offset-4 hover:underline">{c.nombre}</Link>
                  </h2>
                  <p className="text-sm leading-snug">{c.descripcion}</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {c.subcategorias.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/servicios/${s.slug}`}
                      className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium text-tinta"
                    >
                      {s.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Faq preguntas={FAQ_CATEGORIAS} />
    </>
  );
}
