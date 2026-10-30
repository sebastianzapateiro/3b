"use client";

/**
 * B1 · Contenido del backoffice con esqueleto al cambiar de sección (Nielsen 1: visibilidad del estado del sistema).
 * Solo cuando cambia la ruta (Tablero → Aprobaciones). Al filtrar, elegir un ítem o guardar (cambia solo ?…)
 * se deja el contenido actual y basta la barra de arriba: un loading.tsx lo reemplazaba en cada clic.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { destinoInterno, RETARDO_MS, TOPE_MS } from "@/components/BarraCarga";

export function ContenidoPanel({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const [cargando, setCargando] = useState(false);

  const temporizadores = useRef<number[]>([]);
  const limpiar = () => {
    temporizadores.current.forEach((t) => window.clearTimeout(t));
    temporizadores.current = [];
  };

  // Llegó la sección nueva.
  useEffect(() => {
    limpiar();
    setCargando(false);
  }, [ruta]);

  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const destino = destinoInterno(e);
      if (!destino || destino.pathname === location.pathname || !destino.pathname.startsWith("/admin")) return;
      limpiar();
      // Con retardo, para no parpadear si la sección llega casi al instante.
      temporizadores.current.push(
        window.setTimeout(() => setCargando(true), RETARDO_MS),
        window.setTimeout(() => setCargando(false), TOPE_MS),
      );
    };
    // Captura: el Link de Next cancela el clic en su propio manejador.
    document.addEventListener("click", alClic, true);
    return () => {
      limpiar();
      document.removeEventListener("click", alClic, true);
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {cargando ? <EsqueletoPanel /> : children}
    </div>
  );
}

const bloque = "animate-pulse rounded-xl bg-piedra";

/** Forma genérica de una sección: encabezado, tarjetas y lista. */
function EsqueletoPanel() {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col">
      <span className="sr-only">Cargando la sección…</span>
      <div aria-hidden="true" className="flex flex-col gap-2.5 border-b border-borde bg-crema px-5 py-5 lg:px-8">
        <div className={`${bloque} h-8 w-56`} />
        <div className={`${bloque} h-4 w-80 max-w-full`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6 px-5 pb-10 pt-6 lg:px-8">
        <div className="flex flex-wrap gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-[118px] flex-[1_1_220px] flex-col gap-2.5 rounded-[18px] border border-[#EAE3D5] bg-white p-[18px]">
              <div className={`${bloque} h-4 w-36`} />
              <div className={`${bloque} h-8 w-16`} />
              <div className={`${bloque} h-3 w-28`} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] border border-[#EAE3D5] bg-white p-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${bloque} h-10 w-10 rounded-full`} />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`${bloque} h-4 w-1/3`} />
                <div className={`${bloque} h-3 w-1/2`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
