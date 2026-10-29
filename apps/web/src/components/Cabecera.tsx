import Link from "next/link";
import { Desplegable, itemMenu } from "@/components/Desplegable";
import { EnlaceNav } from "@/components/EnlaceNav";
import { Logo } from "@/components/Logo";
import { MenuUsuario } from "@/components/MenuUsuario";

/**
 * Cabecera pública mínima y enfocada en la acción: encontrar un servicio o registrarse como proveedor.
 * Escritorio: logo, Categorías, Cómo funciona, «Soy proveedor» (botón secundario) e «Iniciar sesión» (acción principal).
 * Celular: hamburguesa a la izquierda, logo al centro y perfil a la derecha.
 * Lo institucional (Nosotros, Contacto, Guías, Por localidad, legales) vive en el pie de página.
 */
export function Cabecera() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde-suave bg-crema/95 backdrop-blur supports-[backdrop-filter]:bg-crema/85">
      {/* Escritorio y tablet */}
      <div className="mx-auto hidden max-w-[1200px] items-center justify-between gap-3 px-6 py-4 md:flex">
        <Link href="/" aria-label="LasTresB, inicio" className="text-tinta"><Logo /></Link>
        <nav aria-label="Principal" className="flex items-center gap-1.5">
          <EnlaceNav href="/categorias" prefijos={["/servicios"]}>Categorías</EnlaceNav>
          <EnlaceNav href="/como-funciona">Cómo funciona</EnlaceNav>
          <Link href="/proveedores/registro" className="ml-2 flex h-11 items-center rounded-xl border-2 border-tinta px-[18px] text-[15px] font-bold text-tinta hover:bg-white">Soy proveedor</Link>
          <MenuUsuario />
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
          <Link role="menuitem" href="/proveedores/registro" className={`${itemMenu} border-t border-borde-suave font-semibold`}>Soy proveedor</Link>
          <Link role="menuitem" href="/ingresar" className={itemMenu}>Iniciar sesión</Link>
        </Desplegable>
        <Link href="/" aria-label="LasTresB, inicio" className="flex justify-center text-tinta"><Logo /></Link>
        <span className="flex justify-end"><MenuUsuario compacto /></span>
      </div>
    </header>
  );
}