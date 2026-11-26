"use client";

import { useState } from "react";
import { Chip } from "@/components/PanelFiltros";

/** Componente de calificación en modo superior. */
export function CalificacionSuperior({
  inicial,
  onCambiar,
  conteos,
}: {
  inicial: string;
  onCambiar: (v: string) => void;
  conteos: Record<string, number>;
}) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMostrando((a) => !a)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${inicial !== "0" ? "border-verde bg-verde-suave text-verde-oscuro" : "border-borde text-tinta hover:bg-piedra"}`}
      >
        <span>Calificación</span>
        {mostrando ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}

      </button>

      {mostrando && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-borde-suave bg-white p-3 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <div>
              <Chip activo={inicial === "0"} onClick={() => onCambiar("0")} cuenta={conteos.cal45}>
                Todas
              </Chip>
            </div>
            <div>
              <Chip activo={inicial === "4"} onClick={() => onCambiar("4")} cuenta={conteos.cal4}>
                ★ 4+
              </Chip>
            </div>
            <div>
              <Chip activo={inicial === "4.5"} onClick={() => onCambiar("4.5")} cuenta={conteos.cal45}>
                ★ 4,5+
              </Chip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
