/** CU-79 · Lectura de parámetros configurables (tabla `configuracion`), con el valor por defecto de `PARAMETROS`. */
import { eq, inArray } from "drizzle-orm";
import { defectoDe, PARAMETROS } from "@las3b/shared";
import { db, schema } from "@las3b/db";

export async function parametro(clave: string): Promise<number> {
  const [c] = await db.select({ valor: schema.configuracion.valor }).from(schema.configuracion).where(eq(schema.configuracion.clave, clave)).limit(1);
  return valorParametro(clave, c?.valor);
}

/** Valor guardado como número, o el de `PARAMETROS` si no hay uno válido. */
export function valorParametro(clave: string, valor: unknown): number {
  const n = Number(valor);
  return Number.isFinite(n) && valor !== null && valor !== undefined ? n : (defectoDe(clave) ?? 0);
}

/** Todos los parámetros con su valor actual (null = sin definir). */
export async function todosLosParametros() {
  const filas = await db.select().from(schema.configuracion).where(inArray(schema.configuracion.clave, PARAMETROS.map((p) => p.clave)));
  const mapa = new Map(filas.map((f) => [f.clave, Number(f.valor)]));
  return PARAMETROS.map((p) => ({ ...p, valor: mapa.has(p.clave) && Number.isFinite(mapa.get(p.clave)!) ? mapa.get(p.clave)! : p.defecto }));
}
