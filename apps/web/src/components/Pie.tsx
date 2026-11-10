import Link from "next/link";
import { MARCA } from "@las3b/shared";
import { BotonCookies } from "@/components/Cookies";
import { Logo } from "@/components/Logo";
import { PieSeo } from "@/components/PieSeo";

const enlace = "inline-flex min-h-11 items-center text-[15px] text-tinta-2 hover:text-tinta hover:underline sm:min-h-9";
const titulo = "font-display text-base font-bold text-tinta";

/**
 * Pie de página: aquí vive todo lo institucional y secundario que ya no está en la cabecera.
 * Cuatro columnas (Explorar, Recursos, Empresa, Proveedores) y una franja con categorías y localidades para navegar.
 * Redes y correo oficiales (Instagram y contacto) en la columna de la marca: salen de MARCA (packages/shared).
 * TODO: «Centro de ayuda a proveedores»: no existe todavía; hoy los proveedores usan Cómo funciona y Contacto.
 */
export function Pie() {
  return (
    <footer className="border-t border-borde bg-white">
      <PieSeo />
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo /></Link>
          <ul className="flex flex-col gap-0.5" aria-label="Redes y contacto">
            <li><a href={`https://www.instagram.com/${MARCA.instagram}/`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-tinta hover:underline sm:min-h-9"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" /></svg>@{MARCA.instagram}</a></li>
            <li><a href={`mailto:${MARCA.correo}`} className="inline-flex min-h-11 items-center gap-2 break-all text-[15px] text-tinta-2 hover:text-tinta hover:underline sm:min-h-9"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>{MARCA.correo}</a></li>
          </ul>
        </div>

        <nav aria-label="Explorar" className="flex flex-col">
          <h2 className={titulo}>Explorar</h2>
          <Link href="/proveedores" className={enlace}>Proveedores</Link>
          <Link href="/localidades" className={enlace}>Por localidad</Link>
          <Link href="/guias" className={enlace}>Guías para contratar</Link>
          <Link href="/como-funciona#faq" className={enlace}>Preguntas frecuentes</Link>
        </nav>

        <nav aria-label="Recursos" className="flex flex-col">
          <h2 className={titulo}>Recursos</h2>
          <Link href="/como-funciona" className={enlace}>Cómo funciona</Link>
          <Link href="/resenas" className={enlace}>Reglamento de reseñas</Link>
          <Link href="/reclamos" className={enlace}>Reclamos</Link>
          <Link href="/retiro-de-contenido" className={enlace}>Retiro de contenido</Link>
        </nav>

        <nav aria-label="Empresa" className="flex flex-col">
          <h2 className={titulo}>Empresa</h2>
          <Link href="/nosotros" className={enlace}>Nosotros</Link>
          <Link href="/contacto" className={enlace}>Contacto</Link>
          <Link href="/terminos" className={enlace}>Términos y condiciones</Link>
          <Link href="/privacidad" className={enlace}>Privacidad</Link>
          <Link href="/cookies" className={enlace}>Cookies</Link>
          <BotonCookies className={enlace} />
        </nav>

        <nav aria-label="Proveedores" className="flex flex-col">
          <h2 className={titulo}>Proveedores</h2>
          <Link href="/ingreso" className={enlace}>Registrar mi servicio</Link>
          <Link href="/terminos-proveedores" className={enlace}>Términos del proveedor</Link>
        </nav>
      </div>

      <div className="border-t border-borde-suave">
        <p className="mx-auto max-w-[1200px] px-4 py-5 text-sm leading-normal text-gris sm:px-6">
          LasTresB es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
        </p>
      </div>
    </footer>
  );
}