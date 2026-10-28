/**
 * B1 · Backoffice: aprobar proveedor desde la cola de revisión.
 * Protección: sesión + rol + 2FA (verificarSesionAdmin).
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
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

  await db
    .update(schema.proveedores)
    .set({ estado: "aprobado", aprobadoEn: new Date(), updatedAt: new Date() })
    .where(eq(schema.proveedores.id, proveedorId));

  return NextResponse.json({ ok: true });
}
