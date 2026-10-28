/**
 * B1 · Backoffice: rechazar proveedor desde la cola de revisión.
 * Protección: sesión + rol + 2FA (verificarSesionAdmin).
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";
import { verificarSesionAdmin } from "@/lib/verificacion";

export async function POST(req: Request) {
  const verif = await verificarSesionAdmin();
  if (verif.error) {
    return NextResponse.json({ error: verif.error }, { status: 403 });
  }

  const body = await req.json();
  const proveedorId = String(body.proveedorId ?? "");
  const motivo = String(body.motivo ?? "");

  const [p] = await db
    .select({ usuarioId: schema.proveedores.usuarioId })
    .from(schema.proveedores)
    .where(eq(schema.proveedores.id, proveedorId))
    .limit(1);

  if (!p) {
    return NextResponse.json({ error: "Proveedor no encontrado." }, { status: 404 });
  }

  await db
    .update(schema.proveedores)
    .set({ estado: "rechazado", motivoRechazo: motivo, updatedAt: new Date() })
    .where(eq(schema.proveedores.id, proveedorId));

  return NextResponse.json({ ok: true });
}
