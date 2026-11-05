import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { oficioPrincipal, rutaProveedor } from "@las3b/shared";

/** URL estándar de la página del proveedor (/nombre/oficio) para mostrarla en el panel y el backoffice. */
export const rutaPublicaDe = cache(async (proveedorId: string, slug: string): Promise<string> => {
  const filas = await db
    .select({ nombre: schema.categorias.nombre })
    .from(schema.proveedorCategorias)
    .innerJoin(schema.categorias, eq(schema.categorias.id, schema.proveedorCategorias.categoriaId))
    .where(eq(schema.proveedorCategorias.proveedorId, proveedorId));
  return rutaProveedor(slug, oficioPrincipal(filas.map((f) => f.nombre)));
});
