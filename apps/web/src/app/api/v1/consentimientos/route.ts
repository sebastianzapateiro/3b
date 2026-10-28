/**
 * P1 pendientes · Guarda los consentimientos del usuario (RF-19, Ley 1581).
 * Se llama desde /cuenta/consentimiento tras marcar las casillas.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@las3b/db";

const { consentimientos, politicas } = schema;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { tipos } = await req.json();
  if (!Array.isArray(tipos) || tipos.length === 0) {
    return NextResponse.json({ error: "Faltan tipos de política" }, { status: 400 });
  }

  for (const tipo of tipos) {
    const [vigente] = await db
      .select({ id: politicas.id })
      .from(politicas)
      .where(
        and(
          sql`${politicas.tipo} = ${tipo}`,
          lte(politicas.vigenteDesde, new Date()),
        ),
      )
      .orderBy(desc(politicas.vigenteDesde))
      .limit(1);
    if (!vigente) continue;
    await db.insert(consentimientos).values({
      usuarioId: session.user.id,
      politicaId: vigente.id,
    });
  }

  return NextResponse.json({ ok: true });
}
