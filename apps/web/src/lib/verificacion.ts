/**
 * B1 · Backoffice: sesión + rol + 2FA para rutas admin.
 * Requiere rol verificador, moderador o admin y 2FA habilitado (CU-70/71).
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";

export const ROLES_ADMIN = ["verificador", "moderador", "admin"] as const;

export type VerificacionAdmin = {
  user: { id: string; email: string; name: string; twoFactorEnabled: boolean } | null;
  rol: string | null;
  error: string | null;
};

export async function verificarSesionAdmin(): Promise<VerificacionAdmin> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { user: null, rol: null, error: "Sesión requerida" };
  }

  const user = session.user as {
    id: string;
    email: string;
    name: string;
    twoFactorEnabled?: boolean;
  };

  const [usuarioRol] = await db
    .select({ rol: schema.usuarioRoles.rol })
    .from(schema.usuarioRoles)
    .where(eq(schema.usuarioRoles.usuarioId, user.id))
    .limit(1);

  const rol = usuarioRol?.rol ?? null;

  if (!rol || !(ROLES_ADMIN as readonly string[]).includes(rol)) {
    return { user: user as VerificacionAdmin["user"], rol: null, error: "Rol no autorizado" };
  }

  const dosFactorHabilitado = user.twoFactorEnabled ?? false;

  if (!dosFactorHabilitado) {
    return { user: user as VerificacionAdmin["user"], rol, error: "2FA requerido" };
  }

  return { user: user as VerificacionAdmin["user"], rol, error: null };
}
