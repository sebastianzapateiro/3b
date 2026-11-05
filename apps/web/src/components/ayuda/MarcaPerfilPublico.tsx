"use client";

import { useEffect } from "react";

/** Marca la página como perfil público de un proveedor: el botón de ayuda queda solo como ícono (ver globals.css). No pinta nada. */
export function MarcaPerfilPublico() {
  useEffect(() => {
    document.documentElement.dataset.perfil = "1";
    return () => {
      delete document.documentElement.dataset.perfil;
    };
  }, []);
  return null;
}
