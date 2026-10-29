import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "production") {
  console.warn("[db] Falta DATABASE_URL. Copia .env.example a .env y complétalo.");
}

// La conexión es perezosa: no se abre hasta la primera consulta (el build no necesita base).
// prepare: false es necesario con el pooler de Supabase en modo "transaction".
// max bajo: el build de Next abre varios procesos en paralelo y el pooler de sesión de Supabase admite 15 clientes.
// idle_timeout: cierra conexiones inactivas para devolver el cupo al pooler.
function crearCliente() {
  return postgres(url ?? "postgres://localhost:5432/las3b", { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 3), idle_timeout: 20 });
}

// En desarrollo Next recarga los módulos en cada cambio: sin reutilizar el cliente, cada recarga abriría
// un pool nuevo y dejaría el anterior ocupando conexiones hasta agotar el pooler (EMAXCONNSESSION).
const cache = globalThis as unknown as { __las3bPostgres?: ReturnType<typeof postgres> };
const client = cache.__las3bPostgres ?? crearCliente();
if (process.env.NODE_ENV !== "production") cache.__las3bPostgres = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
export { cifrar, descifrar, estaCifrado, huella, protegerDocumento } from "./cifrado";
export type DB = typeof db;
