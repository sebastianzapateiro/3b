/**
 * Convierte una cuenta existente en administrador del backoffice (B4).
 * Uso: pnpm admin:crear correo@ejemplo.com
 *
 * Antes la persona debe crear su cuenta en /registro. Este comando:
 *  - le asigna el rol `admin`;
 *  - marca su correo como verificado (así puede ingresar sin esperar el enlace);
 *  - deja constancia en `auditoria`.
 * El segundo factor (2FA) se configura después, en /admin/ingresar, con la app autenticadora.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

async function main() {
  const correo = process.argv[2]?.trim().toLowerCase();
  if (!correo?.includes("@")) {
    console.error("Uso: pnpm admin:crear correo@ejemplo.com");
    process.exit(1);
  }

  const { db } = await import("./index");
  const { user, usuarioRoles, auditoria } = await import("./schema/index");
  const { eq } = await import("drizzle-orm");

  const [u] = await db.select({ id: user.id, nombre: user.name }).from(user).where(eq(user.email, correo)).limit(1);
  if (!u) {
    console.error(`No hay una cuenta con el correo ${correo}. Créala primero en /registro.`);
    process.exit(1);
  }

  await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, u.id));
  await db.insert(usuarioRoles).values({ usuarioId: u.id, rol: "admin" }).onConflictDoNothing();
  await db.insert(auditoria).values({ actorId: null, rol: "sistema", accion: "admin_creado_por_script", objetoTipo: "usuario", objetoId: u.id, resultado: "ok", motivo: "pnpm admin:crear" });

  console.log(`Listo: ${u.nombre} (${correo}) ahora es administrador.`);
  console.log("Siguiente paso: entra a /admin/ingresar con su correo y clave; allí configura el segundo factor.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
