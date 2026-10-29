import Link from "next/link";
import { CATEGORIAS, LOCALIDADES_BOGOTA } from "@las3b/shared";
import { BotonCookies } from "@/components/Cookies";
import { Logo } from "@/components/Logo";
import { GUIAS } from "@/lib/guias";

/** Localidades con más demanda: van en el pie para enlazarlas desde todo el sitio (SEO local, solo Bogotá). */
const LOCALIDADES_DESTACADAS = ["suba", "kennedy", "engativa", "usaquen", "chapinero", "bosa", "fontibon", "teusaquillo", "barrios-unidos", "puente-aranda"];

const enlace = "inline-flex min-h-9 items-center text-[15px] text-tinta-2 hover:text-verde-oscuro";
const titulo = "font-display text-base font-bold text-tinta";

/** Pie de página completo: accesos, categorías, localidades, guías y legal. */
export function Pie() {
  const destacadas = LOCALIDADES_DESTACADAS.map((s) => LOCALIDADES_BOGOTA.find((l) => l.slug === s)!);

  return (
    <footer className="border-t border-borde bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="Las 3B, inicio" className="text-tinta"><Logo /></Link>
          <p className="text-sm leading-normal text-gris">
            Servicios y oficios de confianza en Bogotá. Contacta directo por WhatsApp, gratis y sin comisiones.
          </p>
        </div>

        <nav aria-label="Categorías" className="flex flex-col">
          <h2 className={titulo}>Categorías</h2>
          {CATEGORIAS.map((c) => (
            <Link key={c.slug} href={`/categorias/${c.slug}`} className={enlace}>{c.nombre}</Link>
          ))}
          <Link href="/categorias" className={`${enlace} font-semibold text-verde`}>Ver todas</Link>
        </nav>

        <nav aria-label="Localidades de Bogotá" className="flex flex-col">
          <h2 className={titulo}>Servicios por localidad</h2>
          {destacadas.map((l) => (
            <Link key={l.slug} href={`/localidades/${l.slug}`} className={enlace}>{l.nombre}</Link>
          ))}
          <Link href="/localidades" className={`${enlace} font-semibold text-verde`}>Las 20 localidades</Link>
        </nav>

        <nav aria-label="Guías" className="flex flex-col">
          <h2 className={titulo}>Guías</h2>
          {GUIAS.slice(0, 4).map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className={`${enlace} py-1 leading-snug`}>{g.titulo}</Link>
          ))}
          <Link href="/guias" className={`${enlace} font-semibold text-verde`}>Todas las guías</Link>
        </nav>

        <nav aria-label="Accesos" className="flex flex-col">
          <h2 className={titulo}>Las 3B</h2>
          <Link href="/como-funciona" className={enlace}>¿Cómo funciona?</Link>
          <Link href="/buscar" className={enlace}>Buscar un servicio</Link>
          <Link href="/proveedores/registro" className={enlace}>Soy proveedor</Link>
          <Link href="/ingresar" className={enlace}>Ingresar</Link>
          <Link href="/registro" className={enlace}>Crear cuenta</Link>
          <Link href="/reclamos" className={enlace}>Presentar un reclamo</Link>
        </nav>
      </div>

      <div className="border-t border-borde-suave">
        <div className="mx-auto flex max-w-[1200px] flex-col-reverse gap-3 px-5 py-6 text-sm text-gris sm:flex-row sm:flex-wrap sm:justify-between sm:px-6">
          <p className="max-w-[560px] leading-normal">
            Las 3B es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/terminos" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Términos</Link>
            <Link href="/terminos-proveedores" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Términos para proveedores</Link>
            <Link href="/privacidad" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Datos personales</Link>
            <Link href="/retiro-de-contenido" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Retiro de contenido</Link>
            <Link href="/resenas" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Política de reseñas</Link>
            <Link href="/cookies" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Cookies</Link>
            <BotonCookies className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro" />
            <Link href="/reclamos" className="inline-flex min-h-9 items-center text-verde hover:text-verde-oscuro">Reclamos</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
