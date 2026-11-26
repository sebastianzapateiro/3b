"use client";

import { useState } from "react";
import { Chip } from "@/components/PanelFiltros";

/** Componente de localidades vecinas en modo superior. */
export function LocalidadesVecinasSuperior({
  vecinas,
  inicial,
  onAlternar,
}: {
  vecinas: { slug: string; nombre: string }[];
  inicial: string[];
  onAlternar: (s: string) => void;
}) {
  const [mostrando, setMostrando] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMostrando((a) => !a)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${inicial.length ? "border-verde bg-verde-suave text-verde-oscuro" : "border-borde text-tinta hover:bg-piedra"}`}
      >
        <span>Localidades vecinas</span>
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
        <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-64 overflow-y-auto rounded-xl border border-borde-suave bg-white p-3 shadow-lg">
          {vecinas.map((s) => (
            <div key={s.slug} className="flex items-center gap-2 mb-1">
              <Chip
                activo={inicial.includes(s.slug)}
                onClick={() => onAlternar(s.slug)}
              >
                {s.nombre}
              </Chip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
