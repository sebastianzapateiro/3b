import Link from "next/link";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
import type { ResultadoBusqueda } from "@/lib/busqueda";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

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

/**
 * Tarjeta de proveedor para la cuadrícula de /proveedores (P2, CU-01), sin fotos.
 * De arriba abajo: oficios · nombre y nivel · zonas · distintivos · visita · botones.
 */
export function TarjetaResultado({ r }: { r: ResultadoBusqueda }) {
  const perfil = `/${r.slug}`;
  const textoVisita = r.precioVisita != null ? `Visita desde ${pesos.format(r.precioVisita)}` : r.visitaAConvenir ? "Visita a convenir" : null;
  const distintivos = [
    ...(r.atiendeUrgencias ? [{ k: "urg", t: "Atiende urgencias", c: "bg-piedra text-tinta-2" }] : []),
    ...(r.disponible24h ? [{ k: "24h", t: "24 horas", c: "bg-piedra text-tinta-2" }] : []),
    ...r.insignias.map((i) => ({ k: i.clave, t: i.nombre, c: TONO_INSIGNIA[i.clave] ?? "bg-piedra text-tinta-2" })),
  ];

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-borde-suave bg-white p-4">
      <Link href={perfil} className="flex min-w-0 flex-col gap-1.5 text-tinta">
        {r.servicios.length > 0 && <span className="line-clamp-1 text-xs font-bold uppercase tracking-wide text-verde-oscuro">{r.servicios.join(" · ")}</span>}
        <b className="font-display text-lg font-bold leading-tight">{r.nombre}</b>
        <NivelPerfilMarca nivel={r.nivel} />
        {r.localidades.length > 0 && <span className="line-clamp-1 text-sm text-gris">{r.localidades.join(", ")}</span>}
      </Link>

      {distintivos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {distintivos.map((d) => (
            <span key={d.k} className={`flex h-[26px] items-center rounded-[13px] px-2.5 text-xs font-semibold ${d.c}`}>{d.t}</span>
          ))}
        </div>
      )}

      {/* Visita y botones al fondo: quedan alineados entre tarjetas de distinta altura. */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {textoVisita && <b className="border-t border-borde-suave pt-3 text-[15px] text-tinta">{textoVisita}</b>}
        <div className="flex gap-2">
          <Link href={perfil} className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-borde-campo text-[15px] font-semibold text-tinta">Ver perfil</Link>
          {/* Registra el clic en `contactos` (habilita la reseña) y abre WhatsApp. */}
          <a href={`/api/v1/contactos/ir?p=${r.slug}&origen=busqueda`} target="_blank" rel="noopener noreferrer" className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-[14px] bg-verde text-[15px] font-semibold text-white hover:bg-verde-oscuro">
            <IconoWhatsApp />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
