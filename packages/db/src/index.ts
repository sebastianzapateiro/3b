import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "production") {
  console.warn("[db] Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
}

// La conexión es perezosa: no se abre hasta la primera consulta (el build no necesita base).
// prepare: false es necesario con el pooler de Supabase en modo "transaction".
// max bajo: el build de Next abre varios procesos en paralelo y el pooler de sesión de Supabase tiene un límite de conexiones.
const client = postgres(url ?? "postgres://localhost:5432/las3b", { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 3) });

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
export type DB = typeof db;
