import Link from "next/link";
import { CATEGORIAS, LOCALIDADES_BOGOTA } from "@las3b/shared";
import { BotonCookies } from "@/components/Cookies";
import { Logo } from "@/components/Logo";

/** Localidades con más demanda: van en el pie (SEO local, solo Bogotá). Llevan a la búsqueda por localidad. */
const LOCALIDADES_DESTACADAS = ["suba", "kennedy", "engativa", "bosa", "usaquen"];

const enlace = "inline-flex min-h-11 items-center text-[15px] text-tinta-2 hover:text-tinta hover:underline sm:min-h-9";
const titulo = "font-display text-base font-bold text-tinta";

/**
 * Pie de página: marca y cuatro columnas de enlaces (Categorías, Servicios por localidad, Para proveedores, LasTresB).
 * TODO: redes sociales (Instagram, etc.): el sitio aún no tiene enlaces; agregarlos aquí cuando existan.
 */
export function Pie() {
  const destacadas = LOCALIDADES_DESTACADAS.map((s) => LOCALIDADES_BOGOTA.find((l) => l.slug === s)!);

  return (
    <footer className="border-t border-borde bg-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo /></Link>
          <p className="max-w-[300px] text-sm leading-normal text-gris">Servicios de hogar y oficios de confianza en Bogotá. Contacta directo por WhatsApp, gratis y sin comisiones.</p>
        </div>

        <nav aria-label="Categorías" className="flex flex-col">
          <h2 className={titulo}>Categorías</h2>
          {CATEGORIAS.map((c) => <Link key={c.slug} href={`/categorias/${c.slug}`} className={enlace}>{c.nombre}</Link>)}
        </nav>

        <nav aria-label="Servicios por localidad" className="flex flex-col">
          <h2 className={titulo}>Servicios por localidad</h2>
          {destacadas.map((l) => <Link key={l.slug} href={`/buscar?localidad=${l.slug}`} className={enlace}>{l.nombre}</Link>)}
          <Link href="/localidades" className={`${enlace} font-semibold`}>Todas las localidades</Link>
        </nav>

        <nav aria-label="Para proveedores" className="flex flex-col">
          <h2 className={titulo}>Para proveedores</h2>
          <Link href="/proveedores/registro" className={enlace}>Registrar mi servicio</Link>
          <Link href="/como-funciona" className={enlace}>Cómo funciona</Link>
          <Link href="/terminos-proveedores" className={enlace}>Términos del proveedor</Link>
        </nav>

        <nav aria-label="LasTresB" className="flex flex-col">
          <h2 className={titulo}>LasTresB</h2>
          <Link href="/nosotros" className={enlace}>Nosotros</Link>
          <Link href="/contacto" className={enlace}>Contacto</Link>
          <Link href="/guias" className={enlace}>Guías</Link>
          <Link href="/terminos" className={enlace}>Términos</Link>
          <Link href="/privacidad" className={enlace}>Privacidad</Link>
          <Link href="/cookies" className={enlace}>Cookies</Link>
          <BotonCookies className={enlace} />
          <Link href="/resenas" className={enlace}>Reglamento de reseñas</Link>
          <Link href="/reclamos" className={enlace}>Reclamos</Link>
          <Link href="/retiro-de-contenido" className={enlace}>Retiro de contenido</Link>
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