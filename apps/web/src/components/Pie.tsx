import Link from "next/link";
import { CATEGORIAS, LOCALIDADES_BOGOTA } from "@las3b/shared";
import { BotonCookies } from "@/components/Cookies";
import { Logo } from "@/components/Logo";

/** Localidades con más demanda: enlaces internos en el pie (SEO local, solo Bogotá). */
const LOCALIDADES_DESTACADAS = ["suba", "kennedy", "engativa", "bosa", "usaquen"];

const enlace = "inline-flex min-h-11 items-center text-[15px] text-tinta-2 hover:text-tinta hover:underline sm:min-h-9";
const enlaceCorto = "inline-flex min-h-11 items-center text-sm text-tinta-2 hover:text-tinta hover:underline";
const titulo = "font-display text-base font-bold text-tinta";

/**
 * Pie de página: aquí vive todo lo institucional y secundario que ya no está en la cabecera.
 * Cuatro columnas (Explorar, Recursos, Empresa, Proveedores) y una franja con categorías y localidades para navegar.
 * TODO: redes sociales (Instagram, etc.): el sitio aún no tiene enlaces; agregarlos aquí cuando existan.
 * TODO: «Centro de ayuda a proveedores»: no existe todavía; hoy los proveedores usan Cómo funciona y Contacto.
 */
export function Pie() {
  const destacadas = LOCALIDADES_DESTACADAS.map((s) => LOCALIDADES_BOGOTA.find((l) => l.slug === s)!);

  return (
    <footer className="border-t border-borde bg-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo /></Link>
          <p className="max-w-[300px] text-sm leading-normal text-gris">Servicios de hogar y oficios de confianza en Bogotá. Contacta directo por WhatsApp, gratis y sin comisiones.</p>
        </div>

        <nav aria-label="Explorar" className="flex flex-col">
          <h2 className={titulo}>Explorar</h2>
          <Link href="/categorias" className={enlace}>Categorías</Link>
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
          <Link href="/proveedores/registro" className={enlace}>Soy proveedor</Link>
          <Link href="/proveedores/registro" className={enlace}>Registra tu servicio</Link>
          <Link href="/terminos-proveedores" className={enlace}>Términos del proveedor</Link>
        </nav>
      </div>

      <div className="border-t border-borde-suave">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-4 sm:px-6">
          <nav aria-label="Categorías" className="flex flex-wrap items-center gap-x-5">
            <span className="text-sm font-semibold text-tinta">Categorías</span>
            {CATEGORIAS.map((c) => <Link key={c.slug} href={`/categorias/${c.slug}`} className={enlaceCorto}>{c.nombre}</Link>)}
          </nav>
          <nav aria-label="Servicios por localidad" className="flex flex-wrap items-center gap-x-5">
            <span className="text-sm font-semibold text-tinta">Servicios por localidad</span>
            {destacadas.map((l) => <Link key={l.slug} href={`/buscar?localidad=${l.slug}`} className={enlaceCorto}>{l.nombre}</Link>)}
          </nav>
        </div>
      </div>

      <div className="border-t border-borde-suave">
        <p className="mx-auto max-w-[1200px] px-4 py-5 text-sm leading-normal text-gris sm:px-6">
          LasTresB es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
        </p>
      </div>
    </footer>
  );
}