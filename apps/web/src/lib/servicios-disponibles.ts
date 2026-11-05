/**
 * P1 · Servicios disponibles del Home (CU-01, CU-03): los oficios del catálogo que ya tienen al menos un proveedor visible
 * (`aprobado` o `en_revision`, regla 6), con cuántos son. Para la web pública y la API.
 */
import { sql } from "drizzle-orm";
import { subcategoriaPorSlug, type CategoriaPadre } from "@las3b/shared";
import { consultar } from "@las3b/db";

export type ServicioDisponible = { slug: string; nombre: string; proveedores: number; icono: CategoriaPadre["icono"]; categoria: string };

export async function serviciosDisponibles(): Promise<ServicioDisponible[]> {
  const rows = await consultar<{ slug: string; total: number }>(sql`
    SELECT c.slug, count(DISTINCT pc.proveedor_id)::int AS total
    FROM categorias c
    JOIN proveedor_categorias pc ON pc.categoria_id = c.id
    JOIN proveedores p ON p.id = pc.proveedor_id
    WHERE c.padre_id IS NOT NULL AND p.estado IN ('aprobado', 'en_revision')
    GROUP BY c.slug
    ORDER BY total DESC, c.slug`);
  // Solo los oficios vigentes del catálogo (los eliminados o renombrados no se muestran).
  return rows.flatMap((r) => {
    const hallado = subcategoriaPorSlug(r.slug);
    return hallado ? [{ slug: r.slug, nombre: hallado.sub.nombre, proveedores: r.total, icono: hallado.padre.icono, categoria: hallado.padre.nombre }] : [];
  });
}
