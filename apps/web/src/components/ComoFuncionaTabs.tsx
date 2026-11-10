"use client";

/**
 * Pestañas «Soy cliente / Soy proveedor» (home y /como-funciona). Los dos paneles llegan ya renderizados desde el servidor
 * (HTML completo para SEO); aquí solo se alterna cuál se ve, con flechas del teclado y, si `sincronizar`, con ?como=cliente|proveedor.
 */
import { useEffect, useRef, useState } from "react";
import type { RolComo } from "@/lib/como-funciona.content";

type Pestana = { id: RolComo; titulo: string; subtexto: string; panel: React.ReactNode };

export function ComoFuncionaTabs({ pestanas, prefijo, sincronizar = false, etiqueta = "¿Cómo funciona LasTresB?" }: { pestanas: Pestana[]; prefijo: string; sincronizar?: boolean; etiqueta?: string }) {
  const [activa, setActiva] = useState<RolComo>("cliente");
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  // La página es estática: el parámetro se lee en el navegador para no volverla dinámica.
  useEffect(() => {
    if (!sincronizar) return;
    const como = new URLSearchParams(window.location.search).get("como");
    if (como === "cliente" || como === "proveedor") setActiva(como);
  }, [sincronizar]);

  function elegir(id: RolComo) {
    setActiva(id);
    if (!sincronizar) return;
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
      <div role="tablist" aria-label={etiqueta} className="mx-auto grid w-full max-w-[560px] grid-cols-2 gap-1 rounded-[40px] bg-piedra p-2">
        {pestanas.map((p, i) => {
          const on = p.id === activa;
          return (
            <button
              key={p.id}
              ref={(el) => { botones.current[i] = el; }}
              id={`${prefijo}-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${prefijo}-panel-${p.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => elegir(p.id)}
              onKeyDown={(e) => teclas(e, i)}
              className={`flex min-h-16 flex-col items-center justify-center rounded-[32px] px-2 py-2 transition-colors duration-150 motion-reduce:transition-none ${on ? "bg-verde text-crema" : "text-tinta hover:bg-white/60"}`}
            >
              <span className="font-display text-lg font-extrabold sm:text-xl">{p.titulo}</span>
              <span className={`text-[13px] ${on ? "text-crema" : "text-tinta-2"}`}>{p.subtexto}</span>
            </button>
          );
        })}
      </div>
      {pestanas.map((p) => (
        <div key={p.id} role="tabpanel" id={`${prefijo}-panel-${p.id}`} aria-labelledby={`${prefijo}-tab-${p.id}`} hidden={p.id !== activa} className="pt-10">
          {p.panel}
        </div>
      ))}
    </div>
  );
}
