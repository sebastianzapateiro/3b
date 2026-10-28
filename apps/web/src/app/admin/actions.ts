'use server';

/**
 * B1 · Backoffice: cola de aprobación de proveedores (estados del proveedor, CU-30/32).
 * Simula una acción de backend: registrar usuario real no se incluye por ahora.
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verificarSesionAdmin } from "@/lib/verificacion";

export async function aprobarProveedor(proveedorId: string) {
  const verif = await verificarSesionAdmin();
  if (verif.error) return { error: verif.error };

  await db
    .update(schema.proveedores)
    .set({ estado: "aprobado", aprobadoEn: new Date(), updatedAt: new Date() })
    .where(eq(schema.proveedores.id, proveedorId));

  return { ok: true };
}

export async function rechazarProveedor(proveedorId: string, motivo: string) {
  const verif = await verificarSesionAdmin();
  if (verif.error) return { error: verif.error };

  const [p] = await db
    .select({ usuarioId: schema.proveedores.usuarioId })
    .from(schema.proveedores)
    .where(eq(schema.proveedores.id, proveedorId))
    .limit(1);

  if (!p) return { error: "Proveedor no encontrado." };

  await db
    .update(schema.proveedores)
    .set({ estado: "rechazado", motivoRechazo: motivo, updatedAt: new Date() })
    .where(eq(schema.proveedores.id, proveedorId));

  return { ok: true };
}
