import Link from "next/link";
import { LOCALIDADES_BOGOTA, MARCA } from "@las3b/shared";
import { Logo } from "@/components/Logo";
import { Avatar, Estrella, formatoPromedio, TarjetaProveedor } from "@/components/TarjetaProveedor";
import { RECOMENDADOS_DEMO, RESENA_DESTACADA_DEMO } from "@/lib/demo";

/** Home (CU-01, CU-03). Diseño de referencia: docs/mockups/Home_web.dc.html y Home_movil.dc.html. */
const LOCALIDAD_INICIAL = "suba";

const CATEGORIAS = [
  {
    nombre: "Hogar",
    detalle: "Plomería, electricidad, pintura, cerrajería",
    corto: "Plomería, luz, pintura",
    slug: "hogar",
    tono: "bg-verde-claro text-verde-oscuro",
    icono: (
      <>
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10v10h14V10" />
      </>
    ),
  },
  {
    nombre: "Clases y refuerzo",
    detalle: "Matemáticas, inglés, música, tareas",
    corto: "Inglés, mate, música",
    slug: "clases-y-refuerzo",
    tono: "bg-amarillo-suave text-amarillo-oscuro",
    icono: (
      <>
        <path d="M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z" />
        <path d="M20 5h-4a2 2 0 0 0-2 2" />
        <path d="M20 5v13h-6" />
      </>
    ),
  },
  {
    nombre: "Acarreos",
    detalle: "Mudanzas de barrio, objetos pesados",
    corto: "Mudanzas de barrio",
    slug: "acarreos",
    tono: "bg-ladrillo-suave text-ladrillo-oscuro",
    icono: (
      <>
        <path d="M2 7h11v9H2z" />
        <path d="M13 10h4l4 3v3h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
  },
  {
    nombre: "Servicios varios",
    detalle: "Costura, mascotas, jardines, electrodomésticos",
    corto: "Costura, mascotas, jardín",
    slug: "servicios-varios",
    tono: "bg-piedra text-tinta",
    icono: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  },
];

const POPULARES = ["Plomería", "Inglés", "Mudanzas", "Cerrajería"];

const PASOS = [
  { titulo: "Busca", texto: "Dinos qué necesitas y en qué localidad estás.", tono: "bg-verde text-white" },
  { titulo: "Compara", texto: "Mira reseñas reales, fotos de trabajos e insignias de verificación.", tono: "bg-ladrillo text-white" },
  { titulo: "Escribe por WhatsApp", texto: "Acuerdas precio y fecha directo con el proveedor. Sin intermediarios.", tono: "bg-amarillo text-tinta" },
];

const CONFIANZA = [
  {
    titulo: "Identidad verificada",
    texto: "Revisamos el documento y el WhatsApp de cada proveedor",
    extra: " antes de publicarlo",
    color: "#0F6B5C",
    icono: (
      <>
        <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    titulo: "Reseñas de clientes reales",
    texto: "Solo califica quien contactó al proveedor desde Las 3B",
    extra: "",
    color: "#C2452D",
    icono: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    titulo: "Sin comisiones",
    texto: "Lo que pagas va completo al proveedor",
    extra: ". Las 3B no cobra por contactar",
    color: "#9A6F00",
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2" />
      </>
    ),
  },
];

const h2 = "font-display text-[22px] font-bold sm:text-[32px] sm:tracking-[-0.8px]";

const buscar = (params: Record<string, string>) => `/buscar?${new URLSearchParams(params)}`;

function TresPuntos({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      <span className={`size-2 rounded-full ${oscuro ? "bg-verde-vivo" : "bg-verde"}`} />
      <span className={`size-2 rounded-full ${oscuro ? "bg-ladrillo-claro" : "bg-ladrillo"}`} />
      <span className="size-2 rounded-full bg-amarillo" />
    </span>
  );
}

export default function Home() {
  const resena = RESENA_DESTACADA_DEMO;
  const enlaceNav = "flex h-11 items-center px-3.5 text-[15px] font-medium text-tinta";

  return (
    <>
      <header className="sm:border-b sm:border-borde">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 py-3.5 pl-5 pr-4 sm:flex-wrap sm:px-6 sm:py-4">
          <Link href="/" aria-label="Las 3B, inicio" className="text-tinta">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden flex-wrap items-center gap-1 sm:flex">
            <a href="#categorias" className={`${enlaceNav} hidden md:flex`}>Categorías</a>
            <a href="#como" className={`${enlaceNav} hidden md:flex`}>Cómo funciona</a>
            <Link href="/proveedores/registro" className={enlaceNav}>Soy proveedor</Link>
            <Link href="/ingresar" className="ml-1.5 flex h-11 items-center rounded-xl border-2 border-tinta px-[18px] text-[15px] font-semibold text-tinta">
              Ingresar
            </Link>
          </nav>
          {/* Móvil (Home_movil): Ingresar + menú */}
          <div className="relative flex items-center gap-0.5 sm:hidden">
            <Link href="/ingresar" className="flex h-11 items-center px-3 text-[15px] font-semibold text-tinta">Ingresar</Link>
            <details className="group">
              <summary aria-label="Abrir menú" className="flex size-11 cursor-pointer list-none items-center justify-center text-tinta [&::-webkit-details-marker]:hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </summary>
              <nav aria-label="Menú" className="absolute right-0 top-12 z-10 flex w-56 flex-col rounded-[18px] border border-borde-suave bg-white p-2 shadow-[0_8px_30px_rgba(27,38,35,0.12)]">
                <a href="#categorias" className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-tinta">Categorías</a>
                <a href="#como" className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-tinta">Cómo funciona</a>
                <Link href="/proveedores/registro" className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-tinta">Soy proveedor</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-5 pb-7 pt-2.5 sm:px-6 sm:pb-16 sm:pt-14">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px] sm:gap-[22px]">
            <span className="inline-flex h-[30px] items-center gap-2 self-start rounded-2xl border border-borde bg-white px-3 text-[13px] font-semibold text-tinta-2 sm:h-8 sm:px-3.5 sm:text-sm">
              <TresPuntos />
              <span className="sm:hidden">{MARCA.lema}</span>
              <span className="hidden sm:inline">Gratis · Sin comisiones · Hecho en Bogotá</span>
            </span>
            <h1 className="text-balance font-display text-[38px] font-extrabold leading-[1.05] sm:leading-[1.03] tracking-[-1.2px] sm:text-[3.6rem] sm:tracking-[-2px]">
              Encuentra quién te ayude, <span className="text-verde">cerca de ti.</span>
            </h1>
            <p className="max-w-[540px] text-base leading-normal text-tinta-2 sm:text-lg sm:leading-relaxed">
              <span className="sm:hidden">Plomeros, profesores, acarreos y oficios de confianza en tu localidad. Escríbeles directo por WhatsApp, sin comisiones.</span>
              <span className="hidden sm:inline">
                Plomeros, profesores particulares, acarreos y oficios de confianza en tu localidad. Compara reseñas reales y escríbeles directo por WhatsApp.
              </span>
            </p>

            <form action="/buscar" className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5 shadow-[0_6px_24px_rgba(27,38,35,0.08)] sm:flex-row sm:flex-wrap sm:items-end sm:rounded-[22px] sm:p-4 sm:shadow-[0_8px_30px_rgba(27,38,35,0.08)]">
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[2_1_220px]">
                <label htmlFor="q" className="text-[13px] font-semibold text-gris">
                  <span className="sm:hidden">¿Qué servicio o clase necesitas?</span>
                  <span className="hidden sm:inline">Servicio o clase</span>
                </label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B6663" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    id="q"
                    name="q"
                    type="search"
                    placeholder="Ej: plomero, clases de inglés"
                    className="h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white pl-11 pr-3.5 text-base text-tinta sm:pl-3.5"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-[1_1_160px]">
                <label htmlFor="localidad" className="text-[13px] font-semibold text-gris">Localidad</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 sm:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B6663" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  <select
                    id="localidad"
                    name="localidad"
                    defaultValue={LOCALIDAD_INICIAL}
                    className="h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white pl-11 pr-3 text-base text-tinta sm:pl-3"
                  >
                    {LOCALIDADES_BOGOTA.map((l) => (
                      <option key={l.slug} value={l.slug}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-1 h-13 rounded-campo bg-tinta px-7 text-[17px] font-semibold text-white sm:mt-0 sm:flex-none sm:text-base">
                Buscar
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-gris sm:text-sm">Populares:</span>
              {POPULARES.map((p, i) => (
                <Link
                  key={p}
                  href={buscar({ q: p, localidad: LOCALIDAD_INICIAL })}
                  className={`h-9 items-center rounded-[18px] border border-borde bg-white px-3.5 text-sm font-medium text-tinta sm:font-normal ${i < 3 ? "flex" : "hidden sm:flex"}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden min-w-0 flex-[1_1_380px] flex-col gap-3.5 sm:flex">
            <div className="flex flex-col gap-[18px] rounded-[28px] bg-tinta p-7 text-white">
              <div className="flex gap-2.5" aria-hidden="true">
                <span className="h-2.5 flex-1 rounded-full bg-verde-vivo" />
                <span className="h-2.5 flex-1 rounded-full bg-ladrillo-claro" />
                <span className="h-2.5 flex-1 rounded-full bg-amarillo" />
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-sm">
                {[
                  { b: "Bueno", t: "Identidad verificada", c: "text-verde-vivo" },
                  { b: "Bonito", t: "Fotos de trabajos reales", c: "text-ladrillo-claro" },
                  { b: "Barato", t: "Precios a la vista", c: "text-amarillo" },
                ].map((x) => (
                  <div key={x.b} className="flex flex-col gap-1">
                    <b className={`font-display text-[22px] ${x.c}`}>{x.b}</b>
                    <span className="leading-snug text-[#C9D1CF]">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>

            <article className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-[18px] shadow-[0_8px_30px_rgba(27,38,35,0.06)]">
              <Link href={`/${resena.proveedor.slug}`} className="flex items-center gap-3 text-tinta">
                <Avatar proveedor={resena.proveedor} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <b className="text-base">{resena.proveedor.nombre}</b>
                  <span className="text-sm text-gris">
                    {resena.proveedor.servicio} · {resena.proveedor.localidades.join(", ")}
                  </span>
                </span>
                <span className="ml-auto flex items-center gap-1 text-sm font-bold">
                  <Estrella />
                  {formatoPromedio(resena.proveedor.promedio)}
                </span>
              </Link>
              <p className="text-[15px] leading-normal text-tinta-2">«{resena.texto}»</p>
              <span className="text-[13px] text-gris">
                {resena.cliente} · {resena.localidad}
              </span>
            </article>
          </div>
        </section>

        <section id="categorias" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-col gap-3.5 px-5 pb-7 pt-2 sm:gap-5 sm:px-6 sm:pb-14 sm:pt-6">
          <h2 className={h2}>Categorías</h2>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
            {CATEGORIAS.map((c) => (
              <Link
                key={c.slug}
                href={buscar({ categoria: c.slug, localidad: LOCALIDAD_INICIAL })}
                className={`flex h-[124px] min-w-0 flex-col justify-between rounded-[18px] p-3.5 sm:h-auto sm:min-h-40 sm:flex-[1_1_240px] sm:gap-4 sm:rounded-[22px] sm:p-5 ${c.tono}`}
              >
                <svg className="size-7 sm:size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {c.icono}
                </svg>
                <span className="flex flex-col gap-0.5 sm:gap-1">
                  <b className="text-base sm:text-lg">{c.nombre}</b>
                  <span className="text-xs sm:hidden">{c.corto}</span>
                  <span className="hidden text-sm leading-snug sm:inline">{c.detalle}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-5 pb-7 pt-2 sm:gap-5 sm:px-6 sm:pb-14 sm:pt-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={h2}>Recomendados en Suba</h2>
            <Link href={buscar({ localidad: LOCALIDAD_INICIAL })} className="text-sm font-semibold text-verde hover:text-verde-oscuro sm:text-[15px]">
              Ver todos<span className="hidden sm:inline"> los resultados</span>
            </Link>
          </div>
          {/* Móvil muestra 2 tarjetas (Home_movil); escritorio, 3. */}
          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4 [&>*:nth-child(n+3)]:hidden sm:[&>*:nth-child(n+3)]:flex">
            {RECOMENDADOS_DEMO.map((p) => (
              <TarjetaProveedor key={p.slug} proveedor={p} />
            ))}
          </div>
        </section>

        <section id="como" className="scroll-mt-4 sm:border-y sm:border-borde-suave sm:bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 pb-7 pt-2 sm:gap-7 sm:px-6 sm:py-14">
            <h2 className={h2}>Así de fácil</h2>
            <ol className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-7">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="flex items-start gap-3.5 sm:flex-[1_1_260px] sm:flex-col sm:gap-3">
                  <span aria-hidden="true" className={`flex size-9 flex-none items-center justify-center rounded-full font-bold sm:size-11 sm:text-lg ${p.tono}`}>
                    {i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 sm:gap-3">
                    <b className="text-base sm:text-[19px]">{p.titulo}</b>
                    <span className="text-[15px] leading-[1.45] text-tinta-2 sm:text-base sm:leading-normal">{p.texto}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 pb-7 pt-2 sm:px-6 sm:py-14">
          <h2 className={`${h2} sm:sr-only`}>Por qué confiar</h2>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-4">
            {CONFIANZA.map((c) => (
              <div
                key={c.titulo}
                className="flex items-start gap-3 rounded-2xl border border-borde-suave bg-white p-3.5 sm:flex-[1_1_300px] sm:gap-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-1"
              >
                <svg className="size-[22px] flex-none sm:size-[26px]" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {c.icono}
                </svg>
                <span className="flex flex-col gap-0.5 sm:gap-1">
                  <b className="text-[15px] sm:text-[17px]">{c.titulo}</b>
                  <span className="text-sm leading-[1.45] text-tinta-2 sm:text-[15px] sm:leading-normal">
                    {c.texto}
                    <span className="hidden sm:inline">{c.extra}</span>.
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-7 pt-1 sm:px-6 sm:pb-14 sm:pt-0">
          <div className="flex flex-wrap items-center gap-10 rounded-3xl bg-tinta px-5 py-6 text-white sm:rounded-[32px] sm:px-10 sm:py-11">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 sm:gap-4">
              <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[1px] text-amarillo">
                <TresPuntos oscuro />
                Para proveedores
              </span>
              <h2 className="text-balance font-display text-[26px] font-extrabold leading-[1.1] sm:text-[40px] sm:leading-[1.05] sm:tracking-[-1px]">
                ¿Ofreces un servicio? Crea gratis tu página web.
              </h2>
              <p className="max-w-[520px] text-[15px] leading-normal text-[#D5DCDA] sm:text-[17px] sm:leading-relaxed">
                Tu portafolio con dirección propia, código QR para tus volantes y reseñas de tus clientes.
                <span className="hidden sm:inline"> Compártelo por WhatsApp y redes, y mira cuántos te visitan.</span>
              </p>
              <span className="self-start rounded-lg bg-amarillo px-2.5 py-1.5 font-mono text-sm text-tinta sm:hidden">lastresb.com.co/tu-nombre</span>
              <Link
                href="/proveedores/registro"
                className="mt-1 flex h-13 items-center justify-center rounded-campo bg-crema px-7 text-base font-bold text-tinta sm:mt-0 sm:h-[54px] sm:self-start sm:bg-amarillo"
              >
                Registrarme como proveedor
              </Link>
            </div>
            <div className="hidden min-w-0 flex-[0_1_360px] items-center gap-4 rounded-[22px] bg-crema p-[18px] text-tinta sm:flex">
              <svg className="flex-none" width="96" height="96" viewBox="0 0 21 21" role="img" aria-label="Ejemplo de código QR">
                <rect width="21" height="21" fill="#FFFFFF" />
                <path d="M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0z" fill="#1B2623" />
                <path d="M1 1h5v5H1zM15 1h5v5h-5zM1 15h5v5H1z" fill="#FFFFFF" />
                <path d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2z" fill="#1B2623" />
                <path
                  d="M8 1h1v2H8zM10 0h2v1h-2zM9 4h3v1H9zM8 6h1v3H8zM11 7h2v2h-2zM14 8h3v1h-3zM18 8h2v2h-2zM8 10h4v1H8zM13 10h1v3h-1zM15 11h2v2h-2zM19 12h2v1h-2zM8 13h2v2H8zM11 14h1v3h-1zM14 15h2v1h-2zM17 15h1v3h-1zM9 17h1v3H9zM12 18h3v1h-3zM19 17h2v2h-2zM14 20h4v1h-4zM1 8h4v1H1zM3 10h2v2H3zM0 12h2v1H0z"
                  fill="#1B2623"
                />
              </svg>
              <span className="flex min-w-0 flex-col gap-1.5">
                <b className="text-[15px]">Tu dirección propia</b>
                <span className="break-words font-mono text-sm text-verde-oscuro">lastresb.com.co/tu-nombre</span>
                <span className="text-[13px] leading-snug text-gris">Imprímelo en volantes, tarjetas o el vidrio de tu carro.</span>
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto hidden max-w-[1200px] flex-col gap-4 px-5 pb-14 sm:flex sm:px-6">
          <h2 className="font-display text-2xl font-bold">Busca por localidad</h2>
          <nav aria-label="Localidades" className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
            {LOCALIDADES_BOGOTA.map((l) => (
              <Link key={l.slug} href={buscar({ localidad: l.slug })} className="text-verde hover:text-verde-oscuro">
                {l.nombre}
              </Link>
            ))}
          </nav>
        </section>
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-[1200px] flex-col-reverse gap-3 px-5 pb-8 pt-6 text-sm text-gris sm:flex-row sm:flex-wrap sm:justify-between sm:gap-4 sm:px-6 sm:pb-9 sm:pt-7">
          <p className="max-w-[560px] leading-[1.45] sm:leading-normal">
            Las 3B es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4 sm:gap-[18px]">
            <Link href="/terminos" className="text-verde hover:text-verde-oscuro">Términos</Link>
            <Link href="/privacidad" className="text-verde hover:text-verde-oscuro">Datos personales</Link>
            <Link href="/resenas" className="text-verde hover:text-verde-oscuro">Política de reseñas</Link>
            <Link href="/reclamos" className="text-verde hover:text-verde-oscuro">Presentar un reclamo</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
