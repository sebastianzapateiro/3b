/**
 * P3 / P8 / B1 · Categorías sin «precio desde» (CU-35). Para registro, panel del proveedor y ficha del equipo.
 * Solo Aseo y limpieza: el valor es «a convenir» entre proveedor y cliente. Los demás oficios, incluso del mismo proveedor, llevan «desde».
 */
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { categorias, proveedorCategorias } = schema;

export const CATEGORIA_SIN_PRECIO = "aseo";

/** Texto que ve el proveedor donde otras categorías piden el precio. */
export const PRECIO_A_CONVENIR_PROVEEDOR = "A convenir con el cliente";

/** Oficios del proveedor, con la marca de si publican precio. */
export async function oficiosDelProveedor(proveedorId: string) {
  const filas = await db
    .select({ id: categorias.id, nombre: categorias.nombre, slug: categorias.slug })
    .from(proveedorCategorias)
    .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
    .where(eq(proveedorCategorias.proveedorId, proveedorId))
    .orderBy(asc(categorias.id));
  return filas.map((f) => ({ id: f.id, nombre: f.nombre, sinPrecio: f.slug === CATEGORIA_SIN_PRECIO }));
}

/** ¿Este oficio (categoría) no publica precio? */
export async function categoriasSinPrecio(categoriaIds: number[]): Promise<boolean> {
  if (categoriaIds.length === 0) return false;
  const filas = await db.select({ slug: categorias.slug }).from(categorias).where(inArray(categorias.id, categoriaIds));
  return filas.some((f) => f.slug === CATEGORIA_SIN_PRECIO);
}

/** ¿Solo ofrece oficios sin precio? Entonces ninguno de sus servicios lleva valor. */
export async function proveedorSinPrecio(proveedorId: string): Promise<boolean> {
  const oficios = await oficiosDelProveedor(proveedorId);
  return oficios.length > 0 && oficios.every((o) => o.sinPrecio);
}

/**
 * Oficio al que pertenece un servicio y si ese servicio publica precio.
 * Con varios oficios, el servicio debe indicar cuál es; si no, se trata como un oficio con precio.
 */
export async function oficioDelServicio(proveedorId: string, categoriaIdForm: number | null) {
  const oficios = await oficiosDelProveedor(proveedorId);
  const oficio = oficios.length === 1 ? oficios[0] : oficios.find((o) => o.id === categoriaIdForm);
  return { categoriaId: oficio?.id ?? null, sinPrecio: oficio?.sinPrecio ?? false };
}
