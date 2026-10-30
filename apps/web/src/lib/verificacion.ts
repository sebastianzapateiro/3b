/**
 * B1 · Backoffice: sesión + rol + 2FA para rutas admin.
 * Requiere rol verificador, moderador o admin y 2FA habilitado (CU-70/71).
 * La sesión de una cuenta del equipo dura como máximo `sesion_backoffice_h` horas desde que ingresó
 * (docs/03-arquitectura.md); al vencer se cierra y debe ingresar de nuevo con clave y código.
 * El 2FA es obligatorio siempre para `admin`; para verificador y moderador lo decide un admin
 * (`configuracion`: exige_2fa_<rol>, activado por defecto).
 */
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { valorParametro } from "@/lib/parametros";
import { consultar, db, schema } from "@las3b/db";
import { eq, inArray, sql } from "drizzle-orm";

export const ROLES_ADMIN = ["verificador", "moderador", "admin"] as const;
export type RolAdmin = (typeof ROLES_ADMIN)[number];

/** Roles cuyo 2FA puede apagar un admin. `admin` siempre lo exige. */
export const ROLES_2FA_OPCIONAL = ["verificador", "moderador"] as const;
const clave2fa = (rol: string) => `exige_2fa_${rol}`;

/** Si cada rol de backoffice exige 2FA. Sin valor guardado, lo exige. */
export async function exigencia2fa(): Promise<Record<RolAdmin, boolean>> {
  const filas = await db
    .select({ clave: schema.configuracion.clave, valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(inArray(schema.configuracion.clave, ROLES_2FA_OPCIONAL.map(clave2fa)));
  return exigenciaDesde(Object.fromEntries(filas.map((f) => [f.clave, f.valor])));
}

function exigenciaDesde(conf: Record<string, unknown>): Record<RolAdmin, boolean> {
  const valor = (rol: string) => conf[clave2fa(rol)] !== false;
  return { admin: true, verificador: valor("verificador"), moderador: valor("moderador") };
}

export async function guardarExigencia2fa(rol: (typeof ROLES_2FA_OPCIONAL)[number], exige: boolean) {
  await db
    .insert(schema.configuracion)
    .values({ clave: clave2fa(rol), valor: exige })
    .onConflictDoUpdate({ target: schema.configuracion.clave, set: { valor: exige, actualizadoEn: new Date() } });
}

/** Una persona con varios roles debe usar 2FA si cualquiera de ellos lo exige. */
export async function rolesExigen2fa(roles: string[]) {
  return algunoExige(roles, await exigencia2fa());
}

const algunoExige = (roles: string[], e: Record<RolAdmin, boolean>) => roles.some((r) => (ROLES_ADMIN as readonly string[]).includes(r) && e[r as RolAdmin]);

/** Jerarquía para mostrar el rol más alto en el panel. */
const PRIORIDAD: RolAdmin[] = ["admin", "moderador", "verificador"];

export type VerificacionAdmin = {
  user: { id: string; email: string; name: string; twoFactorEnabled: boolean } | null;
  /** Rol de backoffice más alto del usuario. */
  rol: RolAdmin | null;
  roles: string[];
  error: string | null;
};

/** Una sola verificación por petición: el layout del panel y la página la comparten (cache de React). */
export const verificarSesionAdmin = cache(async (): Promise<VerificacionAdmin> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { user: null, rol: null, roles: [], error: "Sesión requerida" };
  }

  const user = session.user as { id: string; email: string; name: string; twoFactorEnabled?: boolean };
  const usuario = { ...user, twoFactorEnabled: user.twoFactorEnabled ?? false };

  // Roles, exigencia de 2FA y duración de la sesión en una sola consulta: la base está lejos (~170 ms por viaje).
  const claves = ["sesion_backoffice_h", ...ROLES_2FA_OPCIONAL.map(clave2fa)];
  const [d] = await consultar<{ roles: string[] | null; conf: Record<string, unknown> | null }>(sql`
    SELECT (SELECT array_agg(rol::text) FROM usuario_roles WHERE usuario_id = ${user.id}) AS roles,
           (SELECT jsonb_object_agg(clave, valor) FROM configuracion WHERE clave IN (${sql.join(claves.map((c) => sql`${c}`), sql`, `)})) AS conf`);
  const roles = d?.roles ?? [];
  const conf = d?.conf ?? {};
  const rol = PRIORIDAD.find((r) => roles.includes(r)) ?? null;

  if (!rol) return { user: usuario, rol: null, roles, error: "Rol no autorizado" };
  if (!usuario.twoFactorEnabled && algunoExige(roles, exigenciaDesde(conf))) return { user: usuario, rol, roles, error: "2FA requerido" };

  const horas = valorParametro("sesion_backoffice_h", conf.sesion_backoffice_h);
  if (Date.now() - new Date(session.session.createdAt).getTime() > horas * 3_600_000) {
    await db.delete(schema.session).where(eq(schema.session.id, session.session.id));
    return { user: null, rol: null, roles: [], error: "Sesión vencida" };
  }

  return { user: usuario, rol, roles, error: null };
});

/** Para páginas del panel: sin acceso válido redirige a /admin/ingresar. Con `soloAdmin`, exige el rol admin. */
export async function exigirBackoffice(soloAdmin = false) {
  const v = await verificarSesionAdmin();
  if (v.error === "Sesión vencida") redirect("/admin/ingresar?vencida=1");
  if (v.error || !v.user || !v.rol) redirect("/admin/ingresar");
  if (soloAdmin && !v.roles.includes("admin")) redirect("/admin");
  return { user: v.user, rol: v.rol, roles: v.roles };
}
