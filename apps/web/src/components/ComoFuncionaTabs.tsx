"use client";

/**
 * Pestañas de «¿Cómo funciona?». Los dos paneles llegan ya renderizados desde el servidor (HTML completo para SEO);
 * aquí solo se alterna cuál se ve, con flechas del teclado y sincronizado con ?como=cliente|proveedor.
 */
import { useEffect, useRef, useState } from "react";
import type { RolComo } from "@/lib/como-funciona.content";

type Pestana = { id: RolComo; titulo: string; subtexto: string; acento: "verde" | "ladrillo"; panel: React.ReactNode };

const BORDE_ACTIVO = { verde: "border-b-verde", ladrillo: "border-b-ladrillo" } as const;

export function ComoFuncionaTabs({ pestanas }: { pestanas: Pestana[] }) {
  const [activa, setActiva] = useState<RolComo>("cliente");
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  // La página es estática: el parámetro se lee en el navegador para no volverla dinámica.
  useEffect(() => {
    const como = new URLSearchParams(window.location.search).get("como");
    if (como === "cliente" || como === "proveedor") setActiva(como);
  }, []);

  function elegir(id: RolComo) {
    setActiva(id);
    const url = new URL(window.location.href);
    url.searchParams.set("como", id);
    window.history.replaceState(null, "", url);
  }

  function teclas(e: React.KeyboardEvent, i: number) {
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const salto = e.key === "Home" ? 0 : e.key === "End" ? pestanas.length - 1 : null;
    if (!paso && salto === null) return;
    e.preventDefault();
    const destino = salto ?? (i + paso + pestanas.length) % pestanas.length;
    elegir(pestanas[destino]!.id);
    botones.current[destino]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="¿Cómo funciona LasTresB?" className="grid grid-cols-2 border-b-4 border-borde">
        {pestanas.map((p, i) => {
          const on = p.id === activa;
          return (
            <button
              key={p.id}
              ref={(el) => { botones.current[i] = el; }}
              id={`como-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`como-panel-${p.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => elegir(p.id)}
              onKeyDown={(e) => teclas(e, i)}
              className={`-mb-1 flex min-h-[72px] flex-col items-center justify-center gap-0.5 border-b-8 px-2 pb-2 pt-3 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-amarillo ${on ? `${BORDE_ACTIVO[p.acento]} text-tinta` : "border-b-transparent text-gris"}`}
            >
              <span className="font-display text-xl font-extrabold tracking-[-0.03em] sm:text-[28px]">{p.titulo}</span>
              <span className="text-sm">{p.subtexto}</span>
            </button>
          );
        })}
      </div>
      {pestanas.map((p) => (
        <div key={p.id} role="tabpanel" id={`como-panel-${p.id}`} aria-labelledby={`como-tab-${p.id}`} hidden={p.id !== activa} className="pt-6 sm:pt-8">
          {p.panel}
        </div>
      ))}
    </div>
  );
}
