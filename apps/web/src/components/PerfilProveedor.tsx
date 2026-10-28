import Link from "next/link";
import { enlaceWhatsApp } from "@las3b/shared";
import { Insignia } from "@/components/Insignia";
import { FotoTrabajo } from "@/components/FotoTrabajo";
import { Resena } from "@/components/Resena";
import type { PortafolioCompleto } from "@/lib/portafolio-completo";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const unidadLabel: Record<string, string> = {
  visita: "visita",
  hora: "hora",
  clase: "clase",
  metro2: "m²",
  trayecto: "trayecto",
  trabajo: "trabajo",
};

/**
 * P7 · Portafolio público completo del proveedor.
 * Diseño de referencia: docs/mockups/Perfil_web.dc.html y Perfil_movil.dc.html.
 */
export function PerfilProveedor({ proveedor }: { proveedor: PortafolioCompleto }) {
  const iniciales = proveedor.nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const enlaceWA =
    proveedor.whatsapp &&
    proveedor.categoriaPrincipal &&
    proveedor.localidadPrincipal
      ? enlaceWhatsApp(
          proveedor.whatsapp,
          proveedor.categoriaPrincipal,
          proveedor.localidadPrincipal,
        )
      : null;

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-5 pb-7 pt-2 sm:gap-5 sm:px-6 sm:pb-14 sm:pt-6">
      {/* Cabecera verde (mockup Perfil) */}
      <header className="flex max-w-[1120px] flex-wrap gap-12 px-5 sm:px-6 py-12 bg-verde-oscuro text-white sm:rounded-[28px] sm:py-16">
        <Link href="/buscar" className="flex h-11 items-center gap-2 text-white/90 hover:text-white sm:hidden">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a resultados
        </Link>
        <span className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono text-white/90">
          lastresb.com.co/{proveedor.slug}
        </span>
      </header>

      <div className="mx-auto max-w-[1120px] px-5 sm:px-6">
        <div className="flex flex-col gap-22 sm:flex-row sm:gap-28">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-[1_1_560px]">
            <span className="flex items-center gap-1 text-sm font-semibold text-amarillo">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="w-2 h-2 rounded-full bg-ladrillo-claro" />
              <span className="w-2 h-2 rounded-full bg-amarillo" />
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-40 flex-none items-center justify-center rounded-[30px] bg-[#D7E8E2] text-verde-oscuro font-display text-3xl font-bold sm:size-48 sm:text-4xl"
              >
                {iniciales}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-balance font-display text-[38px] font-extrabold leading-[1.05] sm:text-[48px]">
                  {proveedor.nombre}
                </h1>
                <span className="text-[16px] text-[#C9D1CF]">
                  {proveedor.categoriaPrincipal}
                  {proveedor.localidadPrincipal
                    ? ` · ${proveedor.localidadPrincipal}`
                    : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              {proveedor.insignias.map((i) => (
                <Insignia key={i.clave} insignia={i} />
              ))}
              <span
                className="flex h-[28px] items-center rounded-[14px] px-2.5 text-xs font-semibold bg-[#F4F0E8] text-tinta"
              >
                Responde en ~1 h
              </span>
            </div>

            {enlaceWA && (
              <a
                href={enlaceWA}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-campo bg-verde text-base font-semibold text-white hover:bg-verde-oscuro sm:mt-0"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
                </svg>
                Escribir por WhatsApp
              </a>
            )}
            <p className="mt-3 text-sm text-[#C9D1CF] text-center sm:text-left sm:mt-0">
              Se abre WhatsApp con un mensaje listo. Acuerdas precio y fecha directo.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-6 sm:flex-[1_1_560px]">
            {proveedor.presentacion && (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
                  Sobre mí
                </h2>
                <p className="text-[17px] leading-[1.6] text-tinta-2">
                  {proveedor.presentacion}
                </p>
              </section>
            )}

            {proveedor.servicios.length > 0 && (
              <section className="flex flex-col gap-10">
                <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
                  Servicios y precios
                </h2>
                <div className="flex flex-col gap-0 rounded-[20px] border border-borde-suave bg-white">
                  {proveedor.servicios.map((s, i) => (
                    <div
                      key={s.nombre}
                      className={`flex justify-between gap-12 px-5 py-4 sm:px-6 sm:py-5 ${
                        i < proveedor.servicios.length - 1 ? "border-b border-borde-suave" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <b className="text-[16px] font-semibold text-tinta">{s.nombre}</b>
                        {s.descripcion && (
                          <span className="text-[14px] text-gris">
                            {s.descripcion}
                          </span>
                        )}
                      </div>
                      <span className="text-[16px] font-variant-numeric tabular-nums font-semibold text-tinta">
                        Desde {s.precioDesde ? pesos.format(Number(s.precioDesde)) : "a convenir"}
                        {s.unidad && s.precioDesde ? ` / ${unidadLabel[s.unidad]}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-gris">
                  Precios orientativos. El valor final lo acuerdas con el proveedor.
                </span>
              </section>
            )}

            {proveedor.fotos.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
                    Trabajos
                  </h2>
                  {proveedor.fotos.length > 4 && (
                    <a href="#" className="text-sm font-semibold text-verde hover:text-verde-oscuro">
                      Ver las {proveedor.fotos.length} fotos
                    </a>
                  )}
                </div>
                <div
                  className={`grid gap-3 ${
                    proveedor.fotos.length <= 3
                      ? "grid-cols-3"
                      : "grid-cols-4"
                  } sm:grid-cols-4`}
                >
                  {proveedor.fotos.slice(0, 4).map((f) => (
                    <FotoTrabajo key={f.id} foto={f} />
                  ))}
                  {proveedor.fotos.length > 4 && (
                    <div className="aspect-[4/5] rounded-[16px] bg-borde-suave flex items-center justify-center text-[11px] font-semibold text-tinta">
                      +{proveedor.fotos.length - 4}
                    </div>
                  )}
                </div>
              </section>
            )}

            {proveedor.resenas.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
                  Reseñas
                </h2>
                <div className="flex flex-wrap gap-4 [&>*:nth-child(n+4)]:hidden sm:[&>*:nth-child(n+4)]:flex">
                  {proveedor.resenas.map((r) => (
                    <Resena key={r.creadoEn.getTime() + r.nombreCliente} resena={r} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
