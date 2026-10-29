import { drizzle } from "drizzle-orm/node-postgres";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import pg from "pg";
import * as schema from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "production") {
  console.warn("[db] Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
}

// Driver node-postgres (`pg`): postgres.js envía varias consultas seguidas por la misma conexión y el pooler de
// Supabase (Supavisor) las entrevera («invalid frontend message type», «incomplete message from client»); las
// consultas quedaban colgadas y el build de Vercel pasaba de 60 s. `pg` envía una consulta a la vez por conexión.
// La conexión es perezosa: no se abre hasta la primera consulta (el build no necesita base).
// max bajo: la instancia de Supabase es pequeña. Durante `next build` cada proceso que genera páginas usa una sola.
// idleTimeoutMillis: cierra conexiones inactivas para devolver el cupo al pooler.
const enBuild = process.env.NEXT_PHASE === "phase-production-build";
function crearPool() {
  return new pg.Pool({
    connectionString: url ?? "postgres://localhost:5432/las3b",
    max: enBuild ? 1 : Number(process.env.DB_POOL_MAX ?? 3),
    idleTimeoutMillis: 20_000,
  });
}

// En desarrollo Next recarga los módulos en cada cambio: sin reutilizar el pool, cada recarga abriría
// uno nuevo y dejaría el anterior ocupando conexiones hasta agotar el pooler (EMAXCONNSESSION).
const cache = globalThis as unknown as { __las3bPool?: pg.Pool };
const pool = cache.__las3bPool ?? crearPool();
if (process.env.NODE_ENV !== "production") cache.__las3bPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export { schema };
export { cifrar, descifrar, estaCifrado, huella, protegerDocumento } from "./cifrado";
export type DB = typeof db;

const dialecto = new PgDialect({ casing: "snake_case" });

/**
 * Consulta SQL a mano (sql`…`) que devuelve las filas. Usa los tipos normales de `pg` (fechas como Date,
 * arreglos como arreglos); `db.execute` de Drizzle con node-postgres devuelve las fechas como texto.
 */
export async function consultar<T = Record<string, unknown>>(consulta: SQL): Promise<T[]> {
  const { sql, params } = dialecto.sqlToQuery(consulta);
  return (await pool.query(sql, params)).rows as T[];
}
