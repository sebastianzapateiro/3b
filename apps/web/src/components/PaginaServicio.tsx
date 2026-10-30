import Link from "next/link";
import { BARRIOS_PRINCIPALES, LOCALIDADES_BOGOTA, type CategoriaPadre, type LocalidadSlug, type Subcategoria } from "@las3b/shared";
import { BotonCercanos } from "@/components/BotonCercanos";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import type { PaginaResultados } from "@/lib/busqueda";
import { GUIAS } from "@/lib/guias";
import { jsonLdLista, jsonLdMigas, jsonLdServicio } from "@/lib/seo";
import { AVISO_GAS, h1, introduccion, preguntas, type Variante } from "@/lib/seo-servicios";

/**
 * Página SEO de un oficio en Bogotá: general, por localidad, urgente o económica.
 * Contenido propio del oficio (packages/shared), proveedores reales y enlaces internos. Nada se inventa.
 */
export function PaginaServicio({
  sub,
  padre,
  variante,
  localidad,
  resultado,
  precios,
  localidadesFuertes,
  variantesPublicadas,
  suficiente,
}: {
  sub: Subcategoria;
  padre: CategoriaPadre;
  variante: Variante;
  localidad?: { nombre: string; slug: string };
  resultado: PaginaResultados;
  precios: number[];
  localidadesFuertes: string[];
  variantesPublicadas: { urgente: boolean; economico: boolean };
  suficiente: boolean;
}) {
  const sufijo = variante === "base" || variante === "localidad" ? "" : `/${variante}`;
  const ruta = variante === "localidad" ? `/servicios/${sub.slug}/${localidad!.slug}` : `/servicios/${sub.slug}${sufijo}`;
  const titulo = h1(sub, variante, localidad?.nombre);
  const barrios = localidad ? BARRIOS_PRINCIPALES[localidad.slug as LocalidadSlug] ?? [] : [];
  const afines = padre.subcategorias.filter((s) => s.slug !== sub.slug).slice(0, 8);
  const guias = GUIAS.filter((g) => !g.categoria || g.categoria === padre.slug).slice(0, 3);
  const buscar = `/buscar?categoria=${sub.slug}${localidad ? `&localidad=${localidad.slug}` : ""}`;
  const enlace = "inline-flex min-h-11 items-center text-[15px] text-verde hover:text-verde-oscuro";
  const nombres = (slugs: string[]) => slugs.map((s) => LOCALIDADES_BOGOTA.find((l) => l.slug === s)).filter((l): l is NonNullable<typeof l> => Boolean(l));

  const migas = [
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Categorías", ruta: "/categorias" },
    { nombre: padre.nombre, ruta: `/categorias/${padre.slug}` },
    { nombre: sub.nombre, ruta: `/servicios/${sub.slug}` },
    ...(variante === "localidad" ? [{ nombre: localidad!.nombre, ruta }] : variante === "base" ? [] : [{ nombre: variante === "urgente" ? "Urgente" : "Económico", ruta }]),
  ];

  return (
    <>
      <JsonLd datos={jsonLdMigas(migas)} />
      <JsonLd datos={jsonLdServicio({ nombre: titulo, descripcion: sub.seo.intro, ruta, categoria: padre.nombre, localidad: localidad?.nombre })} />
      {resultado.items.length > 0 && <JsonLd datos={jsonLdLista(titulo, resultado.items.map((r) => ({ nombre: r.nombre, ruta: `/${r.slug}` })))} />}

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

        {variante === "urgente" && sub.slug === "tecnico-de-gas" && (
          <aside role="alert" className="rounded-[18px] border-2 border-ladrillo bg-ladrillo-suave p-4 text-[15px] font-semibold leading-normal text-ladrillo-oscuro">
            {AVISO_GAS}
          </aside>
        )}

        <header className="flex flex-col gap-3">
          <h1 className="text-balance font-display text-[32px] font-extrabold leading-[1.08] tracking-[-1px] sm:text-5xl">{titulo}</h1>
          <p className="max-w-[720px] text-base leading-relaxed text-tinta-2 sm:text-lg">{introduccion(sub, variante, localidad?.nombre, barrios)}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={buscar} className="flex h-12 items-center rounded-campo bg-tinta px-6 text-base font-semibold text-white">Buscar y filtrar</Link>
            {variante === "base" && <BotonCercanos oficio={sub.slug} />}
            <Link href="/ingreso" className="flex h-12 items-center rounded-campo border-2 border-tinta px-6 text-base font-semibold text-tinta">Ofrezco este servicio</Link>
          </div>
        </header>

        {suficiente ? (
          <section aria-labelledby="proveedores" className="flex flex-col gap-3">
            <h2 id="proveedores" className="font-display text-2xl font-bold">{variante === "economico" ? "Del precio más bajo al más alto" : "Proveedores verificados"}</h2>
            <div className="flex flex-col gap-3 sm:gap-4">
              {resultado.items.map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
              {resultado.total > resultado.items.length && <Link href={buscar} className="flex h-12 items-center justify-center rounded-[14px] border-2 border-tinta text-base font-semibold text-tinta">Ver los {resultado.total} proveedores</Link>}
            </div>
          </section>
        ) : (
          <section aria-labelledby="sin-proveedores" className="flex flex-col gap-3">
            <h2 id="sin-proveedores" className="font-display text-2xl font-bold">Aún no tenemos proveedores para este servicio</h2>
            <p className="text-[15px] leading-normal text-tinta-2">Prueba con otra localidad o cuéntanos qué necesitas desde el <Link href="/" className="font-semibold text-verde underline">inicio</Link>. ¿Ofreces este servicio? <Link href="/ingreso" className="font-semibold text-verde underline">Regístrate gratis</Link>.</p>
          </section>
        )}

        {sub.seo.problemas.length > 0 && (
          <section aria-labelledby="problemas" className="flex flex-col gap-2">
            <h2 id="problemas" className="font-display text-xl font-bold">Problemas que resuelven</h2>
            <ul className="flex flex-wrap gap-2">{sub.seo.problemas.map((p) => <li key={p} className="flex h-9 items-center rounded-full bg-piedra px-3.5 text-sm">{p}</li>)}</ul>
          </section>
        )}

        {(sub.exigeRutDesdeAlta || sub.exigeInsigniaMenores) && (
          <section aria-label="Verificaciones" className="flex flex-col gap-1.5 rounded-[18px] border border-borde-suave bg-white p-4 text-[15px] leading-normal text-tinta-2">
            {sub.exigeRutDesdeAlta && <p>En servicios de mayor riesgo solo aparecen proveedores con RUT verificado.</p>}
            {sub.exigeInsigniaMenores && <p>Los proveedores que trabajan con menores tienen verificación de antecedentes (Ley 1918).</p>}
          </section>
        )}


        <section aria-labelledby="otras-paginas" className="flex flex-col gap-2">
          <h2 id="otras-paginas" className="font-display text-xl font-bold">Más opciones de {sub.nombre.toLowerCase()}</h2>
          <ul className="flex flex-wrap gap-x-5">
            {variante !== "base" && <li><Link href={`/servicios/${sub.slug}`} className={`${enlace} font-semibold`}>{sub.nombre} en toda Bogotá</Link></li>}
            {variante !== "urgente" && variantesPublicadas.urgente && <li><Link href={`/servicios/${sub.slug}/urgente`} className={enlace}>Urgente / 24 horas</Link></li>}
            {variante !== "economico" && variantesPublicadas.economico && <li><Link href={`/servicios/${sub.slug}/economico`} className={enlace}>Los más económicos</Link></li>}
            {nombres(localidadesFuertes).filter((l) => l.slug !== localidad?.slug).map((l) => <li key={l.slug}><Link href={`/servicios/${sub.slug}/${l.slug}`} className={enlace}>{sub.nombre} en {l.nombre}</Link></li>)}
          </ul>
        </section>

        <section aria-labelledby="afines" className="flex flex-col gap-2">
          <h2 id="afines" className="font-display text-xl font-bold">Otros oficios de {padre.nombre}</h2>
          <ul className="flex flex-wrap gap-x-5">
            {afines.map((s) => <li key={s.slug}><Link href={`/servicios/${s.slug}`} className={enlace}>{s.nombre}</Link></li>)}
            <li><Link href={`/categorias/${padre.slug}`} className={`${enlace} font-semibold`}>Ver toda la categoría {padre.nombre}</Link></li>
          </ul>
        </section>

        <section aria-labelledby="guias" className="flex flex-col gap-2">
          <h2 id="guias" className="font-display text-xl font-bold">Antes de contratar</h2>
          <ul className="flex flex-col">{guias.map((g) => <li key={g.slug}><Link href={`/guias/${g.slug}`} className={enlace}>{g.titulo}</Link></li>)}</ul>
        </section>
      </main>
      <Faq preguntas={preguntas(sub, { localidad: localidad?.nombre, precios, urgente: variante === "urgente" })} />
    </>
  );
}
