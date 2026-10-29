import Link from "next/link";
import { Aviso } from "@/components/cuenta";
import { exigirProveedor, resumenPanel } from "@/lib/panel";
import { cambiarPausa } from "./actions";

/** P8 · Resumen del panel del proveedor. Mockup: docs/mockups/Panel_proveedor.md. */
const tarjeta = "rounded-[22px] border border-borde-suave bg-white";
const numero = "font-display text-[38px] leading-none tabular-nums";

export default async function Resumen({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor: p } = await exigirProveedor();
  const sp = await searchParams;
  const r = await resumenPanel(p.id);

  const pasos = [
    { ok: Boolean(p.presentacion), texto: "Cuenta quién eres en «Sobre mí»", href: "/panel/perfil" },
    { ok: r.servicios > 0, texto: "Agrega al menos un servicio con su precio", href: "/panel/servicios" },
    { ok: r.localidades > 0, texto: "Elige las localidades donde trabajas", href: "/panel/perfil" },
    { ok: r.documentos > 0, texto: "Sube tus documentos para la verificación", href: "/panel/verificacion" },
  ];
  const completo = pasos.filter((x) => x.ok).length;
  const visible = p.estado === "aprobado" || p.estado === "en_revision";

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      {p.estado === "rechazado" && p.motivoRechazo && (
        <div className="rounded-[18px] bg-ladrillo-suave p-4 text-[15px] leading-normal text-ladrillo-oscuro"><b>Qué debes corregir:</b> {p.motivoRechazo}</div>
      )}
      {(p.estado === "pendiente" || p.estado === "borrador") && (
        <div className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">
          {p.estado === "pendiente" ? "Tu perfil está en revisión. Te avisamos cuando quede publicado." : "Tu perfil es un borrador. Completa los pasos de abajo para enviarlo a revisión."}
        </div>
      )}
      {p.rutFechaLimite && p.segmento === "independiente_sin_rut" && (
        <div className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">Tienes hasta el <b>{p.rutFechaLimite}</b> para cargar tu RUT. Si no, el perfil se pausa. <Link href="/panel/verificacion" className="font-semibold underline">Ir a verificación</Link></div>
      )}

      <section aria-label="Cifras" className="flex flex-wrap gap-3.5">
        <div className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Te escribieron (30 días)</span><b className={`${numero} text-verde`}>{r.contactos30}</b><span className="text-[13px] text-gris">{r.contactos7} en los últimos 7 días</span></div>
        <div className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Tu calificación</span><b className={numero}>{p.totalResenas > 0 ? p.promedio.toFixed(1).replace(".", ",") : "—"}</b><span className="text-[13px] text-gris">{p.totalResenas} reseñas</span></div>
        <Link href="/panel/resenas" className={`${tarjeta} flex flex-[1_1_200px] flex-col gap-1.5 p-[18px]`}><span className="text-sm font-semibold text-gris">Reseñas sin responder</span><b className={numero}>{r.resenasSinResponder}</b><span className="text-[13px] font-semibold text-verde">Responder</span></Link>
      </section>

      <section className={`${tarjeta} flex flex-col gap-3 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">Completa tu perfil</h2>
          <span className="text-sm font-semibold text-gris">{completo} de {pasos.length}</span>
        </div>
        <ul className="flex flex-col">
          {pasos.map((x) => (
            <li key={x.texto} className="flex items-center gap-3 border-t border-borde-suave py-2.5 first:border-0">
              <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center rounded-full text-sm font-bold ${x.ok ? "bg-verde text-white" : "border-2 border-borde-campo"}`}>{x.ok ? "✓" : ""}</span>
              <span className={`flex-1 text-[15px] ${x.ok ? "text-gris line-through" : ""}`}>{x.texto}</span>
              {!x.ok && <Link href={x.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-verde">Completar</Link>}
            </li>
          ))}
        </ul>
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
    </div>
  );
}
