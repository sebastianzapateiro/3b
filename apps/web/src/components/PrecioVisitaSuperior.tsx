"use client";

import { useState } from "react";
import { Chip } from "@/components/PanelFiltros";
import { TOPES_VISITA, etiquetaTope } from "@/lib/filtros";

/** Componente de precio de visita en modo superior. */
export function PrecioVisitaSuperior({
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
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${inicial ? "border-verde bg-verde-suave text-verde-oscuro" : "border-borde text-tinta hover:bg-piedra"}`}
      >
        <span>Precio visita</span>
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
        <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-xl border border-borde-suave bg-white p-3 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <Chip activo={inicial === ""} onClick={() => onCambiar("")}>Cualquiera</Chip>
            {TOPES_VISITA.map((tope) => (
              <Chip key={tope} activo={inicial === String(tope)} onClick={() => onCambiar(String(tope))} cuenta={conteos[String(tope)] ?? 0}>
                {etiquetaTope(tope)}
              </Chip>
            ))}
            <Chip activo={inicial === "convenir"} onClick={() => onCambiar("convenir")} cuenta={conteos.convenir ?? 0}>A convenir</Chip>
          </div>
        </div>
      )}
    </div>
  );
}
