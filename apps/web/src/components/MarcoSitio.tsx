"use client";

import { usePathname } from "next/navigation";

/** Rutas sin menú flotante (ninguna por ahora; el backoffice y el panel del proveedor tienen su menú lateral y se excluyen en SIN_PIE). */
const SIN_CABECERA: string[] = [];
const SIN_PIE = ["/admin", "/panel"];

const coincide = (ruta: string, prefijos: string[]) => prefijos.some((p) => ruta === p || ruta.startsWith(`${p}/`));

/** Pone el menú flotante arriba y el pie al final en todas las páginas públicas. */
export function MarcoSitio({ cabecera, pie, children }: { cabecera: React.ReactNode; pie: React.ReactNode; children: React.ReactNode }) {
  const ruta = usePathname();
  return (
    <>
      {!coincide(ruta, SIN_CABECERA) && !coincide(ruta, SIN_PIE) && cabecera}
      {children}
      {!coincide(ruta, SIN_PIE) && pie}
    </>
  );
}
