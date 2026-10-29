/**
 * B1 · Backoffice: sesión + rol + 2FA para rutas admin.
 * Requiere rol verificador, moderador o admin y 2FA habilitado (CU-70/71).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";

export const ROLES_ADMIN = ["verificador", "moderador", "admin"] as const;
export type RolAdmin = (typeof ROLES_ADMIN)[number];

/** Jerarquía para mostrar el rol más alto en el panel. */
const PRIORIDAD: RolAdmin[] = ["admin", "moderador", "verificador"];

export type VerificacionAdmin = {
  user: { id: string; email: string; name: string; twoFactorEnabled: boolean } | null;
  /** Rol de backoffice más alto del usuario. */
  rol: RolAdmin | null;
  roles: string[];
  error: string | null;
};

export async function verificarSesionAdmin(): Promise<VerificacionAdmin> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { user: null, rol: null, roles: [], error: "Sesión requerida" };
  }

  const user = session.user as { id: string; email: string; name: string; twoFactorEnabled?: boolean };
  const usuario = { ...user, twoFactorEnabled: user.twoFactorEnabled ?? false };

  const filas = await db
    .select({ rol: schema.usuarioRoles.rol })
    .from(schema.usuarioRoles)
    .where(eq(schema.usuarioRoles.usuarioId, user.id));
  const roles = filas.map((f) => f.rol as string);
  const rol = PRIORIDAD.find((r) => roles.includes(r)) ?? null;

  if (!rol) return { user: usuario, rol: null, roles, error: "Rol no autorizado" };
  if (!usuario.twoFactorEnabled) return { user: usuario, rol, roles, error: "2FA requerido" };

  return { user: usuario, rol, roles, error: null };
}

/** Para páginas del panel: sin acceso válido redirige a /admin/ingresar. Con `soloAdmin`, exige el rol admin. */
export async function exigirBackoffice(soloAdmin = false) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user || !v.rol) redirect("/admin/ingresar");
  if (soloAdmin && !v.roles.includes("admin")) redirect("/admin");
  return { user: v.user, rol: v.rol, roles: v.roles };
}
