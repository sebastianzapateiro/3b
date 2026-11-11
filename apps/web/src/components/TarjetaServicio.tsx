import Link from "next/link";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
import type { ResultadoServicio } from "@/lib/busqueda";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const POR: Record<string, string> = { visita: "por visita", hora: "por hora", clase: "por clase", metro2: "por m²", trayecto: "por trayecto", trabajo: "por trabajo" };

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

/**
 * Tarjeta de la vista «por servicios» de /proveedores (P2, CU-01), sin fotos para no recargar la cuadrícula.
 * De arriba abajo: oficio y título del servicio · precio · quién lo ofrece · botones.
 */
export function TarjetaServicio({ s }: { s: ResultadoServicio }) {
  const p = s.proveedor;
  const perfil = `/${p.slug}`;
  return (
    <article className="flex h-full flex-col rounded-[20px] border border-borde-suave bg-white p-4">
      <div className="flex flex-col gap-1.5">
        {s.oficio && <span className="self-start text-xs font-bold uppercase tracking-wide text-verde-oscuro">{s.oficio}</span>}
        <h3 className="font-display text-lg font-bold leading-tight text-tinta">{s.nombre}</h3>
        {s.descripcion && <p className="line-clamp-2 text-sm leading-snug text-gris">{s.descripcion}</p>}
      </div>

      <p className="mt-3 text-[15px] text-tinta">
        {s.precioDesde != null ? <><span className="text-gris">Desde </span><b className="text-lg">{pesos.format(s.precioDesde)}</b> <span className="text-gris">{POR[s.unidad] ?? ""}</span></> : <b className="text-base">A convenir</b>}
      </p>

      {/* Quién lo ofrece: texto, sin foto. El bloque se pega al fondo para que los botones queden alineados entre tarjetas. */}
      <Link href={perfil} className="mt-auto flex flex-col gap-0.5 border-t border-borde-suave pt-3 text-tinta">
        <span className="text-xs text-gris">Lo ofrece</span>
        <b className="truncate text-[15px]">{p.nombre}</b>
        <NivelPerfilMarca nivel={p.nivel} />
      </Link>

      <div className="mt-3 flex gap-2">
        <Link href={perfil} className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-borde-campo text-[15px] font-semibold text-tinta">Ver perfil</Link>
        {/* Registra el clic en `contactos` (habilita la reseña) y abre WhatsApp. */}
        <a href={`/api/v1/contactos/ir?p=${p.slug}&origen=busqueda`} target="_blank" rel="noopener noreferrer" className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-[14px] bg-verde text-[15px] font-semibold text-white hover:bg-verde-oscuro">
          <IconoWhatsApp />
          WhatsApp
        </a>
      </div>
    </article>
  );
}
