/**
 * P3 / P8 · Pide una URL firmada de un solo uso para subir un documento directo al bucket `privado`.
 * POST { tipo, mime, bytes } → { camino, url }. Después: PUT del archivo a `url` y POST /api/v1/yo/documentos.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prepararSubida, proveedorQueCarga } from "@/lib/documentos";

export const dynamic = "force-dynamic";

const cuerpo = z.object({ tipo: z.string().max(40), mime: z.string().max(60), bytes: z.number().int() });

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ error: "Sin perfil de proveedor" }, { status: 401 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await prepararSubida(p.id, datos.data);
  return "error" in r ? NextResponse.json(r, { status: 422 }) : NextResponse.json(r);
}
