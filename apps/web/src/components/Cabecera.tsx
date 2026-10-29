import Link from "next/link";
import { Desplegable, itemMenu } from "@/components/Desplegable";
import { EnlaceNav } from "@/components/EnlaceNav";
import { Logo } from "@/components/Logo";
import { MenuUsuario } from "@/components/MenuUsuario";

/**
 * Cabecera pública con menú (escritorio y celular).
 * Escritorio: logo, enlaces y cuenta. Celular: hamburguesa a la izquierda, logo al centro y perfil a la derecha.
 * Se mantiene corta: lo secundario (Localidades, Guías, Nosotros, Contacto) va en «Más» y lo personal en el menú de usuario.
 */
export function Cabecera() {
  const chevron = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

  return (
    <header className="sticky top-0 z-40 border-b border-borde-suave bg-crema/95 backdrop-blur supports-[backdrop-filter]:bg-crema/85">
      {/* Escritorio y tablet */}
      <div className="mx-auto hidden max-w-[1200px] items-center justify-between gap-3 px-6 py-4 md:flex">
        <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo /></Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <EnlaceNav href="/categorias" prefijos={["/servicios"]}>Categorías</EnlaceNav>
          <EnlaceNav href="/como-funciona">Cómo funciona</EnlaceNav>
          <Desplegable etiqueta="Más opciones" claseBoton="flex h-11 items-center gap-1 px-3.5 text-[15px] font-medium text-tinta hover:text-verde-oscuro" ancho="w-52" boton={<>Más {chevron}</>}>
            <Link role="menuitem" href="/localidades" className={itemMenu}>Por localidad</Link>
            <Link role="menuitem" href="/guias" className={itemMenu}>Guías para contratar</Link>
            <Link role="menuitem" href="/nosotros" className={`${itemMenu} border-t border-borde-suave`}>Nosotros</Link>
            <Link role="menuitem" href="/contacto" className={itemMenu}>Contacto</Link>
          </Desplegable>
          <EnlaceNav href="/proveedores/registro">Soy proveedor</EnlaceNav>
          <span className="ml-1.5"><MenuUsuario /></span>
        </nav>
      </div>

      {/* Celular: hamburguesa · logo · perfil */}
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-1 px-2 py-3.5 md:hidden">
        <Desplegable
          etiqueta="Abrir menú"
          claseBoton="flex size-11 items-center justify-center text-tinta"
          ancho="w-64"
          boton={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        >
          <Link role="menuitem" href="/categorias" className={itemMenu}>Categorías</Link>
          <Link role="menuitem" href="/como-funciona" className={itemMenu}>Cómo funciona</Link>
          <Link role="menuitem" href="/localidades" className={itemMenu}>Por localidad</Link>
          <Link role="menuitem" href="/guias" className={itemMenu}>Guías</Link>
          <Link role="menuitem" href="/nosotros" className={itemMenu}>Nosotros</Link>
          <Link role="menuitem" href="/contacto" className={itemMenu}>Contacto</Link>
          <Link role="menuitem" href="/proveedores/registro" className={`${itemMenu} border-t border-borde-suave font-semibold`}>Registrar mi servicio</Link>
          <Link role="menuitem" href="/ingresar" className={itemMenu}>Iniciar sesión</Link>
        </Desplegable>
        <Link href="/" aria-label="LasTresB, inicio" className="flex justify-center text-tinta"><Logo /></Link>
        <span className="flex justify-end"><MenuUsuario compacto /></span>
      </div>
    </header>
  );
}