"use client";

/**
 * A0 · Ayuda humana en /ingreso (CU-30). Para quien va a inscribirse como proveedor (o aún no eligió) es una tarjeta amarilla
 * que abre el mismo panel del botón flotante; para clientes queda un enlace discreto al WhatsApp del equipo.
 * El número sale de NEXT_PUBLIC_WHATSAPP_AYUDA (ver lib/ayuda-inscripcion.ts); sin él, el panel solo ofrece «Que me llamen».
 */
import { enlaceAyuda, EVENTO_ABRIR_AYUDA, TEXTO_ATENCION } from "@/lib/ayuda-inscripcion";

export function AyudaInscripcion({ tipo }: { tipo: "cliente" | "proveedor" | null }) {
  if (tipo === "cliente") {
    const href = enlaceAyuda("Hola, necesito ayuda para ingresar o crear mi cuenta en LasTresB.");
    if (!href) return null;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center text-center text-sm font-semibold text-verde underline hover:text-verde-oscuro">
        ¿Necesitas ayuda para ingresar? Escríbenos por WhatsApp
      </a>
    );
  }

  return (
    <section aria-labelledby="ayuda-titulo" className="flex flex-col gap-3 rounded-[22px] border border-amarillo bg-amarillo-suave p-5 sm:flex-row sm:items-start sm:gap-4">
      <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-2xl bg-amarillo text-tinta">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></svg>
      </span>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="ayuda-titulo" className="font-display text-xl font-extrabold leading-tight text-tinta">¿Quieres que te ayudemos a inscribirte?</h2>
          <p className="text-base leading-normal text-tinta">{TEXTO_ATENCION}</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_AYUDA, { detail: { origen: "ingreso" } }))}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-campo bg-tinta px-5 text-base font-semibold text-white hover:bg-verde-oscuro focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:w-auto sm:self-start"
        >
          Hablar con una persona del equipo
        </button>
      </div>
    </section>
  );
}
