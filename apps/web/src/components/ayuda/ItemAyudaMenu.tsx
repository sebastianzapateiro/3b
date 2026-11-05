"use client";

import { itemMenu } from "@/components/Desplegable";
import { EVENTO_ABRIR_AYUDA } from "@/lib/ayuda-inscripcion";

/** «Inscríbete con ayuda» del menú del celular: abre el mismo panel que el botón flotante. */
export function ItemAyudaMenu() {
  return (
    <button role="menuitem" type="button" onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_AYUDA, { detail: { origen: "menu" } }))} className={itemMenu}>
      Inscríbete con ayuda
    </button>
  );
}
