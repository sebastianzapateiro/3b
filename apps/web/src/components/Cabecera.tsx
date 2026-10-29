import Link from "next/link";
import { Desplegable, itemMenu } from "@/components/Desplegable";
import { Logo } from "@/components/Logo";
import { MenuUsuario } from "@/components/MenuUsuario";

/**
 * Cabecera pública con menú (escritorio y móvil). Diseño: docs/mockups/Home_web.dc.html y Home_movil.dc.html.
 * Se mantiene corta: lo secundario (Localidades, Guías) va en «Explorar» y lo personal en el menú de usuario.
 */
export function Cabecera() {
  const enlaceNav = "flex h-11 items-center px-3.5 text-[15px] font-medium text-tinta";
  const chevron = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

  return (
    <header className="sticky top-0 z-40 border-b border-borde-suave bg-crema/95 backdrop-blur supports-[backdrop-filter]:bg-crema/85">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 py-3.5 pl-5 pr-4 sm:px-6 sm:py-4">
        <Link href="/" aria-label="Las 3B, inicio" className="text-tinta">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          <Link href="/categorias" className={enlaceNav}>Categorías</Link>
          <Link href="/como-funciona" className={enlaceNav}>Cómo funciona</Link>
          <span>
            <Desplegable etiqueta="Explorar" claseBoton={`${enlaceNav} gap-1`} ancho="w-52" boton={<>Explorar {chevron}</>}>
              <Link role="menuitem" href="/localidades" className={itemMenu}>Por localidad</Link>
              <Link role="menuitem" href="/guias" className={itemMenu}>Guías para contratar</Link>
            </Desplegable>
          </span>
          <Link href="/proveedores/registro" className={enlaceNav}>Soy proveedor</Link>
          <span className="ml-1.5"><MenuUsuario /></span>
        </nav>

        {/* Móvil (Home_movil): cuenta + menú */}
        <div className="flex items-center gap-0.5 md:hidden">
          <MenuUsuario />
          <Desplegable
            etiqueta="Abrir menú"
            alinear="derecha"
            claseBoton="flex size-11 items-center justify-center text-tinta"
            boton={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
          >
            <Link role="menuitem" href="/categorias" className={itemMenu}>Categorías</Link>
            <Link role="menuitem" href="/como-funciona" className={itemMenu}>Cómo funciona</Link>
            <Link role="menuitem" href="/localidades" className={itemMenu}>Por localidad</Link>
            <Link role="menuitem" href="/guias" className={itemMenu}>Guías</Link>
            <Link role="menuitem" href="/proveedores/registro" className={`${itemMenu} border-t border-borde-suave`}>Soy proveedor</Link>
          </Desplegable>
        </div>
      </div>
    </header>
  );
}
