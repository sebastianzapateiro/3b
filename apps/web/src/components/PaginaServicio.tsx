import Link from "next/link";
import { LOCALIDADES_BOGOTA, LOCALIDADES_VECINAS, type CategoriaPadre, type LocalidadSlug, type Subcategoria } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import type { PaginaResultados } from "@/lib/busqueda";
import { faqServicio } from "@/lib/faqs";
import { GUIAS } from "@/lib/guias";
import { jsonLdLista, jsonLdMigas, jsonLdServicio } from "@/lib/seo";

/**
 * Página de aterrizaje SEO de un servicio en Bogotá (y opcionalmente en una localidad).
 * Reúne: introducción, proveedores reales (si hay), enlaces internos a las 20 localidades, servicios afines, guías y preguntas frecuentes.
 */
export function PaginaServicio({ sub, padre, localidad, resultado }: { sub: Subcategoria; padre: CategoriaPadre; localidad?: { nombre: string; slug: string }; resultado: PaginaResultados }) {
  const minus = sub.nombre.toLowerCase();
  const donde = localidad ? `${localidad.nombre}, Bogotá` : "Bogotá";
  const ruta = localidad ? `/servicios/${sub.slug}/${localidad.slug}` : `/servicios/${sub.slug}`;
  const palabras = sub.claves.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 12);
  const afines = padre.subcategorias.filter((s) => s.slug !== sub.slug).slice(0, 8);
  const vecinas = localidad ? LOCALIDADES_VECINAS[localidad.slug as LocalidadSlug] ?? [] : [];
  const guias = GUIAS.filter((g) => !g.categoria || g.categoria === padre.slug).slice(0, 3);
  const buscar = `/buscar?categoria=${sub.slug}${localidad ? `&localidad=${localidad.slug}` : ""}`;
  const enlace = "inline-flex min-h-11 items-center text-[15px] text-verde hover:text-verde-oscuro";

  const migas = [
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Categorías", ruta: "/categorias" },
    { nombre: padre.nombre, ruta: `/categorias/${padre.slug}` },
    { nombre: sub.nombre, ruta: `/servicios/${sub.slug}` },
    ...(localidad ? [{ nombre: localidad.nombre, ruta }] : []),
  ];

  return (
    <>
      <JsonLd datos={jsonLdMigas(migas)} />
      <JsonLd datos={jsonLdServicio({ nombre: `${sub.nombre} en ${donde}`, descripcion: `${sub.nombre}${sub.detalle ? `: ${sub.detalle}` : ""} en ${donde}.`, ruta, categoria: padre.nombre, localidad: localidad?.nombre })} />
      {resultado.items.length > 0 && <JsonLd datos={jsonLdLista(`${sub.nombre} en ${donde}`, resultado.items.map((r) => ({ nombre: r.nombre, ruta: `/${r.slug}` })))} />}

      <main className="mx-auto flex max-w-[1000px] flex-col gap-7 px-5 pb-10 pt-2 sm:px-6 sm:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            {migas.map((m, i) => (
              <li key={m.ruta} className="flex items-center gap-x-2">
                {i > 0 && <span aria-hidden="true">›</span>}
                {i === migas.length - 1 ? <span aria-current="page" className="text-tinta">{m.nombre}</span> : <Link href={m.ruta} className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">{m.nombre}</Link>}
              </li>
            ))}
          </ol>
        </nav>

        <header className="flex flex-col gap-3">
          <h1 className="text-balance font-display text-[32px] font-extrabold leading-[1.08] tracking-[-1px] sm:text-5xl">{sub.nombre} en {donde}</h1>
          <p className="max-w-[720px] text-base leading-relaxed text-tinta-2 sm:text-lg">
            Encuentra {minus} en {donde}{sub.detalle ? ` (${sub.detalle.toLowerCase()})` : ""}. Compara reseñas de clientes reales, mira las verificaciones de cada proveedor y escríbele directo por WhatsApp: es gratis y sin comisiones.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={buscar} className="flex h-12 items-center rounded-campo bg-tinta px-6 text-base font-semibold text-white">Buscar y filtrar</Link>
            <Link href="/proveedores/registro" className="flex h-12 items-center rounded-campo border-2 border-tinta px-6 text-base font-semibold text-tinta">Ofrezco este servicio</Link>
          </div>
        </header>

        <section aria-labelledby="proveedores" className="flex flex-col gap-3">
          <h2 id="proveedores" className="font-display text-2xl font-bold">{resultado.items.length > 0 ? `Proveedores de ${minus}` : "Aún no hay proveedores aquí"}</h2>
          {resultado.items.length > 0 ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              {resultado.items.map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
              {resultado.total > resultado.items.length && <Link href={buscar} className="flex h-12 items-center justify-center rounded-[14px] border-2 border-tinta text-base font-semibold text-tinta">Ver los {resultado.total} proveedores</Link>}
            </div>
          ) : (
            <p className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">
              Todavía no tenemos proveedores publicados de {minus} en {donde}. {localidad ? "Prueba en una localidad vecina de abajo, o " : ""}si ofreces este servicio, <Link href="/proveedores/registro" className="font-semibold underline">crea tu página gratis</Link>.
            </p>
          )}
        </section>

        {(sub.exigeRutDesdeAlta || sub.exigeInsigniaMenores) && (
          <section aria-label="Verificaciones" className="flex flex-col gap-1.5 rounded-[18px] border border-borde-suave bg-white p-4 text-[15px] leading-normal text-tinta-2">
            {sub.exigeRutDesdeAlta && <p>En servicios de mayor riesgo solo aparecen proveedores con RUT verificado.</p>}
            {sub.exigeInsigniaMenores && <p>Los proveedores que trabajan con menores tienen verificación de antecedentes (Ley 1918).</p>}
          </section>
        )}

        {palabras.length > 0 && (
          <section aria-labelledby="incluye" className="flex flex-col gap-2">
            <h2 id="incluye" className="font-display text-xl font-bold">Qué suelen buscar las personas</h2>
            <ul className="flex flex-wrap gap-2">{palabras.map((p) => <li key={p} className="flex h-9 items-center rounded-full bg-piedra px-3.5 text-sm">{p}</li>)}</ul>
          </section>
        )}

        <section aria-labelledby="localidades" className="flex flex-col gap-2">
          <h2 id="localidades" className="font-display text-xl font-bold">{sub.nombre} por localidad</h2>
          <ul className="flex flex-wrap gap-x-5">
            {(vecinas.length ? LOCALIDADES_BOGOTA.filter((l) => (vecinas as readonly string[]).includes(l.slug)) : LOCALIDADES_BOGOTA).map((l) => (
              <li key={l.slug}><Link href={`/servicios/${sub.slug}/${l.slug}`} className={enlace}>{sub.nombre} en {l.nombre}</Link></li>
            ))}
            {localidad && <li><Link href={`/servicios/${sub.slug}`} className={`${enlace} font-semibold`}>Toda Bogotá</Link></li>}
          </ul>
        </section>

        <section aria-labelledby="afines" className="flex flex-col gap-2">
          <h2 id="afines" className="font-display text-xl font-bold">Otros servicios de {padre.nombre}</h2>
          <ul className="flex flex-wrap gap-x-5">
            {afines.map((s) => <li key={s.slug}><Link href={localidad ? `/servicios/${s.slug}/${localidad.slug}` : `/servicios/${s.slug}`} className={enlace}>{s.nombre}</Link></li>)}
            <li><Link href={`/categorias/${padre.slug}`} className={`${enlace} font-semibold`}>Ver todo {padre.nombre}</Link></li>
          </ul>
        </section>

        <section aria-labelledby="guias" className="flex flex-col gap-2">
          <h2 id="guias" className="font-display text-xl font-bold">Antes de contratar</h2>
          <ul className="flex flex-col">{guias.map((g) => <li key={g.slug}><Link href={`/guias/${g.slug}`} className={enlace}>{g.titulo}</Link></li>)}</ul>
        </section>
      </main>
      <Faq preguntas={faqServicio({ nombre: sub.nombre, localidad: localidad?.nombre, menores: sub.exigeInsigniaMenores, rut: sub.exigeRutDesdeAlta })} />
    </>
  );
}
