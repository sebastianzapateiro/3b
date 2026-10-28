/**
 * P1 pendientes · Políticas vigentes para la página de consentimiento.
 * Devuelve versión y contenido de cada política esencial vigente.
 */
import { NextResponse } from "next/server";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { politicas } = schema;

const TIPOS_ESSENCIALES = ["terminos_compradores", "tratamiento_datos"];

export async function GET() {
  const resultado = await Promise.all(
    TIPOS_ESSENCIALES.map(async (tipo) => {
      const [vigente] = await db
        .select({
          id: politicas.id,
          tipo: politicas.tipo,
          version: politicas.version,
          contenidoMd: politicas.contenidoMd,
          esencial: politicas.esencial,
        })
        .from(politicas)
        .where(
          and(
            sql`${politicas.tipo} = ${tipo}`,
            lte(politicas.vigenteDesde, new Date()),
          ),
        )
        .orderBy(desc(politicas.vigenteDesde))
        .limit(1);
      return vigente;
    }),
  );

  return NextResponse.json(resultado.filter(Boolean));
}
