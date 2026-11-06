import Link from "next/link";
import { ItemAyudaMenu } from "@/components/ayuda/ItemAyudaMenu";
import { Desplegable, itemMenu } from "@/components/Desplegable";
import { EnlaceNav } from "@/components/EnlaceNav";
import { Logo } from "@/components/Logo";
import { MenuUsuario } from "@/components/MenuUsuario";

/**
 * Cabecera pública mínima y enfocada en la acción: encontrar un servicio o ingresar.
 * Escritorio: logo, Categorías, Cómo funciona e «Iniciar sesión» (acción principal, única entrada a /ingreso).
 * Celular: hamburguesa a la izquierda, logo al centro y perfil a la derecha.
 * Lo institucional (Nosotros, Contacto, Guías, Por localidad, legales) vive en el pie de página.
 */
export function Cabecera() {
  return (
    <header className="cabecera sticky top-0 z-40 border-b border-borde-suave bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {/* Escritorio y tablet */}
      <div className="mx-auto hidden max-w-[1200px] items-center justify-between gap-3 px-6 py-4 md:flex">
        <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo sinMonograma className="logo-normal" /><Logo sinMonograma sobreVerde className="logo-sobre-verde" /></Link>
        <nav aria-label="Principal" className="flex items-center gap-1.5">
          <EnlaceNav href="/proveedores" prefijos={["/servicios", "/categorias"]}>Proveedores</EnlaceNav>
          <EnlaceNav href="/como-funciona">Cómo funciona</EnlaceNav>
          <MenuUsuario />
        </nav>
      </div>

      {/* Celular: hamburguesa · logo · perfil */}
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-1 px-2 py-3.5 md:hidden">
        <Desplegable
          etiqueta="Abrir menú"
          claseBoton="icono-cabecera flex size-11 items-center justify-center text-tinta"
          ancho="w-64"
          boton={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        >
          <Link role="menuitem" href="/proveedores" className={itemMenu}>Proveedores</Link>
          <Link role="menuitem" href="/como-funciona" className={itemMenu}>Cómo funciona</Link>
          <ItemAyudaMenu />
          <Link role="menuitem" href="/ingreso" className={`${itemMenu} border-t border-borde-suave font-semibold`}>Ingreso proveedores</Link>
        </Desplegable>
        <Link href="/" aria-label="LasTresB, inicio" className="flex justify-center text-tinta"><Logo sinMonograma className="logo-normal" /><Logo sinMonograma sobreVerde className="logo-sobre-verde" /></Link>
        <span className="flex justify-end"><MenuUsuario compacto /></span>
      </div>
    </header>
  );
}