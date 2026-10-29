/**
 * P5 · Reseñas (CU-20): una reseña por contacto y solo con un clic previo a WhatsApp (regla 4).
 * La calificación de cada reseña es el promedio de sus cuatro criterios.
 */
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { contactos, resenas, proveedores } = schema;

export const CRITERIOS = [
  { clave: "puntualidad", texto: "Puntualidad", ayuda: "Llegó a la hora acordada" },
  { clave: "calidad", texto: "Calidad del trabajo", ayuda: "El resultado fue el esperado" },
  { clave: "calidadPrecio", texto: "Calidad-precio", ayuda: "Lo que pagaste valió la pena" },
  { clave: "cumplimiento", texto: "Cumplimiento", ayuda: "Hizo lo que prometió" },
] as const;

export type ProveedorCalificable = { id: string; slug: string; nombre: string; usuarioId: string };

export async function proveedorPorSlug(slug: string): Promise<ProveedorCalificable | null> {
  const [p] = await db
    .select({ id: proveedores.id, slug: proveedores.slug, nombre: proveedores.nombrePublico, usuarioId: proveedores.usuarioId, estado: proveedores.estado })
    .from(proveedores)
    .where(eq(proveedores.slug, slug))
    .limit(1);
  if (!p || (p.estado !== "aprobado" && p.estado !== "en_revision")) return null;
  return p;
}

/** Contacto del comprador con el proveedor que todavía no tiene reseña (por cuenta o por cookie anónima). */
export async function contactoSinResena(proveedorId: string, usuarioId: string, anonimoId: string | null) {
  const mio = anonimoId ? or(eq(contactos.compradorId, usuarioId), eq(contactos.anonimoId, anonimoId)) : eq(contactos.compradorId, usuarioId);
  const [c] = await db
    .select({ id: contactos.id, categoriaId: contactos.categoriaId })
    .from(contactos)
    .leftJoin(resenas, eq(resenas.contactoId, contactos.id))
    .where(and(eq(contactos.proveedorId, proveedorId), mio, isNull(resenas.id)))
    .orderBy(desc(contactos.createdAt))
    .limit(1);
  return c ?? null;
}

export async function yaCalifico(proveedorId: string, usuarioId: string) {
  const [r] = await db.select({ id: resenas.id }).from(resenas).where(and(eq(resenas.proveedorId, proveedorId), eq(resenas.compradorId, usuarioId))).limit(1);
  return Boolean(r);
}

type Notas = { puntualidad: number; calidad: number; calidadPrecio: number; cumplimiento: number };

export async function crearResena(a: { contactoId: string; proveedorId: string; compradorId: string; notas: Notas; comentario: string | null }) {
  await db.transaction(async (tx) => {
    // Si el clic fue anónimo, el contacto queda asociado a la cuenta de quien califica.
    await tx.update(contactos).set({ compradorId: a.compradorId, anonimoId: null }).where(eq(contactos.id, a.contactoId));
    await tx.insert(resenas).values({ contactoId: a.contactoId, proveedorId: a.proveedorId, compradorId: a.compradorId, ...a.notas, comentario: a.comentario });
    await recalcularReputacion(a.proveedorId, tx);
  });
}

/** Caché de reputación del proveedor: promedio de los promedios por reseña y total de reseñas visibles. */
export async function recalcularReputacion(proveedorId: string, ejecutor: Pick<typeof db, "execute"> = db) {
  await ejecutor.execute(sql`
    UPDATE proveedores SET
      promedio = coalesce((SELECT avg((puntualidad + calidad + calidad_precio + cumplimiento) / 4.0) FROM resenas WHERE proveedor_id = ${proveedorId} AND estado = 'visible'), 0),
      total_resenas = (SELECT count(*) FROM resenas WHERE proveedor_id = ${proveedorId} AND estado = 'visible'),
      updated_at = now()
    WHERE id = ${proveedorId}`);
}
