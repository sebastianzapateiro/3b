import Link from "next/link";

/** Piezas comunes de las pantallas del backoffice (mockups BO_*). */

export const tarjeta = "rounded-[20px] border border-[#EAE3D5] bg-white";
export const campoAdmin = "h-11 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-[15px] text-tinta";
export const etiquetaAdmin = "text-sm font-semibold";
export const botonOscuro = "inline-flex h-11 items-center justify-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white";
export const botonBorde = "inline-flex h-11 items-center justify-center rounded-xl border-[1.5px] border-borde-campo bg-white px-4 text-sm font-semibold text-tinta";

/** Encabezado de página: título, subtítulo y acciones a la derecha. */
export function Encabezado({ titulo, subtitulo, atras, children }: { titulo: React.ReactNode; subtitulo?: string; atras?: { href: string; texto: string }; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-2.5 border-b border-borde bg-crema px-5 py-5 lg:px-8">
      {atras && (
        <Link href={atras.href} className="inline-flex h-8 items-center gap-1.5 self-start text-sm font-semibold text-tinta-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          {atras.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.8px] lg:text-[30px]">{titulo}</h1>
          {subtitulo && <span className="text-sm text-gris">{subtitulo}</span>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function Aviso({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-[15px] ${error ? "bg-ladrillo-suave text-ladrillo-oscuro" : "bg-verde-claro text-verde-oscuro"}`}>
      {error ?? ok}
    </p>
  );
}

const TONOS = {
  verde: "bg-verde-claro text-verde-oscuro",
  amarillo: "bg-amarillo-suave text-amarillo-oscuro",
  rojo: "bg-[#F9E1DB] text-ladrillo-oscuro",
  gris: "bg-piedra text-tinta-2",
} as const;

export function Chip({ tono, children }: { tono: keyof typeof TONOS; children: React.ReactNode }) {
  return <span className={`inline-flex h-6 items-center rounded-xl px-2 text-xs font-semibold ${TONOS[tono]}`}>{children}</span>;
}

export function Iniciales({ nombre, className = "size-10 rounded-xl text-sm" }: { nombre: string; className?: string }) {
  const i = nombre.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  return <span aria-hidden="true" className={`flex flex-none items-center justify-center bg-[#D7E8E2] font-bold text-verde-oscuro ${className}`}>{i}</span>;
}
