import Link from "next/link";
import type { Metadata } from "next";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";
import { JsonLd } from "@/components/JsonLd";
import { jsonLdLista, jsonLdMigas , meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_LOCALIDADES } from "@/lib/faqs";

/** Índice de localidades de Bogotá (P2, SEO local). Solo Bogotá D.C. */
export const metadata: Metadata = meta({ titulo: "Servicios y oficios por localidad en Bogotá", descripcion: "Encuentra plomeros, electricistas, profesores y más en las 20 localidades de Bogotá. Contacta directo por WhatsApp, sin comisiones.", ruta: "/localidades" });

export default function Localidades() {
  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Localidades", ruta: "/localidades" }])} />
      <JsonLd datos={jsonLdLista("Localidades de Bogotá", LOCALIDADES_BOGOTA.map((l) => ({ nombre: l.nombre, ruta: `/localidades/${l.slug}` })))} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-4 sm:gap-7 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Localidades de Bogotá</h1>
          <p className="max-w-[560px] text-base leading-normal text-tinta-2 sm:text-lg">
            Elige tu localidad y encuentra proveedores que atienden cerca de ti.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LOCALIDADES_BOGOTA.map((l) => (
            <li key={l.slug}>
              <Link href={`/localidades/${l.slug}`} className="flex min-h-14 items-center rounded-2xl border border-borde-suave bg-white px-4 py-3 text-base font-semibold text-tinta hover:text-verde-oscuro">
                {l.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Faq preguntas={FAQ_LOCALIDADES} />
    </>
  );
}
