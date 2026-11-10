import Link from "next/link";
import type { Metadata } from "next";
import { LOCALIDADES_BOGOTA, LOCALIDADES_VECINAS, subcategoriaPorSlug, type LocalidadSlug } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { AvisoWhatsApp } from "@/components/AvisoWhatsApp";
import { HojaFiltros, PanelFiltros } from "@/components/PanelFiltros";
import { SelectorOrden } from "@/components/SelectorOrden";
import { TarjetaResultado } from "@/components/TarjetaResultado";
import { TarjetaServicio } from "@/components/TarjetaServicio";
import { cookies } from "next/headers";
import { contieneServicioProhibido } from "@las3b/shared";
import { conteosPorOficio, minProveedoresSeo } from "@/lib/publicacion";
import { buscarProveedores, buscarServicios, categoriaDeTexto, conteosDeFiltros, filtrosDesdeParams, type PaginaResultados, type PaginaServicios } from "@/lib/busqueda";
import { COOKIE_SOLICITUD, obtenerSolicitud } from "@/lib/solicitudes";
import { ETIQUETA_INSIGNIA, ORDENES, aplicaNinos, etiquetaTope, paramsDesdeValores, valoresDesdeParams, type ConteosFiltros, type Orden } from "@/lib/filtros";
import { FAQ_BUSCAR } from "@/lib/faqs";
import { JsonLd } from "@/components/JsonLd";
import { jsonLdLista, jsonLdMigas, meta } from "@/lib/seo";

/**
 * Proveedores (P2, CU-01): todos los proveedores aprobados en cuadrícula, con filtros y búsqueda. Reemplaza a /buscar y a la portada de /categorias.
 * Mockups: docs/mockups/Resultados_web.dc.html y Resultados_movil.dc.html.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const sp = await searchParams;
  const categoria = uno(sp.categoria);
  // La lista completa se indexa; las búsquedas con parámetros no (apuntan a la página SEO del oficio, si la hay).
  if (Object.keys(sp).length === 0) {
    return meta({
      titulo: "Proveedores y servicios de confianza en Bogotá",
      descripcion: "Plomeros, electricistas, profesores, instaladores y más: compara servicios, precios y reseñas reales, y escríbeles directo por WhatsApp. Sin comisiones.",
      ruta: "/proveedores",
    });
  }
  // Resultados filtrados: no se indexan. La canonical apunta a la página SEO del oficio solo si ya existe y se indexa (si no, sería
  // una canonical hacia una página noindex o 404); en cualquier otro caso, a la lista general.
  let canonical = "/proveedores";
  if (categoria && subcategoriaPorSlug(categoria) && Object.keys(sp).every((k) => k === "categoria")) {
    const [conteos, minimo] = await Promise.all([conteosPorOficio().catch(() => []), minProveedoresSeo()]);
    if ((conteos.find((c) => c.oficio === categoria)?.total ?? 0) >= minimo) canonical = `/servicios/${categoria}`;
  }
  return {
    title: "Proveedores: resultados de búsqueda",
    robots: { index: false, follow: true },
    alternates: { canonical },
  };
}

type Params = Record<string, string | string[] | undefined>;

const CONTEOS_VACIOS: ConteosFiltros = {
  insignias: { verificado: 0, formalizado: 0, certificado: 0, apto_menores: 0 },
  hoy: 0, h24: 0, visita: {}, conResenas: 0, cal4: 0, cal45: 0,
};

const UUID =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const varios = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const ETIQUETA_ORDEN: Record<Orden, string> = {
  relevancia: "Relevancia",
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
  const params = new URLSearchParams();
  for (const [k, val] of Object.entries(sp)) for (const x of varios(val)) params.append(k, x);
  const { insignias, cal, visita, hoy, h24, tambien } = valoresDesdeParams(params);
  const pagina = Math.max(1, Number(uno(sp.pagina)) || 1);

  // Ubicación exacta (viene del buscador del inicio): se ordena del más cercano al más lejano, sin filtrar por localidad.
  const exacta = uno(sp.ubic) === "exacta";
  const idSolicitud = exacta ? (await cookies()).get(COOKIE_SOLICITUD)?.value : undefined;
  const solicitud = idSolicitud && UUID.test(idSolicitud) ? await obtenerSolicitud(idSolicitud) : null;
  const punto = solicitud?.punto ?? undefined;
  const enviada = uno(sp.solicitud) === "1";
  // Dos vistas del mismo listado: por servicios (la de inicio) o por proveedores.
  // Con ubicación exacta se ordena por cercanía al proveedor: solo la vista por proveedores lo hace.
  const porServicios = uno(sp.vista) !== "proveedores" && uno(sp.ubic) !== "exacta";

  // Si la base no responde (p. ej. en local sin el túnel) la página se muestra vacía en vez de caerse.
  let sinBase = false;
  const [resultado, conteos] = await Promise.all([
    porServicios ? buscarServicios(filtrosDesdeParams(params)) : buscarProveedores({ ...filtrosDesdeParams(params), punto }),
    conteosDeFiltros(filtrosDesdeParams(params)),
  ]).catch((e) => {
    // Aviso corto (no console.error): en desarrollo Next lo convertiría en una pantalla de error.
    console.warn("[proveedores] sin base de datos:", (e as { cause?: { code?: string } }).cause?.code ?? (e instanceof Error ? e.message.slice(0, 80) : e));
    sinBase = true;
    const vacio: PaginaResultados = { items: [], total: 0, pagina, porPagina: 10, categoriaNombre: null };
    return [vacio, CONTEOS_VACIOS] as const;
  });
  // «Calificación» y «Mejor calificados» solo existen cuando hay proveedores con reseñas suficientes.
  const hayCalificados = conteos.conResenas > 0;

  const nombreLocalidad = LOCALIDADES_BOGOTA.find((l) => l.slug === localidad)?.nombre;
  const lugar = nombreLocalidad ? ` en ${nombreLocalidad}` : exacta ? " cerca de ti" : "";
  const tema = resultado.categoriaNombre ?? (q ? `«${q}»` : null);
  const titulo = tema ? `${tema}${lugar}` : nombreLocalidad ? `Proveedores en ${nombreLocalidad}` : "Proveedores";
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.porPagina));

  /** URL de /proveedores con los parámetros actuales y los cambios indicados (null = quitar). */
  const href = (cambios: Record<string, string | string[] | null>) => {
    const p = new URLSearchParams();
    const actual: Record<string, string | string[] | undefined> = {
      q, localidad, categoria, orden, vista: porServicios ? undefined : "proveedores", ubic: exacta ? "exacta" : undefined, solicitud: enviada ? "1" : undefined, cal: cal === "0" ? undefined : cal, visita: visita || undefined,
      hoy: hoy ? "1" : undefined, h24: h24 ? "1" : undefined,
      insignia: insignias, tambien, pagina: pagina > 1 ? String(pagina) : undefined,
    };
    for (const [k, v] of Object.entries({ ...actual, ...cambios })) {
      if (v == null) continue;
      for (const x of Array.isArray(v) ? v : [v]) p.append(k, x);
    }
    return `/proveedores?${p}`;
  };
  const limpiar = href({ insignia: null, cal: null, visita: null, hoy: null, h24: null, tambien: null, pagina: null });

  // Filtros activos como chips con «x» para quitarlos de uno en uno.
  const activos: { texto: string; quitar: string }[] = [
    ...(nombreLocalidad && !exacta ? [{ texto: nombreLocalidad, quitar: href({ localidad: null, tambien: null, pagina: null }) }] : []),
    ...(q ? [{ texto: `«${q}»`, quitar: href({ q: null, pagina: null }) }] : []),
    ...insignias.map((i) => ({ texto: ETIQUETA_INSIGNIA[i], quitar: href({ insignia: insignias.filter((x) => x !== i), pagina: null }) })),
    ...(cal !== "0" ? [{ texto: `★ ${cal.replace(".", ",")}+`, quitar: href({ cal: null, pagina: null }) }] : []),
    ...(visita ? [{ texto: visita === "convenir" ? "Visita a convenir" : `Visita ${etiquetaTope(Number(visita)).toLowerCase()}`, quitar: href({ visita: null, pagina: null }) }] : []),
    ...(hoy ? [{ texto: "Urgente hoy", quitar: href({ hoy: null, pagina: null }) }] : []),
    ...(h24 ? [{ texto: "24 horas", quitar: href({ h24: null, pagina: null }) }] : []),
    ...tambien.map((t) => ({ texto: `También ${LOCALIDADES_BOGOTA.find((l) => l.slug === t)?.nombre ?? t}`, quitar: href({ tambien: tambien.filter((x) => x !== t), pagina: null }) })),
  ];
  // «hayFiltros» (los del panel) no cuenta la localidad ni el texto buscado, que sí se muestran como chips.
  const hayFiltros = insignias.length > 0 || cal !== "0" || !!visita || hoy || h24 || tambien.length > 0;
  /** Borra todo: filtros, localidad, texto y oficio. Deja solo la vista elegida. */
  const borrarTodo = href({ q: null, localidad: null, categoria: null, ubic: null, solicitud: null, orden: null, insignia: null, cal: null, visita: null, hoy: null, h24: null, tambien: null, pagina: null });

  // Parámetros ajenos al panel y datos que este necesita.
  const base = new URLSearchParams();
  for (const [k, x] of [["q", q], ["localidad", localidad], ["categoria", categoria], ["orden", orden], ["vista", porServicios ? undefined : "proveedores"], ["ubic", exacta ? "exacta" : undefined], ["solicitud", enviada ? "1" : undefined]] as const) if (x) base.set(k, x);
  const inicial = { insignias, cal, visita, hoy, h24, tambien };
  const vecinas = (localidad && localidad in LOCALIDADES_VECINAS ? LOCALIDADES_VECINAS[localidad as LocalidadSlug] : []).map((s) => ({
    slug: s,
    nombre: LOCALIDADES_BOGOTA.find((l) => l.slug === s)?.nombre ?? s,
  }));
  const panel = { base: base.toString(), inicial, mostrarNinos: aplicaNinos(categoria), vecinas, conteos, mostrarCalificacion: hayCalificados };
  const ordenActual: Orden = orden === "calificacion" && !hayCalificados ? "relevancia" : (orden ?? "relevancia");
  const opcionesOrden = ORDENES.filter((o) => o !== "calificacion" || hayCalificados).map((o) => ({ valor: o, texto: ETIQUETA_ORDEN[o] }));

  // Sin resultados: ¿el texto corresponde a un oficio del catálogo? Si menciona un servicio no permitido no se ofrece el aviso.
  const sinResultados = resultado.items.length === 0;
  const prohibido = Boolean(q) && contieneServicioProhibido(q!);
  const oficio = sinResultados && !prohibido ? (resultado.categoriaNombre ?? (q && !sinBase ? (await categoriaDeTexto(q))?.nombre : null) ?? null) : null;
  const textoAviso = oficio ?? q ?? "";

  return (
    <>
      {/* Datos estructurados solo en la lista completa (las búsquedas con parámetros no se indexan). */}
      {Object.keys(sp).length === 0 && resultado.items.length > 0 && (
        <>
          <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Proveedores", ruta: "/proveedores" }])} />
          <JsonLd
            datos={jsonLdLista(
              "Proveedores y servicios en Bogotá",
              porServicios
                ? (resultado as PaginaServicios).items.map((s) => ({ nombre: `${s.nombre} · ${s.proveedor.nombre}`, ruta: `/${s.proveedor.slug}` }))
                : (resultado as PaginaResultados).items.map((r) => ({ nombre: r.nombre, ruta: `/${r.slug}` })),
            )}
          />
        </>
      )}      <main className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pb-14 pt-4 sm:px-6 sm:pt-7 lg:flex-row lg:items-start lg:gap-8">
        {/* Filtros: columna fija en escritorio; en móvil, panel desplegable */}
        <aside className="hidden min-w-0 lg:block lg:flex-[0_0_300px]">
          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col rounded-[22px] border border-borde-suave bg-white p-5"><PanelFiltros {...panel} modo="escritorio" /></div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_560px]">
          <form action="/proveedores" className="flex flex-wrap gap-2" role="search">
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

          {/* Móvil: botón que abre la hoja de filtros */}
          <div className="flex flex-col lg:hidden">
            <HojaFiltros {...panel} activos={activos.length} />
          </div>

          {activos.length > 0 && (
            <ul aria-label="Filtros activos" className="flex flex-wrap gap-2">
              {activos.map((a) => (
                <li key={a.texto}>
                  <Link href={a.quitar} aria-label={`Quitar filtro: ${a.texto}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-verde bg-verde-claro px-3.5 text-sm font-semibold text-verde-oscuro">
                    {a.texto}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link href={borrarTodo} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ladrillo-oscuro underline">Borrar todos los filtros</Link>
              </li>
            </ul>
          )}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.8px] sm:text-[34px] sm:tracking-[-1px]">{titulo}</h1>
              <span role="status" aria-live="polite" aria-atomic="true" className="text-[15px] text-gris">
                {resultado.total} {porServicios ? (resultado.total === 1 ? "servicio" : "servicios") : resultado.total === 1 ? "proveedor" : "proveedores"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <nav aria-label="Tipo de vista" className="flex rounded-xl bg-piedra p-1">
                {([[true, "Por servicios", href({ vista: null, pagina: null })], [false, "Por proveedores", href({ vista: "proveedores", pagina: null })]] as const).map(([activa, texto, destino]) => (
                  <Link key={texto} href={destino} aria-current={porServicios === activa ? "page" : undefined} className={`flex h-9 items-center rounded-lg px-3.5 text-sm font-semibold ${porServicios === activa ? "bg-white text-tinta shadow-sm" : "text-tinta-2 hover:text-tinta"}`}>{texto}</Link>
                ))}
              </nav>
              <SelectorOrden actual={ordenActual} opciones={opcionesOrden} base={paramsDesdeValores(inicial, base).toString()} />
            </div>
          </div>

          {resultado.items.length > 0 ? (
            <section aria-label="Resultados" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
              {porServicios
                ? (resultado as PaginaServicios).items.map((s, i) => <TarjetaServicio key={s.id} s={s} indice={i} />)
                : (resultado as PaginaResultados).items.map((r, i) => <TarjetaResultado key={r.slug} r={r} indice={i} />)}
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

          {exacta && resultado.items.length > 0 && !punto && (
            <p className="rounded-xl bg-piedra px-3.5 py-3 text-sm text-tinta-2">No pudimos medir tu ubicación, así que los ordenamos por calificación. Igual compartimos tu dirección con el proveedor que contactes.</p>
          )}

          <section className="flex flex-col gap-3 rounded-[18px] bg-amarillo-suave p-4 text-amarillo-oscuro">
            {sinBase ? (
              <b className="text-[15px]">No pudimos cargar los proveedores en este momento. Intenta de nuevo en un rato.</b>
            ) : sinResultados ? (
              <>
                <b className="text-[15px]">
                  {hayFiltros ? "No hay proveedores con estos filtros. Prueba quitar alguno." : `Aún no tenemos proveedores para ${tema ?? "esta búsqueda"}.`}
                </b>
                {hayFiltros && <Link href={limpiar} className="inline-flex min-h-11 items-center self-start rounded-campo bg-tinta px-5 text-sm font-semibold text-white">Quitar filtros</Link>}
                {!prohibido && !hayFiltros && (oficio || enviada) && textoAviso && (
                  <AvisoWhatsApp texto={textoAviso} localidadInicial={localidad ?? "suba"} lugar={exacta ? "direccion" : "localidad"} existente={enviada} />
                )}
                <div className="flex flex-wrap gap-x-4">
                  {oficio && <Link href="/ingreso" className="inline-flex min-h-11 items-center text-sm font-semibold underline">¿Ofreces este servicio? Regístrate gratis</Link>}
                  <Link href="/#categorias" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Ver categorías</Link>
                </div>
              </>
            ) : (
              <>
                <b className="text-[15px]">¿No encuentras lo que buscas?</b>
                <p className="text-sm leading-[1.45]">Prueba localidades vecinas o quita filtros.</p>
                <div className="flex flex-wrap gap-x-4">
                  {hayFiltros && <Link href={limpiar} className="inline-flex min-h-11 items-center text-sm font-semibold underline">Quitar filtros</Link>}
                  <Link href="/#categorias" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Ver categorías</Link>
                  <Link href="/ingreso" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Registrar mi servicio</Link>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Faq preguntas={FAQ_BUSCAR} />
    </>
  );
}
