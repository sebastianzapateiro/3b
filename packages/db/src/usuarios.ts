/**
 * B4 · Lista las cuentas creadas, con sus roles y estado de seguridad. Solo lectura.
 * Uso: pnpm usuarios            (todas)
 *      pnpm usuarios admin      (filtra por rol: comprador, proveedor, verificador, moderador, admin)
 *      pnpm usuarios gmail.com  (filtra por texto en el correo o el nombre)
 * Actúa sobre DATABASE_URL del .env de la raíz (hoy, la base de producción).
 */
import { config } from "dotenv";
config({ path: "../../.env", quiet: true });

const ROLES = ["comprador", "proveedor", "verificador", "moderador", "admin"];

async function main() {
  const filtro = process.argv[2]?.trim().toLowerCase() ?? "";
  const { consultar } = await import("./index");
  const { sql } = await import("drizzle-orm");

  const filas = await consultar<{
    correo: string;
    nombre: string;
    roles: string | null;
    verificado: boolean;
    dos_factor: boolean;
    ingreso: string | null;
    proveedor: string | null;
    suspendido_hasta: Date | null;
    creado: Date;
  }>(sql`
    SELECT u.email AS correo, u.name AS nombre, u.email_verified AS verificado, u.two_factor_enabled AS dos_factor,
           u.suspendido_hasta, u.created_at AS creado,
           (SELECT string_agg(r.rol::text, ', ' ORDER BY r.rol::text) FROM usuario_roles r WHERE r.usuario_id = u.id) AS roles,
           (SELECT string_agg(a.provider_id, ', ') FROM account a WHERE a.user_id = u.id) AS ingreso,
           (SELECT p.estado::text FROM proveedores p WHERE p.usuario_id = u.id) AS proveedor
    FROM "user" u
    ORDER BY u.created_at`);

  const visibles = filas.filter((f) =>
    !filtro ? true : ROLES.includes(filtro) ? (f.roles ?? "").split(", ").includes(filtro) : `${f.correo} ${f.nombre}`.toLowerCase().includes(filtro),
  );

  const fecha = (d: Date) => d.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
  console.table(
    visibles.map((f) => ({
      correo: f.correo,
      nombre: f.nombre,
      roles: f.roles ?? "—",
      verificado: f.verificado ? "sí" : "no",
      "2FA": f.dos_factor ? "sí" : "no",
      ingreso: (f.ingreso ?? "—").replace("credential", "clave"),
      proveedor: f.proveedor ?? "—",
      suspendido: f.suspendido_hasta && f.suspendido_hasta > new Date() ? `hasta ${fecha(f.suspendido_hasta)}` : "no",
      creado: fecha(f.creado),
    })),
  );
  console.log(`${visibles.length} de ${filas.length} cuentas${filtro ? ` (filtro: «${filtro}»)` : ""}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
