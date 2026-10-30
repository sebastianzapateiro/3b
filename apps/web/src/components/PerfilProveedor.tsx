import Link from "next/link";
import { AccionesPerfil } from "@/components/AccionesPerfil";
import { FotoTrabajo } from "@/components/FotoTrabajo";
import { Insignia } from "@/components/Insignia";
import { Resena } from "@/components/Resena";
import type { PortafolioCompleto } from "@/lib/portafolio-completo";
import { absoluta } from "@/lib/seo";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const unidadLabel: Record<string, string> = {
  visita: "Por visita",
  hora: "Por hora",
  clase: "Por clase",
  metro2: "Por m²",
  trayecto: "Por trayecto",
  trabajo: "Por trabajo",
};

const h2 = "font-display text-[21px] font-bold lg:text-[26px]";
const tarjeta = "rounded-[22px] border border-borde-suave bg-white";

function IconoEstrella() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#F5B700" stroke="#B88600" strokeWidth="1.5" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

function IconoWhatsApp({ tam }: { tam: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

function Verificacion({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className={`flex items-center gap-2.5 ${ok ? "" : "text-gris"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ok ? "#0F6B5C" : "#8C9592"} strokeWidth={ok ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ok ? <path d="M20 6 9 17l-5-5" /> : <circle cx="12" cy="12" r="8" />}
      </svg>
      {texto}
    </li>
  );
}

function BotonWhatsApp({ href, clase }: { href: string | null; clase: string }) {
  const base = `flex items-center justify-center gap-2 rounded-[14px] bg-verde font-bold text-white ${clase}`;
  const contenido = (
    <>
      <IconoWhatsApp tam={20} />
      Contactar por WA
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} hover:bg-verde-oscuro`}>{contenido}</a>
  ) : (
    <span aria-disabled="true" className={`${base} opacity-60`}>{contenido}</span>
  );
}

/**
 * P7 · Portafolio público del proveedor (RF-37 a RF-43).
 * Diseño de referencia: docs/mockups/Perfil_web.dc.html y Perfil_movil.dc.html.
 */
export function PerfilProveedor({ proveedor: p }: { proveedor: PortafolioCompleto }) {
  const iniciales = p.nombre.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  const url = absoluta(`/${p.slug}`);
  // El clic se registra en `contactos` antes de abrir WhatsApp: es lo que habilita la reseña (regla 4).
  const enlaceWA = p.esEjemplo || !p.whatsapp ? null : `/api/v1/contactos/ir?p=${p.slug}&origen=perfil`;
  const subtitulo = [p.categorias.join(" y "), p.localidades.join(", ")].filter(Boolean).join(" · ");
  const tiene = (clave: string) => p.insignias.some((i) => i.clave === clave);
  const desde = p.desde.toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
  const maxDistribucion = Math.max(1, ...p.distribucion);
  const promedio = p.promedio.toFixed(1).replace(".", ",");

  return (
    <div className="bg-crema">
      {/* Franja verde: volver, dirección propia y compartir */}
      <section className="bg-verde text-white">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-2 py-2.5 lg:px-6 lg:pb-24 lg:pt-4">
          <Link href="/buscar" aria-label="Volver a resultados" className="flex h-11 items-center gap-1.5 px-2 text-[15px] font-semibold text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            <span className="hidden lg:inline">Volver a resultados</span>
          </Link>
          <span className="flex items-center gap-2.5">
            <span className="hidden gap-1 lg:flex" aria-hidden="true">
              <span className="size-2 rounded-full bg-white" /><span className="size-2 rounded-full bg-ladrillo-claro" /><span className="size-2 rounded-full bg-amarillo" />
            </span>
            <span className="rounded-lg bg-white/15 px-2.5 py-1.5 font-mono text-[13px] lg:text-sm">lastresb.com.co/{p.slug}</span>
          </span>
          <span className="lg:hidden"><AccionesPerfil url={url} titulo={p.nombre} variante="icono" /></span>
          <span className="hidden w-0 lg:block" />
        </div>
      </section>

      <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-5 pb-14 lg:-mt-[72px] lg:flex-row lg:items-start lg:px-6">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-[999_1_560px] lg:gap-7">
          {p.esEjemplo && (
            <p className="rounded-2xl bg-amarillo-suave px-4 py-3 text-sm text-amarillo-oscuro">
              Perfil de ejemplo: los datos son ilustrativos y no corresponden a un proveedor real.
            </p>
          )}

          {/* Cabecera del perfil */}
          <section className="-mx-5 flex flex-col gap-3.5 bg-[linear-gradient(#0F6B5C_0_48px,transparent_48px)] px-5 lg:mx-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-[22px] lg:rounded-[26px] lg:border lg:border-borde-suave lg:bg-white lg:bg-none lg:p-7">
            <span aria-hidden="true" className="flex size-24 flex-none items-center justify-center rounded-[26px] border-4 border-crema bg-[#D7E8E2] font-display text-[34px] font-extrabold text-verde-oscuro lg:size-28 lg:rounded-[30px] lg:border-0 lg:text-[40px]">
              {iniciales}
            </span>
            <div className="flex min-w-0 flex-col gap-2 lg:flex-[1_1_300px]">
              <h1 className="text-balance font-display text-[30px] font-extrabold leading-[1.1] tracking-[-0.8px] lg:text-[38px] lg:leading-[1.05] lg:tracking-[-1px]">{p.nombre}</h1>
              {subtitulo && <span className="text-[15px] text-tinta-2 lg:text-base">{subtitulo}</span>}
              <div className="flex flex-wrap items-center gap-2">
                {p.totalResenas > 0 && (
                  <span className="mr-1 flex items-center gap-1.5 text-[15px] font-bold">
                    <IconoEstrella />{promedio}{" "}
                    <a href="#resenas" className="font-medium text-verde hover:text-verde-oscuro">{p.totalResenas} reseñas</a>
                  </span>
                )}
                {p.insignias.map((i) => <Insignia key={i.clave} insignia={i} />)}
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:hidden">
              <BotonWhatsApp href={enlaceWA} clase="h-[54px] text-[17px]" />
              <span className="text-center text-[13px] text-gris">Se abre WhatsApp con un mensaje listo. Acuerdas precio y fecha directo.</span>
            </div>
          </section>

          {p.presentacion && (
            <section className="flex flex-col gap-2 lg:gap-2.5">
              <h2 className={h2}>Sobre mí</h2>
              <p className="max-w-[640px] text-[15px] leading-[1.55] text-tinta-2 lg:text-[17px] lg:leading-[1.6]">{p.presentacion}</p>
            </section>
          )}

          {p.servicios.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>Servicios y precios</h2>
              <div className={`${tarjeta} flex flex-col rounded-[18px] lg:rounded-[20px]`}>
                {p.servicios.map((s, i) => (
                  <div key={s.nombre} className={`flex justify-between gap-3 px-4 py-3.5 lg:px-5 lg:py-4 ${i < p.servicios.length - 1 ? "border-b border-borde-suave" : ""}`}>
                    <span className="flex flex-col gap-0.5">
                      <b className="text-[15px] lg:text-base">{s.nombre}</b>
                      <span className="text-[13px] text-gris lg:text-sm">
                        {[unidadLabel[s.unidad], s.descripcion].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <b className="text-[15px] tabular-nums lg:text-base">
                      {s.precioDesde ? `desde ${pesos.format(Number(s.precioDesde))}` : "a convenir con el proveedor"}
                    </b>
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-gris lg:text-sm">Precios orientativos. El valor final lo acuerdas con el proveedor.</span>
            </section>
          )}

          {p.fotos.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className={h2}>Trabajos</h2>
                {p.fotos.length > 3 && <span className="text-sm font-semibold text-gris">{p.fotos.length} fotos</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-2.5">
                {p.fotos.slice(0, 4).map((f) => <FotoTrabajo key={f.id} foto={f} />)}
              </div>
            </section>
          )}

          <section id="resenas" className="flex scroll-mt-20 flex-col gap-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={h2}>Reseñas</h2>
              <Link href={`/${p.slug}/calificar`} className="hidden h-11 items-center rounded-xl border-2 border-tinta px-[18px] text-[15px] font-semibold text-tinta lg:flex">
                Calificar a este proveedor
              </Link>
            </div>

            {p.totalResenas > 0 && (
              <div className={`${tarjeta} flex items-center gap-4 rounded-[18px] p-4`}>
                <span className="flex flex-col items-center gap-0.5">
                  <b className="font-display text-[38px] leading-none">{promedio}</b>
                  <span className="text-xs text-gris">{p.totalResenas} reseñas</span>
                </span>
                <div className="flex flex-1 flex-col gap-[5px] text-xs tabular-nums text-gris">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <span key={n} className="flex items-center gap-1.5">
                      {n}
                      <span className="h-1.5 flex-1 rounded-[3px] bg-borde-suave">
                        <span className="block h-1.5 rounded-[3px] bg-verde" style={{ width: `${((p.distribucion[n - 1] ?? 0) / maxDistribucion) * 100}%` }} />
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {p.resenas.length > 0 ? (
              <div className="flex flex-wrap gap-3.5">
                {p.resenas.slice(0, 4).map((r) => <Resena key={`${r.creadoEn.getTime()}${r.nombreCliente}`} resena={r} />)}
              </div>
            ) : (
              <p className="text-[15px] text-tinta-2">Aún no tiene reseñas. Sé la primera persona en contar cómo te fue.</p>
            )}
            <Link href={`/${p.slug}/calificar`} className="flex h-12 items-center justify-center rounded-[14px] border-2 border-tinta text-[15px] font-semibold text-tinta lg:hidden">
              Calificar a este proveedor
            </Link>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_300px]">
          <div className={`hidden flex-col gap-3.5 p-[22px] shadow-[0_8px_30px_rgba(27,38,35,0.06)] lg:flex ${tarjeta} rounded-[26px]`}>
            <b className="font-display text-xl">Contacta directo</b>
            <BotonWhatsApp href={enlaceWA} clase="h-[54px] text-base" />
            <span className="text-[13px] leading-[1.45] text-gris">Acuerdas precio, fecha y garantía directo con el proveedor. LasTresB no cobra comisión.</span>
            <div className="flex flex-col gap-1.5 border-t border-borde-suave pt-3.5">
              <span className="text-sm leading-[1.4] text-tinta-2">Comparte este perfil con quien lo necesite.</span>
              <AccionesPerfil url={url} titulo={p.nombre} variante="boton" />
            </div>
          </div>

          <div className={`${tarjeta} flex flex-col gap-3 p-5`}>
            <b className="text-base">Verificaciones</b>
            <ul className="flex flex-col gap-2 text-[15px]">
              <Verificacion ok texto="Documento de identidad revisado" />
              <Verificacion ok texto="WhatsApp confirmado" />
              <Verificacion ok={tiene("formalizado")} texto={tiene("formalizado") ? "RUT vigente" : "RUT (sin cargar)"} />
              <Verificacion ok={tiene("certificado")} texto={tiene("certificado") ? "Certificado de oficio" : "Certificado de oficio (sin cargar)"} />
            </ul>
            <span className="text-[13px] leading-[1.45] text-gris">En LasTresB desde {desde}</span>
          </div>

          {p.localidades.length > 0 && (
            <div className={`${tarjeta} flex flex-col gap-2.5 p-5`}>
              <b className="text-base">Dónde trabaja</b>
              <ul className="flex flex-wrap gap-1.5">
                {p.localidades.map((l) => (
                  <li key={l} className="flex h-[30px] items-center rounded-[15px] bg-piedra px-3 text-sm">{l}</li>
                ))}
              </ul>
            </div>
          )}

          {p.enlaces.length > 0 && (
            <nav aria-label="Más servicios" className={`${tarjeta} flex flex-col gap-1 p-5`}>
              <b className="mb-1 text-base">Explora también</b>
              {p.enlaces.slice(0, 6).map((e) => <Link key={e.ruta} href={e.ruta} className="inline-flex min-h-9 items-center text-sm text-verde hover:text-verde-oscuro">{e.texto}</Link>)}
            </nav>
          )}

          <Link href={`/reportar?tipo=perfil&id=${p.slug}`} className="inline-flex min-h-11 items-center pl-1 text-sm font-semibold text-verde hover:text-verde-oscuro">Reportar este perfil</Link>
          <Link href={`/reclamos?proveedor=${p.slug}`} className="inline-flex min-h-11 items-center pl-1 text-sm font-semibold text-tinta-2 hover:text-verde-oscuro">Presentar un reclamo</Link>
        </aside>
      </div>

      <div className="border-t border-borde">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-gris lg:px-6">
          <span>Página creada gratis en <Link href="/" className="font-bold text-tinta">LasTres<span className="text-ladrillo">B</span></Link></span>
          <Link href="/ingreso" className="font-semibold text-verde hover:text-verde-oscuro">¿Ofreces un servicio? Crea tu página</Link>
        </div>
      </div>
    </div>
  );
}
