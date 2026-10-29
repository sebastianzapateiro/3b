import type { ResenaPublica } from "@/lib/portafolio-completo";

/** «hace 2 semanas», «hace 1 mes»… */
function haceCuanto(fecha: Date): string {
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000));
  if (dias < 1) return "hoy";
  if (dias < 7) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
  if (dias < 30) {
    const s = Math.floor(dias / 7);
    return `hace ${s} ${s === 1 ? "semana" : "semanas"}`;
  }
  if (dias < 365) {
    const m = Math.floor(dias / 30);
    return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
  }
  const a = Math.floor(dias / 365);
  return `hace ${a} ${a === 1 ? "año" : "años"}`;
}

/** Tarjeta de reseña (mockup Perfil_web, sección «Reseñas»). Solo existen reseñas de quien contactó desde Las 3B. */
export function Resena({ resena }: { resena: ResenaPublica }) {
  const n = Math.min(5, Math.max(0, resena.estrellas));
  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-[20px] border border-borde-suave bg-white p-[18px] sm:flex-[1_1_280px]">
      <span className="flex justify-between gap-2 text-[15px]">
        <b>{resena.nombreCliente}</b>
        <span className="text-gris">{haceCuanto(resena.creadoEn)}</span>
      </span>
      <span role="img" aria-label={`${n} de 5 estrellas`} className="text-sm tracking-[1px] text-amarillo-oscuro">
        {"★".repeat(n)}{"☆".repeat(5 - n)}
      </span>
      {resena.comentario && <p className="text-[15px] leading-[1.55] text-tinta-2">{resena.comentario}</p>}
      <span className="text-xs font-semibold text-verde-oscuro">Contactó por Las 3B</span>
      {resena.respuesta && <p className="rounded-xl bg-piedra p-3 text-sm leading-normal text-tinta-2"><b>Respuesta del proveedor:</b> {resena.respuesta}</p>}
    </article>
  );
}
