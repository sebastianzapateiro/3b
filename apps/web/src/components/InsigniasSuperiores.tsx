"use client";

import { useState } from "react";
import { Chip } from "@/components/PanelFiltros";
import { INSIGNIAS_FILTRO, ETIQUETA_INSIGNIA } from "@/lib/filtros";

/** Componente de insignias en modo superior (filtros horizontales). */
export function InsigniasSuperiores({
  inicial,
  onAlternar,
  conteos,
}: {
  inicial: string[];
  onAlternar: (c: string) => void;
  conteos: Record<string, number>;
}) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMostrando((a) => !a)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${inicial.length ? "border-verde bg-verde-suave text-verde-oscuro" : "border-borde text-tinta hover:bg-piedra"}`}
      >
        <span>Requisitos</span>
        {mostrando ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}

      </button>

      {mostrando && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-borde-suave bg-white p-3 shadow-lg">
          {INSIGNIAS_FILTRO.map((clave) => (
            <div key={clave} className="flex items-center gap-2 mb-1">
              <Chip
                activo={inicial.includes(clave)}
                onClick={() => onAlternar(clave)}
                cuenta={conteos[clave]}
              >
                {ETIQUETA_INSIGNIA[clave]}
              </Chip>
              <span className="text-[12px] text-tinta-2">{clave}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
