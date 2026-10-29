import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIAS, LOCALIDADES_BOGOTA, OFICIOS_POPULARES, TODAS_LAS_SUBCATEGORIAS, type CategoriaPadre, type Subcategoria } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { FormDemanda } from "@/components/FormDemanda";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";
import { JsonLd } from "@/components/JsonLd";
import { FAQ_CATEGORIAS } from "@/lib/faqs";
import { jsonLdLista, jsonLdMigas, meta } from "@/lib/seo";

/** Explorar categorías y oficios (P2, CU-03). Datos: CATEGORIAS de @las3b/shared, la misma fuente del Home. */
export const metadata: Metadata = meta({
  titulo: "Categorías de servicios en Bogotá",
  descripcion: "Plomería, electricidad, clases, trasteos, fletes y más. Encuentra proveedores verificados en Bogotá, recomendados por quienes ya los contrataron.",
  ruta: "/categorias",
});

/** Los populares van primero dentro de su grupo; el resto conserva el orden de la taxonomía. */
const ordenar = (lista: Subcategoria[]) => [...lista].sort((a, b) => Number(b.popular) - Number(a.popular));

function Chip({ s }: { s: Subcategoria }) {
  return (
    <li>
      <Link href={`/servicios/${s.slug}`} className="flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-tinta">
        {s.nombre}
        {s.atiendeUrgencias && <span className="rounded-md bg-verde-claro px-1.5 py-0.5 text-[11px] font-bold leading-none text-verde-oscuro">24 h</span>}
      </Link>
    </li>
  );
}

function Tarjeta({ c, ancho }: { c: CategoriaPadre; ancho?: boolean }) {
  const grupos = [...new Set(c.subcategorias.map((s) => s.subgrupo).filter((g): g is string => Boolean(g)))];
  return (
    <section aria-labelledby={`cat-${c.slug}`} className={`flex min-w-0 flex-col gap-4 rounded-[22px] p-5 ${TONO_CATEGORIA[c.icono]}`}>
      <div className="flex items-center gap-3">
        <IconoCategoria icono={c.icono} className="size-8 flex-none" />
        <h2 id={`cat-${c.slug}`} className="font-display text-xl font-bold"><Link href={`/categorias/${c.slug}`} className="underline-offset-4 hover:underline">{c.nombre}</Link></h2>
      </div>
      {grupos.length > 0 ? (
        <div className={`grid gap-5 ${ancho ? "sm:grid-cols-2 lg:grid-cols-4" : ""}`}>
          {grupos.map((g) => (
            <div key={g} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[1px] opacity-80">{g}</h3>
              <ul className="flex flex-wrap gap-2">{ordenar(c.subcategorias.filter((s) => s.subgrupo === g)).map((s) => <Chip key={s.slug} s={s} />)}</ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">{ordenar(c.subcategorias).map((s) => <Chip key={s.slug} s={s} />)}</ul>
      )}
    </section>
  );
}

export default function Categorias() {
  const [hogar, ...otras] = CATEGORIAS;
  const iconoDe = (slug: string) => CATEGORIAS.find((c) => c.subcategorias.some((s) => s.slug === slug))!.icono;

  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Categorías", ruta: "/categorias" }])} />
      <JsonLd datos={jsonLdLista("Oficios y servicios en Bogotá", TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => ({ nombre: sub.nombre, ruta: `/servicios/${sub.slug}` })))} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 pb-12 pt-4 sm:gap-8 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Categorías</h1>
          <p className="max-w-[640px] text-base leading-normal text-tinta-2 sm:text-lg">Encuentra proveedores verificados en Bogotá, recomendados por quienes ya los contrataron.</p>
          <form action="/buscar" role="search" className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5 shadow-[0_6px_24px_rgba(27,38,35,0.08)] sm:flex-row sm:items-end sm:p-4">
            <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[2_1_240px]"><label htmlFor="c-q" className="text-[13px] font-semibold text-gris">¿Qué necesitas?</label><input id="c-q" name="q" type="search" placeholder="Ej: plomero, clases de inglés, trasteo" className="h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base" /></div>
            <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[1_1_180px]"><label htmlFor="c-loc" className="text-[13px] font-semibold text-gris">Localidad</label><select id="c-loc" name="localidad" className="h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3 text-base"><option value="">Toda Bogotá</option>{LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}</select></div>
            <button type="submit" className="h-13 rounded-campo bg-tinta px-7 text-base font-semibold text-white">Buscar</button>
          </form>
        </div>

        <section aria-labelledby="mas-buscado" className="flex flex-col gap-3">
          <h2 id="mas-buscado" className="font-display text-xl font-bold sm:text-2xl">Lo más buscado</h2>
          <ul className="flex flex-wrap gap-2.5">
            {OFICIOS_POPULARES.map(({ sub }) => (
              <li key={sub.slug}>
                <Link href={`/servicios/${sub.slug}`} className={`flex min-h-12 items-center gap-2.5 rounded-full px-5 text-base font-semibold ${TONO_CATEGORIA[iconoDe(sub.slug)]}`}>
                  <IconoCategoria icono={iconoDe(sub.slug)} className="size-5 flex-none" />
                  {sub.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {hogar && <Tarjeta c={hogar} ancho />}
        <div className="grid items-start gap-4 lg:grid-cols-3">{otras.map((c) => <Tarjeta key={c.slug} c={c} />)}</div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <FormDemanda retorno="/categorias" titulo="¿No encuentras lo que buscas? Cuéntanos" />
          <section className="flex flex-col gap-3 rounded-[22px] bg-tinta p-5 text-white sm:p-6">
            <h2 className="font-display text-2xl font-bold">¿Ofreces un servicio? Regístrate gratis</h2>
            <p className="text-[15px] leading-normal text-[#D5DCDA]">Crea tu página con dirección propia y recibe contactos de tu localidad por WhatsApp, sin comisiones.</p>
            <Link href="/proveedores/registro" className="flex h-[52px] items-center justify-center self-start rounded-campo bg-amarillo px-7 text-base font-bold text-tinta">Registrarme como proveedor</Link>
          </section>
        </div>
      </main>
      <Faq preguntas={FAQ_CATEGORIAS} />
    </>
  );
}