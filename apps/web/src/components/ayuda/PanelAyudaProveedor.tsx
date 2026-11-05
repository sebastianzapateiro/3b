"use client";

/**
 * A0 · Panel de ayuda para inscribirse como proveedor (CU-30). Se carga solo cuando alguien lo abre (lo importa AyudaProveedor).
 * Es un <dialog> modal: atrapa el foco, se cierra con Escape o al tocar fuera y devuelve el foco a quien lo abrió.
 * Escritorio: panel anclado abajo a la derecha, sobre el botón. Celular: hoja inferior.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { enlaceAyuda, eventoAyuda, TEXTO_ATENCION, type OrigenAyuda } from "@/lib/ayuda-inscripcion";

type Vista = "menu" | "llamar" | "listo";

const campo = "h-12 w-full min-w-0 rounded-campo border-[1.5px] border-borde-campo bg-white px-3 text-base";
const accion = "flex min-h-12 w-full items-center justify-center gap-2 rounded-campo px-4 text-[15px] font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta";

export default function PanelAyudaProveedor({ abierto, origen, alCerrar }: { abierto: boolean; origen: OrigenAyuda; alCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [vista, setVista] = useState<Vista>("menu");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const wa = enlaceAyuda();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      setVista("menu");
      setError("");
      d.showModal();
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/v1/ayuda-inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: f.get("nombre"),
          oficio: f.get("oficio"),
          celular: f.get("celular"),
          autoriza: f.get("autoriza") === "on",
          origen,
          pagina: window.location.pathname,
          web: f.get("web"),
        }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.error ?? "No pudimos enviar tu solicitud. Intenta de nuevo.");
      eventoAyuda("ayuda_enviar_llamada", origen);
      setVista("listo");
    } catch {
      setError("No pudimos enviar tu solicitud. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <dialog
      ref={ref}
      data-ayuda
      aria-labelledby={`${id}-t`}
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="fixed inset-auto bottom-0 left-0 right-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[24px] bg-white p-5 text-tinta shadow-[0_12px_40px_rgba(27,38,35,0.25)] backdrop:bg-black/30 sm:bottom-[88px] sm:left-auto sm:right-4 sm:max-h-[calc(100dvh-7rem)] sm:w-[400px] sm:rounded-[22px]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-t`} className="font-display text-xl font-extrabold leading-tight">¿Ofreces un servicio? Te ayudamos a inscribirte</h2>
        <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="-mr-2 -mt-2 flex size-11 flex-none items-center justify-center rounded-full hover:bg-piedra focus-visible:outline-3 focus-visible:outline-tinta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>

      {vista === "menu" && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-[15px] leading-normal text-tinta-2">{TEXTO_ATENCION}</p>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => eventoAyuda("ayuda_clic_whatsapp", origen)} className={`${accion} bg-tinta text-white hover:bg-verde-oscuro`}>
              Escríbenos por WhatsApp
            </a>
          )}
          <button type="button" onClick={() => setVista("llamar")} className={`${accion} bg-amarillo text-tinta hover:brightness-95`}>Que me llamen</button>
          <Link href="/ingreso" onClick={() => { eventoAyuda("ayuda_inscribirme_solo", origen); ref.current?.close(); }} className={`${accion} border-[1.5px] border-borde-campo text-tinta hover:border-tinta`}>
            Prefiero inscribirme yo solo
          </Link>
        </div>
      )}

      {vista === "llamar" && (
        <form onSubmit={enviar} className="mt-3 flex flex-col gap-3">
          <p className="text-[15px] leading-normal text-tinta-2">Déjanos tus datos y una persona del equipo te llama.</p>
          <div className="flex flex-col gap-1"><label htmlFor={`${id}-n`} className="text-sm font-semibold">Tu nombre</label><input id={`${id}-n`} name="nombre" required maxLength={80} autoComplete="given-name" className={campo} /></div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-o`} className="text-sm font-semibold">Tu oficio</label>
            <input id={`${id}-o`} name="oficio" required maxLength={120} list={`${id}-lista`} placeholder="Ej: plomería, clases de inglés" className={campo} />
            <datalist id={`${id}-lista`}>{TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => <option key={sub.slug} value={sub.nombre} />)}</datalist>
          </div>
          <div className="flex flex-col gap-1"><label htmlFor={`${id}-c`} className="text-sm font-semibold">Tu celular</label><input id={`${id}-c`} name="celular" type="tel" required inputMode="tel" autoComplete="tel" placeholder="300 000 0000" className={campo} /></div>
          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-tinta-2">
            <input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" />
            <span>Autorizo que me contacten para ayudarme a inscribirme, según la <Link href="/privacidad" target="_blank" className="font-semibold underline">política de tratamiento de datos</Link>.</span>
          </label>
          <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>
          {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setVista("menu")} className={`${accion} flex-1 border-[1.5px] border-borde-campo text-tinta`}>Volver</button>
            <button type="submit" disabled={enviando} className={`${accion} flex-[1.4] bg-tinta text-white disabled:opacity-60`}>{enviando ? "Enviando…" : "Enviar"}</button>
          </div>
        </form>
      )}

      {vista === "listo" && (
        <div className="mt-3 flex flex-col gap-3">
          <p role="status" className="rounded-xl bg-verde-claro px-3.5 py-3 text-[15px] font-semibold text-verde-oscuro">Listo, te contactamos pronto.</p>
          <button type="button" onClick={() => ref.current?.close()} className={`${accion} border-[1.5px] border-borde-campo text-tinta`}>Cerrar</button>
        </div>
      )}
    </dialog>
  );
}
