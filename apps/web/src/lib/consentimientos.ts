/**
 * RF-19 / Ley 1581: guarda la aceptación de la versión vigente de cada política, con fecha e IP.
 * La casilla nunca va premarcada; esta función solo se llama cuando el usuario la marcó.
 */
import { and, desc, eq, lte } from "drizzle-orm";
import { db, schema } from "@las3b/db";

type TipoPolitica = (typeof schema.tipoPoliticaEnum.enumValues)[number];

export const POLITICAS_REGISTRO_COMPRADOR: TipoPolitica[] = ["terminos_compradores", "tratamiento_datos"];

export async function registrarConsentimientos(
  usuarioId: string,
  tipos: TipoPolitica[],
  origen: { ip: string | null; userAgent: string | null },
) {
  for (const tipo of tipos) {
    const [vigente] = await db
      .select({ id: schema.politicas.id })
      .from(schema.politicas)
      .where(and(eq(schema.politicas.tipo, tipo), lte(schema.politicas.vigenteDesde, new Date())))
      .orderBy(desc(schema.politicas.vigenteDesde))
      .limit(1);
    if (!vigente) throw new Error(`No hay versión vigente de la política "${tipo}". Corre pnpm db:seed.`);
    await db.insert(schema.consentimientos).values({ usuarioId, politicaId: vigente.id, ...origen });
  }
}

export function ipDeLaPeticion(headers: Headers | undefined): string | null {
  return headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers?.get("x-real-ip") ?? null;
}
