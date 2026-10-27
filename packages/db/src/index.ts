import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "production") {
  console.warn("[db] Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
}

// La conexión es perezosa: no se abre hasta la primera consulta (el build no necesita base).
// prepare: false es necesario con el pooler de Supabase en modo "transaction".
const client = postgres(url ?? "postgres://localhost:5432/las3b", { prepare: false });

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
export type DB = typeof db;
