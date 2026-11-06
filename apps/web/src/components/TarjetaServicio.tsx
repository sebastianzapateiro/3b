import Link from "next/link";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
import type { ResultadoServicio } from "@/lib/busqueda";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const POR: Record<string, string> = { visita: "por visita", hora: "por hora", clase: "por clase", metro2: "por m²", trayecto: "por trayecto", trabajo: "por trabajo" };

const AVATARES = ["bg-[#D7E8E2] text-verde-oscuro", "bg-[#F6DCD5] text-ladrillo-oscuro", "bg-[#FCE8C2] text-amarillo-oscuro", "bg-[#E6E1F2] text-[#43307A]"];

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

/** Tarjeta de la vista «por servicios» de /proveedores (P2, CU-01): el servicio, su precio y quién lo ofrece. */
export function TarjetaServicio({ s, indice }: { s: ResultadoServicio; indice: number }) {
  const p = s.proveedor;
  const iniciales = p.nombre.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  const perfil = `/${p.slug}`;
  return (
    <article className="flex h-full flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-4">
      <div className="flex flex-col gap-1">
        {s.oficio && <span className="self-start rounded-full bg-verde-claro px-2.5 py-0.5 text-xs font-semibold text-verde-oscuro">{s.oficio}</span>}
        <h3 className="font-display text-lg font-bold leading-tight text-tinta">{s.nombre}</h3>
        {s.descripcion && <p className="line-clamp-2 text-sm leading-snug text-gris">{s.descripcion}</p>}
      </div>
      <p className="text-[15px] text-tinta">
        {s.precioDesde != null ? <><span className="text-gris">Desde </span><b>{pesos.format(s.precioDesde)}</b> <span className="text-gris">{POR[s.unidad] ?? ""}</span></> : <b>A convenir</b>}
      </p>

      <Link href={perfil} className="mt-auto flex items-center gap-3 rounded-2xl bg-crema p-2.5 text-tinta">
        {p.fotoPerfil ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.fotoPerfil} alt="" className="size-11 flex-none rounded-xl object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true" className={`flex size-11 flex-none items-center justify-center rounded-xl font-display text-base font-bold ${AVATARES[indice % AVATARES.length]}`}>{iniciales}</span>
        )}
        <span className="flex min-w-0 flex-col">
          <b className="truncate text-[15px]">{p.nombre}</b>
          <span className="text-[13px] font-semibold"><NivelPerfilMarca nivel={p.nivel} /></span>
        </span>
      </Link>

      <div className="flex gap-2">
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
