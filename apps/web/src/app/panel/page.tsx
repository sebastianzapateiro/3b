import Link from "next/link";
import { Aviso } from "@/components/cuenta";
import { AnilloAvance } from "@/components/panel/Avance";
import { pendientesAlta, type AltaProveedor } from "@/lib/alta-proveedor";
import { exigirProveedor, resumenPanel } from "@/lib/panel";
import { cambiarPausa } from "./actions";

/**
 * P8 · Resumen del panel del proveedor. En borrador es la guía del alta (CU-30): avance, siguiente paso y la
 * lista de pasos. Publicado: cifras de contactos y reseñas. Mockup: docs/mockups/Panel_proveedor.md.
 */
const tarjeta = "rounded-[20px] border border-[#EAE3D5] bg-white";
const numero = "font-display text-[38px] leading-none tabular-nums";

export const metadata = { title: "Resumen" };

export default async function Resumen({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; bienvenida?: string }> }) {
  const { proveedor: p } = await exigirProveedor();
  const sp = await searchParams;
  const borrador = p.estado === "borrador";
  const [r, alta] = await Promise.all([resumenPanel(p.id), pendientesAlta(p.id)]);
  const visible = p.estado === "aprobado" || p.estado === "en_revision";

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      {p.estado === "rechazado" && p.motivoRechazo && (
        <div className="rounded-[18px] bg-ladrillo-suave p-4 text-[15px] leading-normal text-ladrillo-oscuro"><b>Qué debes corregir:</b> {p.motivoRechazo}</div>
      )}
      {p.estado === "pendiente" && (
        <div className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">Tu perfil está en revisión. Te avisamos cuando quede publicado.</div>
      )}
      {p.rutFechaLimite && p.segmento === "independiente_sin_rut" && (
        <div className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">Tienes hasta el <b>{p.rutFechaLimite}</b> para cargar tu RUT. Si no, el perfil se pausa. <Link href="/panel/verificacion" className="font-semibold underline">Ir a verificación</Link></div>
      )}

      {borrador ? (
        <>
          <Avance alta={alta} bienvenida={sp.bienvenida === "1"} />
          <Pasos alta={alta} />
        </>
      ) : (
        <>
          <section aria-label="Cifras" className="flex flex-wrap gap-3.5">
            <div className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Te escribieron (30 días)</span><b className={`${numero} text-verde`}>{r.contactos30}</b><span className="text-[13px] text-gris">{r.contactos7} en los últimos 7 días</span></div>
            <div className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Tu calificación</span><b className={numero}>{p.totalResenas > 0 ? p.promedio.toFixed(1).replace(".", ",") : "—"}</b><span className="text-[13px] text-gris">{p.totalResenas} reseñas</span></div>
            <Link href="/panel/resenas" className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Reseñas sin responder</span><b className={numero}>{r.resenasSinResponder}</b><span className="text-[13px] font-semibold text-verde">Responder</span></Link>
            <div className={`${tarjeta} flex flex-[1_1_200px] items-center gap-3.5 p-[18px]`}>
              <AnilloAvance porcentaje={alta.porcentaje} tamano={64} />
              <span className="flex flex-col gap-0.5"><span className="text-sm font-semibold text-gris">Tu perfil</span>{alta.siguiente ? <Link href={alta.siguiente.href} className="text-[13px] font-semibold text-verde">Completar: {alta.siguiente.titulo.toLowerCase()}</Link> : <span className="text-[13px] text-gris">Completo</span>}</span>
            </div>
          </section>

          <section className={`${tarjeta} flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6`}>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold">Tu página pública</h2>
              <span className="text-sm text-gris">{visible ? "Así te ven tus clientes." : "Se publica cuando el equipo apruebe tu perfil."}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {visible && <Link href={`/${p.slug}`} className="flex h-11 items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Ver mi página</Link>}
              {(p.estado === "aprobado" || p.estado === "pausado") && (
                <form action={cambiarPausa}>
                  <input type="hidden" name="accion" value={p.estado === "aprobado" ? "pausar" : "reactivar"} />
                  <button type="submit" className="h-11 rounded-xl border-2 border-tinta px-4 text-sm font-semibold text-tinta">{p.estado === "aprobado" ? "Pausar mi perfil" : "Reactivar mi perfil"}</button>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/** Tarjeta principal del alta, compacta: porcentaje, una línea de contexto y el siguiente paso como botón. */
function Avance({ alta, bienvenida }: { alta: AltaProveedor; bienvenida: boolean }) {
  const s = alta.listo ? null : alta.siguiente;
  return (
    <section aria-labelledby="avance-titulo" className={`${tarjeta} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-baseline gap-3">
        <b id="avance-titulo" className="font-display text-[40px] font-extrabold leading-none tabular-nums tracking-[-1px]">
          {alta.porcentaje} %<span className="sr-only"> de tu perfil</span>
        </b>
        <span className="text-[15px] leading-snug text-tinta-2">
          {alta.listo ? "Tu perfil está listo para enviar." : bienvenida ? "¡Bienvenido! Tu perfil es un borrador: nadie lo ve aún." : "Tu perfil es un borrador: nadie lo ve aún."}
        </span>
      </div>
      {alta.listo ? (
        <Link href="/panel/confirmar" className="flex h-12 items-center justify-center rounded-campo bg-tinta px-6 text-base font-semibold text-white sm:self-start">Revisar y publicar</Link>
      ) : (
        s && (
          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-amarillo-suave px-4 py-3">
            <span className="flex min-w-0 flex-col text-amarillo-oscuro">
              <span className="text-[11px] font-bold uppercase tracking-[0.8px]">Siguiente paso</span>
              <b className="text-base leading-tight">{s.titulo}</b>
            </span>
            <Link href={s.href} className="flex h-10 flex-none items-center justify-center rounded-xl bg-tinta px-5 text-sm font-semibold text-white">Continuar</Link>
          </div>
        )
      )}
    </section>
  );
}

/** Lista numerada de pasos del alta; cada uno lleva a su sección. */
function Pasos({ alta }: { alta: AltaProveedor }) {
  return (
    <section className={`${tarjeta} flex flex-col p-2 sm:p-3`}>
      <h2 className="px-3 pb-1 pt-3 font-display text-xl font-bold">Pasos para publicar</h2>
      <ol className="flex flex-col">
        {alta.tareas.map((t, i) => {
          const actual = alta.siguiente?.clave === t.clave && !alta.listo;
          return (
            <li key={t.clave}>
              <Link href={t.href} className={`flex items-center gap-3.5 rounded-[14px] px-3 py-3.5 hover:bg-crema ${actual ? "bg-amarillo-suave/60" : ""}`}>
                <span aria-hidden="true" className={`flex size-9 flex-none items-center justify-center rounded-full text-sm font-bold ${t.ok ? "bg-verde text-white" : actual ? "bg-tinta text-white" : "border-2 border-borde-campo text-gris"}`}>{t.ok ? "✓" : i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-semibold">
                    {t.titulo}
                    {t.opcional && <span className="ml-1.5 text-sm font-normal text-gris">opcional</span>}
                    <span className="sr-only">{t.ok ? ", hecho" : ", pendiente"}</span>
                  </span>
                  <span className="text-sm text-gris">{t.texto}</span>
                </span>
                <span className="flex flex-none flex-col items-end gap-0.5 text-sm font-semibold">{t.ok ? <><span className="text-verde-oscuro">Terminado</span><span className="font-normal text-gris underline">Editar</span></> : <span className="text-verde">{t.iniciada ? "Completar" : "Empezar"}</span>}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href={alta.listo ? "/panel/confirmar" : "#"} aria-disabled={!alta.listo} className={`flex items-center gap-3.5 rounded-[14px] px-3 py-3.5 ${alta.listo ? "bg-amarillo-suave/60 hover:bg-crema" : "pointer-events-none opacity-50"}`}>
            <span aria-hidden="true" className={`flex size-9 flex-none items-center justify-center rounded-full text-sm font-bold ${alta.listo ? "bg-tinta text-white" : "border-2 border-borde-campo text-gris"}`}>{alta.tareas.length + 1}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[15px] font-semibold">Publicar</span>
              <span className="text-sm text-gris">{alta.listo ? "Aceptas los términos y el equipo revisa tu perfil." : "Se habilita cuando completes los pasos obligatorios."}</span>
            </span>
          </Link>
        </li>
      </ol>
    </section>
  );
}
