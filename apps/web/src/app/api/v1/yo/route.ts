/** A0 · Qué roles tiene la persona con sesión (menú de usuario e ingreso al backoffice). No expone datos personales. */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { rolesExigen2fa } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const roles = (await db.select({ rol: schema.usuarioRoles.rol }).from(schema.usuarioRoles).where(eq(schema.usuarioRoles.usuarioId, session.user.id))).map((r) => r.rol as string);
  const [p] = await db.select({ id: schema.proveedores.id }).from(schema.proveedores).where(eq(schema.proveedores.usuarioId, session.user.id)).limit(1);

  return NextResponse.json({
    proveedor: Boolean(p) || roles.includes("proveedor"),
    backoffice: roles.some((r) => ["verificador", "moderador", "admin"].includes(r)),
    // Si sus roles exigen segundo factor (admin siempre; verificador y moderador según el backoffice).
    exige2fa: await rolesExigen2fa(roles),
  });
}
