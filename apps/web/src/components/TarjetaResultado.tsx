import Link from "next/link";
import { Estrella, formatoPromedio } from "@/components/TarjetaProveedor";
import type { ResultadoBusqueda } from "@/lib/busqueda";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const AVATARES = [
  "bg-[#D7E8E2] text-verde-oscuro",
  "bg-[#F6DCD5] text-ladrillo-oscuro",
  "bg-[#FCE8C2] text-amarillo-oscuro",
  "bg-[#E6E1F2] text-[#43307A]",
];

const TONO_INSIGNIA: Record<string, string> = {
  verificado: "bg-verde-claro text-verde-oscuro",
  formalizado: "bg-amarillo-suave text-amarillo-oscuro",
  apto_menores: "bg-ladrillo-suave text-ladrillo-oscuro",
  certificado: "bg-verde-claro text-verde-oscuro",
};

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

/** Resultado de búsqueda (mockups Resultados_web: fila; Resultados_movil: tarjeta con «Ver perfil» y WhatsApp). */
export function TarjetaResultado({ r, indice }: { r: ResultadoBusqueda; indice: number }) {
  const iniciales = r.nombre.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const detalle = [r.servicios.join(", "), r.localidades.join(", ")].filter(Boolean).join(" · ");
  const perfil = `/${r.slug}`;

  return (
    <article className="flex flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-[18px] sm:rounded-[22px] sm:p-[18px]">
      <Link href={perfil} className="flex min-w-0 flex-1 gap-3 text-tinta sm:basis-[300px] sm:gap-[18px]">
        <span aria-hidden="true" className={`flex size-16 flex-none items-center justify-center rounded-2xl font-display text-[22px] font-bold sm:size-20 sm:rounded-[20px] sm:text-[26px] ${AVATARES[indice % AVATARES.length]}`}>
          {iniciales}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <b className="text-base sm:text-lg">{r.nombre}</b>
          {detalle && <span className="text-sm text-gris">{detalle}</span>}
          <span className="flex flex-wrap items-center gap-x-1 text-sm font-semibold">
            {r.totalResenas > 0 ? (
              <>
                <Estrella />
                {formatoPromedio(r.promedio)}
                <span className="font-normal text-gris">({r.totalResenas})</span>
              </>
            ) : (
              <span className="text-tinta-2">Nuevo en LasTresB</span>
            )}
            {r.precioDesde != null && <span className="font-normal text-gris sm:hidden">· Desde {pesos.format(r.precioDesde)} la visita</span>}
          </span>
        </span>
      </Link>

      {(r.insignias.length > 0 || r.atiendeUrgencias || r.disponible24h) && (
        <div className="flex flex-wrap gap-1.5 sm:order-last sm:w-full sm:basis-full sm:pl-[98px]">
          {r.atiendeUrgencias && <span className="flex h-[26px] items-center rounded-[13px] bg-piedra px-2.5 text-xs font-semibold text-tinta-2">Atiende urgencias</span>}
          {r.disponible24h && <span className="flex h-[26px] items-center rounded-[13px] bg-piedra px-2.5 text-xs font-semibold text-tinta-2">24 horas</span>}
          {r.insignias.map((i) => (
            <span key={i.clave} className={`flex h-[26px] items-center rounded-[13px] px-2.5 text-xs font-semibold ${TONO_INSIGNIA[i.clave] ?? "bg-piedra text-tinta-2"}`}>
              {i.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 sm:w-[220px] sm:flex-none sm:flex-col sm:items-stretch">
        {r.precioDesde != null && (
          <span className="hidden text-right text-sm text-tinta-2 sm:block">
            Visita desde <b className="text-tinta">{pesos.format(r.precioDesde)}</b>
          </span>
        )}
        <Link href={perfil} className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-borde-campo text-[15px] font-semibold text-tinta sm:hidden">
          Ver perfil
        </Link>
        {/* Registra el clic en `contactos` (habilita la reseña) y abre WhatsApp. */}
        <a href={`/api/v1/contactos/ir?p=${r.slug}&origen=busqueda`} target="_blank" rel="noopener noreferrer" className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-[14px] bg-verde text-[15px] font-semibold text-white hover:bg-verde-oscuro sm:flex-none">
          <IconoWhatsApp />
          <span className="sm:hidden">WhatsApp</span>
          <span className="hidden sm:inline">Escribir por WhatsApp</span>
        </a>
      </div>
    </article>
  );
}
