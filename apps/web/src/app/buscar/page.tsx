import Link from "next/link";
import type { Metadata } from "next";
import { LOCALIDADES_BOGOTA, subcategoriaPorSlug } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { FiltrosResultados } from "@/components/FiltrosResultados";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import { buscarProveedores, INSIGNIAS_FILTRO, ORDENES, type InsigniaFiltro, type Orden } from "@/lib/busqueda";
import { FAQ_BUSCAR } from "@/lib/faqs";

/** Resultados de búsqueda con filtros (P2, CU-01). Mockups: docs/mockups/Resultados_web.dc.html y Resultados_movil.dc.html. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const categoria = uno((await searchParams).categoria);
  // Las búsquedas con parámetros no se indexan; apuntan a la página SEO del oficio (si lo hay).
  return {
    title: "Resultados de búsqueda",
    robots: { index: false, follow: true },
    ...(categoria && subcategoriaPorSlug(categoria) ? { alternates: { canonical: `/servicios/${categoria}` } } : {}),
  };
}

type Params = Record<string, string | string[] | undefined>;

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const varios = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const ETIQUETA_ORDEN: Record<Orden, string> = {
  calificacion: "Mejor calificados",
  resenas: "Más reseñas",
  precio: "Menor precio",
};

export default async function Buscar({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = uno(sp.q);
  const localidad = uno(sp.localidad);
  const categoria = uno(sp.categoria);
  const orden = ORDENES.find((o) => o === uno(sp.orden));
  const insignias = varios(sp.insignia).filter((i): i is InsigniaFiltro => (INSIGNIAS_FILTRO as readonly string[]).includes(i));
  const cal = uno(sp.cal) === "4" || uno(sp.cal) === "4.5" ? uno(sp.cal)! : "0";
  const precioMax = Number(uno(sp.precioMax)) || undefined;
  const tambien = varios(sp.tambien);
  const pagina = Math.max(1, Number(uno(sp.pagina)) || 1);

  const resultado = await buscarProveedores({
    q,
    localidad,
    categoria,
    tambien,
    insignias,
    calificacionMin: Number(cal) || undefined,
    precioMax,
    orden,
    pagina,
  });

  const nombreLocalidad = LOCALIDADES_BOGOTA.find((l) => l.slug === localidad)?.nombre;
  const tema = resultado.categoriaNombre ?? (q ? `«${q}»` : null);
  const titulo = tema ? `${tema}${nombreLocalidad ? ` en ${nombreLocalidad}` : ""}` : nombreLocalidad ? `Servicios en ${nombreLocalidad}` : "Resultados de búsqueda";
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.porPagina));

  /** URL de /buscar con los parámetros actuales y los cambios indicados (null = quitar). */
  const href = (cambios: Record<string, string | string[] | null>) => {
    const p = new URLSearchParams();
    const actual: Record<string, string | string[] | undefined> = {
      q, localidad, categoria, orden, cal: cal === "0" ? undefined : cal, precioMax: precioMax ? String(precioMax) : undefined,
      insignia: insignias, tambien, pagina: pagina > 1 ? String(pagina) : undefined,
    };
    for (const [k, v] of Object.entries({ ...actual, ...cambios })) {
      if (v == null) continue;
      for (const x of Array.isArray(v) ? v : [v]) p.append(k, x);
    }
    return `/buscar?${p}`;
  };
  const alternar = (clave: InsigniaFiltro) =>
    href({ insignia: insignias.includes(clave) ? insignias.filter((i) => i !== clave) : [...insignias, clave], pagina: null });

  const valores = { q, localidad, categoria, orden, insignias, cal, precioMax, tambien };
  const limpiar = href({ insignia: null, cal: null, precioMax: null, tambien: null, pagina: null });
  const hayFiltros = insignias.length > 0 || cal !== "0" || Boolean(precioMax) || tambien.length > 0;

  const chip = (activo: boolean) =>
    `flex h-9 flex-none items-center gap-1.5 rounded-full px-3.5 text-sm ${activo ? "bg-verde font-semibold text-white" : "border border-borde-campo bg-white font-medium text-tinta"}`;

  return (
    <>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-14 pt-4 sm:px-6 sm:pt-7 lg:flex-row lg:items-start lg:gap-8">
        {/* Filtros: columna fija en escritorio; en móvil, panel desplegable */}
        <aside className="hidden min-w-0 lg:block lg:flex-[1_1_250px]">
          <FiltrosResultados prefijo="d" valores={valores} limpiar={limpiar} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_560px]">
          <form action="/buscar" className="flex flex-wrap gap-2" role="search">
            <div className="flex h-12 min-w-0 flex-[2_1_200px] items-center gap-2 rounded-[14px] border-[1.5px] border-borde-campo bg-white px-3">
              <svg className="flex-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6663" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input name="q" type="search" defaultValue={q} aria-label="Servicio o clase" placeholder="Ej: plomero, clases de inglés" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            </div>
            <select name="localidad" aria-label="Localidad" defaultValue={localidad ?? ""} className="h-12 min-w-0 flex-[1_1_140px] rounded-[14px] border-[1.5px] border-borde-campo bg-white px-3 text-base">
              <option value="">Toda Bogotá</option>
              {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
            </select>
            <button type="submit" className="h-12 rounded-[14px] bg-tinta px-6 text-[15px] font-semibold text-white">Buscar</button>
          </form>

          {/* Móvil: atajos y botón de filtros */}
          <div className="flex flex-col gap-3 lg:hidden">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <Link href={alternar("verificado")} aria-pressed={insignias.includes("verificado")} className={chip(insignias.includes("verificado"))}>
                {insignias.includes("verificado") && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>}
                Verificados
              </Link>
              <Link href={alternar("formalizado")} aria-pressed={insignias.includes("formalizado")} className={chip(insignias.includes("formalizado"))}>Formalizados</Link>
              <Link href={href({ cal: cal === "4" ? null : "4", pagina: null })} aria-pressed={cal === "4"} className={chip(cal === "4")}>4+ estrellas</Link>
            </div>
            <details className="group">
              <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-[14px] bg-tinta text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
                Filtros{hayFiltros ? " (activos)" : ""}
              </summary>
              <div className="mt-3"><FiltrosResultados prefijo="m" valores={valores} limpiar={limpiar} /></div>
            </details>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[34px] sm:tracking-[-1px]">{titulo}</h1>
              <span className="text-[15px] text-gris">
                {resultado.total} {resultado.total === 1 ? "proveedor" : "proveedores"}
              </span>
            </div>
            <form action="/buscar" className="flex items-center gap-2 text-sm text-tinta-2">
              {q && <input type="hidden" name="q" value={q} />}
              {localidad && <input type="hidden" name="localidad" value={localidad} />}
              {categoria && <input type="hidden" name="categoria" value={categoria} />}
              {insignias.map((i) => <input key={i} type="hidden" name="insignia" value={i} />)}
              {tambien.map((t) => <input key={t} type="hidden" name="tambien" value={t} />)}
              {cal !== "0" && <input type="hidden" name="cal" value={cal} />}
              {precioMax && <input type="hidden" name="precioMax" value={precioMax} />}
              <label htmlFor="orden">Ordenar por</label>
              <select id="orden" name="orden" defaultValue={orden ?? "calificacion"} className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white px-2.5 text-sm font-semibold text-tinta">
                {ORDENES.map((o) => <option key={o} value={o}>{ETIQUETA_ORDEN[o]}</option>)}
              </select>
              <button type="submit" className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-sm font-semibold text-tinta">Ordenar</button>
            </form>
          </div>

          {resultado.items.length > 0 ? (
            <section aria-label="Resultados" className="flex flex-col gap-3 sm:gap-4">
              {resultado.items.map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
            </section>
          ) : null}

          {totalPaginas > 1 && (
            <nav aria-label="Páginas de resultados" className="flex flex-wrap justify-center gap-1.5 pt-2">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href({ pagina: n === 1 ? null : String(n) })}
                  aria-current={n === pagina ? "page" : undefined}
                  className={`flex size-11 items-center justify-center rounded-xl font-semibold ${n === pagina ? "bg-tinta text-white" : "border border-borde-campo text-tinta"}`}
                >
                  {n}
                </Link>
              ))}
              {pagina < totalPaginas && (
                <Link href={href({ pagina: String(pagina + 1) })} className="flex h-11 items-center rounded-xl border border-borde-campo px-4 font-semibold text-tinta">Siguiente</Link>
              )}
            </nav>
          )}

          <section className="rounded-[18px] bg-amarillo-suave p-4 text-amarillo-oscuro">
            <b className="text-[15px]">{resultado.items.length > 0 ? "¿No encuentras lo que buscas?" : "No encontramos proveedores con esos criterios"}</b>
            <p className="mt-1.5 text-sm leading-[1.45]">
              Prueba localidades vecinas o quita filtros. También puedes pedirle a un conocido que se registre gratis.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4">
              {hayFiltros && <Link href={limpiar} className="inline-flex min-h-11 items-center text-sm font-semibold underline">Quitar filtros</Link>}
              <Link href="/categorias" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Ver categorías</Link>
              <Link href="/proveedores/registro" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Registrar un proveedor</Link>
            </div>
          </section>
        </div>
      </main>
      <Faq preguntas={FAQ_BUSCAR} />
    </>
  );
}
