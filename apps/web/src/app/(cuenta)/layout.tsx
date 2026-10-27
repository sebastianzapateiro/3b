import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Pantallas de cuenta (ingresar, registro, recuperar clave). Mockup: docs/mockups/Login_movil.dc.html.
 * Escritorio no tiene mockup: panel de marca a la izquierda y el mismo formulario a la derecha.
 */
export const metadata = { robots: { index: false } };

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh lg:p-4">
      <aside className="hidden flex-[1_1_0] flex-col justify-between rounded-[28px] bg-tinta p-12 text-white lg:flex">
        <Link href="/" aria-label="Las 3B, inicio" className="text-crema">
          <Logo oscuro />
        </Link>
        <div className="flex max-w-[480px] flex-col gap-6">
          <div className="flex gap-2.5" aria-hidden="true">
            <span className="h-2.5 flex-1 rounded-full bg-verde-vivo" />
            <span className="h-2.5 flex-1 rounded-full bg-ladrillo-claro" />
            <span className="h-2.5 flex-1 rounded-full bg-amarillo" />
          </div>
          <p className="text-balance font-display text-[44px] font-extrabold leading-[1.05] tracking-[-1.2px]">
            Quien te ayuda, <span className="text-verde-vivo">cerca de ti.</span>
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <b className="font-display text-[22px] text-verde-vivo">Bueno</b>
              <span className="leading-snug text-[#C9D1CF]">Identidad verificada</span>
            </div>
            <div className="flex flex-col gap-1">
              <b className="font-display text-[22px] text-ladrillo-claro">Bonito</b>
              <span className="leading-snug text-[#C9D1CF]">Fotos de trabajos reales</span>
            </div>
            <div className="flex flex-col gap-1">
              <b className="font-display text-[22px] text-amarillo">Barato</b>
              <span className="leading-snug text-[#C9D1CF]">Precios a la vista</span>
            </div>
          </div>
        </div>
        <p className="max-w-[420px] text-sm leading-normal text-[#C9D1CF]">
          Las 3B es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
        </p>
      </aside>

      <main className="flex flex-[1_1_0] flex-col px-6 pb-7 pt-4 lg:items-center lg:justify-center lg:px-12 lg:py-10">
        <div className="flex w-full max-w-[420px] flex-1 flex-col self-center lg:flex-none">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/" aria-label="Volver al inicio" className="-ml-2.5 flex size-11 items-center justify-center text-tinta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <Logo />
            <span className="w-11" aria-hidden="true" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
