import Link from "next/link";
import type { Insignia, ProveedorResumen } from "@/lib/demo";

/** Tarjeta de proveedor para home y resultados (RF-03). Mockup: Home_web, "Recomendados en Suba". */
const AVATAR: Record<ProveedorResumen["tono"], string> = {
  verde: "bg-[#D7E8E2] text-verde-oscuro",
  amarillo: "bg-[#FCE8C2] text-amarillo-oscuro",
  ladrillo: "bg-[#F6DCD5] text-ladrillo-oscuro",
};

const INSIGNIA: Record<Insignia, { texto: string; tono: string }> = {
  verificado: { texto: "Verificado", tono: "bg-verde-claro text-verde-oscuro" },
  formalizado: { texto: "Formalizado", tono: "bg-amarillo-suave text-amarillo-oscuro" },
  apto_menores: { texto: "Apto para menores", tono: "bg-ladrillo-suave text-ladrillo-oscuro" },
  certificado: { texto: "Certificado", tono: "bg-verde-claro text-verde-oscuro" },
};

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function Avatar({ proveedor }: { proveedor: ProveedorResumen }) {
  return (
    <span aria-hidden="true" className={`flex size-14 flex-none items-center justify-center rounded-2xl font-display text-xl font-bold ${AVATAR[proveedor.tono]}`}>
      {proveedor.iniciales}
    </span>
  );
}

export function Estrella() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#F5B700" stroke="#B88600" strokeWidth="1.5" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

export function formatoPromedio(promedio: number) {
  return decimal.format(promedio);
}

export function TarjetaProveedor({ proveedor }: { proveedor: ProveedorResumen }) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-3.5 sm:flex-[1_1_300px] sm:gap-3.5 sm:rounded-[22px] sm:p-[18px]">
      <Link href={`/${proveedor.slug}`} className="flex items-center gap-3 text-tinta">
        <Avatar proveedor={proveedor} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <b className="text-base">{proveedor.nombre}</b>
          <span className="text-sm text-gris">
            {proveedor.servicio} · {proveedor.localidades.join(", ")}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Estrella />
            {formatoPromedio(proveedor.promedio)}
            <span className="font-normal text-gris">({proveedor.totalResenas} reseñas)</span>
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap gap-1.5">
        {proveedor.insignias.map((i) => (
          <span key={i} className={`flex h-[26px] items-center rounded-[13px] px-2.5 text-xs font-semibold ${INSIGNIA[i].tono}`}>
            {INSIGNIA[i].texto}
          </span>
        ))}
        {proveedor.precioDesde != null && (
          <span className="flex h-[26px] items-center rounded-[13px] bg-arena px-2.5 text-xs font-semibold text-tinta-2">
            Desde {pesos.format(proveedor.precioDesde)}
          </span>
        )}
      </div>
      {/* P4: apuntará a /api/v1/contactos (registra el clic y redirige a wa.me). Por ahora abre el portafolio. */}
      <Link
        href={`/${proveedor.slug}`}
        className="mt-auto flex h-12 items-center justify-center gap-2 rounded-campo bg-verde text-base font-semibold text-white hover:bg-verde-oscuro"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
        </svg>
        Contactar por WA
      </Link>
    </article>
  );
}
