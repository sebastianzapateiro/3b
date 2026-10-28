import type { ResenaPublica } from "@/lib/portafolio-completo";

const meses = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatearFecha(fecha: Date): string {
  const d = new Date(fecha);
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function Estrella({ llenada }: { llenada?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={llenada ? "#F5B700" : "none"}
      stroke={llenada ? "#B88600" : "#5B6663"}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m12 3 2.7 5.6 6.1 .9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

/** Tarjeta de reseña individual (mockup Perfil, sección "Reseñas"). */
export function Resena({ resena }: { resena: ResenaPublica }) {
  return (
    <article
      className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-3.5 sm:p-[18px]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-tinta">
          {resena.nombreCliente}
        </span>
        <span className="text-xs text-gris">
          {formatearFecha(resena.creadoEn)}
        </span>
      </div>
      <div className="flex items-center gap-1 text-sm text-amarillo-oscuro">
        {[1, 2, 3, 4, 5].map((n) => (
          <Estrella key={n} llenada={n <= resena.estrellas} />
        ))}
      </div>
      {resena.comentario && (
        <p className="mt-1 text-[14px] leading-normal text-tinta-2">
          «{resena.comentario}»
        </p>
      )}
    </article>
  );
}
