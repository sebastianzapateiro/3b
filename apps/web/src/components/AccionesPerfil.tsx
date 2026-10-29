"use client";

import { useState } from "react";

/** Compartir y copiar el enlace del perfil (mockups Perfil_movil y Perfil_web). */
export function AccionesPerfil({ url, titulo, variante }: { url: string; titulo: string; variante: "icono" | "boton" }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        return;
      }
    }
    await copiar();
  }

  if (variante === "icono") {
    return (
      <button type="button" onClick={compartir} aria-label="Compartir perfil" className="flex size-11 items-center justify-center text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      </button>
    );
  }

  return (
    <button type="button" onClick={copiar} className="h-11 self-start rounded-[10px] border-[1.5px] border-borde-campo bg-white px-4 text-sm font-semibold text-tinta">
      {copiado ? "Enlace copiado" : "Copiar enlace"}
    </button>
  );
}
