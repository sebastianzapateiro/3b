"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Menú desplegable accesible: se cierra al elegir una opción, al pulsar fuera, con Escape o al cambiar de página.
 * Sirve para «Explorar», el menú de usuario y el menú móvil, y así la cabecera no crece.
 */
export function Desplegable({
  boton,
  etiqueta,
  alinear = "izquierda",
  claseBoton,
  ancho = "w-56",
  children,
}: {
  boton: React.ReactNode;
  etiqueta: string;
  alinear?: "izquierda" | "derecha";
  claseBoton: string;
  ancho?: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const ruta = usePathname();

  useEffect(() => setAbierto(false), [ruta]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative">
      <button type="button" aria-label={etiqueta} aria-expanded={abierto} aria-haspopup="menu" onClick={() => setAbierto((a) => !a)} className={claseBoton}>
        {boton}
      </button>
      {abierto && (
        <div
          role="menu"
          onClick={(e) => (e.target as HTMLElement).closest("a,button") && setAbierto(false)}
          className={`absolute top-[calc(100%+6px)] z-50 flex flex-col rounded-[18px] border border-borde-suave bg-white p-2 shadow-[0_8px_30px_rgba(27,38,35,0.12)] ${ancho} ${alinear === "derecha" ? "right-0" : "left-0"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export const itemMenu = "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-medium text-tinta hover:bg-piedra";
