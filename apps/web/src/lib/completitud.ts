/**
 * P3 / P8 / B1 · Completitud del perfil del proveedor (0–100) y estado del perfil: borrador, completo o publicado.
 * Para el panel del proveedor y la ficha del equipo. El estado de revisión (`estado`) no cambia: «publicado» es aprobado o en revisión.
 */
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { proveedores, proveedorCategorias, proveedorLocalidades, portafolioFotos } = schema;

export const FOTOS_MINIMAS = 3;

export type EstadoPerfil = "borrador" | "completo" | "publicado";

const CRITERIOS = ["nombre", "WhatsApp", "oficio", "zona de Bogotá", "descripción", `${FOTOS_MINIMAS} fotos de trabajos`] as const;

/** Qué le falta al perfil y el porcentaje resultante (cada criterio pesa lo mismo). */
export async function calcularCompletitud(proveedorId: string) {
  const [[p], [cats], [locs], [fotos]] = await Promise.all([
    db.select({ nombre: proveedores.nombrePublico, whatsapp: proveedores.whatsapp, presentacion: proveedores.presentacion }).from(proveedores).where(eq(proveedores.id, proveedorId)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ n: sql<number>`count(*)::int` }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
    db.select({ n: sql<number>`count(*)::int` }).from(portafolioFotos).where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible"))),
  ]);
  const cumple = [
    !!p?.nombre?.trim(),
    !!p?.whatsapp?.trim(),
    (cats?.n ?? 0) > 0,
    (locs?.n ?? 0) > 0,
    !!p?.presentacion?.trim(),
    (fotos?.n ?? 0) >= FOTOS_MINIMAS,
  ];
  return {
    porcentaje: Math.round((cumple.filter(Boolean).length / CRITERIOS.length) * 100),
    faltan: CRITERIOS.filter((_, i) => !cumple[i]),
  };
}

/** Recalcula y guarda el porcentaje. Llamar después de cambiar nombre, WhatsApp, oficios, zonas, descripción o fotos. */
export async function guardarCompletitud(proveedorId: string) {
  const { porcentaje } = await calcularCompletitud(proveedorId);
  await db.update(proveedores).set({ completitud: porcentaje }).where(eq(proveedores.id, proveedorId));
  return porcentaje;
}

/** Borrador (incompleto) → completo (100 %) → publicado (ya aprobado por el equipo, o en revisión). */
export function estadoPerfil(estado: string, completitud: number): EstadoPerfil {
  if (estado === "aprobado" || estado === "en_revision") return "publicado";
  return completitud >= 100 ? "completo" : "borrador";
}
