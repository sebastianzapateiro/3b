import { CATEGORIAS } from "@las3b/shared";
import { CategoryTile } from "@/components/categorias/CategoryTile";
import { construirMosaico } from "@/lib/mosaico";

/**
 * Mosaico de /categorias (P2, CU-03), renderizado en servidor. Grid de 12 columnas en escritorio, 6 en tablet y una en celular.
 * Los tiles salen de la taxonomía vigente; ver lib/mosaico.ts.
 */
export function CategoryMosaic() {
  const tiles = construirMosaico(CATEGORIAS);
  return (
    <section aria-label="Categorías de servicios" className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-6 min-[900px]:grid-cols-12">
      {tiles.map((t, i) => <CategoryTile key={t.clave} tile={t} prioridad={i === 0} />)}
    </section>
  );
}
