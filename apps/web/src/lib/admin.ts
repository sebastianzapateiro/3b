/**
 * B1 · Backoffice: cola de aprobación de proveedores (estado `pendiente`).
 * Solo se usa desde la página admin protegida.
 */
import { db, schema } from "@las3b/db";
import { desc, eq } from "drizzle-orm";

export type ProveedorPendiente = {
  id: string;
  nombrePublico: string;
  slug: string;
  segmento: string;
  whatsapp: string;
  categoriaNombre: string | null;
};

export async function buscarPendientes(): Promise<ProveedorPendiente[]> {
  const filas = await db
    .select({
      id: schema.proveedores.id,
      nombrePublico: schema.proveedores.nombrePublico,
      slug: schema.proveedores.slug,
      segmento: schema.proveedores.segmento,
      whatsapp: schema.proveedores.whatsapp,
      categoriaNombre: schema.categorias.nombre,
    })
    .from(schema.proveedores)
    .leftJoin(
      schema.proveedorCategorias,
      eq(schema.proveedores.id, schema.proveedorCategorias.proveedorId),
    )
    .leftJoin(
      schema.categorias,
      eq(schema.proveedorCategorias.categoriaId, schema.categorias.id),
    )
    .where(eq(schema.proveedores.estado, "pendiente"))
    .orderBy(desc(schema.proveedores.createdAt))
    .limit(50);

  if (!filas) return [];

  return filas.map((f) => ({
    id: f.id,
    nombrePublico: f.nombrePublico,
    slug: f.slug,
    segmento: String(f.segmento ?? ""),
    whatsapp: f.whatsapp,
    categoriaNombre: f.categoriaNombre,
  }));
}
