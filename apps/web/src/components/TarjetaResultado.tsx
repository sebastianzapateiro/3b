import Link from "next/link";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
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

/** Tarjeta vertical de proveedor para la cuadrícula de /proveedores: perfil arriba, insignias y los dos botones abajo. */
export function TarjetaResultado({ r, indice }: { r: ResultadoBusqueda; indice: number }) {
  const iniciales = r.nombre.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const detalle = [r.servicios.join(", "), r.localidades.join(", ")].filter(Boolean).join(" · ");
  const perfil = `/${r.slug}`;
  const textoVisita = r.precioVisita != null ? `Visita desde ${pesos.format(r.precioVisita)}` : r.visitaAConvenir ? "Visita a convenir" : null;

  return (
    <article className="flex h-full flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-4">
      <Link href={perfil} className="flex min-w-0 gap-3 text-tinta">
        {r.fotoPerfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.fotoPerfil} alt={`Foto de ${r.nombre}`} className="size-16 flex-none rounded-2xl object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true" className={`flex size-16 flex-none items-center justify-center rounded-2xl font-display text-[22px] font-bold ${AVATARES[indice % AVATARES.length]}`}>
            {iniciales}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <b className="text-base">{r.nombre}</b>
          {detalle && <span className="line-clamp-2 text-sm text-gris">{detalle}</span>}
          <span className="flex flex-wrap items-center gap-x-1 text-sm font-semibold">
            <NivelPerfilMarca nivel={r.nivel} />
          </span>
        </span>
      </Link>

      {(r.insignias.length > 0 || r.atiendeUrgencias || r.disponible24h) && (
        <div className="flex flex-wrap gap-1.5">
          {r.atiendeUrgencias && <span className="flex h-[26px] items-center rounded-[13px] bg-piedra px-2.5 text-xs font-semibold text-tinta-2">Atiende urgencias</span>}
          {r.disponible24h && <span className="flex h-[26px] items-center rounded-[13px] bg-piedra px-2.5 text-xs font-semibold text-tinta-2">24 horas</span>}
          {r.insignias.map((i) => (
            <span key={i.clave} className={`flex h-[26px] items-center rounded-[13px] px-2.5 text-xs font-semibold ${TONO_INSIGNIA[i.clave] ?? "bg-piedra text-tinta-2"}`}>
              {i.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-1">
        {textoVisita && <b className="text-sm text-tinta">{textoVisita}</b>}
        <div className="flex gap-2">
          <Link href={perfil} className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-borde-campo text-[15px] font-semibold text-tinta">
            Ver perfil
          </Link>
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
