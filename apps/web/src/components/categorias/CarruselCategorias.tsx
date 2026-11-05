import { CATEGORIAS } from "@las3b/shared";
import { CategoryTile } from "@/components/categorias/CategoryTile";
import { Desplazamiento } from "@/components/categorias/Desplazamiento";
import { construirMosaico } from "@/lib/mosaico";

/**
 * «Explora por categoría» del Home (P1, CU-03): los mismos tiles con foto del mosaico, en una sola fila
 * que se desplaza sola hacia la derecha (ver Desplazamiento). Los tiles salen de la taxonomía vigente; ver lib/mosaico.ts.
 */
export function CarruselCategorias() {
  const tiles = construirMosaico(CATEGORIAS);
  return (
    <Desplazamiento
      etiqueta="Categorías de servicios"
      copia={tiles.map((t) => <CategoryTile key={t.clave} tile={t} carrusel />)}
    >
      {tiles.map((t, i) => <CategoryTile key={t.clave} tile={t} carrusel prioridad={i < 2} />)}
    </Desplazamiento>
  );
}
