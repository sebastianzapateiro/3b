"use client";

/**
 * P1 · Carrusel del Home que se desplaza solo, poco a poco, hacia la derecha y vuelve a empezar sin saltos
 * (el contenido va dos veces; al terminar la primera vuelta se reubica). Se detiene al pasar el cursor, al tocarlo,
 * con el foco del teclado y si la persona prefiere menos movimiento; además trae un botón para pausar.
 */
import { useEffect, useRef, useState } from "react";

const VELOCIDAD_PX_S = 36;

export function Desplazamiento({ children, copia, etiqueta }: { children: React.ReactNode; copia: React.ReactNode; etiqueta: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const copiaRef = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);
  const [reducido, setReducido] = useState(false);
  const detenido = useRef(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(m.matches);
    const cambio = () => setReducido(m.matches);
    m.addEventListener("change", cambio);
    return () => m.removeEventListener("change", cambio);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || pausado || reducido) return;
    const pausa = () => (detenido.current = true);
    const sigue = () => (detenido.current = false);
    const eventos: [string, () => void][] = [["pointerenter", pausa], ["pointerleave", sigue], ["focusin", pausa], ["focusout", sigue], ["touchstart", pausa], ["touchend", sigue]];
    for (const [n, f] of eventos) el.addEventListener(n, f, { passive: true });

    // Largo de una vuelta = distancia entre el primer tile y el primero de la copia.
    const vuelta = () => (copiaRef.current?.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0;
    let pos = el.scrollLeft;
    let antes = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const dt = Math.min(ahora - antes, 100) / 1000;
      antes = ahora;
      const largo = vuelta() - (el.firstElementChild as HTMLElement | null)?.offsetLeft!;
      if (detenido.current) pos = el.scrollLeft;
      else if (largo > 0) {
        pos += VELOCIDAD_PX_S * dt;
        if (pos >= largo) pos -= largo;
        el.scrollLeft = pos;
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(cuadro);
      for (const [n, f] of eventos) el.removeEventListener(n, f);
    };
  }, [pausado, reducido]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ref}
        role="region"
        aria-label={etiqueta}
        tabIndex={0}
        className="-mx-5 grid auto-cols-[78%] grid-flow-col grid-rows-1 gap-3 overflow-x-auto scroll-px-5 px-5 pb-3 sm:-mx-6 sm:auto-cols-[300px] sm:gap-4 sm:px-6 sm:scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
        {/* La copia solo sirve para el bucle visual: fuera del teclado y de los lectores de pantalla. */}
        <div ref={copiaRef} className="contents" aria-hidden="true" inert>{copia}</div>
      </div>
      {!reducido && (
        <button type="button" onClick={() => setPausado((p) => !p)} aria-pressed={pausado} className="self-end text-[13px] font-semibold text-tinta-2 underline underline-offset-2 hover:text-tinta">
          {pausado ? "Reanudar movimiento" : "Pausar movimiento"}
        </button>
      )}
    </div>
  );
}
